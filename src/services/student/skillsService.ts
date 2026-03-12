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
      .order('updated_at', { ascending: false });

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
    // First, get the current skill to check if it's verified
    const { data: currentSkill, error: fetchError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch current skill', fetchError, { skillId });
      return { success: false, data: null, error: fetchError.message };
    }

    // Check if skill is verified/approved
    const isVerified = currentSkill.approval_status === 'verified' || currentSkill.approval_status === 'approved';

    let updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isVerified) {
      // If verified, store changes as pending edit
      updateData.has_pending_edit = true;
      updateData.pending_edit_data = updates;
      
      // Store current verified data if not already stored
      if (!currentSkill.verified_data) {
        updateData.verified_data = {
          name: currentSkill.name,
          type: currentSkill.type,
          level: currentSkill.level,
          proficiency_level: currentSkill.proficiency_level,
          description: currentSkill.description,
        };
      }
      
      // Don't update the main fields, only the pending_edit_data
      updateData = {
        has_pending_edit: true,
        pending_edit_data: updates,
        verified_data: updateData.verified_data,
        updated_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('skills')
      .update(updateData)
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
  skillRecords: Partial<Skill>[]
): Promise<ServiceResponse<Skill[]>> {
  try {
    // Valid database columns for skills table (verified from schema)
    const validFields = [
      'id', 'student_id', 'name', 'type', 'level', 'description',
      'verified', 'enabled', 'approval_status', 'training_id',
      'proficiency_level', 'pending_edit_data', 'has_pending_edit',
      'verified_data', 'created_at', 'updated_at'
    ];

    // Get existing skills to check verification status
    const existingIds = skillRecords.filter(r => r.id).map(r => r.id);
    let existingSkills: any[] = [];
    
    if (existingIds.length > 0) {
      const { data } = await supabase
        .from('skills')
        .select('*')
        .in('id', existingIds);
      existingSkills = data || [];
    }

    const records = skillRecords.map(record => {
      const cleanRecord: any = {
        student_id: studentId,
        updated_at: new Date().toISOString(),
      };
      
      // Find existing skill if updating
      const existingSkill = existingSkills.find(s => s.id === record.id);
      const isVerified = existingSkill && (existingSkill.approval_status === 'verified' || existingSkill.approval_status === 'approved');
      
      if (isVerified) {
        // For verified skills, check if anything actually changed
        // CRITICAL: Keep all existing fields to avoid NOT NULL violations
        cleanRecord.id = record.id;
        
        // Copy all existing fields from the database
        Object.keys(existingSkill).forEach(key => {
          if (key !== 'updated_at' && existingSkill[key] !== undefined) {
            cleanRecord[key] = existingSkill[key];
          }
        });
        
        // Check if any field actually changed
        let hasChanges = false;
        const pendingChanges: any = {};
        
        const compareField = (fieldName: string, newValue: any) => {
          const oldValue = existingSkill[fieldName];
          const oldNorm = oldValue === null || oldValue === undefined ? '' : String(oldValue);
          const newNorm = newValue === null || newValue === undefined ? '' : String(newValue);
          
          if (oldNorm !== newNorm) {
            hasChanges = true;
            pendingChanges[fieldName] = newValue;
          }
        };
        
        // Check each field
        if (record.name !== undefined) compareField('name', record.name);
        if (record.type !== undefined) compareField('type', record.type);
        if (record.level !== undefined) compareField('level', record.level);
        if (record.proficiency_level !== undefined) compareField('proficiency_level', record.proficiency_level);
        if (record.description !== undefined) compareField('description', record.description);
        
        // Only set has_pending_edit if there are actual changes
        if (hasChanges) {
          cleanRecord.has_pending_edit = true;
          cleanRecord.pending_edit_data = pendingChanges;
          
          // Store current verified data if not already stored
          if (!existingSkill.verified_data) {
            cleanRecord.verified_data = {
              name: existingSkill.name,
              type: existingSkill.type,
              level: existingSkill.level,
              proficiency_level: existingSkill.proficiency_level,
              description: existingSkill.description,
            };
          } else {
            cleanRecord.verified_data = existingSkill.verified_data;
          }
        }
        // If no changes, keep existing has_pending_edit status
      } else {
        // For new or unverified skills, update normally
        validFields.forEach(field => {
          const value = record[field as keyof Skill];
          if (value !== undefined && field !== 'student_id' && field !== 'updated_at') {
            cleanRecord[field] = value;
          }
        });
        
        // Ensure type is set (technical or soft)
        if (!cleanRecord.type) {
          cleanRecord.type = 'technical';
        }
        
        // Set has_pending_edit to false for new/unverified skills
        if (cleanRecord.has_pending_edit === undefined) {
          cleanRecord.has_pending_edit = false;
        }
      }
      
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
