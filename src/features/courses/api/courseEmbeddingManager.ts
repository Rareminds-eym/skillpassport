/**
 * Course Embedding Manager
 * Manages the generation and storage of vector embeddings for courses
 * to enable semantic similarity search in course recommendations.
 * 
 * NOTE: This service now uses the shared embedding client.
 * All duplicate code has been removed.
 * 
 * Feature: rag-course-recommendations
 * Requirements: 1.1, 1.4, 1.5
 */

import { supabase } from '@/shared/api/supabaseClient';
import { generateEmbedding } from '@/shared/api/embedding';

// Batch processing configuration
const BATCH_SIZE = 10; // Process 10 courses at a time to avoid rate limits
const BATCH_DELAY_MS = 2000; // 2 second delay between batches

/**
 * Sleep utility for batch processing delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Build embeddable text from course data
 * Combines title, description, skills, and target outcomes into a single
 * text representation suitable for embedding generation.
 * 
 * @param {Object} course - Course object with title, description, skills, and outcomes
 * @param {string} course.title - Course title
 * @param {string} [course.description] - Course description
 * @param {string[]} [course.skills] - Array of skill names
 * @param {string[]} [course.target_outcomes] - Array of target outcomes
 * @returns {string} - Combined text for embedding
 * 
 * Requirements: 1.1
 */
export const buildCourseText = (course) => {
  if (!course || !course.title) {
    throw new Error('Course must have a title');
  }

  const parts = [];

  // Add title (required)
  parts.push(`Title: ${course.title}`);

  // Add description if available
  if (course.description && course.description.trim()) {
    parts.push(`Description: ${course.description.trim()}`);
  }

  // Add skills if available
  const skills = course.skills || course.skillsCovered || [];
  if (Array.isArray(skills) && skills.length > 0) {
    const skillsText = skills.filter(s => s && s.trim()).join(', ');
    if (skillsText) {
      parts.push(`Skills: ${skillsText}`);
    }
  }

  // Add target outcomes if available
  const outcomes = course.target_outcomes || course.targetOutcomes || [];
  if (Array.isArray(outcomes) && outcomes.length > 0) {
    const outcomesText = outcomes.filter(o => o && o.trim()).join('; ');
    if (outcomesText) {
      parts.push(`Target Outcomes: ${outcomesText}`);
    }
  }

  return parts.join('\n\n');
};


/**
 * Fetch a course with its skills from the database
 * @param {string} courseId - Course ID to fetch
 * @returns {Promise<Object|null>} - Course object with skills or null if not found
 */
const fetchCourseWithSkills = async (courseId) => {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('course_id, title, description, target_outcomes, status')
    .eq('course_id', courseId)
    .maybeSingle();

  if (courseError || !course) {
    logger.error(`Failed to fetch course ${courseId}`, courseError ? new Error(courseError.message) : new Error('Course not found'));
    return null;
  }

  const { data: skillsData, error: skillsError } = await supabase
    .from('course_skills')
    .select('skill_name')
    .eq('course_id', courseId);

  if (skillsError) {
    logger.warn(`Failed to fetch skills for course ${courseId}`, { error: skillsError.message });
  }

  return {
    ...course,
    skills: (skillsData || []).map(s => s.skill_name)
  };
};

/**
 * Generate and store embedding for a single course
 * Uses the backend API to generate and store the embedding.
 * 
 * @param courseId - Course ID to embed
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise with success status and error details
 * 
 * Requirements: 1.1, 1.3
 */
export const embedCourse = async (
  courseId: string,
  signal?: AbortSignal
): Promise<{ success: boolean; courseId: string; error?: string }> => {
  try {
    // Check if operation was cancelled
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      const error = new Error('Authentication required');
      console.error(`[CourseEmbedding] ${courseId}:`, error);
      return {
        success: false,
        courseId,
        error: error.message
      };
    }

    // Fetch course with skills
    const course = await fetchCourseWithSkills(courseId);

    if (!course) {
      const error = new Error('Course not found');
      console.error(`[CourseEmbedding] ${courseId}:`, error);
      return {
        success: false,
        courseId,
        error: error.message
      };
    }

    // Check cancellation again before expensive operation
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }

    // Build text for embedding
    const courseText = buildCourseText(course);
    
    // Generate embedding via shared client
    const embedding = await generateEmbedding(courseText, {
      table: 'courses',
      id: courseId,
      returnEmbedding: true,
      skipDatabaseUpdate: true // We'll update DB separately
    });
    
    // Store embedding in database
    const embeddingString = `[${embedding.join(',')}]`;

    const { error: updateError } = await supabase
      .from('courses')
      .update({ embedding: embeddingString })
      .eq('course_id', courseId);

    if (updateError) {
      const error = new Error(`Database update failed: ${updateError.message}`);
      console.error(`[CourseEmbedding] ${courseId}:`, error);
      return {
        success: false,
        courseId,
        error: error.message
      };
    }

    console.log(`[CourseEmbedding] ✅ Successfully embedded: ${course.title} (${courseId})`);
    return {
      success: true,
      courseId
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[CourseEmbedding] Failed to embed ${courseId}:`, errorMessage);
    return {
      success: false,
      courseId,
      error: errorMessage
    };
  }
};


/**
 * Batch embed all courses that don't have embeddings
 * Processes courses in batches to avoid rate limiting.
 * Continues processing even if individual courses fail.
 * 
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise with success/failure counts and error details
 * 
 * Requirements: 1.4, 1.5
 */
export const embedAllCourses = async (signal?: AbortSignal) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ courseId: string; error: string }>
  };

  try {
    // Check if operation was cancelled
    if (signal?.aborted) {
      throw new Error('Operation cancelled');
    }

    // Fetch all active courses without embeddings
    const { data: courses, error: fetchError } = await supabase
      .from('courses')
      .select('course_id, title')
      .eq('status', 'Active')
      .is('embedding', null)
      .is('deleted_at', null);

    if (fetchError) {
      const error = new Error(`Failed to fetch courses: ${fetchError.message}`);
      console.error('[CourseEmbedding]', error);
      throw error;
    }

    if (!courses || courses.length === 0) {
      console.log('[CourseEmbedding] ✅ No courses need embedding');
      return results;
    }

    console.log(`[CourseEmbedding] 📋 Found ${courses.length} courses to embed`);

    // Process in batches
    for (let i = 0; i < courses.length; i += BATCH_SIZE) {
      // Check cancellation before each batch
      if (signal?.aborted) {
        console.log('[CourseEmbedding] ⚠️ Operation cancelled by user');
        throw new Error('Operation cancelled');
      }

      const batch = courses.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(courses.length / BATCH_SIZE);
      
      console.log(`[CourseEmbedding] 📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} courses)`);

      for (const course of batch) {
        // Check cancellation before each course
        if (signal?.aborted) {
          console.log('[CourseEmbedding] ⚠️ Operation cancelled by user');
          throw new Error('Operation cancelled');
        }

        const result = await embedCourse(course.course_id, signal);
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            courseId: course.course_id,
            error: result.error || 'Unknown error'
          });
        }
      }

      if (i + BATCH_SIZE < courses.length) {
        console.log(`[CourseEmbedding] ⏳ Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await sleep(BATCH_DELAY_MS);
      }
    }

    console.log(`[CourseEmbedding] ✅ Embedding complete: ${results.success} success, ${results.failed} failed`);
    
    if (results.errors.length > 0) {
      console.log('[CourseEmbedding] ❌ Failed courses:');
      results.errors.forEach(e => console.log(`  - ${e.courseId}: ${e.error}`));
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CourseEmbedding] Batch embedding failed:', errorMessage);
    throw error;
  }
};

/**
 * Check if a course has an embedding
 * @param {string} courseId - Course ID to check
 * @returns {Promise<boolean>} - True if course has embedding
 */
export const hasEmbedding = async (courseId) => {
  const { data, error } = await supabase
    .from('courses')
    .select('embedding')
    .eq('course_id', courseId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.embedding !== null;
};

/**
 * Get embedding statistics for all courses
 * @returns {Promise<{ total: number, withEmbedding: number, withoutEmbedding: number }>}
 */
export const getEmbeddingStats = async () => {
  // Get total active courses
  const { count: total, error: totalError } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')
    .is('deleted_at', null);

  if (totalError) {
    throw new Error(`Failed to get total count: ${totalError.message}`);
  }

  // Get courses with embeddings
  const { count: withEmbedding, error: embeddedError } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')
    .is('deleted_at', null)
    .not('embedding', 'is', null);

  if (embeddedError) {
    throw new Error(`Failed to get embedded count: ${embeddedError.message}`);
  }

  return {
    total: total || 0,
    withEmbedding: withEmbedding || 0,
    withoutEmbedding: (total || 0) - (withEmbedding || 0)
  };
};

// Default export for convenience
export default {
  buildCourseText,
  embedCourse,
  embedAllCourses,
  hasEmbedding,
  getEmbeddingStats
};
