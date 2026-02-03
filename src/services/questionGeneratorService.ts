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

/**
 * Returns a pre-defined fallback question for instant loading
 * Used when cache is empty and API fails
 */
function getFallbackQuestion(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag
): Question {
  // Middle school fallback questions (grades 6-8, ages 11-14)
  const middleSchoolFallbacks: Record<Subtag, { text: string; options: Question['options']; correctAnswer: Question['correctAnswer'] }[]> = {
    numerical_reasoning: [
      { text: 'If you have 24 cookies and want to share them equally among 6 friends, how many cookies does each friend get?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B' },
      { text: 'A pizza has 8 slices. If you eat 2 slices, what fraction of the pizza is left?', options: { A: '1/4', B: '1/2', C: '3/4', D: '2/3' }, correctAnswer: 'C' },
      { text: 'If a book costs $12 and you have $50, how many books can you buy?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B' },
    ],
    logical_reasoning: [
      { text: 'All dogs are animals. Max is a dog. What can we conclude?', options: { A: 'Max is a cat', B: 'Max is an animal', C: 'All animals are dogs', D: 'Max is not a pet' }, correctAnswer: 'B' },
      { text: 'If it rains, the grass gets wet. The grass is wet. What can we say?', options: { A: 'It definitely rained', B: 'It might have rained', C: 'It did not rain', D: 'The sun is out' }, correctAnswer: 'B' },
    ],
    verbal_reasoning: [
      { text: 'HOT is to COLD as DAY is to:', options: { A: 'Sun', B: 'Night', C: 'Light', D: 'Morning' }, correctAnswer: 'B' },
      { text: 'BOOK is to READ as SONG is to:', options: { A: 'Dance', B: 'Write', C: 'Listen', D: 'Play' }, correctAnswer: 'C' },
      { text: 'Which word means the OPPOSITE of "happy"?', options: { A: 'Joyful', B: 'Excited', C: 'Sad', D: 'Cheerful' }, correctAnswer: 'C' },
    ],
    spatial_reasoning: [
      { text: 'How many sides does a triangle have?', options: { A: '2', B: '3', C: '4', D: '5' }, correctAnswer: 'B' },
      { text: 'If you fold a square piece of paper in half, what shape do you get?', options: { A: 'Triangle', B: 'Circle', C: 'Rectangle', D: 'Pentagon' }, correctAnswer: 'C' },
      { text: 'How many corners does a rectangle have?', options: { A: '2', B: '3', C: '4', D: '5' }, correctAnswer: 'C' },
    ],
    data_interpretation: [
      { text: 'In a class of 20 students, 8 like soccer and 12 like basketball. How many more students like basketball than soccer?', options: { A: '2', B: '4', C: '6', D: '8' }, correctAnswer: 'B' },
      { text: 'If a graph shows Monday: 5 books, Tuesday: 3 books, Wednesday: 7 books read, which day had the most books read?', options: { A: 'Monday', B: 'Tuesday', C: 'Wednesday', D: 'All equal' }, correctAnswer: 'C' },
    ],
    pattern_recognition: [
      { text: 'What comes next: 2, 4, 6, 8, ?', options: { A: '9', B: '10', C: '11', D: '12' }, correctAnswer: 'B' },
      { text: 'What comes next: A, B, C, D, ?', options: { A: 'F', B: 'E', C: 'G', D: 'A' }, correctAnswer: 'B' },
      { text: 'What comes next: 1, 3, 5, 7, ?', options: { A: '8', B: '9', C: '10', D: '11' }, correctAnswer: 'B' },
    ],
  };

  // High school fallback questions (grades 9-10, ages 14-16)
  const highSchoolFallbacks: Record<Subtag, { text: string; options: Question['options']; correctAnswer: Question['correctAnswer'] }[]> = {
    numerical_reasoning: [
      { text: 'If a shirt costs $25 and is on sale for 20% off, what is the sale price?', options: { A: '$20', B: '$22', C: '$18', D: '$15' }, correctAnswer: 'A' },
      { text: 'What is 15% of 80?', options: { A: '10', B: '12', C: '15', D: '8' }, correctAnswer: 'B' },
      { text: 'If 3x + 7 = 22, what is x?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'C' },
    ],
    logical_reasoning: [
      { text: 'All roses are flowers. Some flowers fade quickly. Which conclusion is valid?', options: { A: 'All roses fade quickly', B: 'Some roses may fade quickly', C: 'No roses fade quickly', D: 'Roses never fade' }, correctAnswer: 'B' },
      { text: 'If it rains, the ground gets wet. The ground is wet. What can we conclude?', options: { A: 'It definitely rained', B: 'It might have rained', C: 'It did not rain', D: 'The sun is shining' }, correctAnswer: 'B' },
    ],
    verbal_reasoning: [
      { text: 'HAPPY is to SAD as LIGHT is to:', options: { A: 'Lamp', B: 'Dark', C: 'Bright', D: 'Sun' }, correctAnswer: 'B' },
      { text: 'Choose the word most similar to "ABUNDANT":', options: { A: 'Scarce', B: 'Plentiful', C: 'Empty', D: 'Small' }, correctAnswer: 'B' },
    ],
    spatial_reasoning: [
      { text: 'If you rotate a square 90 degrees clockwise, which corner moves to the top?', options: { A: 'Top-left', B: 'Top-right', C: 'Bottom-left', D: 'Bottom-right' }, correctAnswer: 'C' },
      { text: 'How many faces does a cube have?', options: { A: '4', B: '6', C: '8', D: '12' }, correctAnswer: 'B' },
    ],
    data_interpretation: [
      { text: 'A bar chart shows sales of 100, 150, 200, 250 for Jan-Apr. What is the average monthly sales?', options: { A: '150', B: '175', C: '200', D: '225' }, correctAnswer: 'B' },
      { text: 'If a pie chart shows 25% for Category A, what angle does it represent?', options: { A: '45°', B: '90°', C: '180°', D: '270°' }, correctAnswer: 'B' },
    ],
    pattern_recognition: [
      { text: 'What comes next: 2, 4, 8, 16, ?', options: { A: '24', B: '32', C: '20', D: '18' }, correctAnswer: 'B' },
      { text: 'Complete the pattern: A, C, E, G, ?', options: { A: 'H', B: 'I', C: 'J', D: 'K' }, correctAnswer: 'B' },
    ],
  };

  // Select appropriate fallbacks based on grade level (higher_secondary uses high school fallbacks)
  const fallbacks = gradeLevel === 'middle_school' ? middleSchoolFallbacks : highSchoolFallbacks;
  const subtagFallbacks = fallbacks[subtag] || fallbacks.numerical_reasoning;
  const fallback = subtagFallbacks[Math.floor(Math.random() * subtagFallbacks.length)];

  return {
    id: generateQuestionId(gradeLevel, phase, difficulty, subtag),
    text: fallback.text,
    options: fallback.options,
    correctAnswer: fallback.correctAnswer,
    difficulty,
    subtag,
    gradeLevel,
    phase,
    explanation: 'Fallback question',
    createdAt: new Date().toISOString(),
  };
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
  
  try {
    const result = await callWorkerAPI<QuestionGenerationResult>('/generate/diagnostic', {
      gradeLevel,
      excludeQuestionIds,
      excludeQuestionTexts,
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ [QuestionGeneratorService] Generated ${result.questions.length} questions in ${elapsed}ms (via Worker)`);
    
    return result;
  } catch (error) {
    console.error('❌ [QuestionGeneratorService] Worker API failed, using fallback:', error);
    return generateFallbackDiagnosticQuestions(gradeLevel);
  }
}

/**
 * Generates fallback diagnostic questions when worker is unavailable
 * Phase 1: All 8 questions at Level 3 (baseline) to establish starting ability
 */
function generateFallbackDiagnosticQuestions(gradeLevel: GradeLevel): QuestionGenerationResult {
  const phase: TestPhase = 'diagnostic_screener';
  const subtags: Subtag[] = ['numerical_reasoning', 'logical_reasoning', 'verbal_reasoning', 
                             'spatial_reasoning', 'data_interpretation', 'pattern_recognition'];
  // All 6 questions at Level 3 for baseline assessment
  const difficulties: DifficultyLevel[] = [3, 3, 3, 3, 3, 3];
  
  const questions: Question[] = difficulties.map((difficulty, i) => 
    getFallbackQuestion(gradeLevel, phase, difficulty, subtags[i])
  );
  
  return {
    questions,
    fromCache: false,
    generatedCount: 0,
    cachedCount: 0,
  };
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
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 [QuestionGeneratorService] generateAdaptiveCoreQuestions called:', { gradeLevel, startingDifficulty, count });
  const startTime = Date.now();
  
  try {
    const result = await callWorkerAPI<QuestionGenerationResult>('/generate/adaptive', {
      gradeLevel,
      startingDifficulty,
      count,
      excludeQuestionIds,
      excludeQuestionTexts,
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ [QuestionGeneratorService] Generated ${result.questions.length} questions in ${elapsed}ms (via Worker)`);
    
    return result;
  } catch (error) {
    console.error('❌ [QuestionGeneratorService] Worker API failed, using fallback:', error);
    return generateFallbackAdaptiveQuestions(gradeLevel, startingDifficulty, count);
  }
}

/**
 * Generates fallback adaptive questions when worker is unavailable
 */
function generateFallbackAdaptiveQuestions(
  gradeLevel: GradeLevel, 
  startingDifficulty: DifficultyLevel,
  count: number
): QuestionGenerationResult {
  const phase: TestPhase = 'adaptive_core';
  const shuffledSubtags = [...ALL_SUBTAGS].sort(() => Math.random() - 0.5);
  
  const questions: Question[] = [];
  let currentDifficulty = startingDifficulty;
  
  for (let i = 0; i < count; i++) {
    const subtag = shuffledSubtags[i % shuffledSubtags.length];
    questions.push(getFallbackQuestion(gradeLevel, phase, currentDifficulty, subtag));
    
    // Vary difficulty slightly
    if (Math.random() > 0.5 && currentDifficulty < 5) {
      currentDifficulty = (currentDifficulty + 1) as DifficultyLevel;
    } else if (currentDifficulty > 1) {
      currentDifficulty = (currentDifficulty - 1) as DifficultyLevel;
    }
  }
  
  return {
    questions,
    fromCache: false,
    generatedCount: 0,
    cachedCount: 0,
  };
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
  
  try {
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
  } catch (error) {
    console.error('❌ [QuestionGeneratorService] Worker API failed, using fallback:', error);
    return generateFallbackStabilityQuestions(gradeLevel, provisionalBand, count);
  }
}

/**
 * Generates fallback stability questions when worker is unavailable
 */
function generateFallbackStabilityQuestions(
  gradeLevel: GradeLevel, 
  provisionalBand: DifficultyLevel,
  count: number
): QuestionGenerationResult {
  const phase: TestPhase = 'stability_confirmation';
  const dataFormats: Subtag[] = ['data_interpretation', 'pattern_recognition'];
  const logicFormats: Subtag[] = ['logical_reasoning', 'numerical_reasoning'];
  
  const questions: Question[] = [];
  const minDiff = Math.max(1, provisionalBand - 1) as DifficultyLevel;
  const maxDiff = Math.min(5, provisionalBand + 1) as DifficultyLevel;
  
  for (let i = 0; i < count; i++) {
    const pool = i % 2 === 0 ? dataFormats : logicFormats;
    const subtag = pool[Math.floor(Math.random() * pool.length)];
    const difficulty = [minDiff, provisionalBand, maxDiff][Math.floor(Math.random() * 3)];
    questions.push(getFallbackQuestion(gradeLevel, phase, difficulty, subtag));
  }
  
  return {
    questions,
    fromCache: false,
    generatedCount: 0,
    cachedCount: 0,
  };
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
  
  try {
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
  } catch (error) {
    console.error('❌ [QuestionGeneratorService] Worker API failed, using fallback:', error);
    return {
      questions: [getFallbackQuestion(gradeLevel, phase, difficulty, subtag)],
      fromCache: false,
      generatedCount: 0,
      cachedCount: 0,
    };
  }
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
    excludeQuestionTexts?: string[]
  ): Promise<QuestionGenerationResult> {
    return generateAdaptiveCoreQuestions(gradeLevel, startingDifficulty, count, excludeQuestionIds, excludeQuestionTexts);
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
