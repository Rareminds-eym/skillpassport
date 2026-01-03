/**
 * Property-Based Test: Question Metadata Completeness
 * 
 * **Feature: adaptive-aptitude-test, Property 17: Question metadata completeness**
 * **Validates: Requirements 6.3**
 * 
 * Property: For any valid Question in the adaptive aptitude test, all required
 * metadata fields SHALL be present and contain valid values according to their
 * type definitions.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  Question,
  DifficultyLevel,
  Subtag,
  GradeLevel,
  TestPhase,
  ALL_SUBTAGS,
  ALL_DIFFICULTY_LEVELS,
  TEST_PHASES_ORDER,
} from '../../types/adaptiveAptitude';

// =============================================================================
// ARBITRARIES (Generators)
// =============================================================================

/**
 * Generator for valid difficulty levels (1-5)
 */
const difficultyLevelArbitrary: fc.Arbitrary<DifficultyLevel> = fc.constantFrom(
  ...ALL_DIFFICULTY_LEVELS
);

/**
 * Generator for valid subtags
 */
const subtagArbitrary: fc.Arbitrary<Subtag> = fc.constantFrom(...ALL_SUBTAGS);

/**
 * Generator for valid grade levels
 */
const gradeLevelArbitrary: fc.Arbitrary<GradeLevel> = fc.constantFrom(
  'middle_school',
  'high_school'
);

/**
 * Generator for valid test phases
 */
const testPhaseArbitrary: fc.Arbitrary<TestPhase> = fc.constantFrom(
  ...TEST_PHASES_ORDER
);

/**
 * Generator for valid answer keys
 */
const answerKeyArbitrary: fc.Arbitrary<'A' | 'B' | 'C' | 'D'> = fc.constantFrom(
  'A',
  'B',
  'C',
  'D'
);

/**
 * Generator for non-empty strings (for question text and options)
 */
const nonEmptyStringArbitrary = fc
  .string({ minLength: 1, maxLength: 500 })
  .filter((s) => s.trim().length > 0);

/**
 * Generator for valid question options (A, B, C, D with non-empty values)
 */
const questionOptionsArbitrary = fc.record({
  A: nonEmptyStringArbitrary,
  B: nonEmptyStringArbitrary,
  C: nonEmptyStringArbitrary,
  D: nonEmptyStringArbitrary,
});

/**
 * Generator for valid Question objects with all required metadata
 */
const validQuestionArbitrary: fc.Arbitrary<Question> = fc.record({
  id: fc.uuid(),
  text: nonEmptyStringArbitrary,
  options: questionOptionsArbitrary,
  correctAnswer: answerKeyArbitrary,
  difficulty: difficultyLevelArbitrary,
  subtag: subtagArbitrary,
  gradeLevel: gradeLevelArbitrary,
  phase: testPhaseArbitrary,
  explanation: fc.option(nonEmptyStringArbitrary, { nil: undefined }),
  createdAt: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
});

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates that a question has all required metadata fields with valid values
 */
function validateQuestionMetadata(question: Question): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check id
  if (!question.id || typeof question.id !== 'string' || question.id.trim().length === 0) {
    errors.push('id must be a non-empty string');
  }

  // Check text
  if (!question.text || typeof question.text !== 'string' || question.text.trim().length === 0) {
    errors.push('text must be a non-empty string');
  }

  // Check options
  if (!question.options || typeof question.options !== 'object') {
    errors.push('options must be an object');
  } else {
    const requiredKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    for (const key of requiredKeys) {
      if (
        !question.options[key] ||
        typeof question.options[key] !== 'string' ||
        question.options[key].trim().length === 0
      ) {
        errors.push(`options.${key} must be a non-empty string`);
      }
    }
  }

  // Check correctAnswer
  const validAnswers = ['A', 'B', 'C', 'D'];
  if (!validAnswers.includes(question.correctAnswer)) {
    errors.push('correctAnswer must be one of A, B, C, D');
  }

  // Check difficulty
  if (!ALL_DIFFICULTY_LEVELS.includes(question.difficulty)) {
    errors.push('difficulty must be a valid DifficultyLevel (1-5)');
  }

  // Check subtag
  if (!ALL_SUBTAGS.includes(question.subtag)) {
    errors.push('subtag must be a valid Subtag');
  }

  // Check gradeLevel
  const validGradeLevels: GradeLevel[] = ['middle_school', 'high_school'];
  if (!validGradeLevels.includes(question.gradeLevel)) {
    errors.push('gradeLevel must be a valid GradeLevel');
  }

  // Check phase
  if (!TEST_PHASES_ORDER.includes(question.phase)) {
    errors.push('phase must be a valid TestPhase');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// PROPERTY TESTS
// =============================================================================

describe('Property 17: Question Metadata Completeness', () => {
  it('should have a valid id field for any generated question', async () => {
    await fc.assert(
      fc.property(validQuestionArbitrary, (question) => {
        // Property: id must be a non-empty string
        expect(question.id).toBeDefined();
        expect(typeof question.id).toBe('string');
        expect(question.id.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should have a valid text field for any generated question', async () => {
    await fc.assert(
      fc.property(validQuestionArbitrary, (question) => {
        // Property: text must be a non-empty string
        expect(question.text).toBeDefined();
        expect(typeof question.text).toBe('string');
        expect(question.text.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should have all four option keys (A, B, C, D) with non-empty values', async () => {
    await fc.assert(
      fc.property(validQuestionArbitrary, (question) => {
        // Property: options must have A, B, C, D keys with non-empty string values
        expect(question.options).toBeDefined();
        expect(typeof question.options).toBe('object');

        const requiredKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        for (const key of requiredKeys) {
          expect(question.options[key]).toBeDefined();
          expect(typeof question.options[key]).toBe('string');
          expect(question.options[key].trim().length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have a valid correctAnswer field (A, B, C, or D)', async () => {
    await fc.assert(
      fc.property(validQuestionArbitrary, (question) => {
        // Property: correctAnswer must be one of A, B, C, D
        expect(question.correctAnswer).toBeDefined();
        expect(['A', 'B', 'C', 'D']).toContain(question.correctAnswer);
      }),
      { numRuns: 100 }
    );
  });

  it('should have a valid difficulty level (1-5)', async () => {
    await fc.assert(
      fc.property(validQuestionArbitrary, (question) => {
        // Property: difficulty must be a valid DifficultyLevel (1-5)
        expect(question.difficulty).toBeDefined();
        expect(ALL_DIFFICULTY_LEVELS).toContain(question.difficulty);
      }),
      { numRuns: 100 }
    );
  });

  it('should have a valid subtag from the defined subtag types', async () => {
    await fc.assert(
      fc.property(validQuestionArbitrary, (question) => {
        // Property: subtag must be a valid Subtag
        expect(question.subtag).toBeDefined();
        expect(ALL_SUBTAGS).toContain(question.subtag);
      }),
      { numRuns: 100 }
    );
  });

  it('should have a valid gradeLevel (middle_school or high_school)', async () => {
    await fc.assert(
      fc.property(validQuestionArbitrary, (question) => {
        // Property: gradeLevel must be a valid GradeLevel
        expect(question.gradeLevel).toBeDefined();
        expect(['middle_school', 'high_school']).toContain(question.gradeLevel);
      }),
      { numRuns: 100 }
    );
  });

  it('should have a valid phase from the defined test phases', async () => {
    await fc.assert(
      fc.property(validQuestionArbitrary, (question) => {
        // Property: phase must be a valid TestPhase
        expect(question.phase).toBeDefined();
        expect(TEST_PHASES_ORDER).toContain(question.phase);
      }),
      { numRuns: 100 }
    );
  });

  it('should pass complete metadata validation for any generated question', async () => {
    await fc.assert(
      fc.property(validQuestionArbitrary, (question) => {
        // Property: All required metadata fields must be valid
        const validation = validateQuestionMetadata(question);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should allow optional explanation field to be undefined', async () => {
    const questionWithoutExplanation = validQuestionArbitrary.map((q) => ({
      ...q,
      explanation: undefined,
    }));

    await fc.assert(
      fc.property(questionWithoutExplanation, (question) => {
        // Property: explanation is optional, validation should still pass
        const validation = validateQuestionMetadata(question);
        expect(validation.isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should allow optional createdAt field to be undefined', async () => {
    const questionWithoutCreatedAt = validQuestionArbitrary.map((q) => ({
      ...q,
      createdAt: undefined,
    }));

    await fc.assert(
      fc.property(questionWithoutCreatedAt, (question) => {
        // Property: createdAt is optional, validation should still pass
        const validation = validateQuestionMetadata(question);
        expect(validation.isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
