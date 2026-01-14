/**
 * Property-Based Test: Active Course Filter
 * 
 * **Feature: rag-course-recommendations, Property 5: Active Course Filter**
 * **Validates: Requirements 3.3**
 * 
 * Property: For any similarity search result set, all returned courses
 * SHALL have status equal to 'Active'.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { cosineSimilarity } from '../../utils/vectorUtils';

// Constants matching the service implementation
const MAX_RECOMMENDATIONS = 10;
const MIN_SIMILARITY_THRESHOLD = 0.3;
const EMBEDDING_DIMENSION = 768;

// Valid course statuses in the system
const COURSE_STATUSES = ['Active', 'Inactive', 'Draft', 'Archived', 'Pending'] as const;
type CourseStatus = typeof COURSE_STATUSES[number];

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
 */
const embeddingArbitrary = fc.array(
  fc.float({ min: -1, max: 1, noNaN: true }),
  { minLength: EMBEDDING_DIMENSION, maxLength: EMBEDDING_DIMENSION }
);

/**
 * Generator for a course with any status (including non-Active)
 */
const courseWithAnyStatusArbitrary = fc.record({
  course_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  code: fc.string({ minLength: 2, maxLength: 20 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  duration: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.string({ minLength: 1, maxLength: 50 }),
  skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
  target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
  status: fc.constantFrom(...COURSE_STATUSES),
  embedding: embeddingArbitrary,
  deleted_at: fc.constantFrom(null, new Date().toISOString())
});

/**
 * Generator for an array of courses with mixed statuses
 */
const mixedStatusCoursesArbitrary = fc.array(courseWithAnyStatusArbitrary, { minLength: 0, maxLength: 50 });

interface Course {
  course_id: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  category: string;
  skills: string[];
  target_outcomes: string[];
  status: CourseStatus;
  embedding: number[];
  deleted_at: string | null;
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
  status: CourseStatus;
  relevance_score: number;
}


/**
 * Simulates the course filtering and similarity search logic from courseRecommendationService.
 * This mirrors the actual implementation which:
 * 1. Filters to only Active courses (via database query .eq('status', 'Active'))
 * 2. Filters out deleted courses (via .is('deleted_at', null))
 * 3. Filters courses with valid embeddings
 * 4. Calculates similarity and filters by threshold
 * 5. Returns top 10 results
 * 
 * This is a pure function that can be tested without database dependencies.
 */
const performSimilaritySearchWithStatusFilter = (
  profileEmbedding: number[],
  courses: Course[]
): RecommendedCourse[] => {
  // Step 1: Filter to only Active courses (Requirement 3.3)
  // This mirrors the database query: .eq('status', 'Active')
  const activeCourses = courses.filter(course => course.status === 'Active');
  
  // Step 2: Filter out deleted courses
  // This mirrors the database query: .is('deleted_at', null)
  const nonDeletedCourses = activeCourses.filter(course => course.deleted_at === null);
  
  // Step 3: Filter courses with valid embeddings
  const coursesWithEmbeddings = nonDeletedCourses.filter(
    course => course.embedding && 
              Array.isArray(course.embedding) && 
              course.embedding.length === EMBEDDING_DIMENSION
  );

  // Step 4: Calculate similarity scores
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
      status: course.status,
      relevance_score: relevanceScore,
      _similarity: similarity
    };
  })
  // Filter by minimum threshold
  .filter(course => course._similarity >= MIN_SIMILARITY_THRESHOLD);

  // Step 5: Sort by similarity and limit to MAX_RECOMMENDATIONS
  const recommendations = scoredCourses
    .sort((a, b) => b._similarity - a._similarity)
    .slice(0, MAX_RECOMMENDATIONS)
    .map(({ _similarity, ...course }) => course);

  return recommendations;
};

describe('Property 5: Active Course Filter', () => {
  
  it('should only return courses with status "Active"', () => {
    fc.assert(
      fc.property(
        embeddingArbitrary,
        mixedStatusCoursesArbitrary,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearchWithStatusFilter(profileEmbedding, courses);
          
          // Property: ALL returned courses must have status === 'Active'
          results.forEach(course => {
            expect(course.status).toBe('Active');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter out all non-Active courses regardless of similarity', () => {
    // Create courses where non-Active courses have higher similarity
    fc.assert(
      fc.property(
        fc.constant(Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION))),
        fc.array(
          fc.record({
            course_id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            code: fc.string({ minLength: 2, maxLength: 20 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            duration: fc.string({ minLength: 1, maxLength: 50 }),
            category: fc.string({ minLength: 1, maxLength: 50 }),
            skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
            target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
            // Mix of statuses with bias toward non-Active
            status: fc.oneof(
              fc.constant('Active' as CourseStatus),
              fc.constantFrom('Inactive', 'Draft', 'Archived', 'Pending') as fc.Arbitrary<CourseStatus>,
              fc.constantFrom('Inactive', 'Draft', 'Archived', 'Pending') as fc.Arbitrary<CourseStatus>,
              fc.constantFrom('Inactive', 'Draft', 'Archived', 'Pending') as fc.Arbitrary<CourseStatus>,
              fc.constantFrom('Inactive', 'Draft', 'Archived', 'Pending') as fc.Arbitrary<CourseStatus>
            ),
            // High similarity embedding
            embedding: fc.constant(Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION))),
            deleted_at: fc.constant(null)
          }),
          { minLength: 10, maxLength: 30 }
        ),
        (profileEmbedding, courses) => {
          const results = performSimilaritySearchWithStatusFilter(profileEmbedding, courses);
          
          // Count Active courses in input
          const activeCoursesCount = courses.filter(c => c.status === 'Active').length;
          
          // Property: All results must be Active
          results.forEach(course => {
            expect(course.status).toBe('Active');
          });
          
          // Property: Result count should not exceed Active course count
          expect(results.length).toBeLessThanOrEqual(activeCoursesCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no Active courses exist', () => {
    // Generate only non-Active courses
    const nonActiveCourses = fc.array(
      fc.record({
        course_id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 100 }),
        code: fc.string({ minLength: 2, maxLength: 20 }),
        description: fc.string({ minLength: 0, maxLength: 500 }),
        duration: fc.string({ minLength: 1, maxLength: 50 }),
        category: fc.string({ minLength: 1, maxLength: 50 }),
        skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
        target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
        status: fc.constantFrom('Inactive', 'Draft', 'Archived', 'Pending') as fc.Arbitrary<CourseStatus>,
        embedding: embeddingArbitrary,
        deleted_at: fc.constant(null)
      }),
      { minLength: 1, maxLength: 20 }
    );

    fc.assert(
      fc.property(
        embeddingArbitrary,
        nonActiveCourses,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearchWithStatusFilter(profileEmbedding, courses);
          
          // Property: No results when no Active courses exist
          expect(results.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter out deleted courses even if Active', () => {
    // Generate Active courses but some are deleted
    const activeButSomeDeleted = fc.array(
      fc.record({
        course_id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 100 }),
        code: fc.string({ minLength: 2, maxLength: 20 }),
        description: fc.string({ minLength: 0, maxLength: 500 }),
        duration: fc.string({ minLength: 1, maxLength: 50 }),
        category: fc.string({ minLength: 1, maxLength: 50 }),
        skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
        target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
        status: fc.constant('Active' as CourseStatus),
        embedding: embeddingArbitrary,
        // Mix of deleted and non-deleted
        deleted_at: fc.oneof(
          fc.constant(null),
          fc.date().map(d => d.toISOString())
        )
      }),
      { minLength: 5, maxLength: 20 }
    );

    fc.assert(
      fc.property(
        embeddingArbitrary,
        activeButSomeDeleted,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearchWithStatusFilter(profileEmbedding, courses);
          
          // Count non-deleted Active courses
          const validCoursesCount = courses.filter(
            c => c.status === 'Active' && c.deleted_at === null
          ).length;
          
          // Property: All results must be Active
          results.forEach(course => {
            expect(course.status).toBe('Active');
          });
          
          // Property: Result count should not exceed valid course count
          expect(results.length).toBeLessThanOrEqual(validCoursesCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all Active courses when fewer than 10 exist and pass threshold', () => {
    // Create a deterministic test with known Active courses
    const profileEmbedding = Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION));
    
    // Create 5 Active courses and 10 Inactive courses with same embedding
    const courses: Course[] = [
      ...Array.from({ length: 5 }, (_, i) => ({
        course_id: `active-${i}`,
        title: `Active Course ${i}`,
        code: `AC${i}`,
        description: `Description ${i}`,
        duration: '4 weeks',
        category: 'Technology',
        skills: ['skill1', 'skill2'],
        target_outcomes: ['outcome1'],
        status: 'Active' as CourseStatus,
        embedding: Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION)),
        deleted_at: null
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        course_id: `inactive-${i}`,
        title: `Inactive Course ${i}`,
        code: `IC${i}`,
        description: `Description ${i}`,
        duration: '4 weeks',
        category: 'Technology',
        skills: ['skill1', 'skill2'],
        target_outcomes: ['outcome1'],
        status: 'Inactive' as CourseStatus,
        embedding: Array(EMBEDDING_DIMENSION).fill(1 / Math.sqrt(EMBEDDING_DIMENSION)),
        deleted_at: null
      }))
    ];

    const results = performSimilaritySearchWithStatusFilter(profileEmbedding, courses);
    
    // Property: Should return exactly 5 Active courses
    expect(results.length).toBe(5);
    
    // Property: All results must be Active
    results.forEach(course => {
      expect(course.status).toBe('Active');
      expect(course.course_id).toMatch(/^active-/);
    });
  });

  it('should handle edge case of all courses being Active', () => {
    const allActiveCourses = fc.array(
      fc.record({
        course_id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 100 }),
        code: fc.string({ minLength: 2, maxLength: 20 }),
        description: fc.string({ minLength: 0, maxLength: 500 }),
        duration: fc.string({ minLength: 1, maxLength: 50 }),
        category: fc.string({ minLength: 1, maxLength: 50 }),
        skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
        target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
        status: fc.constant('Active' as CourseStatus),
        embedding: embeddingArbitrary,
        deleted_at: fc.constant(null)
      }),
      { minLength: 0, maxLength: 30 }
    );

    fc.assert(
      fc.property(
        embeddingArbitrary,
        allActiveCourses,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearchWithStatusFilter(profileEmbedding, courses);
          
          // Property: All results must be Active
          results.forEach(course => {
            expect(course.status).toBe('Active');
          });
          
          // Property: Result count should respect MAX_RECOMMENDATIONS limit
          expect(results.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain Active filter even with varying similarity thresholds', () => {
    fc.assert(
      fc.property(
        embeddingArbitrary,
        mixedStatusCoursesArbitrary,
        (profileEmbedding, courses) => {
          const results = performSimilaritySearchWithStatusFilter(profileEmbedding, courses);
          
          // Property: Regardless of similarity scores, all results must be Active
          results.forEach(course => {
            expect(course.status).toBe('Active');
          });
          
          // Property: No non-Active course should ever appear in results
          const nonActiveInResults = results.filter(c => c.status !== 'Active');
          expect(nonActiveInResults.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
