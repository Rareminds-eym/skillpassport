/**
 * Batch Course Embedding Script
 * Generates vector embeddings for all active courses using Gemini text-embedding-004
 * 
 * Feature: rag-course-recommendations
 * Requirements: 1.4, 1.5
 * 
 * Usage: node scripts/embedCourses.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Configuration
const BATCH_SIZE = 10; // Process 10 courses at a time to avoid rate limits
const BATCH_DELAY_MS = 2000; // 2 second delay between batches
const MAX_RETRIES = 4;
const INITIAL_BACKOFF_MS = 1000; // 1 second
const BACKOFF_MULTIPLIER = 2; // Exponential: 1s, 2s, 4s, 8s

// Gemini Embedding API configuration
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.VITE_GEMINI_API_KEY;

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const missing = [];
  
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!geminiApiKey) missing.push('VITE_GEMINI_API_KEY');
  
  if (missing.length > 0) {
    console.error('❌ Error: Missing required environment variables!');
    console.error('Please add these to your .env file:');
    missing.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
  console.log(`   Supabase URL: ${supabaseUrl}`);
}

validateEnvironment();

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sleep utility for delays and backoff
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Check if an error is a rate limit error
 * @param {Response} response - Fetch response
 * @param {Object} errorData - Parsed error data
 * @returns {boolean}
 */
function isRateLimitError(response, errorData) {
  return response.status === 429 || 
         errorData?.error?.code === 429 ||
         errorData?.error?.status === 'RESOURCE_EXHAUSTED';
}

/**
 * Generate embedding for a single text using Gemini text-embedding-004
 * Implements exponential backoff for rate limiting
 * 
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - 768-dimensional embedding vector
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  let lastError = null;
  let backoffMs = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${EMBEDDING_API_URL}?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }]
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const embedding = data?.embedding?.values;
        
        if (!embedding || !Array.isArray(embedding)) {
          throw new Error('Invalid embedding response format');
        }
        
        return embedding;
      }

      // Parse error response
      const errorData = await response.json().catch(() => ({}));
      
      // Check for rate limiting
      if (isRateLimitError(response, errorData) && attempt < MAX_RETRIES) {
        console.warn(`   ⏳ Rate limited on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
        backoffMs *= BACKOFF_MULTIPLIER;
        continue;
      }

      lastError = new Error(
        errorData?.error?.message || 
        `Embedding API error: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      if (error.message.includes('Rate limited') || error.message.includes('RESOURCE_EXHAUSTED')) {
        if (attempt < MAX_RETRIES) {
          console.warn(`   ⏳ Rate limit error on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`);
          await sleep(backoffMs);
          backoffMs *= BACKOFF_MULTIPLIER;
          continue;
        }
      }
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to generate embedding after all retries');
}

/**
 * Build embeddable text from course data
 * @param {Object} course - Course object
 * @returns {string} - Combined text for embedding
 */
function buildCourseText(course) {
  const parts = [];

  // Add title (required)
  parts.push(`Title: ${course.title}`);

  // Add description if available
  if (course.description && course.description.trim()) {
    parts.push(`Description: ${course.description.trim()}`);
  }

  // Add skills if available
  const skills = course.skills || [];
  if (Array.isArray(skills) && skills.length > 0) {
    const skillsText = skills.filter(s => s && s.trim()).join(', ');
    if (skillsText) {
      parts.push(`Skills: ${skillsText}`);
    }
  }

  // Add target outcomes if available
  const outcomes = course.target_outcomes || [];
  if (Array.isArray(outcomes) && outcomes.length > 0) {
    const outcomesText = outcomes.filter(o => o && o.trim()).join('; ');
    if (outcomesText) {
      parts.push(`Target Outcomes: ${outcomesText}`);
    }
  }

  return parts.join('\n\n');
}


/**
 * Fetch a course with its skills from the database
 * @param {string} courseId - Course ID to fetch
 * @returns {Promise<Object|null>} - Course object with skills or null if not found
 */
async function fetchCourseWithSkills(courseId) {
  // Fetch course basic data
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('course_id, title, description, target_outcomes, status')
    .eq('course_id', courseId)
    .single();

  if (courseError || !course) {
    console.error(`   ❌ Failed to fetch course ${courseId}:`, courseError?.message);
    return null;
  }

  // Fetch skills for this course
  const { data: skillsData, error: skillsError } = await supabase
    .from('course_skills')
    .select('skill_name')
    .eq('course_id', courseId);

  if (skillsError) {
    console.warn(`   ⚠️ Failed to fetch skills for course ${courseId}:`, skillsError.message);
  }

  return {
    ...course,
    skills: (skillsData || []).map(s => s.skill_name)
  };
}

/**
 * Generate and store embedding for a single course
 * @param {string} courseId - Course ID to embed
 * @param {string} courseTitle - Course title for logging
 * @returns {Promise<{ success: boolean, courseId: string, error?: string }>}
 */
async function embedCourse(courseId, courseTitle) {
  try {
    // Fetch course with skills
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
    
    // Generate embedding
    const embedding = await generateEmbedding(courseText);
    
    // Store embedding in database
    // Format embedding as a string for pgvector: '[0.1, 0.2, ...]'
    const embeddingString = `[${embedding.join(',')}]`;
    
    const { error: updateError } = await supabase
      .from('courses')
      .update({ embedding: embeddingString })
      .eq('course_id', courseId);

    if (updateError) {
      console.error(`   ❌ Failed to store embedding for course ${courseId}:`, updateError.message);
      return {
        success: false,
        courseId,
        error: `Database update failed: ${updateError.message}`
      };
    }

    console.log(`   ✅ ${courseTitle}`);
    return {
      success: true,
      courseId
    };
  } catch (error) {
    console.error(`   ❌ ${courseTitle}: ${error.message}`);
    return {
      success: false,
      courseId,
      error: error.message
    };
  }
}

/**
 * Get embedding statistics for all courses
 * @returns {Promise<{ total: number, withEmbedding: number, withoutEmbedding: number }>}
 */
async function getEmbeddingStats() {
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
}


/**
 * Main function to embed all courses without embeddings
 * Processes courses in batches to avoid rate limiting
 */
async function embedAllCourses() {
  const startTime = Date.now();
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  console.log('\n🚀 Starting Course Embedding Generation');
  console.log('   Using Gemini text-embedding-004 model');
  console.log(`   Batch size: ${BATCH_SIZE} courses`);
  console.log(`   Batch delay: ${BATCH_DELAY_MS}ms\n`);

  try {
    // Show initial stats
    const initialStats = await getEmbeddingStats();
    console.log('📊 Initial Statistics:');
    console.log(`   Total active courses: ${initialStats.total}`);
    console.log(`   Already embedded: ${initialStats.withEmbedding}`);
    console.log(`   Need embedding: ${initialStats.withoutEmbedding}\n`);

    // Fetch all active courses without embeddings
    const { data: courses, error: fetchError } = await supabase
      .from('courses')
      .select('course_id, title')
      .eq('status', 'Active')
      .is('embedding', null)
      .is('deleted_at', null)
      .order('title');

    if (fetchError) {
      console.error('❌ Failed to fetch courses:', fetchError.message);
      throw new Error(`Failed to fetch courses: ${fetchError.message}`);
    }

    if (!courses || courses.length === 0) {
      console.log('✅ All courses already have embeddings! Nothing to do.\n');
      return results;
    }

    console.log(`📋 Found ${courses.length} courses to embed\n`);

    // Process in batches
    const totalBatches = Math.ceil(courses.length / BATCH_SIZE);
    
    for (let i = 0; i < courses.length; i += BATCH_SIZE) {
      const batch = courses.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`📦 Batch ${batchNumber}/${totalBatches} (${batch.length} courses)`);

      // Process each course in the batch
      for (const course of batch) {
        const result = await embedCourse(course.course_id, course.title);
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            courseId: course.course_id,
            title: course.title,
            error: result.error || 'Unknown error'
          });
        }
      }

      // Add delay between batches to avoid rate limiting (except for last batch)
      if (i + BATCH_SIZE < courses.length) {
        console.log(`   ⏳ Waiting ${BATCH_DELAY_MS}ms before next batch...\n`);
        await sleep(BATCH_DELAY_MS);
      }
    }

    // Calculate duration
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 EMBEDDING GENERATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`   ✅ Successful: ${results.success}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   ⏱️  Duration: ${duration}s`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Failed Courses:');
      results.errors.forEach(e => {
        console.log(`   - ${e.title} (${e.courseId}): ${e.error}`);
      });
    }

    // Show final stats
    const finalStats = await getEmbeddingStats();
    console.log('\n📊 Final Statistics:');
    console.log(`   Total active courses: ${finalStats.total}`);
    console.log(`   With embeddings: ${finalStats.withEmbedding}`);
    console.log(`   Without embeddings: ${finalStats.withoutEmbedding}`);
    console.log(`   Coverage: ${((finalStats.withEmbedding / finalStats.total) * 100).toFixed(1)}%\n`);

    return results;
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
embedAllCourses()
  .then(results => {
    if (results.failed > 0) {
      process.exit(1); // Exit with error code if any failures
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
