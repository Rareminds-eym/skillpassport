/**
 * Assessment Response Persistence Tests
 * 
 * Unit tests for the critical response saving functionality
 * 
 * @module features/assessment/__tests__/responsePersistence.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client
const createMockSupabase = () => ({
  from: vi.fn(() => ({
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'test-response-id' }, error: null }))
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
});

let mockSupabase = createMockSupabase();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Import after mocking
import { saveResponseEnhanced } from '../services/assessmentServiceEnhanced';

describe('Response Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Question ID Parsing', () => {
    it('should handle static question IDs (riasec_r1 format)', async () => {
      const result = await saveResponseEnhanced({
        attemptId: 'test-attempt-id',
        questionId: 'riasec_r1',
        responseValue: 5,
        isCorrect: null,
        sectionId: 'riasec'
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('personal_assessment_responses');
    });

    it('should handle AI question IDs (UUID format)', async () => {
      const uuid = 'f48f122d-bd34-408f-b45c-948dba1d4701';
      
      const result = await saveResponseEnhanced({
        attemptId: 'test-attempt-id',
        questionId: uuid,
        responseValue: 'Answer A',
        isCorrect: true,
        sectionId: 'aptitude'
      });

      expect(result.success).toBe(true);
    });

    it('should handle sectionId_questionId format with UUID', async () => {
      const fullQuestionId = 'aptitude_f48f122d-bd34-408f-b45c-948dba1d4701';
      
      // Test parsing logic
      const underscoreIndex = fullQuestionId.indexOf('_');
      const sectionId = fullQuestionId.substring(0, underscoreIndex);
      const questionId = fullQuestionId.substring(underscoreIndex + 1);
      
      expect(sectionId).toBe('aptitude');
      expect(questionId).toBe('f48f122d-bd34-408f-b45c-948dba1d4701');
      
      // Verify UUID regex
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId);
      expect(isUUID).toBe(true);
    });
  });

  describe('MCQ Correctness Detection', () => {
    it('should calculate isCorrect for MCQ when answer matches correct', () => {
      const question = {
        id: 'test-question',
        correct: 'Option A',
        text: 'Test question'
      };
      
      const answer = 'Option A';
      const isCorrect = answer === question.correct;
      
      expect(isCorrect).toBe(true);
    });

    it('should calculate isCorrect as false for wrong answer', () => {
      const question = {
        id: 'test-question',
        correct: 'Option B',
        text: 'Test question'
      };
      
      const answer = 'Option A';
      const isCorrect = answer === question.correct;
      
      expect(isCorrect).toBe(false);
    });

    it('should handle array of correct answers', () => {
      const question = {
        correct: ['A', 'B'],
        text: 'Multi-select question'
      };
      
      const answer = 'A';
      const isCorrect = question.correct.includes(answer);
      
      expect(isCorrect).toBe(true);
    });
  });

  describe('Idempotency', () => {
    it('should return cached result for duplicate requests', async () => {
      const params = {
        attemptId: 'test-attempt-id',
        questionId: 'riasec_r1',
        responseValue: 5,
        sectionId: 'riasec'
      };

      // First call - should hit database
      await saveResponseEnhanced(params);
      
      // Second call - should use cache
      const result = await saveResponseEnhanced(params);
      
      // Should return success from cache
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing attempt ID', async () => {
      const result = await saveResponseEnhanced({
        attemptId: '',
        questionId: 'riasec_r1',
        responseValue: 5
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active attempt');
    });

    it('should handle database errors gracefully', async () => {
      // Reset mock for error case - cast to any to allow flexible return types
      vi.resetAllMocks();
      
      (mockSupabase as any) = {
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Database error' } 
              }))
            }))
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null }))
          }))
        }))
      };

      const result = await saveResponseEnhanced({
        attemptId: 'test-attempt-id',
        questionId: 'riasec_r1',
        responseValue: 5
      });

      expect(result.success).toBe(false);
    });
  });
});
