/**
 * Education Service - CRUD for student education records
 */

import { supabase } from '../../lib/supabaseClient';
import { getLogger } from '../../config/logging';
import type { Education, ServiceResponse, CreateEducationInput } from './types';

const logger = getLogger('education-service');

export async function getEducationByStudentId(studentId: string): Promise<ServiceResponse<Education[]>> {
  try {
    const { data, error } = await supabase
      .from('education')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch education', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in getEducationByStudentId', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

export async function createEducation(input: CreateEducationInput): Promise<ServiceResponse<Education>> {
  try {
    const { data, error } = await supabase
      .from('education')
      .insert([{
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create education', error, { studentId: input.student_id });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in createEducation', err, { studentId: input.student_id });
    return { success: false, data: null, error: err.message };
  }
}

export async function updateEducation(
  educationId: string,
  updates: Partial<CreateEducationInput>
): Promise<ServiceResponse<Education>> {
  try {
    const { data, error } = await supabase
      .from('education')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', educationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update education', error, { educationId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in updateEducation', err, { educationId });
    return { success: false, data: null, error: err.message };
  }
}

export async function deleteEducation(educationId: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('education')
      .delete()
      .eq('id', educationId);

    if (error) {
      logger.error('Failed to delete education', error, { educationId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: null, error: null };
  } catch (err: any) {
    logger.error('Exception in deleteEducation', err, { educationId });
    return { success: false, data: null, error: err.message };
  }
}

export async function bulkUpsertEducation(
  studentId: string,
  educationRecords: any[]
): Promise<ServiceResponse<Education[]>> {
  try {
    const validFields = [
      'id', 'student_id', 'level', 'degree', 'department', 'university',
      'year_of_passing', 'cgpa', 'status', 'approval_status', 'enabled',
      'has_pending_edit', 'pending_edit_data', 'verified_data', 'created_at', 'updated_at'
    ];
    
    const records = educationRecords.map(record => {
      const cleanRecord: any = {
        student_id: studentId,
        updated_at: new Date().toISOString(),
      };
      
      // Map common UI field names
      if (record.institution) cleanRecord.university = record.institution;
      if (record.yearOfPassing) cleanRecord.year_of_passing = record.yearOfPassing;
      
      // Copy valid fields
      validFields.forEach(field => {
        if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
          cleanRecord[field] = record[field];
        }
      });
      
      return cleanRecord;
    });

    const { data, error } = await supabase
      .from('education')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) {
      logger.error('Failed to bulk upsert education', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in bulkUpsertEducation', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}
