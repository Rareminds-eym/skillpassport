/**
 * Question Bank Utility
 * Fetches adaptive questions from personal_assessment_questions table
 * 
 * Database Schema:
 * - id: uuid (primary key)
 * - question_text: text
 * - options: jsonb {A, B, C, D}
 * - correct_answer: varchar
 * - description: text (explanation)
 * - metadata: jsonb {
 *     grade: integer (6, 7, 8),
 *     dimension: text (QR, LR, SR, PAR, DI, AA),
 *     difficulty_rank: integer (1-5),
 *     time_target_sec: integer
 *   }
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GradeLevel, DifficultyLevel, Subtag, Question, TestPhase } from '../types';

/**
 * Maps dimension codes to subtags
 * Database dimensions: AR, DI, LR, PS, QR, ST
 */
const DIMENSION_TO_SUBTAG: Record<string, Subtag> = {
  'QR': 'numerical_reasoning',      // Quantitative Reasoning
  'LR': 'logical_reasoning',         // Logical Reasoning
  'ST': 'spatial_reasoning',         // Spatial Thinking
  'AR': 'pattern_recognition',       // Abstract Reasoning
  'DI': 'data_interpretation',       // Data Interpretation
  'PS': 'verbal_reasoning',          // Problem Solving (mapped to verbal)
};

/**
 * Extract numeric grade from student grade string
 */
export function extractGradeNumber(gradeString: string): number | null {
  if (!gradeString) return null;
  const match = gradeString.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Convert student grade string to GradeLevel enum
 */
export function studentGradeToGradeLevel(gradeString: string): GradeLevel {
  const numericGrade = extractGradeNumber(gradeString);
  
  if (!numericGrade) return 'high_school';
  
  if (numericGrade >= 6 && numericGrade <= 8) return 'middle_school';
  if (numericGrade >= 9 && numericGrade <= 10) return 'high_school';
  if (numericGrade >= 11 && numericGrade <= 12) return 'higher_secondary';
  
  return 'high_school';
}

/**
 * Map grade level to specific grade numbers
 */
function gradeToNumbers(gradeLevel: GradeLevel, specificGrade?: string | number): number[] {
  // If specific grade provided, use it
  if (specificGrade !== undefined && specificGrade !== null) {
    if (typeof specificGrade === 'number') return [specificGrade];
    const extracted = extractGradeNumber(specificGrade);
    return extracted ? [extracted] : [6, 7, 8];
  }
  
  // Otherwise use grade range
  switch (gradeLevel) {
    case 'middle_school': return [6, 7, 8];
    case 'high_school': return [9, 10];
    case 'higher_secondary': return [11, 12];
    default: return [9, 10];
  }
}

/**
 * Fisher-Yates shuffle for randomization
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Convert database row to Question type
 */
function mapToQuestion(row: any, phase: TestPhase, gradeLevel: GradeLevel): Question {
  const dimension = row.metadata?.dimension || row.dimension;
  const subtag = DIMENSION_TO_SUBTAG[dimension] || 'logical_reasoning';
  
  return {
    id: row.id,
    text: row.question_text,
    options: row.options, // Already in {A, B, C, D} format
    correctAnswer: row.correct_answer,
    explanation: row.description || 'No explanation available',
    difficulty: (row.metadata?.difficulty_rank || row.difficulty_rank) as DifficultyLevel,
    subtag,
    gradeLevel,
    phase,
    createdAt: new Date().toISOString()
  };
}

/**
 * Fetch diagnostic screener questions (8 questions at difficulty 3)
 * Fully randomized selection with no sequential dimension repeats
 */
export async function fetchDiagnosticQuestions(
  supabase: SupabaseClient,
  gradeLevel: GradeLevel,
  excludeIds: string[] = [],
  specificGrade?: string | number
): Promise<Question[]> {
  const grades = gradeToNumbers(gradeLevel, specificGrade);
  
  console.log('🔍 [QuestionBank] Fetching diagnostic questions:', {
    grades,
    difficulty: 3,
    excludeCount: excludeIds.length
  });
  
  // Fetch all available questions at difficulty 3
  let query = supabase
    .from('personal_assessment_questions')
    .select('id, metadata, question_text, options, correct_answer, description')
    .contains('metadata', { grade: grades[0] })
    .eq('metadata->>difficulty_rank', '3')
    .limit(100); // Fetch large pool for randomization
  
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  
  const { data, error } = await query;
  
  if (error || !data || data.length === 0) {
    throw new Error(`No diagnostic questions available for grades ${grades.join(', ')}`);
  }
  
  // Shuffle all questions
  const shuffled = shuffle(data);
  
  // Select 8 questions ensuring no consecutive same dimensions
  const selected: any[] = [];
  let lastDimension: string | null = null;
  
  for (const question of shuffled) {
    const dimension = question.metadata?.dimension || question.dimension;
    
    // Skip if same as last dimension
    if (dimension === lastDimension) {
      continue;
    }
    
    selected.push(question);
    lastDimension = dimension;
    
    if (selected.length === 8) {
      break;
    }
  }
  
  // If we couldn't get 8 without repeats, fill remaining with any available
  if (selected.length < 8) {
    const usedIds = selected.map(q => q.id);
    for (const question of shuffled) {
      if (!usedIds.includes(question.id)) {
        selected.push(question);
        if (selected.length === 8) break;
      }
    }
  }
  
  if (selected.length === 0) {
    throw new Error(`No diagnostic questions available for grades ${grades.join(', ')}`);
  }
  
  console.log(`✅ [QuestionBank] Returning ${selected.length} diagnostic questions with dimension distribution:`, 
    selected.reduce((acc, q) => {
      const dim = q.metadata?.dimension || q.dimension;
      acc[dim] = (acc[dim] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );
  
  return selected.map(row => mapToQuestion(row, 'diagnostic_screener', gradeLevel));
}

/**
 * Fetch single adaptive question with comprehensive fallback strategy
 */
export async function fetchAdaptiveQuestion(
  supabase: SupabaseClient,
  gradeLevel: GradeLevel,
  difficulty: DifficultyLevel,
  subtag: Subtag,
  excludeIds: string[] = [],
  specificGrade?: string | number
): Promise<Question | null> {
  const grades = gradeToNumbers(gradeLevel, specificGrade);
  const dimension = Object.entries(DIMENSION_TO_SUBTAG)
    .find(([_, tag]) => tag === subtag)?.[0];
  
  console.log('🔍 [QuestionBank] Fetching adaptive question:', {
    grades,
    difficulty,
    subtag,
    dimension,
    excludeCount: excludeIds.length
  });
  
  // Strategy 1: Try exact match (grade + difficulty + dimension)
  if (dimension) {
    let query = supabase
      .from('personal_assessment_questions')
      .select('id, metadata, question_text, options, correct_answer, description')
      .contains('metadata', { grade: grades[0] })
      .eq('metadata->>difficulty_rank', difficulty.toString())
      .eq('metadata->>dimension', dimension)
      .limit(20);
    
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    
    const { data, error } = await query;
    
    if (!error && data && data.length > 0) {
      const shuffled = shuffle(data);
      const selected = shuffled[0];
      console.log(`✅ [QuestionBank] Found exact match: ${selected.id} (${dimension}, difficulty ${difficulty})`);
      return mapToQuestion(selected, 'adaptive_core', gradeLevel);
    }
    
    console.warn(`⚠️ [QuestionBank] No exact match for ${dimension} at difficulty ${difficulty}`);
  }
  
  // Strategy 2: Try same difficulty, any dimension
  console.log(`🔄 [QuestionBank] Trying difficulty ${difficulty}, any dimension...`);
  let fallbackQuery = supabase
    .from('personal_assessment_questions')
    .select('id, metadata, question_text, options, correct_answer, description')
    .contains('metadata', { grade: grades[0] })
    .eq('metadata->>difficulty_rank', difficulty.toString())
    .limit(20);
  
  if (excludeIds.length > 0) {
    fallbackQuery = fallbackQuery.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  
  const { data: fallbackData, error: fallbackError } = await fallbackQuery;
  
  if (!fallbackError && fallbackData && fallbackData.length > 0) {
    const shuffled = shuffle(fallbackData);
    const selected = shuffled[0];
    console.log(`✅ [QuestionBank] Found at difficulty ${difficulty}: ${selected.id} (${selected.metadata?.dimension || 'unknown'})`);
    return mapToQuestion(selected, 'adaptive_core', gradeLevel);
  }
  
  // Strategy 3: Try adjacent difficulty levels (±1)
  const adjacentDifficulties = [
    difficulty - 1,
    difficulty + 1
  ].filter(d => d >= 1 && d <= 5) as DifficultyLevel[];
  
  for (const adjDiff of adjacentDifficulties) {
    console.log(`🔄 [QuestionBank] Trying adjacent difficulty ${adjDiff}...`);
    
    let adjQuery = supabase
      .from('personal_assessment_questions')
      .select('id, metadata, question_text, options, correct_answer, description')
      .contains('metadata', { grade: grades[0] })
      .eq('metadata->>difficulty_rank', adjDiff.toString())
      .limit(20);
    
    if (excludeIds.length > 0) {
      adjQuery = adjQuery.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    
    const { data: adjData, error: adjError } = await adjQuery;
    
    if (!adjError && adjData && adjData.length > 0) {
      const shuffled = shuffle(adjData);
      const selected = shuffled[0];
      console.log(`✅ [QuestionBank] Found at difficulty ${adjDiff}: ${selected.id} (${selected.metadata?.dimension || 'unknown'})`);
      return mapToQuestion(selected, 'adaptive_core', gradeLevel);
    }
  }
  
  // Strategy 4: Try expanding grade range
  const allMiddleSchoolGrades = [6, 7, 8];
  const expandedGrades = allMiddleSchoolGrades.filter(g => !grades.includes(g));
  
  if (expandedGrades.length > 0) {
    console.log(`🔄 [QuestionBank] Trying expanded grades: ${expandedGrades.join(', ')}...`);
    
    let expandedQuery = supabase
      .from('personal_assessment_questions')
      .select('id, metadata, question_text, options, correct_answer, description')
      .gte('metadata->>difficulty_rank', Math.max(1, difficulty - 1).toString())
      .lte('metadata->>difficulty_rank', Math.min(5, difficulty + 1).toString())
      .limit(20);
    
    if (excludeIds.length > 0) {
      expandedQuery = expandedQuery.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    
    const { data: expandedData, error: expandedError } = await expandedQuery;
    
    if (!expandedError && expandedData && expandedData.length > 0) {
      const shuffled = shuffle(expandedData);
      const selected = shuffled[0];
      console.log(`✅ [QuestionBank] Found with expanded grades: ${selected.id} (grade ${selected.metadata?.grade}, ${selected.metadata?.dimension}, difficulty ${selected.metadata?.difficulty_rank})`);
      return mapToQuestion(selected, 'adaptive_core', gradeLevel);
    }
  }
  
  // Strategy 5: Last resort - any available question
  console.log(`🔄 [QuestionBank] Last resort: trying any available question...`);
  let lastResortQuery = supabase
    .from('personal_assessment_questions')
    .select('id, metadata, question_text, options, correct_answer, description')
    .limit(50);
  
  if (excludeIds.length > 0) {
    lastResortQuery = lastResortQuery.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  
  const { data: lastResortData, error: lastResortError } = await lastResortQuery;
  
  if (!lastResortError && lastResortData && lastResortData.length > 0) {
    const shuffled = shuffle(lastResortData);
    const selected = shuffled[0];
    console.log(`✅ [QuestionBank] Last resort found: ${selected.id} (grade ${selected.metadata?.grade}, ${selected.metadata?.dimension}, difficulty ${selected.metadata?.difficulty_rank})`);
    return mapToQuestion(selected, 'adaptive_core', gradeLevel);
  }
  
  console.error('❌ [QuestionBank] Question bank exhausted - no questions available');
  return null;
}

/**
 * Fetch stability confirmation questions (6 questions at provisional difficulty)
 * Fully randomized selection with no sequential dimension repeats
 */
export async function fetchStabilityQuestions(
  supabase: SupabaseClient,
  gradeLevel: GradeLevel,
  difficulty: DifficultyLevel,
  excludeIds: string[] = [],
  specificGrade?: string | number
): Promise<Question[]> {
  const grades = gradeToNumbers(gradeLevel, specificGrade);
  
  console.log('🔍 [QuestionBank] Fetching stability questions:', {
    grades,
    difficulty,
    excludeCount: excludeIds.length
  });
  
  // Fetch all available questions at this difficulty
  let query = supabase
    .from('personal_assessment_questions')
    .select('id, metadata, question_text, options, correct_answer, description')
    .contains('metadata', { grade: grades[0] })
    .eq('metadata->>difficulty_rank', difficulty.toString())
    .limit(100); // Fetch large pool for randomization
  
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  
  const { data, error } = await query;
  
  if (error || !data || data.length === 0) {
    throw new Error(`No stability questions available for grades ${grades.join(', ')} at difficulty ${difficulty}`);
  }
  
  // Shuffle all questions
  const shuffled = shuffle(data);
  
  // Select 6 questions ensuring no consecutive same dimensions
  const selected: any[] = [];
  let lastDimension: string | null = null;
  
  for (const question of shuffled) {
    const dimension = question.metadata?.dimension || question.dimension;
    
    // Skip if same as last dimension
    if (dimension === lastDimension) {
      continue;
    }
    
    selected.push(question);
    lastDimension = dimension;
    
    if (selected.length === 6) {
      break;
    }
  }
  
  // If we couldn't get 6 without repeats, fill remaining with any available
  if (selected.length < 6) {
    const usedIds = selected.map(q => q.id);
    for (const question of shuffled) {
      if (!usedIds.includes(question.id)) {
        selected.push(question);
        if (selected.length === 6) break;
      }
    }
  }
  
  if (selected.length === 0) {
    throw new Error(`No stability questions available for grades ${grades.join(', ')} at difficulty ${difficulty}`);
  }
  
  console.log(`✅ [QuestionBank] Returning ${selected.length} stability questions with dimension distribution:`, 
    selected.reduce((acc, q) => {
      const dim = q.metadata?.dimension || q.dimension;
      acc[dim] = (acc[dim] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );
  
  return selected.map(row => mapToQuestion(row, 'stability_confirmation', gradeLevel));
}
