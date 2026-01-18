/**
 * Unit Tests for Career Assessment AI Service - Question Validation
 * 
 * Tests for validateQuestion and validateQuestionBatch functions
 * 
 * @requirement Task 2.1, 2.3 - Question validation functions
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the validation functions
import { validateQuestion, validateQuestionBatch } from '../../services/careerAssessmentAIService';

describe('validateQuestion', () => {
  describe('valid questions', () => {
    it('should validate a properly formatted aptitude question', () => {
      const question = {
        text: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correct: 'B',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a properly formatted knowledge question', () => {
      const question = {
        question: 'What is the formula for force?',
        options: ['F = ma', 'E = mc²', 'V = IR', 'P = VI'],
        correct_answer: 'A',
        subject: 'Physics'
      };

      const result = validateQuestion(question, 'knowledge');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept question text at minimum length (10 characters)', () => {
      const question = {
        text: '1234567890', // Exactly 10 characters
        options: ['A', 'B', 'C', 'D'],
        correct: 'A',
        subtype: 'numerical'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(true);
    });

    it('should accept question text at maximum length (500 characters)', () => {
      const question = {
        text: 'A'.repeat(500), // Exactly 500 characters
        options: ['A', 'B', 'C', 'D'],
        correct: 'A',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid questions - missing text', () => {
    it('should reject question with missing text field', () => {
      const question = {
        options: ['A', 'B', 'C', 'D'],
        correct: 'A',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing question text');
    });

    it('should reject question with empty text', () => {
      const question = {
        text: '',
        options: ['A', 'B', 'C', 'D'],
        correct: 'A',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('outside valid range'))).toBe(true);
    });
  });

  describe('invalid questions - text length', () => {
    it('should reject question with text too short (9 characters)', () => {
      const question = {
        text: '123456789', // 9 characters
        options: ['A', 'B', 'C', 'D'],
        correct: 'A',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('outside valid range'))).toBe(true);
    });

    it('should reject question with text too long (501 characters)', () => {
      const question = {
        text: 'A'.repeat(501), // 501 characters
        options: ['A', 'B', 'C', 'D'],
        correct: 'A',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('outside valid range'))).toBe(true);
    });
  });

  describe('invalid questions - options', () => {
    it('should reject question with missing options', () => {
      const question = {
        text: 'What is the capital of France?',
        correct: 'B',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid options array');
    });

    it('should reject question with non-array options', () => {
      const question = {
        text: 'What is the capital of France?',
        options: 'not an array',
        correct: 'B',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid options array');
    });

    it('should reject question with wrong number of options (3)', () => {
      const question = {
        text: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin'],
        correct: 'B',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Expected 4 options'))).toBe(true);
    });

    it('should reject question with wrong number of options (5)', () => {
      const question = {
        text: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid', 'Rome'],
        correct: 'B',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Expected 4 options'))).toBe(true);
    });
  });

  describe('invalid questions - correct answer', () => {
    it('should reject question with missing correct answer', () => {
      const question = {
        text: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing correct answer');
    });

    it('should reject question with invalid correct answer (E)', () => {
      const question = {
        text: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correct: 'E',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid correct answer'))).toBe(true);
    });

    it('should reject question with invalid correct answer (1)', () => {
      const question = {
        text: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correct: '1',
        subtype: 'verbal'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid correct answer'))).toBe(true);
    });
  });

  describe('invalid questions - missing subtype', () => {
    it('should reject aptitude question with missing subtype', () => {
      const question = {
        text: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correct: 'B'
      };

      const result = validateQuestion(question, 'aptitude');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing subtype/category for aptitude question');
    });

    it('should not require subtype for knowledge questions', () => {
      const question = {
        text: 'What is the formula for force?',
        options: ['F = ma', 'E = mc²', 'V = IR', 'P = VI'],
        correct: 'A'
      };

      const result = validateQuestion(question, 'knowledge');

      // Should be valid even without subtype for knowledge questions
      expect(result.isValid).toBe(true);
    });
  });
});

describe('validateQuestionBatch', () => {
  beforeEach(() => {
    // Spy on console.warn to suppress output during tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('all valid questions', () => {
    it('should validate a batch of all valid questions', () => {
      const questions = [
        {
          text: 'Question 1',
          options: ['A', 'B', 'C', 'D'],
          correct: 'A',
          subtype: 'verbal'
        },
        {
          text: 'Question 2',
          options: ['A', 'B', 'C', 'D'],
          correct: 'B',
          subtype: 'numerical'
        },
        {
          text: 'Question 3',
          options: ['A', 'B', 'C', 'D'],
          correct: 'C',
          subtype: 'logical'
        }
      ];

      const result = validateQuestionBatch(questions, 'aptitude', 3);

      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
      expect(result.needsMore).toBe(false);
    });
  });

  describe('mixed valid and invalid questions', () => {
    it('should separate valid and invalid questions', () => {
      const questions = [
        {
          text: 'Valid question',
          options: ['A', 'B', 'C', 'D'],
          correct: 'A',
          subtype: 'verbal'
        },
        {
          text: 'Invalid - missing options',
          correct: 'B',
          subtype: 'verbal'
        },
        {
          text: 'Another valid question',
          options: ['A', 'B', 'C', 'D'],
          correct: 'C',
          subtype: 'numerical'
        }
      ];

      const result = validateQuestionBatch(questions, 'aptitude', 3);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].errors).toContain('Missing or invalid options array');
    });
  });

  describe('needsMore flag', () => {
    it('should set needsMore to false when valid count meets expected count', () => {
      const questions = [
        {
          text: 'Question 1',
          options: ['A', 'B', 'C', 'D'],
          correct: 'A',
          subtype: 'verbal'
        },
        {
          text: 'Question 2',
          options: ['A', 'B', 'C', 'D'],
          correct: 'B',
          subtype: 'numerical'
        }
      ];

      const result = validateQuestionBatch(questions, 'aptitude', 2);

      expect(result.needsMore).toBe(false);
    });

    it('should set needsMore to true when valid count is less than expected', () => {
      const questions = [
        {
          text: 'Question 1',
          options: ['A', 'B', 'C', 'D'],
          correct: 'A',
          subtype: 'verbal'
        }
      ];

      const result = validateQuestionBatch(questions, 'aptitude', 5);

      expect(result.needsMore).toBe(true);
    });

    it('should set needsMore to false when valid count exceeds expected', () => {
      const questions = [
        {
          text: 'Question 1',
          options: ['A', 'B', 'C', 'D'],
          correct: 'A',
          subtype: 'verbal'
        },
        {
          text: 'Question 2',
          options: ['A', 'B', 'C', 'D'],
          correct: 'B',
          subtype: 'numerical'
        },
        {
          text: 'Question 3',
          options: ['A', 'B', 'C', 'D'],
          correct: 'C',
          subtype: 'logical'
        }
      ];

      const result = validateQuestionBatch(questions, 'aptitude', 2);

      expect(result.needsMore).toBe(false);
    });
  });

  describe('empty batch', () => {
    it('should handle empty question array', () => {
      const result = validateQuestionBatch([], 'aptitude', 5);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
      expect(result.needsMore).toBe(true);
    });
  });

  describe('logging', () => {
    it('should log validation results', () => {
      const questions = [
        {
          text: 'Valid question',
          options: ['A', 'B', 'C', 'D'],
          correct: 'A',
          subtype: 'verbal'
        }
      ];

      validateQuestionBatch(questions, 'aptitude', 5);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('📊 Validation results: 1/5 valid, 0 invalid')
      );
    });

    it('should log invalid question details', () => {
      const questions = [
        {
          text: 'Invalid question',
          options: ['A', 'B'], // Only 2 options
          correct: 'A',
          subtype: 'verbal'
        }
      ];

      validateQuestionBatch(questions, 'aptitude', 1);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('❌ Question 1 failed validation:'),
        expect.any(Array)
      );
    });
  });
});

describe('Error Handling Functions', () => {
  // Import error handling functions at the top level
  let classifyError, QuestionGenerationError, getUserErrorMessage, handleAPIError, handleNetworkError, handleDatabaseError, handleInsufficientQuestions;
  
  beforeEach(async () => {
    // Dynamically import the functions
    const module = await import('../../services/careerAssessmentAIService.js');
    classifyError = module.classifyError;
    QuestionGenerationError = module.QuestionGenerationError;
    getUserErrorMessage = module.getUserErrorMessage;
    handleAPIError = module.handleAPIError;
    handleNetworkError = module.handleNetworkError;
    handleDatabaseError = module.handleDatabaseError;
    handleInsufficientQuestions = module.handleInsufficientQuestions;
  });

  describe('classifyError', () => {
    it('should classify 503 as API_UNAVAILABLE', () => {
      const errorType = classifyError(null, 503);
      expect(errorType).toBe(QuestionGenerationError.API_UNAVAILABLE);
    });

    it('should classify 429 as RATE_LIMIT', () => {
      const errorType = classifyError(null, 429);
      expect(errorType).toBe(QuestionGenerationError.RATE_LIMIT);
    });

    it('should classify 500+ as API_UNAVAILABLE', () => {
      const errorType = classifyError(null, 500);
      expect(errorType).toBe(QuestionGenerationError.API_UNAVAILABLE);
    });

    it('should classify 400-499 (except 429) as INVALID_RESPONSE', () => {
      const errorType = classifyError(null, 400);
      expect(errorType).toBe(QuestionGenerationError.INVALID_RESPONSE);
    });

    it('should classify timeout error as NETWORK_TIMEOUT', () => {
      const error = new Error('Request timed out');
      const errorType = classifyError(error);
      expect(errorType).toBe(QuestionGenerationError.NETWORK_TIMEOUT);
    });

    it('should classify network error as API_UNAVAILABLE', () => {
      const error = new Error('Network request failed');
      const errorType = classifyError(error);
      expect(errorType).toBe(QuestionGenerationError.API_UNAVAILABLE);
    });

    it('should classify JSON parse error as INVALID_RESPONSE', () => {
      const error = new Error('Failed to parse JSON');
      const errorType = classifyError(error);
      expect(errorType).toBe(QuestionGenerationError.INVALID_RESPONSE);
    });

    it('should classify database error as DATABASE_ERROR', () => {
      const error = new Error('Supabase connection failed');
      const errorType = classifyError(error);
      expect(errorType).toBe(QuestionGenerationError.DATABASE_ERROR);
    });

    it('should classify unknown error as UNKNOWN', () => {
      const error = new Error('Something went wrong');
      const errorType = classifyError(error);
      expect(errorType).toBe(QuestionGenerationError.UNKNOWN);
    });
  });

  describe('getUserErrorMessage', () => {
    it('should return appropriate message for each error type', () => {
      expect(getUserErrorMessage(QuestionGenerationError.API_UNAVAILABLE))
        .toContain('temporarily unavailable');
      expect(getUserErrorMessage(QuestionGenerationError.RATE_LIMIT))
        .toContain('Please wait');
      expect(getUserErrorMessage(QuestionGenerationError.INVALID_RESPONSE))
        .toContain('invalid response');
      expect(getUserErrorMessage(QuestionGenerationError.INSUFFICIENT_QUESTIONS))
        .toContain('additional questions');
      expect(getUserErrorMessage(QuestionGenerationError.DATABASE_ERROR))
        .toContain('continue with the assessment');
      expect(getUserErrorMessage(QuestionGenerationError.NETWORK_TIMEOUT))
        .toContain('timeout');
    });
  });

  describe('handleAPIError', () => {
    it('should handle 429 rate limit with retry-after header', async () => {
      const response = {
        status: 429,
        headers: {
          get: (key) => key === 'retry-after' ? '5' : null
        }
      };
      
      const result = await handleAPIError(response, 1, 3);
      
      expect(result.shouldRetry).toBe(true);
      expect(result.delay).toBe(5000); // 5 seconds in ms
    });

    it('should handle 429 rate limit without retry-after header', async () => {
      const response = {
        status: 429,
        headers: {
          get: () => null
        }
      };
      
      const result = await handleAPIError(response, 2, 3);
      
      expect(result.shouldRetry).toBe(true);
      expect(result.delay).toBe(4000); // 2s * 2 = 4s
    });

    it('should handle 503 with exponential backoff', async () => {
      const response = {
        status: 503,
        headers: {
          get: () => null
        }
      };
      
      const result = await handleAPIError(response, 3, 3);
      
      expect(result.shouldRetry).toBe(false); // Last attempt
      expect(result.delay).toBe(6000); // 2s * 3 = 6s
    });

    it('should not retry on 4xx client errors (except 429)', async () => {
      const response = {
        status: 400,
        headers: {
          get: () => null
        }
      };
      
      const result = await handleAPIError(response, 1, 3);
      
      expect(result.shouldRetry).toBe(false);
    });
  });

  describe('handleNetworkError', () => {
    it('should handle network error with exponential backoff', () => {
      const error = new Error('Network request failed');
      
      const result = handleNetworkError(error, 2, 3);
      
      expect(result.shouldRetry).toBe(true);
      expect(result.delay).toBe(4000); // 2s * 2 = 4s
    });

    it('should not retry after max attempts', () => {
      const error = new Error('Network request failed');
      
      const result = handleNetworkError(error, 3, 3);
      
      expect(result.shouldRetry).toBe(false);
    });
  });

  describe('handleDatabaseError', () => {
    it('should allow continuation after database error', () => {
      const error = new Error('Database connection failed');
      
      const result = handleDatabaseError(error, 'saving questions');
      
      expect(result.canContinue).toBe(true);
      expect(result.message).toContain('continue with the assessment');
    });
  });

  describe('handleInsufficientQuestions', () => {
    it('should allow proceeding with 80% or more questions', () => {
      const result = handleInsufficientQuestions(40, 50, 1, 3);
      
      expect(result.canProceed).toBe(true);
      expect(result.shouldRetry).toBe(false);
    });

    it('should retry with less than 80% questions', () => {
      const result = handleInsufficientQuestions(30, 50, 1, 3);
      
      expect(result.canProceed).toBe(false);
      expect(result.shouldRetry).toBe(true);
    });

    it('should not retry after max attempts even with insufficient questions', () => {
      const result = handleInsufficientQuestions(30, 50, 3, 3);
      
      expect(result.canProceed).toBe(false);
      expect(result.shouldRetry).toBe(false);
    });
  });
});
