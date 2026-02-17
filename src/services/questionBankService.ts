import { supabase } from '../lib/supabaseClient';
import type {
  Question,
  GradeLevel,
  TestPhase,
  DifficultyLevel,
  Subtag,
  AptitudeQuestionBank,
} from '../types/adaptiveAptitude';
import {
  dimensionToSubtag,
  subtagToDimension,
  gradeLevelToGrades,
  shuffleArray,
  clampDifficulty,
  reorderForSubtagDiversity,
} from './questionBankMappings';

const TABLE = 'aptitude_questions' as const;

/**
 * Maps a database row to the Question format used by the adaptive test system
 */
function mapToQuestion(
  row: AptitudeQuestionBank,
  phase: TestPhase,
  gradeLevel: GradeLevel,
): Question {
  const subtag = dimensionToSubtag(row.dimension);
  const explanation = row.explanation
    || [row.explanation_step_1, row.explanation_step_2, row.explanation_step_3]
        .filter(Boolean)
        .join(' ');

  return {
    id: row.id,
    text: row.question_text,
    options: {
      A: row.option_a,
      B: row.option_b,
      C: row.option_c,
      D: row.option_d,
    },
    correctAnswer: row.correct_answer,
    difficulty: row.difficulty_rank,
    subtag,
    gradeLevel,
    phase,
    explanation: explanation || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Fetches questions from the aptitude_questions table with filters.
 * Returns raw database rows.
 */
async function fetchQuestions(params: {
  grades: string[];
  difficultyRanks: DifficultyLevel[];
  dimensions?: string[];
  excludeIds?: string[];
  limit: number;
}): Promise<AptitudeQuestionBank[]> {
  let query = supabase
    .from(TABLE)
    .select('*')
    .in('grade', params.grades)
    .in('difficulty_rank', params.difficultyRanks);

  if (params.dimensions && params.dimensions.length > 0) {
    query = query.in('dimension', params.dimensions);
  }

  if (params.excludeIds && params.excludeIds.length > 0) {
    query = query.not('id', 'in', `(${params.excludeIds.join(',')})`);
  }

  query = query.limit(params.limit);

  const { data, error } = await query;

  if (error) {
    console.error('[QuestionBankService] Query error:', error.message);
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  return (data ?? []) as AptitudeQuestionBank[];
}

/**
 * Service for fetching pre-existing aptitude questions from the question bank.
 * These are stored in Supabase and NOT AI-generated.
 */
export const questionBankService = {
  /**
   * Get 8 diagnostic screener questions at difficulty 3, balanced across subtags.
   */
  async getQuestionsForDiagnostic(
    gradeLevel: GradeLevel,
    excludeIds: string[] = [],
  ): Promise<Question[]> {
    const grades = gradeLevelToGrades(gradeLevel);
    const pool = await fetchQuestions({
      grades,
      difficultyRanks: [3],
      excludeIds,
      limit: 80,
    });

    const shuffled = shuffleArray(pool);
    const selected: AptitudeQuestionBank[] = [];
    const usedDimensions = new Map<string, number>();

    for (const row of shuffled) {
      if (selected.length >= 8) break;
      const dimCount = usedDimensions.get(row.dimension) ?? 0;
      if (dimCount < 2) {
        selected.push(row);
        usedDimensions.set(row.dimension, dimCount + 1);
      }
    }

    // If we couldn't fill with balanced dimensions, fill with whatever is available
    if (selected.length < 8) {
      const selectedIds = new Set(selected.map(q => q.id));
      for (const row of shuffled) {
        if (selected.length >= 8) break;
        if (!selectedIds.has(row.id)) {
          selected.push(row);
          selectedIds.add(row.id);
        }
      }
    }

    const questions = shuffleArray(selected).map(row => mapToQuestion(row, 'diagnostic_screener', gradeLevel));
    return reorderForSubtagDiversity(questions, 2);
  },

  /**
   * Get questions for the adaptive core phase at a specific difficulty level.
   */
  async getQuestionsForAdaptiveCore(
    gradeLevel: GradeLevel,
    difficulty: DifficultyLevel,
    count: number,
    excludeIds: string[] = [],
  ): Promise<Question[]> {
    const grades = gradeLevelToGrades(gradeLevel);
    const pool = await fetchQuestions({
      grades,
      difficultyRanks: [difficulty],
      excludeIds,
      limit: Math.max(count * 5, 50),
    });

    const selected = shuffleArray(pool).slice(0, count);
    const questions = selected.map(row => mapToQuestion(row, 'adaptive_core', gradeLevel));
    return reorderForSubtagDiversity(questions, 2);
  },

  /**
   * Get questions for the stability confirmation phase at provisional band ±1.
   */
  async getQuestionsForStability(
    gradeLevel: GradeLevel,
    provisionalBand: DifficultyLevel,
    count: number,
    excludeIds: string[] = [],
  ): Promise<Question[]> {
    const grades = gradeLevelToGrades(gradeLevel);
    const difficulties: DifficultyLevel[] = [
      clampDifficulty(provisionalBand - 1),
      provisionalBand,
      clampDifficulty(provisionalBand + 1),
    ];
    // Deduplicate (e.g. when band is 1, clamp gives [1,1,2])
    const uniqueDifficulties = [...new Set(difficulties)] as DifficultyLevel[];

    const pool = await fetchQuestions({
      grades,
      difficultyRanks: uniqueDifficulties,
      excludeIds,
      limit: Math.max(count * 5, 30),
    });

    const selected = shuffleArray(pool).slice(0, count);
    const questions = selected.map(row => mapToQuestion(row, 'stability_confirmation', gradeLevel));
    return reorderForSubtagDiversity(questions, 2);
  },

  /**
   * Get a single adaptive question at a specific difficulty and subtag.
   */
  async getSingleAdaptiveQuestion(
    gradeLevel: GradeLevel,
    difficulty: DifficultyLevel,
    subtag: Subtag,
    excludeIds: string[] = [],
  ): Promise<Question | null> {
    const grades = gradeLevelToGrades(gradeLevel);
    const dimension = subtagToDimension(subtag);

    const pool = await fetchQuestions({
      grades,
      difficultyRanks: [difficulty],
      dimensions: dimension ? [dimension] : undefined,
      excludeIds,
      limit: 20,
    });

    if (pool.length === 0) {
      // Fallback: try without dimension filter
      const fallback = await fetchQuestions({
        grades,
        difficultyRanks: [difficulty],
        excludeIds,
        limit: 20,
      });
      if (fallback.length === 0) return null;
      const row = shuffleArray(fallback)[0];
      return mapToQuestion(row, 'adaptive_core', gradeLevel);
    }

    const row = shuffleArray(pool)[0];
    return mapToQuestion(row, 'adaptive_core', gradeLevel);
  },

  /**
   * Get a single question by its ID.
   */
  async getQuestionById(questionId: string): Promise<AptitudeQuestionBank | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch question: ${error.message}`);
    }
    return data as AptitudeQuestionBank;
  },

  /**
   * Get all questions belonging to a specific batch.
   */
  async getQuestionsByBatch(batchId: string): Promise<AptitudeQuestionBank[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('batch_id', batchId);

    if (error) throw new Error(`Failed to fetch batch: ${error.message}`);
    return (data ?? []) as AptitudeQuestionBank[];
  },

  /**
   * Get the count of available questions, optionally filtered.
   */
  async getQuestionCount(
    gradeLevel?: GradeLevel,
    dimension?: string,
    difficulty?: DifficultyLevel,
  ): Promise<number> {
    let query = supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true });

    if (gradeLevel) {
      query = query.in('grade', gradeLevelToGrades(gradeLevel));
    }
    if (dimension) {
      query = query.eq('dimension', dimension);
    }
    if (difficulty) {
      query = query.eq('difficulty_rank', difficulty);
    }

    const { count, error } = await query;
    if (error) throw new Error(`Failed to get count: ${error.message}`);
    return count ?? 0;
  },
};

export default questionBankService;
