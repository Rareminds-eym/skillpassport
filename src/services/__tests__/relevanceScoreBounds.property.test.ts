/**
 * Property-Based Test: Relevance Score Bounds
 * 
 * **Feature: rag-course-recommendations, Property 6: Relevance Score Bounds**
 * **Validates: Requirements 3.4**
 * 
 * Property: For any recommended course, the relevance_score SHALL be
 * a number between 0 and 100 inclusive.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { cosineSimilarity } from '../embeddingService';

// Constants matching the service implementation
const MAX_RECOMMENDATIONS = 10;
const MIN_SIMILARITY_THRESHOLD = 0.3;
const EMBEDDING_DIMENSION = 768;

/**
 * Calculate relevance score from cosine similarity
 * Mirrors the implementation in courseRecommendationService.js
 * 
 * Converts similarity (-1 to 1) to percentage (0 to 100)
 */
const calculateRelevanceScore = (similarity: number): number => {
  // Cosine similarity ranges from -1 to 1
  // Convert to 0-100 scale where 1 = 100, 0 = 50, -1 = 0
  const score = Math.round(((similarity + 1) / 2) * 100);
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, score));
};

/**
 * Generator for a valid embedding vector (768 dimensions)
 * Uses normalized values to ensure valid cosine similarity calculations
 */
const embeddingArbitrary = fc.array(
  fc.float({ min: -1, max: 1, noNaN: true }),
  { minLength: EMBEDDING_DIMENSION, maxLength: EMBEDDING_DIMENSION }
);

/**
 * Generator for a course with Active status and valid embedding
 */
const activeCourseArbitrary = fc.record({
  course_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  code: fc.string({ minLength: 2, maxLength: 20 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  duration: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.string({ minLength: 1, maxLength: 50 }),
  skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
  target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
  status: fc.constant('Active' as const),
  embedding: embeddingArbitrary,
  deleted_at: fc.constant(null)
});

/**
 * Generator for an array of active courses
 */
const activeCoursesArbitrary = fc.array(activeCourseArbitrary, { minLength: 1, maxLength: 30 });

interface Course {
  course_id: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  category: string;
  skills: string[];
  target_outcomes: string[];
  status: 'Active';
  embedding: number[];
  deleted_at: null;
}

interface RecommendedCourse {
  course_id: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  category: string;
  skills: string[];
  target_outcomes: string[];
  relevance_score: number;
}

/**
 * Simulates the course recommendation logic from courseRecommendationService.
 * This mirrors the actual implementation which:
 * 1. Filters to only Active courses with valid embeddings
 * 2. Calculates similarity and converts to relevance score
 * 3. Filters by minimum threshold
 * 4. Returns top 10 results
 * 
 * This is a pure function that can be tested without database dependencies.
 */
const performSimilaritySearchWithScoring = (
  profileEmbedding: number[],
  courses: Course[]
): RecommendedCourse[] => {
  // Filter courses with valid embeddings
  const coursesWithEmbeddings = courses.filter(
    course => course.embedding && 
              Array.isArray(course.embedding) && 
              course.embedding.length === EMBEDDING_DIMENSION &&
              course.status === 'Active' &&
              course.deleted_at === null
  );

  // Calculate similarity scores and convert to relevance scores
  const scoredCourses = coursesWithEmbeddings.map(course => {
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

describe('Property 6: Relevance Score Bounds', () => {
  
  it('should return relevance scores between 0 and 100 inclusive for all recommendations', () => {
    fc.assert(
      fc.property(
        embeddingArbitrary,
        activeCoursesArbitrary,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearchWithScoring(profileEmbedding, courses);
          
          // Property: ALL returned courses must have relevance_score between 0 and 100
          results.forEach(course => {
            expect(course.relevance_score).toBeGreaterThanOrEqual(0);
            expect(course.relevance_score).toBeLessThanOrEqual(100);
            expect(Number.isInteger(course.relevance_score)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce relevance score of 100 for identical embeddings', () => {
    // When profile and course embeddings are identical, similarity = 1, score = 100
    const normalizedEmbedding = Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION));
    
    const course: Course = {
      course_id: 'test-course-1',
      title: 'Test Course',
      code: 'TC001',
      description: 'A test course',
      duration: '4 weeks',
      category: 'Technology',
      skills: ['JavaScript', 'React'],
      target_outcomes: ['Build web apps'],
      status: 'Active',
      embedding: normalizedEmbedding,
      deleted_at: null
    };

    const results = performSimilaritySearchWithScoring(normalizedEmbedding, [course]);
    
    // Property: Identical embeddings should produce score of 100
    expect(results.length).toBe(1);
    expect(results[0].relevance_score).toBe(100);
  });

  it('should produce relevance score of 0 for opposite embeddings', () => {
    // When embeddings are opposite (similarity = -1), score = 0
    const positiveEmbedding = Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION));
    const negativeEmbedding = Array(EMBEDDING_DIMENSION).fill(-1 / Math.sqrt(EMBEDDING_DIMENSION));
    
    const course: Course = {
      course_id: 'test-course-2',
      title: 'Test Course',
      code: 'TC002',
      description: 'A test course',
      duration: '4 weeks',
      category: 'Technology',
      skills: ['JavaScript', 'React'],
      target_outcomes: ['Build web apps'],
      status: 'Active',
      embedding: negativeEmbedding,
      deleted_at: null
    };

    // Note: This course won't appear in results because similarity < threshold
    // But we can test the calculateRelevanceScore function directly
    const similarity = cosineSimilarity(positiveEmbedding, negativeEmbedding);
    const score = calculateRelevanceScore(similarity);
    
    // Property: Opposite embeddings should produce score of 0
    expect(score).toBe(0);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should produce relevance score of 50 for orthogonal embeddings', () => {
    // When embeddings are orthogonal (similarity = 0), score = 50
    // Create two orthogonal vectors
    const embedding1 = Array(EMBEDDING_DIMENSION).fill(0);
    embedding1[0] = 1;
    
    const embedding2 = Array(EMBEDDING_DIMENSION).fill(0);
    embedding2[1] = 1;
    
    const similarity = cosineSimilarity(embedding1, embedding2);
    const score = calculateRelevanceScore(similarity);
    
    // Property: Orthogonal embeddings should produce score of 50
    expect(score).toBe(50);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should always produce integer relevance scores', () => {
    fc.assert(
      fc.property(
        embeddingArbitrary,
        activeCoursesArbitrary,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearchWithScoring(profileEmbedding, courses);
          
          // Property: All relevance scores must be integers
          results.forEach(course => {
            expect(Number.isInteger(course.relevance_score)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle extreme similarity values correctly', () => {
    // Test with various similarity values to ensure bounds are maintained
    const testCases = [
      { similarity: 1, expectedScore: 100 },
      { similarity: 0.5, expectedScore: 75 },
      { similarity: 0, expectedScore: 50 },
      { similarity: -0.5, expectedScore: 25 },
      { similarity: -1, expectedScore: 0 },
      // Edge cases beyond normal range (shouldn't happen but test clamping)
      { similarity: 1.5, expectedScore: 100 },  // Should clamp to 100
      { similarity: -1.5, expectedScore: 0 },   // Should clamp to 0
    ];

    testCases.forEach(({ similarity, expectedScore }) => {
      const score = calculateRelevanceScore(similarity);
      
      // Property: Score must always be between 0 and 100
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBe(expectedScore);
    });
  });

  it('should maintain score bounds with random similarity values', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -2, max: 2, noNaN: true }),
        (similarity) => {
          const score = calculateRelevanceScore(similarity);
          
          // Property: Score must always be between 0 and 100, regardless of input
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
          expect(Number.isInteger(score)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce monotonically increasing scores for increasing similarity', () => {
    // Higher similarity should produce higher or equal relevance scores
    fc.assert(
      fc.property(
        fc.float({ min: -1, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 0.5, noNaN: true }),
        (baseSimilarity, delta) => {
          const lowerSimilarity = Math.max(-1, baseSimilarity - delta);
          const higherSimilarity = Math.min(1, baseSimilarity + delta);
          
          const lowerScore = calculateRelevanceScore(lowerSimilarity);
          const higherScore = calculateRelevanceScore(higherSimilarity);
          
          // Property: Higher similarity should produce higher or equal score
          expect(higherScore).toBeGreaterThanOrEqual(lowerScore);
          
          // Both scores must be within bounds
          expect(lowerScore).toBeGreaterThanOrEqual(0);
          expect(lowerScore).toBeLessThanOrEqual(100);
          expect(higherScore).toBeGreaterThanOrEqual(0);
          expect(higherScore).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return relevance scores as numbers, not strings or other types', () => {
    fc.assert(
      fc.property(
        embeddingArbitrary,
        activeCoursesArbitrary,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearchWithScoring(profileEmbedding, courses);
          
          // Property: All relevance scores must be of type number
          results.forEach(course => {
            expect(typeof course.relevance_score).toBe('number');
            expect(Number.isNaN(course.relevance_score)).toBe(false);
            expect(Number.isFinite(course.relevance_score)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
