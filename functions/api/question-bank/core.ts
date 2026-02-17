/**
 * Question Bank Core Logic
 *
 * Shared functions for fetching pre-existing aptitude questions from the
 * aptitude_questions table. Can be imported directly by other Cloudflare
 * Pages Function handlers (no HTTP round-trip needed).
 *
 * The HTTP API layer in [[path]].ts delegates to these functions.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────────────────────────────

export type GradeLevel = 'middle_school' | 'high_school' | 'higher_secondary';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type TestPhase = 'diagnostic_screener' | 'adaptive_core' | 'stability_confirmation';
export type Subtag =
  | 'numerical_reasoning'
  | 'logical_reasoning'
  | 'verbal_reasoning'
  | 'spatial_reasoning'
  | 'data_interpretation'
  | 'pattern_recognition';

export interface Question {
  id: string;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: DifficultyLevel;
  subtag: Subtag;
  gradeLevel: GradeLevel;
  phase: TestPhase;
  explanation?: string;
  createdAt?: string;
}

export interface QuestionGenerationResult {
  questions: Question[];
  fromCache: boolean;
  generatedCount: number;
  cachedCount: number;
  generatedBy: 'question_bank';
  source: 'database';
}

interface DBRow {
  id: string;
  batch_id: string;
  grade: string;
  dimension: string;
  band: string;
  difficulty_rank: number;
  template_family: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation_step_1?: string;
  explanation_step_2?: string;
  explanation_step_3?: string;
  final_answer?: string;
  time_target_sec?: number;
  solution_type?: string;
  solution_data?: string;
  explanation?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Mapping constants ──────────────────────────────────────────────────────

const DIMENSION_TO_SUBTAG: Record<string, Subtag> = {
  QRA: 'numerical_reasoning',
  LRA: 'logical_reasoning',
  VRA: 'verbal_reasoning',
  SRA: 'spatial_reasoning',
  DIA: 'data_interpretation',
  PRA: 'pattern_recognition',
};

const SUBTAG_TO_DIMENSION: Record<string, string> = {
  numerical_reasoning: 'QRA',
  logical_reasoning: 'LRA',
  verbal_reasoning: 'VRA',
  spatial_reasoning: 'SRA',
  data_interpretation: 'DIA',
  pattern_recognition: 'PRA',
};

export const GRADE_LEVEL_TO_GRADES: Record<GradeLevel, string[]> = {
  middle_school: ['6', '7', '8'],
  high_school: ['9', '10'],
  higher_secondary: ['11', '12'],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(n: number): DifficultyLevel {
  return Math.max(1, Math.min(5, Math.round(n))) as DifficultyLevel;
}

function reorderForSubtagDiversity(questions: Question[], maxConsecutive: number = 2): Question[] {
  if (questions.length <= 1) return questions;
  const result: Question[] = [];
  const remaining = [...questions];
  while (remaining.length > 0) {
    let lastSubtag: string | null = null;
    let consecutiveCount = 0;
    for (let i = result.length - 1; i >= 0 && i >= result.length - maxConsecutive; i--) {
      if (lastSubtag === null) { lastSubtag = result[i].subtag; consecutiveCount = 1; }
      else if (result[i].subtag === lastSubtag) { consecutiveCount++; }
      else { break; }
    }
    let selectedIndex = 0;
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      const diffIdx = remaining.findIndex(q => q.subtag !== lastSubtag);
      if (diffIdx !== -1) selectedIndex = diffIdx;
    }
    result.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }
  return result;
}

function mapRow(row: DBRow, phase: TestPhase, gradeLevel: GradeLevel): Question {
  const subtag = DIMENSION_TO_SUBTAG[row.dimension] ?? 'logical_reasoning';
  const explanation =
    row.explanation ||
    [row.explanation_step_1, row.explanation_step_2, row.explanation_step_3]
      .filter(Boolean)
      .join(' ');

  return {
    id: row.id,
    text: row.question_text,
    options: { A: row.option_a, B: row.option_b, C: row.option_c, D: row.option_d },
    correctAnswer: row.correct_answer,
    difficulty: row.difficulty_rank as DifficultyLevel,
    subtag,
    gradeLevel,
    phase,
    explanation: explanation || undefined,
    createdAt: row.created_at,
  };
}

async function queryQuestions(
  supabase: SupabaseClient,
  grades: string[],
  difficulties: DifficultyLevel[],
  limit: number,
  excludeIds: string[] = [],
  dimensions?: string[],
): Promise<DBRow[]> {
  let query = supabase
    .from('aptitude_questions')
    .select('*')
    .in('grade', grades)
    .in('difficulty_rank', difficulties);

  if (dimensions && dimensions.length > 0) {
    query = query.in('dimension', dimensions);
  }

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query.limit(limit);
  if (error) throw new Error(`DB query failed: ${error.message}`);
  return (data ?? []) as DBRow[];
}

function buildResult(questions: Question[]): QuestionGenerationResult {
  return {
    questions,
    fromCache: false,
    generatedCount: questions.length,
    cachedCount: 0,
    generatedBy: 'question_bank',
    source: 'database',
  };
}

function resolveGrades(gradeLevel: GradeLevel, studentGrade?: string | null): string[] {
  return studentGrade ? [studentGrade] : GRADE_LEVEL_TO_GRADES[gradeLevel];
}

// ─── Exported handler functions ─────────────────────────────────────────────

export interface DiagnosticParams {
  gradeLevel: GradeLevel;
  studentGrade?: string | null;
  excludeQuestionIds?: string[];
}

export async function fetchDiagnosticQuestions(
  supabase: SupabaseClient,
  params: DiagnosticParams,
): Promise<QuestionGenerationResult> {
  const { gradeLevel, studentGrade, excludeQuestionIds: excludeIds = [] } = params;
  const baseGrades = resolveGrades(gradeLevel, studentGrade);
  const fullGrades = GRADE_LEVEL_TO_GRADES[gradeLevel];

  console.log('[QuestionBank] diagnostic:', { gradeLevel, baseGrades, studentGrade: studentGrade ?? null, excludeIds: excludeIds.length });

  let pool = await queryQuestions(supabase, baseGrades, [3], 80, excludeIds);

  // Fallback: widen to full grade range if exact grade returned too few
  if (pool.length < 8 && studentGrade && baseGrades.join() !== fullGrades.join()) {
    console.log(`[QuestionBank] diagnostic: widening to full grade range (had ${pool.length}/8)`);
    pool = await queryQuestions(supabase, fullGrades, [3], 80, excludeIds);
  }

  // Fallback: widen difficulty to 2-4 if still not enough
  if (pool.length < 8) {
    console.log(`[QuestionBank] diagnostic: widening difficulty to [2,3,4] (had ${pool.length}/8)`);
    pool = await queryQuestions(supabase, fullGrades, [2, 3, 4] as DifficultyLevel[], 80, excludeIds);
  }
  const shuffled = shuffle(pool);

  const selected: DBRow[] = [];
  const dimCounts = new Map<string, number>();

  for (const row of shuffled) {
    if (selected.length >= 8) break;
    const count = dimCounts.get(row.dimension) ?? 0;
    if (count < 2) {
      selected.push(row);
      dimCounts.set(row.dimension, count + 1);
    }
  }

  if (selected.length < 8) {
    const ids = new Set(selected.map(r => r.id));
    for (const row of shuffled) {
      if (selected.length >= 8) break;
      if (!ids.has(row.id)) {
        selected.push(row);
        ids.add(row.id);
      }
    }
  }

  const questions = reorderForSubtagDiversity(
    shuffle(selected).map(r => mapRow(r, 'diagnostic_screener', gradeLevel)),
    2,
  );
  return buildResult(questions);
}

export interface AdaptiveParams {
  gradeLevel: GradeLevel;
  startingDifficulty?: DifficultyLevel;
  difficulty?: DifficultyLevel;
  count?: number;
  excludeQuestionIds?: string[];
  studentGrade?: string | null;
}

export async function fetchAdaptiveQuestions(
  supabase: SupabaseClient,
  params: AdaptiveParams,
): Promise<QuestionGenerationResult> {
  const {
    gradeLevel,
    startingDifficulty,
    difficulty: difficultyAlt,
    count = 10,
    excludeQuestionIds: excludeIds = [],
    studentGrade,
  } = params;
  const difficulty = (startingDifficulty ?? difficultyAlt ?? 3) as DifficultyLevel;
  const baseGrades = resolveGrades(gradeLevel, studentGrade);
  const fullGrades = GRADE_LEVEL_TO_GRADES[gradeLevel];
  const adjDifficulties = [...new Set([
    clamp(difficulty - 1),
    difficulty,
    clamp(difficulty + 1),
  ])] as DifficultyLevel[];
  const limit = Math.max(count * 5, 50);

  console.log('[QuestionBank] adaptive:', { gradeLevel, baseGrades, studentGrade: studentGrade ?? null, difficulty, count, excludeIds: excludeIds.length });

  // Progressive fallback: exact grade+difficulty → exact grade+adj difficulties → full grade range
  const attempts: Array<{ grades: string[]; difficulties: DifficultyLevel[]; label: string }> = [
    { grades: baseGrades, difficulties: [difficulty], label: 'exact grade+difficulty' },
    { grades: baseGrades, difficulties: adjDifficulties, label: 'exact grade+adj difficulty' },
  ];
  if (studentGrade && baseGrades.join() !== fullGrades.join()) {
    attempts.push(
      { grades: fullGrades, difficulties: [difficulty], label: 'full grade range+difficulty' },
      { grades: fullGrades, difficulties: adjDifficulties, label: 'full grade range+adj difficulty' },
    );
  }

  let bestPartialPool: DBRow[] = [];
  let bestPartialLabel = '';

  for (const attempt of attempts) {
    const pool = await queryQuestions(supabase, attempt.grades, attempt.difficulties, limit, excludeIds);
    if (pool.length >= count) {
      if (attempt !== attempts[0]) {
        console.log(`[QuestionBank] adaptive: used fallback '${attempt.label}' (${pool.length} results)`);
      }
      const questions = reorderForSubtagDiversity(
        shuffle(pool).slice(0, count).map(r => mapRow(r, 'adaptive_core', gradeLevel)),
        2,
      );
      return buildResult(questions);
    }
    if (pool.length > bestPartialPool.length) {
      bestPartialPool = pool;
      bestPartialLabel = attempt.label;
    }
  }

  if (bestPartialPool.length > 0) {
    console.warn(`[QuestionBank] adaptive: using best partial results from '${bestPartialLabel}' (${bestPartialPool.length}/${count})`);
    const questions = reorderForSubtagDiversity(
      shuffle(bestPartialPool).slice(0, count).map(r => mapRow(r, 'adaptive_core', gradeLevel)),
      2,
    );
    return buildResult(questions);
  }

  console.warn('[QuestionBank] adaptive: all fallback attempts exhausted');
  return buildResult([]);
}

export interface StabilityParams {
  gradeLevel: GradeLevel;
  provisionalBand?: DifficultyLevel;
  difficulty?: DifficultyLevel;
  count?: number;
  excludeQuestionIds?: string[];
  studentGrade?: string | null;
}

export async function fetchStabilityQuestions(
  supabase: SupabaseClient,
  params: StabilityParams,
): Promise<QuestionGenerationResult> {
  const {
    gradeLevel,
    provisionalBand: bandParam,
    difficulty: difficultyAlt,
    count = 6,
    excludeQuestionIds: excludeIds = [],
    studentGrade,
  } = params;
  const provisionalBand = (bandParam ?? difficultyAlt ?? 3) as DifficultyLevel;
  const baseGrades = resolveGrades(gradeLevel, studentGrade);
  const fullGrades = GRADE_LEVEL_TO_GRADES[gradeLevel];

  const difficulties = [...new Set([
    clamp(provisionalBand - 1),
    provisionalBand,
    clamp(provisionalBand + 1),
  ])] as DifficultyLevel[];
  const limit = Math.max(count * 5, 30);

  console.log('[QuestionBank] stability:', { gradeLevel, baseGrades, studentGrade: studentGrade ?? null, provisionalBand, difficulties, count });

  let pool = await queryQuestions(supabase, baseGrades, difficulties, limit, excludeIds);

  // Fallback: widen to full grade range if exact grade returned too few
  if (pool.length < count && studentGrade && baseGrades.join() !== fullGrades.join()) {
    console.log(`[QuestionBank] stability: widening to full grade range (had ${pool.length}/${count})`);
    pool = await queryQuestions(supabase, fullGrades, difficulties, limit, excludeIds);
  }

  // Fallback: widen difficulty range further (±2)
  if (pool.length < count) {
    const widerDifficulties = [...new Set([
      clamp(provisionalBand - 2),
      clamp(provisionalBand - 1),
      provisionalBand,
      clamp(provisionalBand + 1),
      clamp(provisionalBand + 2),
    ])] as DifficultyLevel[];
    console.log(`[QuestionBank] stability: widening difficulty range (had ${pool.length}/${count})`);
    pool = await queryQuestions(supabase, fullGrades, widerDifficulties, limit, excludeIds);
  }

  const questions = shuffle(pool)
    .slice(0, count)
    .map(r => mapRow(r, 'stability_confirmation', gradeLevel));

  return buildResult(questions);
}

export interface SingleQuestionParams {
  gradeLevel: GradeLevel;
  difficulty?: DifficultyLevel;
  subtag?: Subtag;
  excludeQuestionIds?: string[];
  studentGrade?: string | null;
}

export async function fetchSingleQuestion(
  supabase: SupabaseClient,
  params: SingleQuestionParams,
): Promise<QuestionGenerationResult> {
  const {
    gradeLevel,
    difficulty: diffParam = 3,
    subtag,
    excludeQuestionIds: excludeIds = [],
    studentGrade,
  } = params;
  const difficulty = diffParam as DifficultyLevel;
  const baseGrades = resolveGrades(gradeLevel, studentGrade);
  const fullGrades = GRADE_LEVEL_TO_GRADES[gradeLevel];
  const adjDifficulties = [...new Set([
    clamp(difficulty - 1),
    difficulty,
    clamp(difficulty + 1),
  ])] as DifficultyLevel[];

  const dimension = subtag ? SUBTAG_TO_DIMENSION[subtag] : undefined;
  const dimensions = dimension ? [dimension] : undefined;

  console.log('[QuestionBank] single:', { gradeLevel, baseGrades, fullGrades, studentGrade: studentGrade ?? null, difficulty, subtag, dimension });

  // Progressive fallback cascade — each attempt is less restrictive
  const attempts: Array<{ grades: string[]; difficulties: DifficultyLevel[]; dimensions?: string[]; label: string }> = [
    { grades: baseGrades, difficulties: [difficulty], dimensions, label: 'exact grade+difficulty+dimension' },
    { grades: baseGrades, difficulties: [difficulty], label: 'exact grade+difficulty' },
    { grades: baseGrades, difficulties: adjDifficulties, dimensions, label: 'exact grade+adj difficulty+dimension' },
    { grades: baseGrades, difficulties: adjDifficulties, label: 'exact grade+adj difficulty' },
  ];

  // Widen to full grade range only when studentGrade narrows the search
  if (studentGrade && baseGrades.join() !== fullGrades.join()) {
    attempts.push(
      { grades: fullGrades, difficulties: [difficulty], dimensions, label: 'full grade range+difficulty+dimension' },
      { grades: fullGrades, difficulties: [difficulty], label: 'full grade range+difficulty' },
      { grades: fullGrades, difficulties: adjDifficulties, label: 'full grade range+adj difficulty' },
    );
  }

  for (const attempt of attempts) {
    const pool = await queryQuestions(supabase, attempt.grades, attempt.difficulties, 20, excludeIds, attempt.dimensions);
    if (pool.length > 0) {
      if (attempt !== attempts[0]) {
        console.log(`[QuestionBank] single: used fallback '${attempt.label}'`);
      }
      const row = shuffle(pool)[0];
      return buildResult([mapRow(row, 'adaptive_core', gradeLevel)]);
    }
  }

  console.warn('[QuestionBank] single: all fallback attempts exhausted');
  return buildResult([]);
}

export async function getQuestionCount(supabase: SupabaseClient): Promise<number | 'unknown'> {
  const { count, error } = await supabase
    .from('aptitude_questions')
    .select('id', { count: 'exact', head: true });
  return error ? 'unknown' : (count ?? 0);
}
