/**
 * Projects Service - CRUD for student projects
 */

import { supabase } from '../../lib/supabaseClient';
import { getLogger } from '../../config/logging';
import type { Project, ServiceResponse, CreateProjectInput } from './types';

const logger = getLogger('projects-service');

export async function getProjectsByStudentId(studentId: string): Promise<ServiceResponse<Project[]>> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', studentId)
      .order('start_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch projects', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in getProjectsByStudentId', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

export async function createProject(input: CreateProjectInput): Promise<ServiceResponse<Project>> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create project', error, { studentId: input.student_id });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in createProject', err, { studentId: input.student_id });
    return { success: false, data: null, error: err.message };
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<CreateProjectInput>
): Promise<ServiceResponse<Project>> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update project', error, { projectId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in updateProject', err, { projectId });
    return { success: false, data: null, error: err.message };
  }
}

export async function deleteProject(projectId: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      logger.error('Failed to delete project', error, { projectId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: null, error: null };
  } catch (err: any) {
    logger.error('Exception in deleteProject', err, { projectId });
    return { success: false, data: null, error: err.message };
  }
}

export async function bulkUpsertProjects(
  studentId: string,
  projectRecords: any[]
): Promise<ServiceResponse<Project[]>> {
  try {
    const validFields = [
      'id', 'student_id', 'title', 'description', 'status', 'start_date',
      'end_date', 'duration', 'tech_stack', 'demo_link', 'github_link',
      'certificate_url', 'video_url', 'ppt_url', 'organization', 'role',
      'approval_status', 'enabled', 'has_pending_edit', 'pending_edit_data',
      'verified_data', 'approval_authority', 'approved_by', 'approved_at',
      'rejected_by', 'rejected_at', 'approval_notes', 'created_at', 'updated_at'
    ];
    
    const records = projectRecords.map(record => {
      const cleanRecord: any = {
        student_id: studentId,
        updated_at: new Date().toISOString(),
      };
      
      // Map common UI field names
      if (record.technologies) cleanRecord.tech_stack = record.technologies;
      if (record.demoUrl) cleanRecord.demo_link = record.demoUrl;
      if (record.githubUrl) cleanRecord.github_link = record.githubUrl;
      if (record.startDate) cleanRecord.start_date = record.startDate;
      if (record.endDate) cleanRecord.end_date = record.endDate;
      
      // Copy valid fields
      validFields.forEach(field => {
        if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
          cleanRecord[field] = record[field];
        }
      });
      
      return cleanRecord;
    });

    const { data, error } = await supabase
      .from('projects')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) {
      logger.error('Failed to bulk upsert projects', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in bulkUpsertProjects', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}
