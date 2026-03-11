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
    const { data, error } = await supabase
      .from('experience')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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
      
      // Copy valid fields
      validFields.forEach(field => {
        if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
          cleanRecord[field] = record[field];
        }
      });
      
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
