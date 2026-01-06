/**
 * Embedding Service
 * Handles embedding generation for students and opportunities
 */

import { supabase } from '../lib/supabaseClient';

const EMBEDDING_API_URL = import.meta.env.VITE_EMBEDDING_API_URL || 
  import.meta.env.VITE_CAREER_API_URL;

const regenerationDebounce = new Map();
const DEBOUNCE_MS = 5000;

function buildStudentEmbeddingText(student) {
  const parts = [];

  if (student.name) parts.push(`Name: ${student.name}`);
  if (student.branch_field) parts.push(`Field: ${student.branch_field}`);
  if (student.course_name) parts.push(`Course: ${student.course_name}`);
  if (student.university) parts.push(`University: ${student.university}`);
  if (student.bio) parts.push(`Bio: ${student.bio}`);
  if (student.skill_summary) parts.push(`Skills: ${student.skill_summary}`);

  if (student.technical_skills?.length > 0) {
    const skillNames = student.technical_skills
      .map(s => typeof s === 'string' ? s : s.name || s.skill_name)
      .filter(Boolean);
    if (skillNames.length > 0) {
      parts.push(`Technical Skills: ${skillNames.join(', ')}`);
    }
  }

  if (student.experience?.length > 0) {
    const expSummary = student.experience
      .map(e => `${e.role || e.title} at ${e.organization || e.company}`)
      .join('; ');
    parts.push(`Experience: ${expSummary}`);
  }

  if (student.projects?.length > 0) {
    const projNames = student.projects.map(p => p.title || p.name).filter(Boolean).join(', ');
    if (projNames) parts.push(`Projects: ${projNames}`);
  }

  if (student.certificates?.length > 0) {
    const certNames = student.certificates.map(c => c.name || c.title).filter(Boolean).join(', ');
    if (certNames) parts.push(`Certifications: ${certNames}`);
  }

  if (student.courseEnrollments?.length > 0) {
    const completedCourses = student.courseEnrollments
      .filter(c => c.status === 'completed')
      .map(c => c.course_title)
      .filter(Boolean);
    const inProgressCourses = student.courseEnrollments
      .filter(c => c.status === 'in_progress' || c.status === 'active')
      .map(c => c.course_title)
      .filter(Boolean);
    
    if (completedCourses.length > 0) parts.push(`Completed Courses: ${completedCourses.join(', ')}`);
    if (inProgressCourses.length > 0) parts.push(`Courses In Progress: ${inProgressCourses.join(', ')}`);

    const acquiredSkills = student.courseEnrollments
      .filter(c => c.status === 'completed' && c.skills_acquired?.length > 0)
      .flatMap(c => c.skills_acquired)
      .filter(Boolean);
    if (acquiredSkills.length > 0) parts.push(`Skills from Courses: ${acquiredSkills.join(', ')}`);
  }

  if (student.trainings?.length > 0) {
    const completedTrainings = student.trainings
      .filter(t => t.status === 'completed')
      .map(t => `${t.title}${t.organization ? ` (${t.organization})` : ''}`)
      .filter(Boolean);
    if (completedTrainings.length > 0) parts.push(`Completed Trainings: ${completedTrainings.join(', ')}`);
  }

  if (student.hobbies?.length > 0) parts.push(`Hobbies: ${student.hobbies.join(', ')}`);
  if (student.interests?.length > 0) parts.push(`Interests: ${student.interests.join(', ')}`);

  return parts.join('\n');
}

function buildOpportunityEmbeddingText(opportunity) {
  const parts = [];

  if (opportunity.job_title || opportunity.title) parts.push(`Job Title: ${opportunity.job_title || opportunity.title}`);
  if (opportunity.company_name) parts.push(`Company: ${opportunity.company_name}`);
  if (opportunity.department) parts.push(`Department: ${opportunity.department}`);
  if (opportunity.employment_type) parts.push(`Type: ${opportunity.employment_type}`);
  if (opportunity.experience_level || opportunity.experience_required) {
    parts.push(`Experience: ${opportunity.experience_level || opportunity.experience_required}`);
  }
  if (opportunity.location) parts.push(`Location: ${opportunity.location}`);

  const skills = opportunity.skills_required || [];
  if (Array.isArray(skills) && skills.length > 0) {
    const skillNames = skills.map(s => typeof s === 'string' ? s : s.name || s.skill).filter(Boolean);
    parts.push(`Required Skills: ${skillNames.join(', ')}`);
  }

  const requirements = opportunity.requirements || [];
  if (Array.isArray(requirements) && requirements.length > 0) {
    parts.push(`Requirements: ${requirements.join('; ')}`);
  }

  if (opportunity.description) parts.push(`Description: ${opportunity.description.slice(0, 1000)}`);

  return parts.join('\n');
}

export async function generateStudentEmbedding(studentId) {
  try {
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select(`*, experience (*), projects (*), certificates (*), technical_skills (*)`)
      .eq('id', studentId)
      .single();

    if (fetchError || !student) {
      throw new Error(`Student not found: ${fetchError?.message || 'Not found'}`);
    }

    const { data: courseEnrollments } = await supabase
      .from('course_enrollments')
      .select('course_title, status, progress, skills_acquired')
      .eq('student_id', studentId)
      .in('status', ['completed', 'in_progress', 'active']);

    const { data: trainings } = await supabase
      .from('trainings')
      .select('title, organization, status, description')
      .eq('student_id', studentId);

    student.courseEnrollments = courseEnrollments || [];
    student.trainings = trainings || [];

    const text = buildStudentEmbeddingText(student);
    if (text.length < 20) return { success: false, error: 'Insufficient data' };

    const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, table: 'students', id: studentId, type: 'student' })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return { success: true, ...(await response.json()) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

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
    if (text.length < 20) return { success: false, error: 'Insufficient data' };

    const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, table: 'opportunities', id: opportunityId, type: 'opportunity' })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return { success: true, ...(await response.json()) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function ensureStudentEmbedding(studentId) {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('id, embedding')
      .eq('id', studentId)
      .single();

    if (error) throw new Error(`Failed to check student: ${error.message}`);
    if (student.embedding) return { success: true, existed: true };

    return await generateStudentEmbedding(studentId);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getEmbeddingStats() {
  try {
    const { data, error } = await supabase.rpc('get_embedding_stats');
    if (error) throw new Error(`Failed to get stats: ${error.message}`);
    return { success: true, stats: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function processEmbeddingQueue(batchSize = 10) {
  try {
    const { data: batch, error: queueError } = await supabase
      .rpc('get_embedding_queue_batch', { batch_size: batchSize });

    if (queueError) throw new Error(`Failed to get queue batch: ${queueError.message}`);
    if (!batch || batch.length === 0) return { success: true, processed: 0, message: 'Queue is empty' };

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
    return { success: true, processed: batch.length, succeeded: successCount, failed: batch.length - successCount, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function backfillMissingEmbeddings(table = 'students', limit = 50) {
  try {
    const { data: records, error: fetchError } = await supabase
      .from(table)
      .select('id')
      .is('embedding', null)
      .limit(limit);

    if (fetchError) throw new Error(`Failed to fetch records: ${fetchError.message}`);
    if (!records || records.length === 0) return { success: true, processed: 0, message: `No ${table} need embeddings` };

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
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successCount = results.filter(r => r.success).length;
    return { success: true, table, processed: records.length, succeeded: successCount, failed: records.length - successCount, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function regenerateStudentEmbedding(studentId) {
  if (!studentId) return { success: false, error: 'No studentId' };

  const lastRegen = regenerationDebounce.get(studentId);
  if (lastRegen && Date.now() - lastRegen < DEBOUNCE_MS) {
    return { success: true, debounced: true };
  }
  regenerationDebounce.set(studentId, Date.now());

  try {
    await supabase.from('students').update({ embedding: null }).eq('id', studentId);
    return await generateStudentEmbedding(studentId);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function scheduleEmbeddingRegeneration(studentId) {
  if (!studentId) return;
  setTimeout(() => { regenerateStudentEmbedding(studentId).catch(() => {}); }, 1000);
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
