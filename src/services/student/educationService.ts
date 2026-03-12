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
    // First, get the current education to check if it's verified
    const { data: currentEducation, error: fetchError } = await supabase
      .from('education')
      .select('*')
      .eq('id', educationId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch current education', fetchError, { educationId });
      return { success: false, data: null, error: fetchError.message };
    }

    // Check if education is verified/approved
    const isVerified = currentEducation.approval_status === 'verified' || currentEducation.approval_status === 'approved';

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
      if (!currentEducation.verified_data) {
        updateData.verified_data = {
          degree: currentEducation.degree,
          department: currentEducation.department,
          university: currentEducation.university,
          year_of_passing: currentEducation.year_of_passing,
          cgpa: currentEducation.cgpa,
          level: currentEducation.level,
          status: currentEducation.status,
        };
      }
    }

    const { data, error } = await supabase
      .from('education')
      .update(updateData)
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
    
    // Get existing education records to check verification status
    const existingIds = educationRecords.filter(r => r.id).map(r => r.id);
    let existingEducation: any[] = [];
    
    if (existingIds.length > 0) {
      const { data } = await supabase
        .from('education')
        .select('*')
        .in('id', existingIds);
      existingEducation = data || [];
    }
    
    const records = educationRecords.map(record => {
      const cleanRecord: any = {
        student_id: studentId,
        updated_at: new Date().toISOString(),
      };
      
      // Map common UI field names
      if (record.institution) cleanRecord.university = record.institution;
      if (record.yearOfPassing) cleanRecord.year_of_passing = record.yearOfPassing;
      
      // Find existing education if updating
      const existingEdu = existingEducation.find(e => e.id === record.id);
      const isVerified = existingEdu && (existingEdu.approval_status === 'verified' || existingEdu.approval_status === 'approved');
      
      if (isVerified) {
        // For verified education, store changes as pending edit
        // CRITICAL: Keep all existing fields to avoid NOT NULL violations
        cleanRecord.id = record.id;
        
        // Copy all existing fields from the database
        Object.keys(existingEdu).forEach(key => {
          if (key !== 'updated_at' && existingEdu[key] !== undefined) {
            cleanRecord[key] = existingEdu[key];
          }
        });
        
        // Check if any field actually changed
        let hasChanges = false;
        const pendingChanges: any = {};
        
        const compareField = (fieldName: string, newValue: any) => {
          const oldValue = existingEdu[fieldName];
          const oldNorm = oldValue === null || oldValue === undefined ? '' : String(oldValue);
          const newNorm = newValue === null || newValue === undefined ? '' : String(newValue);
          
          if (oldNorm !== newNorm) {
            hasChanges = true;
            pendingChanges[fieldName] = newValue;
          }
        };
        
        // Check direct fields
        if (record.degree !== undefined) compareField('degree', record.degree);
        if (record.department !== undefined) compareField('department', record.department);
        if (record.university !== undefined) compareField('university', record.university);
        if (record.year_of_passing !== undefined) compareField('year_of_passing', record.year_of_passing);
        if (record.cgpa !== undefined) compareField('cgpa', record.cgpa);
        if (record.level !== undefined) compareField('level', record.level);
        if (record.status !== undefined) compareField('status', record.status);
        
        // Check mapped fields
        if (record.institution !== undefined) compareField('university', record.institution);
        if (record.yearOfPassing !== undefined) compareField('year_of_passing', record.yearOfPassing);
        
        // Only set has_pending_edit if there are actual changes
        if (hasChanges) {
          cleanRecord.has_pending_edit = true;
          cleanRecord.pending_edit_data = pendingChanges;
          
          if (!existingEdu.verified_data) {
            cleanRecord.verified_data = {
              degree: existingEdu.degree,
              department: existingEdu.department,
              university: existingEdu.university,
              year_of_passing: existingEdu.year_of_passing,
              cgpa: existingEdu.cgpa,
              level: existingEdu.level,
              status: existingEdu.status,
            };
          } else {
            cleanRecord.verified_data = existingEdu.verified_data;
          }
        }
      } else {
        // For new or unverified education, update normally
        validFields.forEach(field => {
          if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
            cleanRecord[field] = record[field];
          }
        });
        
        // Set has_pending_edit to false for new/unverified education
        if (cleanRecord.has_pending_edit === undefined) {
          cleanRecord.has_pending_edit = false;
        }
      }
      
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
