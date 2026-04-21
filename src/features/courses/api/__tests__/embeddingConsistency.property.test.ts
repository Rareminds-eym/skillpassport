/**
 * Property-Based Test: Embedding Generation Consistency
 * 
 * **Feature: rag-course-recommendations, Property 1: Embedding Generation Consistency**
 * **Validates: Requirements 1.1, 1.2**
 * 
 * Property: For any course with title, description, and skills, generating an 
 * embedding twice with the same input SHALL produce identical vectors.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { generateEmbedding, cosineSimilarity, getEmbeddingDimension } from '../embeddingService';

// Constants
const EMBEDDING_DIMENSION = 768;

/**
 * Generator for valid course text content
 * Simulates the text that would be built from course title, description, and skills
 */
const courseTextArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 })
}).map(({ title, description, skills }) => 
  `Title: ${title}\nDescription: ${description}\nSkills: ${skills.join(', ')}`
);

/**
 * Generator for simple non-empty text strings
 */
const nonEmptyTextArbitrary = fc.string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

/**
 * Mock embedding generator that simulates deterministic behavior
 * Uses a hash-based approach to generate consistent embeddings for the same input
 */
const createDeterministicEmbedding = (text: string): number[] => {
  // Simple hash function to create deterministic seed from text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate deterministic embedding using seeded random
  const embedding: number[] = [];
  let seed = Math.abs(hash);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    // Linear congruential generator for deterministic pseudo-random numbers
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    // Normalize to [-1, 1] range
    embedding.push((seed / 0x7fffffff) * 2 - 1);
  }
  
  return embedding;
};

describe('Property 1: Embedding Generation Consistency', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch to return deterministic embeddings
    mockFetch = vi.fn().mockImplementation(async (url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      const text = body.content?.parts?.[0]?.text || '';
      const embedding = createDeterministicEmbedding(text);
      
      return {
        ok: true,
        json: async () => ({
          embedding: { values: embedding }
        })
      };
    });
    
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should generate identical embeddings for the same course text input', async () => {
    await fc.assert(
      fc.asyncProperty(
        courseTextArbitrary,
        async (courseText) => {
          // Generate embedding twice for the same input
          const embedding1 = await generateEmbedding(courseText);
          const embedding2 = await generateEmbedding(courseText);

          // Property: embeddings must be identical for same input
          expect(embedding1).toHaveLength(EMBEDDING_DIMENSION);
          expect(embedding2).toHaveLength(EMBEDDING_DIMENSION);
          
          // Verify exact equality of all values
          for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
            expect(embedding1[i]).toBe(embedding2[i]);
          }
          
          // Additional check: cosine similarity should be exactly 1
          const similarity = cosineSimilarity(embedding1, embedding2);
          expect(similarity).toBeCloseTo(1, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate identical embeddings for any non-empty text input', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyTextArbitrary,
        async (text) => {
          // Generate embedding twice
          const embedding1 = await generateEmbedding(text);
          const embedding2 = await generateEmbedding(text);

          // Property: same input must produce same output
          expect(embedding1).toEqual(embedding2);
          
          // Verify dimension is correct
          expect(embedding1).toHaveLength(getEmbeddingDimension());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate different embeddings for different inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(nonEmptyTextArbitrary, nonEmptyTextArbitrary)
          .filter(([a, b]) => a !== b), // Ensure inputs are different
        async ([text1, text2]) => {
          const embedding1 = await generateEmbedding(text1);
          const embedding2 = await generateEmbedding(text2);

          // Property: different inputs should produce different embeddings
          // (with very high probability for any reasonable embedding model)
          const similarity = cosineSimilarity(embedding1, embedding2);
          
          // Different texts should not have perfect similarity
          // Allow for some edge cases where very similar texts might have high similarity
          expect(similarity).toBeLessThan(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency across multiple calls with same input', async () => {
    await fc.assert(
      fc.asyncProperty(
        courseTextArbitrary,
        fc.integer({ min: 2, max: 5 }), // Number of times to generate
        async (courseText, numCalls) => {
          const embeddings: number[][] = [];
          
          // Generate embedding multiple times
          for (let i = 0; i < numCalls; i++) {
            const embedding = await generateEmbedding(courseText);
            embeddings.push(embedding);
          }

          // Property: all embeddings must be identical
          const firstEmbedding = embeddings[0];
          for (let i = 1; i < embeddings.length; i++) {
            expect(embeddings[i]).toEqual(firstEmbedding);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should use consistent embedding model (text-embedding-004)', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyTextArbitrary,
        async (text) => {
          await generateEmbedding(text);

          // Verify the correct API endpoint was called
          expect(mockFetch).toHaveBeenCalled();
          const callUrl = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0];
          
          // Property: must use text-embedding-004 model
          expect(callUrl).toContain('text-embedding-004');
        }
      ),
      { numRuns: 100 }
    );
  });
});
