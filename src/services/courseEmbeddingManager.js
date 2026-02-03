/**
 * Course Embedding Manager
 * Manages the generation and storage of vector embeddings for courses
 * to enable semantic similarity search in course recommendations.
 * 
 * Feature: rag-course-recommendations
 * Requirements: 1.1, 1.4, 1.5
 */

import { supabase } from '../lib/supabaseClient';
import { getPagesApiUrl } from '../utils/pagesUrl';

// API URL for embedding generation (uses career-api Cloudflare worker)
const EMBEDDING_API_URL = getPagesApiUrl('career');

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
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
  // Fetch course basic data
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('course_id, title, description, target_outcomes, status')
    .eq('course_id', courseId)
    .maybeSingle();

  if (courseError || !course) {
    console.error(`Failed to fetch course ${courseId}:`, courseError?.message);
    return null;
  }

  // Fetch skills for this course
  const { data: skillsData, error: skillsError } = await supabase
    .from('course_skills')
    .select('skill_name')
    .eq('course_id', courseId);

  if (skillsError) {
    console.warn(`Failed to fetch skills for course ${courseId}:`, skillsError.message);
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
 * @param {string} courseId - Course ID to embed
 * @returns {Promise<{ success: boolean, courseId: string, error?: string }>}
 * 
 * Requirements: 1.1, 1.3
 */
export const embedCourse = async (courseId) => {
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      return {
        success: false,
        courseId,
        error: 'Authentication required'
      };
    }

    // Try using the backend API first (preferred - handles everything server-side)
    const response = await fetch(`${EMBEDDING_API_URL}/regenerate?table=courses&id=${courseId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Successfully embedded course via API: ${courseId}`);
      return { success: true, courseId };
    }

    // Fallback: Generate locally if API doesn't support courses
    const course = await fetchCourseWithSkills(courseId);
    
    if (!course) {
      return {
        success: false,
        courseId,
        error: 'Course not found'
      };
    }

    // Build text for embedding
    const courseText = buildCourseText(course);
    
    // Generate embedding via API
    const embedding = await generateEmbedding(courseText);
    
    // Store embedding in database
    const embeddingString = `[${embedding.join(',')}]`;
    
    const { error: updateError } = await supabase
      .from('courses')
      .update({ embedding: embeddingString })
      .eq('course_id', courseId);

    if (updateError) {
      console.error(`Failed to store embedding for course ${courseId}:`, updateError.message);
      return {
        success: false,
        courseId,
        error: `Database update failed: ${updateError.message}`
      };
    }

    console.log(`✅ Successfully embedded course: ${course.title} (${courseId})`);
    return {
      success: true,
      courseId
    };
  } catch (error) {
    console.error(`Failed to embed course ${courseId}:`, error.message);
    return {
      success: false,
      courseId,
      error: error.message
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
    // Fetch all active courses without embeddings
    const { data: courses, error: fetchError } = await supabase
      .from('courses')
      .select('course_id, title')
      .eq('status', 'Active')
      .is('embedding', null)
      .is('deleted_at', null);

    if (fetchError) {
      console.error('Failed to fetch courses:', fetchError.message);
      throw new Error(`Failed to fetch courses: ${fetchError.message}`);
    }

    if (!courses || courses.length === 0) {
      console.log('✅ No courses need embedding');
      return results;
    }

    console.log(`📋 Found ${courses.length} courses to embed`);

    // Process in batches
    for (let i = 0; i < courses.length; i += BATCH_SIZE) {
      const batch = courses.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(courses.length / BATCH_SIZE);
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} courses)`);

      // Process each course in the batch
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

      // Add delay between batches to avoid rate limiting (except for last batch)
      if (i + BATCH_SIZE < courses.length) {
        console.log(`⏳ Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await sleep(BATCH_DELAY_MS);
      }
    }

    console.log(`\n✅ Embedding complete: ${results.success} success, ${results.failed} failed`);
    
    if (results.errors.length > 0) {
      console.log('❌ Failed courses:');
      results.errors.forEach(e => console.log(`  - ${e.courseId}: ${e.error}`));
    }

    return results;
  } catch (error) {
    console.error('Batch embedding failed:', error.message);
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
