import { ssoClient } from '@/shared/api/ssoClient';
import { apiGet, apiPost } from '@/shared/api/apiClient';
/**
 * Course Embedding Manager
 * Manages the generation and storage of vector embeddings for courses
 * to enable semantic similarity search in course recommendations.
 *
 * Feature: rag-course-recommendations
 * Requirements: 1.1, 1.4, 1.5
 */

import { getApiUrl } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('course-embedding-manager');

// API URL for embedding generation (uses career-api Cloudflare worker)
const EMBEDDING_API_URL = getApiUrl('career');

/**
 * Generate embedding for text via the career-api Cloudflare worker
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateEmbedding(text) {
  if (!text || text.trim().length < 10) {
    throw new Error('Text too short for embedding generation');
  }

  // Get auth token
  const user = useAuthStore.getState().user;
  const token = ssoClient.getAccessToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await ssoClient.fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      },
    body: JSON.stringify({ text, returnEmbedding: true })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  const result = await response.json();
  if (!result.embedding || !Array.isArray(result.embedding)) {
    throw new Error('Invalid embedding response');
  }

  return result.embedding;
}

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
  try {
    const response = await apiGet(`/courses/embed/course?courseId=${encodeURIComponent(courseId)}`);
    if (!response?.data) {
      logger.error(`Failed to fetch course ${courseId}`, new Error('Course not found'));
      return null;
    }
    return response.data;
  } catch (err) {
    logger.error(`Failed to fetch course ${courseId}`, err instanceof Error ? err : new Error(String(err)));
    return null;
  }
};

/**
 * Generate and store embedding for a single course
 * Uses the backend API to generate and store the embedding.
 * 
 * @param {string} courseId - Course ID to embed
 * @returns {Promise<{ success: boolean, courseId: string, error?: string }>}
 * 
 * Requirements: 1.1, 1.3
 */
export const embedCourse = async (courseId) => {
  try {
    const user = useAuthStore.getState().user;
    const token = ssoClient.getAccessToken();

    if (!token) {
      return {
        success: false,
        courseId,
        error: 'Authentication required'
      };
    }

    const response = await ssoClient.fetch(`${EMBEDDING_API_URL}/regenerate?table=courses&id=${courseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        }
    });

    if (response.ok) {
      return { success: true, courseId };
    }

    const course = await fetchCourseWithSkills(courseId);

    if (!course) {
      return {
        success: false,
        courseId,
        error: 'Course not found'
      };
    }

    const courseText = buildCourseText(course);
    const embedding = await generateEmbedding(courseText);
    const embeddingString = `[${embedding.join(',')}]`;

    await apiPost('/courses/embedding/generate', { courseId, embeddingString });

    return {
      success: true,
      courseId
    };
  } catch (error) {
    logger.error(`Failed to embed course ${courseId}`, error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      courseId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};


/**
 * Batch embed all courses that don't have embeddings
 * Processes courses in batches to avoid rate limiting.
 * Continues processing even if individual courses fail.
 * 
 * @returns {Promise<{ success: number, failed: number, errors: Array<{ courseId: string, error: string }> }>}
 * 
 * Requirements: 1.4, 1.5
 */
export const embedAllCourses = async () => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    const response = await apiGet('/courses/embed/pending');
    const courses = response?.data || [];

    if (!courses || courses.length === 0) {
      return results;
    }

    for (let i = 0; i < courses.length; i += BATCH_SIZE) {
      const batch = courses.slice(i, i + BATCH_SIZE);

      for (const course of batch) {
        const result = await embedCourse(course.course_id);

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
        await sleep(BATCH_DELAY_MS);
      }
    }

    return results;
  } catch (error) {
    logger.error('Batch embedding failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Check if a course has an embedding
 * @param {string} courseId - Course ID to check
 * @returns {Promise<boolean>} - True if course has embedding
 */
export const hasEmbedding = async (courseId) => {
  try {
    const response = await apiGet(`/courses/embedding/check?courseId=${encodeURIComponent(courseId)}`);
    return response?.data?.hasEmbedding ?? false;
  } catch {
    return false;
  }
};

/**
 * Get embedding statistics for all courses
 * @returns {Promise<{ total: number, withEmbedding: number, withoutEmbedding: number }>}
 */
export const getEmbeddingStats = async () => {
  const response = await apiGet('/courses/embedding/stats');
  return response?.data ?? { total: 0, withEmbedding: 0, withoutEmbedding: 0 };
};

// Default export for convenience
export default {
  buildCourseText,
  embedCourse,
  embedAllCourses,
  hasEmbedding,
  getEmbeddingStats
};
