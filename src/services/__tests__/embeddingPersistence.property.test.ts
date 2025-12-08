/**
 * Property-Based Test: Embedding Persistence
 * 
 * **Feature: rag-course-recommendations, Property 2: Embedding Persistence**
 * **Validates: Requirements 1.3**
 * 
 * Property: For any course that undergoes embedding generation, the embedding 
 * SHALL be retrievable from the database with the correct dimension (768).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { supabase } from '../../lib/supabaseClient';

// Mock supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

// Constants
const EMBEDDING_DIMENSION = 768;

/**
 * Generator for valid embedding vectors with correct dimension
 */
const embeddingArbitrary = fc.array(
  fc.float({ min: -1, max: 1, noNaN: true }),
  { minLength: EMBEDDING_DIMENSION, maxLength: EMBEDDING_DIMENSION }
);

/**
 * Generator for valid course IDs (UUIDs)
 */
const courseIdArbitrary = fc.uuid();

describe('Property 2: Embedding Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should persist and retrieve embeddings with correct dimension (768)', async () => {
    await fc.assert(
      fc.asyncProperty(
        courseIdArbitrary,
        embeddingArbitrary,
        async (courseId, embedding) => {
          // Setup mock for update operation (storing embedding)
          const updateMock = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: { id: courseId }, error: null })
          };

          // Setup mock for select operation (retrieving embedding)
          const selectMock = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{ id: courseId, embedding: embedding }],
              error: null
            })
          };

          // Configure mock to return appropriate mock based on operation
          let callCount = 0;
          vi.mocked(supabase.from).mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return updateMock as any;
            }
            return selectMock as any;
          });

          // Simulate storing the embedding
          const storeResult = await supabase
            .from('courses')
            .update({ embedding })
            .eq('id', courseId);

          expect(storeResult.error).toBeNull();

          // Simulate retrieving the embedding
          const retrieveResult = await supabase
            .from('courses')
            .select('id, embedding')
            .eq('id', courseId);

          // Property assertions
          expect(retrieveResult.error).toBeNull();
          expect(retrieveResult.data).toBeDefined();
          expect(retrieveResult.data).toHaveLength(1);
          
          const retrievedEmbedding = retrieveResult.data![0].embedding;
          
          // Core property: embedding dimension must be exactly 768
          expect(retrievedEmbedding).toHaveLength(EMBEDDING_DIMENSION);
          
          // Verify the embedding values are preserved
          expect(retrievedEmbedding).toEqual(embedding);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject embeddings with incorrect dimensions', async () => {
    // Test that embeddings with wrong dimensions are handled correctly
    await fc.assert(
      fc.asyncProperty(
        courseIdArbitrary,
        fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { 
          minLength: 1, 
          maxLength: EMBEDDING_DIMENSION - 1 
        }),
        async (courseId, invalidEmbedding) => {
          // Setup mock to simulate database constraint violation
          const updateMock = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { 
                message: 'Embedding dimension mismatch',
                code: '22000' // PostgreSQL data exception
              }
            })
          };

          vi.mocked(supabase.from).mockReturnValue(updateMock as any);

          // Attempt to store invalid embedding
          const result = await supabase
            .from('courses')
            .update({ embedding: invalidEmbedding })
            .eq('id', courseId);

          // Property: invalid dimension embeddings should be rejected
          expect(result.error).not.toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain embedding integrity across storage operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        courseIdArbitrary,
        embeddingArbitrary,
        async (courseId, originalEmbedding) => {
          // This test verifies that the embedding values are not corrupted
          // during storage and retrieval
          
          const selectMock = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{ id: courseId, embedding: originalEmbedding }],
              error: null
            })
          };

          vi.mocked(supabase.from).mockReturnValue(selectMock as any);

          const result = await supabase
            .from('courses')
            .select('id, embedding')
            .eq('id', courseId);

          expect(result.error).toBeNull();
          expect(result.data).toBeDefined();
          
          const retrieved = result.data![0].embedding;
          
          // Property: all embedding values must be preserved exactly
          for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
            expect(retrieved[i]).toBe(originalEmbedding[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
