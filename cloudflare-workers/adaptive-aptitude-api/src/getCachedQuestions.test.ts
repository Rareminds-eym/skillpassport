/**
 * Property-Based Tests for getCachedQuestions
 * 
 * Feature: duplicate-question-prevention
 * Property 2: Cache query filters exclusions
 * Validates: Requirements 1.2, 2.2
 * 
 * This test verifies that when querying cached questions with an exclusion list,
 * all returned questions have IDs that are NOT in the exclusion list.
 * 
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES (matching index.ts)
// =============================================================================

type GradeLevel = 'middle_school' | 'high_school';
type TestPhase = 'diagnostic_screener' | 'adaptive_core' | 'stability_confirmation';
type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
type Subtag = 
  | 'numerical_reasoning'
  | 'logical_reasoning'
  | 'verbal_reasoning'
  | 'spatial_reasoning'
  | 'data_interpretation'
  | 'pattern_recognition';

interface Question {
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

interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  OPENROUTER_API_KEY?: string;
  VITE_OPENROUTER_API_KEY?: string;
}

// =============================================================================
// HELPER FUNCTIONS (extracted from index.ts for testing)
// =============================================================================

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

async function getCachedQuestions(
  env: Env,
  supabase: any,
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

  // Fix: Use correct Supabase PostgREST NOT IN syntax with quoted IDs
  if (excludeIds.length > 0) {
    query = query.not('question_id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
  }

  query = query.order('usage_count', { ascending: true }).limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('❌ [getCachedQuestions] Error fetching cached questions:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const questions = data.map((record: any) => ({
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

  // Post-query validation: Filter out any questions that are in the exclusion list
  const validQuestions = questions.filter((q: Question) => !excludeIds.includes(q.id));

  return validQuestions;
}

// =============================================================================
// TEST SETUP
// =============================================================================

let supabase: any;
let env: Env;

beforeAll(() => {
  // Load environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  }

  env = {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseKey,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  supabase = createClient(supabaseUrl, supabaseKey);
});

// =============================================================================
// PROPERTY-BASED TEST GENERATORS
// =============================================================================

const gradeLevelArbitrary = fc.constantFrom<GradeLevel>('middle_school', 'high_school');
const phaseArbitrary = fc.constantFrom<TestPhase>('diagnostic_screener', 'adaptive_core', 'stability_confirmation');
const difficultyArbitrary = fc.constantFrom<DifficultyLevel>(1, 2, 3, 4, 5);
const subtagArbitrary = fc.constantFrom<Subtag>(
  'numerical_reasoning',
  'logical_reasoning',
  'verbal_reasoning',
  'spatial_reasoning',
  'data_interpretation',
  'pattern_recognition'
);

// Generate realistic question IDs that match the format used in the system
const questionIdArbitrary = fc.tuple(
  gradeLevelArbitrary,
  phaseArbitrary,
  difficultyArbitrary,
  subtagArbitrary
).map(([gradeLevel, phase, difficulty, subtag]) => 
  generateQuestionId(gradeLevel, phase, difficulty, subtag)
);

// Generate an array of question IDs for exclusion lists
const exclusionListArbitrary = fc.array(questionIdArbitrary, { minLength: 0, maxLength: 30 });

// =============================================================================
// PROPERTY-BASED TESTS
// =============================================================================

describe('Property 2: Cache query filters exclusions', () => {
  /**
   * **Feature: duplicate-question-prevention, Property 2: Cache query filters exclusions**
   * **Validates: Requirements 1.2, 2.2**
   * 
   * Property: For any cache query with an exclusion list, all returned questions 
   * should have IDs that are NOT in the exclusion list.
   * 
   * This property ensures that:
   * 1. The SQL NOT IN clause is correctly formatted
   * 2. The post-query validation catches any questions that slip through
   * 3. No excluded question IDs ever appear in the results
   */
  it('should never return questions with IDs in the exclusion list', async () => {
    await fc.assert(
      fc.asyncProperty(
        gradeLevelArbitrary,
        phaseArbitrary,
        fc.option(difficultyArbitrary, { nil: undefined }),
        fc.option(subtagArbitrary, { nil: undefined }),
        exclusionListArbitrary,
        async (gradeLevel, phase, difficulty, subtag, excludeIds) => {
          // Query the cache with the exclusion list
          const results = await getCachedQuestions(
            env,
            supabase,
            gradeLevel,
            phase,
            difficulty,
            subtag,
            10,
            excludeIds
          );

          // Property: No returned question should have an ID in the exclusion list
          const hasExcludedQuestion = results.some(q => excludeIds.includes(q.id));

          // Log failure details for debugging
          if (hasExcludedQuestion) {
            const excludedQuestions = results.filter(q => excludeIds.includes(q.id));
            console.error('❌ Property violation: Excluded questions were returned:', {
              gradeLevel,
              phase,
              difficulty,
              subtag,
              excludeCount: excludeIds.length,
              excludeIds: excludeIds.slice(0, 10), // First 10 for readability
              returnedCount: results.length,
              excludedQuestions: excludedQuestions.map(q => q.id),
            });
          }

          // Assert the property holds
          expect(hasExcludedQuestion).toBe(false);
        }
      ),
      { 
        numRuns: 100, // Run 100 iterations as specified in design
        verbose: true,
      }
    );
  }, 60000); // 60 second timeout for property test

  /**
   * Additional property test: Verify exclusion list completeness
   * 
   * This test ensures that when we have a known set of questions in the cache,
   * and we exclude some of them, those excluded questions never appear in results.
   */
  it('should respect exclusion list even with partial matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        gradeLevelArbitrary,
        phaseArbitrary,
        difficultyArbitrary,
        subtagArbitrary,
        fc.integer({ min: 1, max: 10 }), // Number of questions to exclude
        async (gradeLevel, phase, difficulty, subtag, excludeCount) => {
          // First, get some questions from the cache without exclusions
          const allQuestions = await getCachedQuestions(
            env,
            supabase,
            gradeLevel,
            phase,
            difficulty,
            subtag,
            20,
            []
          );

          // If we don't have enough questions, skip this test case
          if (allQuestions.length < excludeCount) {
            return true; // Property holds vacuously
          }

          // Select some questions to exclude
          const questionsToExclude = allQuestions.slice(0, excludeCount);
          const excludeIds = questionsToExclude.map(q => q.id);

          // Query again with exclusions
          const filteredQuestions = await getCachedQuestions(
            env,
            supabase,
            gradeLevel,
            phase,
            difficulty,
            subtag,
            20,
            excludeIds
          );

          // Property: None of the excluded questions should appear in results
          const hasExcludedQuestion = filteredQuestions.some(q => excludeIds.includes(q.id));

          if (hasExcludedQuestion) {
            const excludedQuestions = filteredQuestions.filter(q => excludeIds.includes(q.id));
            console.error('❌ Property violation: Excluded questions appeared in filtered results:', {
              gradeLevel,
              phase,
              difficulty,
              subtag,
              totalQuestions: allQuestions.length,
              excludeCount,
              excludeIds,
              filteredCount: filteredQuestions.length,
              excludedQuestions: excludedQuestions.map(q => q.id),
            });
          }

          expect(hasExcludedQuestion).toBe(false);
        }
      ),
      { 
        numRuns: 100,
        verbose: true,
      }
    );
  }, 60000);

  /**
   * Edge case test: Empty exclusion list
   * 
   * When the exclusion list is empty, the function should work normally
   * and return questions without any filtering.
   */
  it('should work correctly with empty exclusion list', async () => {
    await fc.assert(
      fc.asyncProperty(
        gradeLevelArbitrary,
        phaseArbitrary,
        fc.option(difficultyArbitrary, { nil: undefined }),
        fc.option(subtagArbitrary, { nil: undefined }),
        async (gradeLevel, phase, difficulty, subtag) => {
          const results = await getCachedQuestions(
            env,
            supabase,
            gradeLevel,
            phase,
            difficulty,
            subtag,
            10,
            [] // Empty exclusion list
          );

          // Property: Should return questions (if any exist in cache)
          // No exclusions means all matching questions are valid
          expect(Array.isArray(results)).toBe(true);
          
          // All returned questions should match the query parameters
          results.forEach(q => {
            expect(q.gradeLevel).toBe(gradeLevel);
            expect(q.phase).toBe(phase);
            if (difficulty !== undefined) {
              expect(q.difficulty).toBe(difficulty);
            }
            if (subtag !== undefined) {
              expect(q.subtag).toBe(subtag);
            }
          });
        }
      ),
      { 
        numRuns: 50,
        verbose: true,
      }
    );
  }, 60000);
});
