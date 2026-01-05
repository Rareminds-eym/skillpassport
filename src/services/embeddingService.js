/**
 * Industrial-Grade Embedding Service
 * 
 * Handles embedding generation for students, opportunities, and courses
 * with automatic queue processing and fallback mechanisms.
 */

import { supabase } from '../lib/supabaseClient';

const EMBEDDING_API_URL = import.meta.env.VITE_EMBEDDING_API_URL || 
  import.meta.env.VITE_CAREER_API_URL || 
  'https://career-api.dark-mode-d021.workers.dev';

// Debounce map to prevent multiple regenerations
const regenerationDebounce = new Map();
const DEBOUNCE_MS = 5000; // 5 seconds

/**
 * Build searchable text from student data
 */
function buildStudentEmbeddingText(student) {
  const parts = [];

  // Basic info
  if (student.name) parts.push(`Name: ${student.name}`);
  if (student.branch_field) parts.push(`Field: ${student.branch_field}`);
  if (student.course_name) parts.push(`Course: ${student.course_name}`);
  if (student.university) parts.push(`University: ${student.university}`);
  if (student.bio) parts.push(`Bio: ${student.bio}`);
  if (student.skill_summary) parts.push(`Skills: ${student.skill_summary}`);

  // Get skills from related tables
  if (student.technical_skills?.length > 0) {
    const skillNames = student.technical_skills
      .map(s => typeof s === 'string' ? s : s.name || s.skill_name)
      .filter(Boolean);
    if (skillNames.length > 0) {
      parts.push(`Technical Skills: ${skillNames.join(', ')}`);
    }
  }

  // Experience
  if (student.experience?.length > 0) {
    const expSummary = student.experience
      .map(e => `${e.role || e.title} at ${e.organization || e.company}`)
      .join('; ');
    parts.push(`Experience: ${expSummary}`);
  }

  // Projects
  if (student.projects?.length > 0) {
    const projNames = student.projects
      .map(p => p.title || p.name)
      .filter(Boolean)
      .join(', ');
    if (projNames) parts.push(`Projects: ${projNames}`);
  }

  // Certificates
  if (student.certificates?.length > 0) {
    const certNames = student.certificates
      .map(c => c.name || c.title)
      .filter(Boolean)
      .join(', ');
    if (certNames) parts.push(`Certifications: ${certNames}`);
  }

  // Hobbies and interests
  if (student.hobbies?.length > 0) {
    parts.push(`Hobbies: ${student.hobbies.join(', ')}`);
  }
  if (student.interests?.length > 0) {
    parts.push(`Interests: ${student.interests.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Build searchable text from opportunity data
 */
function buildOpportunityEmbeddingText(opportunity) {
  const parts = [];

  if (opportunity.job_title || opportunity.title) {
    parts.push(`Job Title: ${opportunity.job_title || opportunity.title}`);
  }
  if (opportunity.company_name) {
    parts.push(`Company: ${opportunity.company_name}`);
  }
  if (opportunity.department) {
    parts.push(`Department: ${opportunity.department}`);
  }
  if (opportunity.employment_type) {
    parts.push(`Type: ${opportunity.employment_type}`);
  }
  if (opportunity.experience_level || opportunity.experience_required) {
    parts.push(`Experience: ${opportunity.experience_level || opportunity.experience_required}`);
  }
  if (opportunity.location) {
    parts.push(`Location: ${opportunity.location}`);
  }

  // Skills
  const skills = opportunity.skills_required || [];
  if (Array.isArray(skills) && skills.length > 0) {
    const skillNames = skills
      .map(s => typeof s === 'string' ? s : s.name || s.skill)
      .filter(Boolean);
    parts.push(`Required Skills: ${skillNames.join(', ')}`);
  }

  // Requirements
  const requirements = opportunity.requirements || [];
  if (Array.isArray(requirements) && requirements.length > 0) {
    parts.push(`Requirements: ${requirements.join('; ')}`);
  }

  // Description
  if (opportunity.description) {
    parts.push(`Description: ${opportunity.description.slice(0, 1000)}`);
  }

  return parts.join('\n');
}

/**
 * Generate embedding for a student
 */
export async function generateStudentEmbedding(studentId) {
  try {
    // Fetch student with related data
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select(`
        *,
        experience (*),
        projects (*),
        certificates (*),
        technical_skills (*)
      `)
      .eq('id', studentId)
      .single();

    if (fetchError || !student) {
      throw new Error(`Student not found: ${fetchError?.message || 'Not found'}`);
    }

    const text = buildStudentEmbeddingText(student);
    
    if (text.length < 20) {
      console.warn('⚠️ Insufficient student data for embedding');
      return { success: false, error: 'Insufficient data' };
    }

    // Call embedding API
    const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        table: 'students',
        id: studentId,
        type: 'student'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Generated embedding for student ${studentId}`);
    
    return { success: true, ...result };

  } catch (error) {
    console.error('❌ Error generating student embedding:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate embedding for an opportunity
 */
export async function generateOpportunityEmbedding(opportunityId) {
  try {
    const { data: opportunity, error: fetchError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (fetchError || !opportunity) {
      throw new Error(`Opportunity not found: ${fetchError?.message || 'Not found'}`);
    }

    const text = buildOpportunityEmbeddingText(opportunity);
    
    if (text.length < 20) {
      console.warn('⚠️ Insufficient opportunity data for embedding');
      return { success: false, error: 'Insufficient data' };
    }

    const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        table: 'opportunities',
        id: opportunityId,
        type: 'opportunity'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Generated embedding for opportunity ${opportunityId}`);
    
    return { success: true, ...result };

  } catch (error) {
    console.error('❌ Error generating opportunity embedding:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Ensure student has an embedding (generate if missing)
 */
export async function ensureStudentEmbedding(studentId) {
  try {
    // Check if embedding exists
    const { data: student, error } = await supabase
      .from('students')
      .select('id, embedding')
      .eq('id', studentId)
      .single();

    if (error) {
      throw new Error(`Failed to check student: ${error.message}`);
    }

    if (student.embedding) {
      console.log(`✅ Student ${studentId} already has embedding`);
      return { success: true, existed: true };
    }

    // Generate embedding
    return await generateStudentEmbedding(studentId);

  } catch (error) {
    console.error('❌ Error ensuring student embedding:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats() {
  try {
    const { data, error } = await supabase.rpc('get_embedding_stats');
    
    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    return { success: true, stats: data };

  } catch (error) {
    console.error('❌ Error getting embedding stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process embedding queue (for admin/background use)
 */
export async function processEmbeddingQueue(batchSize = 10) {
  try {
    // Get batch from queue
    const { data: batch, error: queueError } = await supabase
      .rpc('get_embedding_queue_batch', { batch_size: batchSize });

    if (queueError) {
      throw new Error(`Failed to get queue batch: ${queueError.message}`);
    }

    if (!batch || batch.length === 0) {
      return { success: true, processed: 0, message: 'Queue is empty' };
    }

    const results = [];

    for (const item of batch) {
      try {
        let result;
        
        if (item.table_name === 'students') {
          result = await generateStudentEmbedding(item.record_id);
        } else if (item.table_name === 'opportunities') {
          result = await generateOpportunityEmbedding(item.record_id);
        } else {
          result = { success: false, error: 'Unknown table' };
        }

        // Mark as completed
        await supabase.rpc('complete_embedding_queue_item', {
          queue_id: item.id,
          success: result.success,
          error_msg: result.error || null
        });

        results.push({ id: item.record_id, ...result });

      } catch (itemError) {
        await supabase.rpc('complete_embedding_queue_item', {
          queue_id: item.id,
          success: false,
          error_msg: itemError.message
        });
        results.push({ id: item.record_id, success: false, error: itemError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return {
      success: true,
      processed: batch.length,
      succeeded: successCount,
      failed: batch.length - successCount,
      results
    };

  } catch (error) {
    console.error('❌ Error processing embedding queue:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Backfill all missing embeddings
 */
export async function backfillMissingEmbeddings(table = 'students', limit = 50) {
  try {
    // Get records without embeddings
    const { data: records, error: fetchError } = await supabase
      .from(table)
      .select('id')
      .is('embedding', null)
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch records: ${fetchError.message}`);
    }

    if (!records || records.length === 0) {
      return { success: true, processed: 0, message: `No ${table} need embeddings` };
    }

    const results = [];

    for (const record of records) {
      let result;
      
      if (table === 'students') {
        result = await generateStudentEmbedding(record.id);
      } else if (table === 'opportunities') {
        result = await generateOpportunityEmbedding(record.id);
      } else {
        result = { success: false, error: 'Unknown table' };
      }

      results.push({ id: record.id, ...result });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successCount = results.filter(r => r.success).length;
    
    return {
      success: true,
      table,
      processed: records.length,
      succeeded: successCount,
      failed: records.length - successCount,
      results
    };

  } catch (error) {
    console.error('❌ Error backfilling embeddings:', error);
    return { success: false, error: error.message };
  }
}

export default {
  generateStudentEmbedding,
  generateOpportunityEmbedding,
  ensureStudentEmbedding,
  getEmbeddingStats,
  processEmbeddingQueue,
  backfillMissingEmbeddings,
  buildStudentEmbeddingText,
  buildOpportunityEmbeddingText
};


/**
 * Regenerate embedding for a student (debounced)
 * Call this after profile updates to refresh the embedding
 */
export async function regenerateStudentEmbedding(studentId) {
  if (!studentId) {
    console.warn('⚠️ No studentId provided for embedding regeneration');
    return { success: false, error: 'No studentId' };
  }

  // Debounce: prevent multiple regenerations within 5 seconds
  const lastRegen = regenerationDebounce.get(studentId);
  if (lastRegen && Date.now() - lastRegen < DEBOUNCE_MS) {
    console.log('⏳ Embedding regeneration debounced for', studentId);
    return { success: true, debounced: true };
  }
  regenerationDebounce.set(studentId, Date.now());

  console.log('🔄 Regenerating embedding for student:', studentId);

  try {
    // First, clear the existing embedding to trigger regeneration
    const { error: clearError } = await supabase
      .from('students')
      .update({ embedding: null })
      .eq('id', studentId);

    if (clearError) {
      console.error('❌ Failed to clear embedding:', clearError);
    }

    // Generate new embedding
    const result = await generateStudentEmbedding(studentId);
    
    if (result.success) {
      console.log('✅ Embedding regenerated successfully for', studentId);
    } else {
      console.warn('⚠️ Embedding regeneration failed:', result.error);
    }

    return result;

  } catch (error) {
    console.error('❌ Error regenerating embedding:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Schedule embedding regeneration (non-blocking)
 * Use this for fire-and-forget embedding updates
 */
export function scheduleEmbeddingRegeneration(studentId) {
  if (!studentId) return;

  // Run in background without blocking
  setTimeout(() => {
    regenerateStudentEmbedding(studentId).catch(err => {
      console.error('Background embedding regeneration failed:', err);
    });
  }, 1000); // 1 second delay to let DB updates complete
}
