/**
 * Experience Service - CRUD for student experience records
 */

import { supabase } from '../../lib/supabaseClient';
import { getLogger } from '../../config/logging';
import type { Experience, ServiceResponse, CreateExperienceInput } from './types';

const logger = getLogger('experience-service');

export async function getExperienceByStudentId(studentId: string): Promise<ServiceResponse<Experience[]>> {
  try {
    const { data, error } = await supabase
      .from('experience')
      .select('*')
      .eq('student_id', studentId)
      .order('start_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch experience', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in getExperienceByStudentId', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

export async function createExperience(input: CreateExperienceInput): Promise<ServiceResponse<Experience>> {
  try {
    const { data, error } = await supabase
      .from('experience')
      .insert([{
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create experience', error, { studentId: input.student_id });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in createExperience', err, { studentId: input.student_id });
    return { success: false, data: null, error: err.message };
  }
}

export async function updateExperience(
  experienceId: string,
  updates: Partial<CreateExperienceInput>
): Promise<ServiceResponse<Experience>> {
  try {
    // First, get the current experience to check if it's verified
    const { data: currentExperience, error: fetchError } = await supabase
      .from('experience')
      .select('*')
      .eq('id', experienceId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch current experience', fetchError, { experienceId });
      return { success: false, data: null, error: fetchError.message };
    }

    // Check if experience is verified/approved
    const isVerified = currentExperience.approval_status === 'verified' || currentExperience.approval_status === 'approved';

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
      if (!currentExperience.verified_data) {
        updateData.verified_data = {
          role: currentExperience.role,
          organization: currentExperience.organization,
          start_date: currentExperience.start_date,
          end_date: currentExperience.end_date,
          duration: currentExperience.duration,
          description: currentExperience.description,
        };
      }
    }

    const { data, error } = await supabase
      .from('experience')
      .update(updateData)
      .eq('id', experienceId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update experience', error, { experienceId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in updateExperience', err, { experienceId });
    return { success: false, data: null, error: err.message };
  }
}

export async function deleteExperience(experienceId: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('experience')
      .delete()
      .eq('id', experienceId);

    if (error) {
      logger.error('Failed to delete experience', error, { experienceId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: null, error: null };
  } catch (err: any) {
    logger.error('Exception in deleteExperience', err, { experienceId });
    return { success: false, data: null, error: err.message };
  }
}

export async function bulkUpsertExperience(
  studentId: string,
  experienceRecords: any[]
): Promise<ServiceResponse<Experience[]>> {
  try {
    const validFields = [
      'id', 'student_id', 'organization', 'role', 'start_date', 'end_date',
      'duration', 'description', 'verified', 'approval_status', 'enabled',
      'has_pending_edit', 'pending_edit_data', 'verified_data',
      'approval_authority', 'approved_by', 'approved_at', 'rejected_by',
      'rejected_at', 'approval_notes', 'created_at', 'updated_at'
    ];
    
    // Get existing experience records to check verification status
    const existingIds = experienceRecords.filter(r => r.id).map(r => r.id);
    let existingExperience: any[] = [];
    
    if (existingIds.length > 0) {
      const { data } = await supabase
        .from('experience')
        .select('*')
        .in('id', existingIds);
      existingExperience = data || [];
    }
    
    const records = experienceRecords.map(record => {
      const cleanRecord: any = {
        student_id: studentId,
        updated_at: new Date().toISOString(),
      };
      
      // Map common UI field names
      if (record.company) cleanRecord.organization = record.company;
      if (record.position) cleanRecord.role = record.position;
      if (record.startDate) cleanRecord.start_date = record.startDate;
      if (record.endDate) cleanRecord.end_date = record.endDate;
      
      // Find existing experience if updating
      const existingExp = existingExperience.find(e => e.id === record.id);
      const isVerified = existingExp && (existingExp.approval_status === 'verified' || existingExp.approval_status === 'approved');
      
      if (isVerified) {
        // For verified experience, store changes as pending edit
        // CRITICAL: Keep all existing fields to avoid NOT NULL violations
        cleanRecord.id = record.id;
        
        // Copy all existing fields from the database
        Object.keys(existingExp).forEach(key => {
          if (key !== 'updated_at' && existingExp[key] !== undefined) {
            cleanRecord[key] = existingExp[key];
          }
        });
        
        // Now set the versioning metadata
        cleanRecord.has_pending_edit = true;
        cleanRecord.pending_edit_data = {};
        
        // Store current verified data if not already stored
        if (!existingExp.verified_data) {
          cleanRecord.verified_data = {
            role: existingExp.role,
            organization: existingExp.organization,
            start_date: existingExp.start_date,
            end_date: existingExp.end_date,
            duration: existingExp.duration,
            description: existingExp.description,
          };
        } else {
          cleanRecord.verified_data = existingExp.verified_data;
        }
        
        // Build pending_edit_data with the changes
        validFields.forEach(field => {
          if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at' && field !== 'id' && 
              field !== 'has_pending_edit' && field !== 'pending_edit_data' && field !== 'verified_data') {
            cleanRecord.pending_edit_data[field] = record[field];
          }
        });
        
        // Also handle mapped fields
        if (record.company) cleanRecord.pending_edit_data.organization = record.company;
        if (record.position) cleanRecord.pending_edit_data.role = record.position;
        if (record.startDate) cleanRecord.pending_edit_data.start_date = record.startDate;
        if (record.endDate) cleanRecord.pending_edit_data.end_date = record.endDate;
      } else {
        // For new or unverified experience, update normally
        validFields.forEach(field => {
          if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
            cleanRecord[field] = record[field];
          }
        });
        
        // Set has_pending_edit to false for new/unverified experience
        if (cleanRecord.has_pending_edit === undefined) {
          cleanRecord.has_pending_edit = false;
        }
      }
      
      return cleanRecord;
    });

    const { data, error } = await supabase
      .from('experience')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) {
      logger.error('Failed to bulk upsert experience', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in bulkUpsertExperience', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}
