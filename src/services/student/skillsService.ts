/**
 * Skills Service - CRUD for student skills
 */

import { supabase } from '../../lib/supabaseClient';
import { getLogger } from '../../config/logging';
import type { Skill, ServiceResponse, CreateSkillInput } from './types';

const logger = getLogger('skills-service');

export async function getSkillsByStudentId(studentId: string): Promise<ServiceResponse<Skill[]>> {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch skills', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in getSkillsByStudentId', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

export async function createSkill(input: CreateSkillInput): Promise<ServiceResponse<Skill>> {
  try {
    const { data, error } = await supabase
      .from('skills')
      .insert([{
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create skill', error, { studentId: input.student_id });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in createSkill', err, { studentId: input.student_id });
    return { success: false, data: null, error: err.message };
  }
}

export async function updateSkill(
  skillId: string,
  updates: Partial<CreateSkillInput>
): Promise<ServiceResponse<Skill>> {
  try {
    const { data, error } = await supabase
      .from('skills')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', skillId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update skill', error, { skillId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in updateSkill', err, { skillId });
    return { success: false, data: null, error: err.message };
  }
}

export async function deleteSkill(skillId: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      logger.error('Failed to delete skill', error, { skillId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: null, error: null };
  } catch (err: any) {
    logger.error('Exception in deleteSkill', err, { skillId });
    return { success: false, data: null, error: err.message };
  }
}

export async function bulkUpsertSkills(
  studentId: string,
  skillRecords: any[]
): Promise<ServiceResponse<Skill[]>> {
  try {
    const validFields = [
      'id', 'student_id', 'name', 'level', 'category', 'years_of_experience',
      'verified', 'enabled', 'created_at', 'updated_at'
    ];
    
    const records = skillRecords.map(record => {
      const cleanRecord: any = {
        student_id: studentId,
        updated_at: new Date().toISOString(),
      };
      
      // Map common UI field names
      if (record.yearsOfExperience) cleanRecord.years_of_experience = record.yearsOfExperience;
      
      // Copy valid fields only
      validFields.forEach(field => {
        if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
          cleanRecord[field] = record[field];
        }
      });
      
      return cleanRecord;
    });

    const { data, error } = await supabase
      .from('skills')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) {
      logger.error('Failed to bulk upsert skills', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in bulkUpsertSkills', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}
