/**
 * Unit Tests for Assessment Service - Validation
 * 
 * Tests for getInProgressAttempt validation functionality
 * 
 * @requirement Task 3 - Add validation for returned attempt data
 * Validates: Requirements 2.4, 3.2
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase client
const mockSupabaseChain = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  update: vi.fn().mockReturnThis(),
});

const supabase = {
  from: vi.fn(),
};

vi.mock('../../lib/supabaseClient', () => ({
  supabase,
}));

// Import after mocking
const { getInProgressAttempt } = await import('../../services/assessmentService.js');

describe('getInProgressAttempt - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid attempt structure', () => {
    it('should return attempt when all required fields are present', async () => {
      const validAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        section_timings: {},
        timer_remaining: null,
        elapsed_time: null,
        all_responses: { riasec_r1: 4 },
        adaptive_aptitude_session_id: null,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: validAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeTruthy();
      expect(result.id).toBe(validAttempt.id);
    });

    it('should return null when attempt is missing required field: id', async () => {
      const invalidAttempt = {
        // id is missing
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });

    it('should return null when attempt is missing required field: student_id', async () => {
      const invalidAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        // student_id is missing
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });

    it('should return null when attempt is missing required field: stream_id', async () => {
      const invalidAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        // stream_id is missing
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });

    it('should return null when attempt is missing required field: grade_level', async () => {
      const invalidAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        // grade_level is missing
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });
  });

  describe('Field type validation', () => {
    it('should return null when id is not a string', async () => {
      const invalidAttempt = {
        id: 12345, // Should be string
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });

    it('should return null when status is not "in_progress"', async () => {
      const invalidAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'completed', // Should be 'in_progress'
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });

    it('should return null when current_section_index is not a number', async () => {
      const invalidAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: '0', // Should be number
        current_question_index: 5,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });
  });

  describe('Joined data validation (Requirement 3.2)', () => {
    it('should return null when stream data is missing', async () => {
      const invalidAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        // stream is missing
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });

    it('should return null when stream is not an object', async () => {
      const invalidAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        stream: 'invalid', // Should be object
        responses: [{ id: 'resp1', response_value: 4 }],
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });

    it('should return null when responses is not an array', async () => {
      const invalidAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: 'invalid', // Should be array
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: invalidAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });

    it('should accept empty responses array', async () => {
      const validAttempt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        stream_id: '123e4567-e89b-12d3-a456-426614174002',
        grade_level: 'higher_secondary',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        current_section_index: 0,
        current_question_index: 5,
        stream: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Science' },
        responses: [], // Empty array is valid
        all_responses: { riasec_r1: 4 }, // Has progress via all_responses
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: validAttempt, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeTruthy();
      expect(result.id).toBe(validAttempt.id);
    });
  });

  describe('Edge cases', () => {
    it('should return null when no student ID provided', async () => {
      const result = await getInProgressAttempt(null);
      expect(result).toBeNull();
    });

    it('should return null when no attempt found (PGRST116)', async () => {
      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      supabase.from.mockReturnValue(chain);

      const result = await getInProgressAttempt('student-id');

      expect(result).toBeNull();
    });
  });
});
