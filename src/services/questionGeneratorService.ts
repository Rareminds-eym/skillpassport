/**
 * Question Generator Service
 * 
 * Generates adaptive aptitude test questions using Cloudflare Pages Function.
 * Handles question generation for all test phases with caching support.
 * 
 * Requirements: 4.1, 4.2, 1.4, 6.1, 2.5, 6.2, 3.1, 3.2, 7.1
 */

import { supabase } from '../lib/supabaseClient';
import { getPagesApiUrl } from '../utils/pagesUrl';
import {
  Question,
  GradeLevel,
  TestPhase,
  DifficultyLevel,
  Subtag,
  ALL_SUBTAGS,
} from '../types/adaptiveAptitude';

// =============================================================================
// CLOUDFLARE PAGES FUNCTION API CONFIGURATION
// =============================================================================

const API_URL = getPagesApiUrl('question-generation');

/**
 * Makes a request to the Cloudflare Pages Function API
 */
async function callWorkerAPI<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  console.log(`📡 [QuestionGeneratorService] Calling Pages Function API: ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ [QuestionGeneratorService] Worker API error:', response.status, errorData);
    throw new Error((errorData as { error?: string }).error || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for generating questions
 */
export interface QuestionGenerationOptions {
  gradeLevel: GradeLevel;
  phase: TestPhase;
  difficulty?: DifficultyLevel;
  subtag?: Subtag;
  count?: number;
  excludeQuestionIds?: string[];
  excludeQuestionTexts?: string[];  // Add support for excluding by question text
}

/**
 * Result of question generation
 */
export interface QuestionGenerationResult {
  questions: Question[];
  fromCache: boolean;
  generatedCount: number;
  cachedCount: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generates a unique question ID
 */
function generateQuestionId(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${gradeLevel}_${phase}_d${difficulty}_${subtag}_${timestamp}_${random}`;
}


// =============================================================================
// CACHING FUNCTIONS
// =============================================================================

/**
 * Retrieves cached questions from the database
 * Requirements: 7.1
 */
async function getCachedQuestions(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty?: DifficultyLevel,
  subtag?: Subtag,
  limit: number = 10,
  excludeIds: string[] = []
): Promise<Question[]> {
  let query = supabase
    .from('adaptive_aptitude_questions_cache')
    .select('*')
    .eq('grade_level', gradeLevel)
    .eq('phase', phase)
    .eq('is_active', true);

  if (difficulty !== undefined) {
    query = query.eq('difficulty', difficulty);
  }

  if (subtag !== undefined) {
    query = query.eq('subtag', subtag);
  }

  if (excludeIds.length > 0) {
    query = query.not('question_id', 'in', `(${excludeIds.join(',')})`);
  }

  query = query.order('usage_count', { ascending: true }).limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cached questions:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((record) => ({
    id: record.question_id,
    text: record.text,
    options: record.options as Question['options'],
    correctAnswer: record.correct_answer as Question['correctAnswer'],
    difficulty: record.difficulty as DifficultyLevel,
    subtag: record.subtag as Subtag,
    gradeLevel: record.grade_level as GradeLevel,
    phase: record.phase as TestPhase,
    explanation: record.explanation || undefined,
    createdAt: record.created_at,
  }));
}

/**
 * Saves questions to the cache
 * Requirements: 7.1
 */
async function cacheQuestions(questions: Question[]): Promise<void> {
  if (questions.length === 0) return;

  const records = questions.map((q) => ({
    question_id: q.id,
    text: q.text,
    options: q.options,
    correct_answer: q.correctAnswer,
    difficulty: q.difficulty,
    subtag: q.subtag,
    grade_level: q.gradeLevel,
    phase: q.phase,
    explanation: q.explanation || null,
  }));

  const { error } = await supabase
    .from('adaptive_aptitude_questions_cache')
    .upsert(records, { onConflict: 'question_id' });

  if (error) {
    console.error('Error caching questions:', error);
  }
}

/**
 * Updates usage count for questions
 */
async function updateQuestionUsage(questionIds: string[]): Promise<void> {
  for (const questionId of questionIds) {
    try {
      await supabase.rpc('update_question_usage', { p_question_id: questionId });
    } catch {
      // Ignore errors - usage tracking is non-critical
    }
  }
}

// =============================================================================
// DIAGNOSTIC SCREENER GENERATION (via Cloudflare Worker)
// =============================================================================

/**
 * Generates questions for the Diagnostic Screener phase via Cloudflare Worker
 * Requirements: 1.4, 6.1
 * 
 * - Generates 6 questions: 2 Easy (1-2), 2 Medium (3), 2 Hard (4-5)
 * - Ensures at least 3 different subtags
 * - Prevents consecutive same-subtag questions
 */
export async function generateDiagnosticScreenerQuestions(
  gradeLevel: GradeLevel,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 [QuestionGeneratorService] generateDiagnosticScreenerQuestions called:', { gradeLevel });
  const startTime = Date.now();
  
  const result = await callWorkerAPI<QuestionGenerationResult>('/generate/diagnostic', {
    gradeLevel,
    excludeQuestionIds,
    excludeQuestionTexts,
  });
  
  const elapsed = Date.now() - startTime;
  console.log(`✅ [QuestionGeneratorService] Generated ${result.questions.length} questions in ${elapsed}ms (via Worker)`);
  
  return result;
}

// =============================================================================
// ADAPTIVE CORE GENERATION (via Cloudflare Worker)
// =============================================================================

/**
 * Generates questions for the Adaptive Core Loop phase via Cloudflare Worker
 * Requirements: 2.5, 6.2
 * 
 * - Generates 8-11 questions with adaptive difficulty
 * - Maintains subtag balance (no more than 2 consecutive same subtag)
 * - Limits consecutive difficulty jumps in same direction to 2
 */
export async function generateAdaptiveCoreQuestions(
  gradeLevel: GradeLevel,
  startingDifficulty: DifficultyLevel,
  count: number = 10,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = [],
  studentCourse?: string | null
): Promise<QuestionGenerationResult> {
  console.log('🎯 [QuestionGeneratorService] generateAdaptiveCoreQuestions called:', { gradeLevel, startingDifficulty, count, studentCourse });
  const startTime = Date.now();
  
  const result = await callWorkerAPI<QuestionGenerationResult>('/generate/adaptive', {
    gradeLevel,
    startingDifficulty,
    count,
    excludeQuestionIds,
    excludeQuestionTexts,
    studentCourse,
  });
  
  const elapsed = Date.now() - startTime;
  console.log(`✅ [QuestionGeneratorService] Generated ${result.questions.length} questions in ${elapsed}ms (via Worker)`);
  
  return result;
}

// =============================================================================
// STABILITY CONFIRMATION GENERATION (via Cloudflare Worker)
// =============================================================================

/**
 * Generates questions for the Stability Confirmation phase via Cloudflare Worker
 * Requirements: 3.1, 3.2
 * 
 * - Generates 4-6 questions within ±1 of provisional band
 * - Includes at least one near-boundary item
 * - Mixes data and logic formats
 */
export async function generateStabilityConfirmationQuestions(
  gradeLevel: GradeLevel,
  provisionalBand: DifficultyLevel,
  count: number = 4,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 [QuestionGeneratorService] generateStabilityConfirmationQuestions called:', { gradeLevel, provisionalBand, count });
  const startTime = Date.now();
  
  const result = await callWorkerAPI<QuestionGenerationResult>('/generate/stability', {
    gradeLevel,
    provisionalBand,
    count,
    excludeQuestionIds,
    excludeQuestionTexts,
  });
  
  const elapsed = Date.now() - startTime;
  console.log(`✅ [QuestionGeneratorService] Generated ${result.questions.length} questions in ${elapsed}ms (via Worker)`);
  
  return result;
}

// =============================================================================
// SINGLE QUESTION GENERATION (for dynamic adaptive core)
// =============================================================================

/**
 * Generates a single question via Cloudflare Worker
 * Used during adaptive core phase for dynamic question generation based on current difficulty
 */
export async function generateSingleQuestion(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 [QuestionGeneratorService] generateSingleQuestion called:', { gradeLevel, phase, difficulty, subtag });
  const startTime = Date.now();
  
  const result = await callWorkerAPI<QuestionGenerationResult>('/generate/single', {
    gradeLevel,
    phase,
    difficulty,
    subtag,
    excludeQuestionIds,
    excludeQuestionTexts,
  });
  
  const elapsed = Date.now() - startTime;
  console.log(`✅ [QuestionGeneratorService] Generated single question in ${elapsed}ms (via Worker)`);
  
  return result;
}

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

/**
 * Main function to generate questions based on options
 * Requirements: 7.1
 */
export async function generateQuestions(
  options: QuestionGenerationOptions
): Promise<QuestionGenerationResult> {
  const { gradeLevel, phase, difficulty, subtag, count = 1, excludeQuestionIds = [], excludeQuestionTexts = [] } = options;

  // If specific difficulty and subtag provided, generate single question
  if (difficulty !== undefined && subtag !== undefined) {
    return generateSingleQuestion(gradeLevel, phase, difficulty, subtag, excludeQuestionIds, excludeQuestionTexts);
  }

  // Phase-specific generation
  switch (phase) {
    case 'diagnostic_screener':
      return generateDiagnosticScreenerQuestions(gradeLevel, excludeQuestionIds, excludeQuestionTexts);
    
    case 'adaptive_core':
      return generateAdaptiveCoreQuestions(
        gradeLevel,
        difficulty || 3,
        count,
        excludeQuestionIds,
        excludeQuestionTexts
      );
    
    case 'stability_confirmation':
      return generateStabilityConfirmationQuestions(
        gradeLevel,
        difficulty || 3,
        count,
        excludeQuestionIds,
        excludeQuestionTexts
      );
    
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

// =============================================================================
// QUESTION GENERATOR SERVICE CLASS
// =============================================================================

/**
 * QuestionGeneratorService class providing all question generation functionality
 */
export class QuestionGeneratorService {
  /**
   * Generates questions for the Diagnostic Screener phase
   * Requirements: 1.4, 6.1
   */
  static async generateDiagnosticScreenerQuestions(
    gradeLevel: GradeLevel,
    excludeQuestionIds?: string[],
    excludeQuestionTexts?: string[]
  ): Promise<QuestionGenerationResult> {
    return generateDiagnosticScreenerQuestions(gradeLevel, excludeQuestionIds, excludeQuestionTexts);
  }

  /**
   * Generates questions for the Adaptive Core Loop phase
   * Requirements: 2.5, 6.2
   */
  static async generateAdaptiveCoreQuestions(
    gradeLevel: GradeLevel,
    startingDifficulty: DifficultyLevel,
    count?: number,
    excludeQuestionIds?: string[],
    excludeQuestionTexts?: string[],
    studentCourse?: string | null
  ): Promise<QuestionGenerationResult> {
    return generateAdaptiveCoreQuestions(gradeLevel, startingDifficulty, count, excludeQuestionIds, excludeQuestionTexts, studentCourse);
  }

  /**
   * Generates questions for the Stability Confirmation phase
   * Requirements: 3.1, 3.2
   */
  static async generateStabilityConfirmationQuestions(
    gradeLevel: GradeLevel,
    provisionalBand: DifficultyLevel,
    count?: number,
    excludeQuestionIds?: string[],
    excludeQuestionTexts?: string[]
  ): Promise<QuestionGenerationResult> {
    return generateStabilityConfirmationQuestions(gradeLevel, provisionalBand, count, excludeQuestionIds, excludeQuestionTexts);
  }

  /**
   * Generates questions based on options
   * Requirements: 7.1
   */
  static async generateQuestions(
    options: QuestionGenerationOptions
  ): Promise<QuestionGenerationResult> {
    return generateQuestions(options);
  }

  /**
   * Gets cached questions from the database
   * Requirements: 7.1
   */
  static async getCachedQuestions(
    gradeLevel: GradeLevel,
    phase: TestPhase,
    difficulty?: DifficultyLevel,
    subtag?: Subtag,
    limit?: number,
    excludeIds?: string[]
  ): Promise<Question[]> {
    return getCachedQuestions(gradeLevel, phase, difficulty, subtag, limit, excludeIds);
  }

  /**
   * Caches questions to the database
   * Requirements: 7.1
   */
  static async cacheQuestions(questions: Question[]): Promise<void> {
    return cacheQuestions(questions);
  }

  /**
   * Updates usage count for questions
   */
  static async updateQuestionUsage(questionIds: string[]): Promise<void> {
    return updateQuestionUsage(questionIds);
  }
}

export default QuestionGeneratorService;
