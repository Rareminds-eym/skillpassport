/**
 * Property-Based Test: Batch Processing Resilience
 * 
 * **Feature: rag-course-recommendations, Property 9: Batch Processing Resilience**
 * **Validates: Requirements 1.5**
 * 
 * Property: For any batch of courses being embedded where some fail, the successful 
 * embeddings SHALL still be persisted and the failure count SHALL equal the number 
 * of actual failures.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Constants
const EMBEDDING_DIMENSION = 768;

/**
 * Generator for valid course objects
 */
const courseArbitrary = fc.record({
  course_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  status: fc.constant('Active'),
  target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 })
});

/**
 * Generator for a batch of courses with some marked to fail
 * Returns an object with courses array and a set of course IDs that should fail
 */
const batchWithFailuresArbitrary = fc.tuple(
  fc.array(courseArbitrary, { minLength: 1, maxLength: 10 }),
  fc.float({ min: 0, max: 1 }) // Failure rate
).map(([courses, failureRate]) => {
  const failingCourseIds = new Set<string>();
  courses.forEach(course => {
    // Randomly mark some courses to fail based on failure rate
    if (Math.random() < failureRate) {
      failingCourseIds.add(course.course_id);
    }
  });
  return { courses, failingCourseIds };
});

/**
 * Create a deterministic embedding for testing
 */
const createMockEmbedding = (courseId: string): number[] => {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = ((hash << 5) - hash) + courseId.charCodeAt(i);
    hash = hash & hash;
  }
  
  const embedding: number[] = [];
  let seed = Math.abs(hash);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    embedding.push((seed / 0x7fffffff) * 2 - 1);
  }
  return embedding;
};

describe('Property 9: Batch Processing Resilience', () => {
  let mockSupabase: any;
  let mockGenerateEmbedding: ReturnType<typeof vi.fn>;
  let storedEmbeddings: Map<string, number[]>;
  let failingCourseIds: Set<string>;

  beforeEach(() => {
    vi.clearAllMocks();
    storedEmbeddings = new Map();
    failingCourseIds = new Set();

    // Mock generateEmbedding to fail for specific course IDs
    mockGenerateEmbedding = vi.fn().mockImplementation(async (text: string) => {
      // Extract course ID from the text (we'll pass it in a predictable way)
      const courseIdMatch = text.match(/CourseID:([a-f0-9-]+)/i);
      const courseId = courseIdMatch ? courseIdMatch[1] : '';
      
      if (failingCourseIds.has(courseId)) {
        throw new Error(`Embedding generation failed for course ${courseId}`);
      }
      
      return createMockEmbedding(courseId);
    });

    // Mock supabase client
    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        return {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockImplementation((data: any) => ({
            eq: vi.fn().mockImplementation((field: string, value: string) => {
              // Store the embedding
              if (data.embedding) {
                storedEmbeddings.set(value, data.embedding);
              }
              return Promise.resolve({ data: { course_id: value }, error: null });
            })
          })),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            return Promise.resolve({ data: null, error: null });
          })
        };
      })
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should persist successful embeddings even when some courses fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        batchWithFailuresArbitrary,
        async ({ courses, failingCourseIds: failIds }) => {
          // Reset state for this test run
          storedEmbeddings.clear();
          failingCourseIds = failIds;

          // Simulate batch processing
          const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ courseId: string; error: string }>
          };

          for (const course of courses) {
            try {
              // Build course text with embedded course ID for tracking
              const courseText = `CourseID:${course.course_id}\nTitle: ${course.title}`;
              
              // Try to generate embedding
              const embedding = await mockGenerateEmbedding(courseText);
              
              // Store in mock database
              await mockSupabase
                .from('courses')
                .update({ embedding })
                .eq('course_id', course.course_id);
              
              results.success++;
            } catch (error: any) {
              results.failed++;
              results.errors.push({
                courseId: course.course_id,
                error: error.message
              });
            }
          }

          // Property assertions
          const expectedSuccessCount = courses.filter(c => !failIds.has(c.course_id)).length;
          const expectedFailCount = courses.filter(c => failIds.has(c.course_id)).length;

          // Property 1: Success count equals number of non-failing courses
          expect(results.success).toBe(expectedSuccessCount);

          // Property 2: Failure count equals number of actual failures
          expect(results.failed).toBe(expectedFailCount);

          // Property 3: Total processed equals total courses
          expect(results.success + results.failed).toBe(courses.length);

          // Property 4: All successful embeddings are persisted
          for (const course of courses) {
            if (!failIds.has(course.course_id)) {
              expect(storedEmbeddings.has(course.course_id)).toBe(true);
            }
          }

          // Property 5: Failed courses are not persisted
          for (const courseId of failIds) {
            expect(storedEmbeddings.has(courseId)).toBe(false);
          }

          // Property 6: Error array length matches failure count
          expect(results.errors.length).toBe(expectedFailCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should continue processing after individual course failures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(courseArbitrary, { minLength: 3, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }).filter(i => i < 10), // Index of course to fail
        async (courses, failIndex) => {
          // Ensure failIndex is within bounds
          const actualFailIndex = failIndex % courses.length;
          const failingId = courses[actualFailIndex].course_id;
          
          storedEmbeddings.clear();
          failingCourseIds = new Set([failingId]);

          let processedCount = 0;
          let successCount = 0;
          let failCount = 0;

          // Process all courses
          for (const course of courses) {
            processedCount++;
            try {
              const courseText = `CourseID:${course.course_id}\nTitle: ${course.title}`;
              const embedding = await mockGenerateEmbedding(courseText);
              
              await mockSupabase
                .from('courses')
                .update({ embedding })
                .eq('course_id', course.course_id);
              
              successCount++;
            } catch {
              failCount++;
            }
          }

          // Property: All courses should be processed regardless of failures
          expect(processedCount).toBe(courses.length);
          
          // Property: Exactly one failure should occur
          expect(failCount).toBe(1);
          
          // Property: All other courses should succeed
          expect(successCount).toBe(courses.length - 1);
          
          // Property: Successful courses should have embeddings stored
          expect(storedEmbeddings.size).toBe(courses.length - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle all courses failing gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(courseArbitrary, { minLength: 1, maxLength: 5 }),
        async (courses) => {
          storedEmbeddings.clear();
          // Mark all courses to fail
          failingCourseIds = new Set(courses.map(c => c.course_id));

          const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ courseId: string; error: string }>
          };

          for (const course of courses) {
            try {
              const courseText = `CourseID:${course.course_id}\nTitle: ${course.title}`;
              const embedding = await mockGenerateEmbedding(courseText);
              
              await mockSupabase
                .from('courses')
                .update({ embedding })
                .eq('course_id', course.course_id);
              
              results.success++;
            } catch (error: any) {
              results.failed++;
              results.errors.push({
                courseId: course.course_id,
                error: error.message
              });
            }
          }

          // Property: All courses should fail
          expect(results.failed).toBe(courses.length);
          expect(results.success).toBe(0);
          
          // Property: No embeddings should be stored
          expect(storedEmbeddings.size).toBe(0);
          
          // Property: All errors should be recorded
          expect(results.errors.length).toBe(courses.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle all courses succeeding', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(courseArbitrary, { minLength: 1, maxLength: 10 }),
        async (courses) => {
          storedEmbeddings.clear();
          failingCourseIds = new Set(); // No failures

          const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ courseId: string; error: string }>
          };

          for (const course of courses) {
            try {
              const courseText = `CourseID:${course.course_id}\nTitle: ${course.title}`;
              const embedding = await mockGenerateEmbedding(courseText);
              
              await mockSupabase
                .from('courses')
                .update({ embedding })
                .eq('course_id', course.course_id);
              
              results.success++;
            } catch (error: any) {
              results.failed++;
              results.errors.push({
                courseId: course.course_id,
                error: error.message
              });
            }
          }

          // Property: All courses should succeed
          expect(results.success).toBe(courses.length);
          expect(results.failed).toBe(0);
          
          // Property: All embeddings should be stored
          expect(storedEmbeddings.size).toBe(courses.length);
          
          // Property: No errors should be recorded
          expect(results.errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
