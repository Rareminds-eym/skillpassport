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
    // First, get the current project to check if it's verified
    const { data: currentProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch current project', fetchError, { projectId });
      return { success: false, data: null, error: fetchError.message };
    }

    // Check if project is verified/approved
    const isVerified = currentProject.approval_status === 'verified' || currentProject.approval_status === 'approved';

    let updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isVerified) {
      // If verified, store changes as pending edit
      updateData = {
        has_pending_edit: true,
        pending_edit_data: updates,
        updated_at: new Date().toISOString(),
      };
      
      // Store current verified data if not already stored
      if (!currentProject.verified_data) {
        updateData.verified_data = {
          title: currentProject.title,
          description: currentProject.description,
          role: currentProject.role,
          start_date: currentProject.start_date,
          end_date: currentProject.end_date,
          duration: currentProject.duration,
          organization: currentProject.organization,
          tech_stack: currentProject.tech_stack,
          demo_link: currentProject.demo_link,
          github_link: currentProject.github_link,
        };
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
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
    
    // Get existing project records to check verification status
    const existingIds = projectRecords.filter(r => r.id).map(r => r.id);
    let existingProjects: any[] = [];
    
    if (existingIds.length > 0) {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .in('id', existingIds);
      existingProjects = data || [];
    }
    
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
      
      // Find existing project if updating
      const existingProj = existingProjects.find(p => p.id === record.id);
      const isVerified = existingProj && (existingProj.approval_status === 'verified' || existingProj.approval_status === 'approved');
      
      if (isVerified) {
        // For verified projects, check if anything actually changed
        // CRITICAL: Keep all existing fields to avoid NOT NULL violations
        cleanRecord.id = record.id;
        
        // Copy all existing fields from the database
        Object.keys(existingProj).forEach(key => {
          if (key !== 'updated_at' && existingProj[key] !== undefined) {
            cleanRecord[key] = existingProj[key];
          }
        });
        
        // Check if any field actually changed
        let hasChanges = false;
        const pendingChanges: any = {};
        
        // Compare each field to detect actual changes
        const compareField = (fieldName: string, newValue: any) => {
          const oldValue = existingProj[fieldName];
          // Normalize null/undefined for comparison
          const oldNorm = oldValue === null || oldValue === undefined ? '' : String(oldValue);
          const newNorm = newValue === null || newValue === undefined ? '' : String(newValue);
          
          if (oldNorm !== newNorm) {
            hasChanges = true;
            pendingChanges[fieldName] = newValue;
          }
        };
        
        // Check direct fields
        if (record.title !== undefined) compareField('title', record.title);
        if (record.description !== undefined) compareField('description', record.description);
        if (record.role !== undefined) compareField('role', record.role);
        if (record.organization !== undefined) compareField('organization', record.organization);
        if (record.status !== undefined) compareField('status', record.status);
        
        // Check mapped fields
        if (record.technologies !== undefined) compareField('tech_stack', record.technologies);
        else if (record.tech_stack !== undefined) compareField('tech_stack', record.tech_stack);
        
        if (record.demoUrl !== undefined) compareField('demo_link', record.demoUrl);
        else if (record.demo_link !== undefined) compareField('demo_link', record.demo_link);
        
        if (record.githubUrl !== undefined) compareField('github_link', record.githubUrl);
        else if (record.github_link !== undefined) compareField('github_link', record.github_link);
        
        if (record.startDate !== undefined) compareField('start_date', record.startDate);
        else if (record.start_date !== undefined) compareField('start_date', record.start_date);
        
        if (record.endDate !== undefined) compareField('end_date', record.endDate);
        else if (record.end_date !== undefined) compareField('end_date', record.end_date);
        
        // Only set has_pending_edit if there are actual changes
        if (hasChanges) {
          cleanRecord.has_pending_edit = true;
          cleanRecord.pending_edit_data = pendingChanges;
          
          // Store current verified data if not already stored
          if (!existingProj.verified_data) {
            cleanRecord.verified_data = {
              title: existingProj.title,
              description: existingProj.description,
              role: existingProj.role,
              start_date: existingProj.start_date,
              end_date: existingProj.end_date,
              duration: existingProj.duration,
              organization: existingProj.organization,
              tech_stack: existingProj.tech_stack,
              demo_link: existingProj.demo_link,
              github_link: existingProj.github_link,
            };
          } else {
            cleanRecord.verified_data = existingProj.verified_data;
          }
        }
        // If no changes, keep existing status (don't modify has_pending_edit)
      } else {
        // For new or unverified projects, update normally
        validFields.forEach(field => {
          if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
            cleanRecord[field] = record[field];
          }
        });
        
        // Set has_pending_edit to false for new/unverified projects
        if (cleanRecord.has_pending_edit === undefined) {
          cleanRecord.has_pending_edit = false;
        }
      }
      
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
