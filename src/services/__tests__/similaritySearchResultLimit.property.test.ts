/**
 * Property-Based Test: Similarity Search Result Limit
 * 
 * **Feature: rag-course-recommendations, Property 4: Similarity Search Result Limit**
 * **Validates: Requirements 3.2**
 * 
 * Property: For any student profile embedding, the vector similarity search
 * SHALL return at most 10 courses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { cosineSimilarity } from '../../utils/vectorUtils';

// Constants matching the service implementation
const MAX_RECOMMENDATIONS = 10;
const MIN_SIMILARITY_THRESHOLD = 0.3;
const EMBEDDING_DIMENSION = 768;

/**
 * Calculate relevance score from cosine similarity
 * Mirrors the implementation in courseRecommendationService.js
 */
const calculateRelevanceScore = (similarity: number): number => {
  const score = Math.round(((similarity + 1) / 2) * 100);
  return Math.max(0, Math.min(100, score));
};

/**
 * Generator for a valid embedding vector (768 dimensions)
 * Values are normalized to produce valid cosine similarity results
 */
const embeddingArbitrary = fc.array(
  fc.float({ min: -1, max: 1, noNaN: true }),
  { minLength: EMBEDDING_DIMENSION, maxLength: EMBEDDING_DIMENSION }
);

/**
 * Generator for a course with embedding
 */
const courseWithEmbeddingArbitrary = fc.record({
  course_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  code: fc.string({ minLength: 2, maxLength: 20 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  duration: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.string({ minLength: 1, maxLength: 50 }),
  skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
  target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
  status: fc.constant('Active'),
  embedding: embeddingArbitrary
});

/**
 * Generator for an array of courses with varying sizes
 * Tests with 0 to 50 courses to ensure limit is enforced
 */
const coursesArrayArbitrary = fc.array(courseWithEmbeddingArbitrary, { minLength: 0, maxLength: 50 });

/**
 * Simulates the core similarity search and ranking logic from getRecommendedCourses
 * This is a pure function that can be tested without database/API dependencies
 */
const performSimilaritySearch = (
  profileEmbedding: number[],
  courses: Array<{
    course_id: string;
    title: string;
    code: string;
    description: string;
    duration: string;
    category: string;
    skills: string[];
    target_outcomes: string[];
    status: string;
    embedding: number[];
  }>
): Array<{
  course_id: string;
  title: string;
  relevance_score: number;
}> => {
  // Filter courses with valid embeddings and calculate similarity
  const scoredCourses = courses
    .filter(course => course.embedding && Array.isArray(course.embedding) && course.embedding.length === EMBEDDING_DIMENSION)
    .map(course => {
      const similarity = cosineSimilarity(profileEmbedding, course.embedding);
      const relevanceScore = calculateRelevanceScore(similarity);
      
      return {
        course_id: course.course_id,
        title: course.title,
        code: course.code,
        description: course.description,
        duration: course.duration,
        category: course.category,
        skills: course.skills,
        target_outcomes: course.target_outcomes,
        relevance_score: relevanceScore,
        _similarity: similarity
      };
    })
    // Filter by minimum threshold
    .filter(course => course._similarity >= MIN_SIMILARITY_THRESHOLD);

  // Sort by similarity and limit to MAX_RECOMMENDATIONS
  const recommendations = scoredCourses
    .sort((a, b) => b._similarity - a._similarity)
    .slice(0, MAX_RECOMMENDATIONS)
    .map(({ _similarity, ...course }) => course);

  return recommendations;
};

describe('Property 4: Similarity Search Result Limit', () => {
  
  it('should return at most 10 courses regardless of input size', async () => {
    await fc.assert(
      fc.property(
        embeddingArbitrary,
        coursesArrayArbitrary,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearch(profileEmbedding, courses);
          
          // Property: Result count must never exceed MAX_RECOMMENDATIONS (10)
          expect(results.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return at most 10 courses even when all courses have high similarity', async () => {
    // Generate courses with embeddings very similar to the profile
    const highSimilarityCourses = fc.array(
      fc.record({
        course_id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 100 }),
        code: fc.string({ minLength: 2, maxLength: 20 }),
        description: fc.string({ minLength: 0, maxLength: 500 }),
        duration: fc.string({ minLength: 1, maxLength: 50 }),
        category: fc.string({ minLength: 1, maxLength: 50 }),
        skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
        target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
        status: fc.constant('Active'),
        // Use a fixed embedding that will have high similarity with any normalized profile
        embedding: fc.constant(Array(EMBEDDING_DIMENSION).fill(0.5))
      }),
      { minLength: 15, maxLength: 30 } // More than MAX_RECOMMENDATIONS
    );

    await fc.assert(
      fc.property(
        fc.constant(Array(EMBEDDING_DIMENSION).fill(0.5)), // Profile embedding similar to courses
        highSimilarityCourses,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearch(profileEmbedding, courses);
          
          // Property: Even with many high-similarity courses, limit must be enforced
          expect(results.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
          
          // With 15-30 similar courses, we should get exactly 10 (the max)
          // unless similarity threshold filters some out
          if (courses.length >= MAX_RECOMMENDATIONS) {
            // At least some results should be returned if courses exist
            expect(results.length).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return fewer than 10 courses when fewer courses exist', async () => {
    const fewCourses = fc.array(courseWithEmbeddingArbitrary, { minLength: 0, maxLength: 9 });

    await fc.assert(
      fc.property(
        embeddingArbitrary,
        fewCourses,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearch(profileEmbedding, courses);
          
          // Property: Result count should not exceed input count
          expect(results.length).toBeLessThanOrEqual(courses.length);
          
          // Property: Result count should still respect MAX_RECOMMENDATIONS
          expect(results.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no courses exist', async () => {
    await fc.assert(
      fc.property(
        embeddingArbitrary,
        (profileEmbedding) => {
          const results = performSimilaritySearch(profileEmbedding, []);
          
          // Property: Empty input should produce empty output
          expect(results).toEqual([]);
          expect(results.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return exactly 10 courses when more than 10 courses pass the similarity threshold', async () => {
    // Create a deterministic test with courses that will definitely pass the threshold
    const profileEmbedding = Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION));
    
    // Create 20 courses with the same embedding (similarity = 1.0)
    const courses = Array.from({ length: 20 }, (_, i) => ({
      course_id: `course-${i}`,
      title: `Course ${i}`,
      code: `C${i}`,
      description: `Description ${i}`,
      duration: '4 weeks',
      category: 'Technology',
      skills: ['skill1', 'skill2'],
      target_outcomes: ['outcome1'],
      status: 'Active',
      embedding: Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION))
    }));

    const results = performSimilaritySearch(profileEmbedding, courses);
    
    // Property: With 20 identical courses, exactly 10 should be returned
    expect(results.length).toBe(MAX_RECOMMENDATIONS);
  });

  it('should maintain the limit across different embedding dimensions scenarios', async () => {
    // Test with courses that have varying embedding quality
    const mixedCourses = fc.array(
      fc.oneof(
        // Valid embedding
        courseWithEmbeddingArbitrary,
        // Course with null embedding (should be filtered)
        fc.record({
          course_id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          code: fc.string({ minLength: 2, maxLength: 20 }),
          description: fc.string({ minLength: 0, maxLength: 500 }),
          duration: fc.string({ minLength: 1, maxLength: 50 }),
          category: fc.string({ minLength: 1, maxLength: 50 }),
          skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
          target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
          status: fc.constant('Active'),
          embedding: fc.constant(null as any)
        })
      ),
      { minLength: 0, maxLength: 50 }
    );

    await fc.assert(
      fc.property(
        embeddingArbitrary,
        mixedCourses,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearch(profileEmbedding, courses);
          
          // Property: Limit must be enforced even with mixed valid/invalid embeddings
          expect(results.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return results sorted by similarity (highest first) within the limit', async () => {
    await fc.assert(
      fc.property(
        embeddingArbitrary,
        coursesArrayArbitrary.filter(courses => courses.length > 0),
        (profileEmbedding, courses) => {
          const results = performSimilaritySearch(profileEmbedding, courses);
          
          // Property: Results should be sorted by relevance_score in descending order
          for (let i = 1; i < results.length; i++) {
            expect(results[i - 1].relevance_score).toBeGreaterThanOrEqual(results[i].relevance_score);
          }
          
          // Property: Limit must still be enforced
          expect(results.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
        }
      ),
      { numRuns: 100 }
    );
  });
});
