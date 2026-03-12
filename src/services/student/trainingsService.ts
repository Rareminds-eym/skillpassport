/**
 * Trainings Service - CRUD for student training records
 */

import { supabase } from '../../lib/supabaseClient';
import { getLogger } from '../../config/logging';
import type { Training, ServiceResponse, CreateTrainingInput } from './types';

const logger = getLogger('trainings-service');

export async function getTrainingsByStudentId(studentId: string): Promise<ServiceResponse<Training[]>> {
  try {
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('student_id', studentId)
      .order('start_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch trainings', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    // Fetch related skills for each training
    if (data && Array.isArray(data)) {
      const trainingsWithSkills = await Promise.all(
        data.map(async (training) => {
          const { data: skills } = await supabase
            .from('skills')
            .select('*')
            .eq('training_id', training.id);
          
          return {
            ...training,
            skills: skills || []
          };
        })
      );
      
      return { success: true, data: trainingsWithSkills, error: null };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in getTrainingsByStudentId', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

export async function createTraining(input: CreateTrainingInput & { skills?: any[] }): Promise<ServiceResponse<Training>> {
  try {
    // Extract skills separately
    const skills = input.skills || [];
    const { skills: _, ...trainingInput } = input as any;

    const { data, error } = await supabase
      .from('trainings')
      .insert([{
        ...trainingInput,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create training', error, { studentId: input.student_id });
      return { success: false, data: null, error: error.message };
    }

    // Handle skills if provided
    if (Array.isArray(skills) && skills.length > 0 && data) {
      const skillRecords = skills.map((skill: any) => ({
        student_id: data.student_id,
        training_id: data.id,
        name: skill.name || skill,
        type: skill.type || 'technical',
        level: skill.level || null,
        proficiency_level: skill.proficiency_level || null,
        description: skill.description || null,
        verified: false,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabase
        .from('skills')
        .insert(skillRecords);
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in createTraining', err, { studentId: input.student_id });
    return { success: false, data: null, error: err.message };
  }
}

export async function updateTraining(
  trainingId: string,
  updates: any
): Promise<ServiceResponse<Training>> {
  try {
    // First, get the current training to check if it's verified
    const { data: currentTraining, error: fetchError } = await supabase
      .from('trainings')
      .select('*')
      .eq('id', trainingId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch current training', fetchError, { trainingId });
      return { success: false, data: null, error: fetchError.message };
    }

    // Extract skills separately
    const skills = updates.skills || updates.skillsList || [];
    
    // Map camelCase UI fields to snake_case DB fields
    if (updates.completedModules !== undefined) updates.completed_modules = updates.completedModules;
    if (updates.totalModules !== undefined) updates.total_modules = updates.totalModules;
    if (updates.hoursSpent !== undefined) updates.hours_spent = updates.hoursSpent;
    if (updates.startDate !== undefined) updates.start_date = updates.startDate;
    if (updates.endDate !== undefined) updates.end_date = updates.endDate;
    if (updates.courseId !== undefined) updates.course_id = updates.courseId;
    
    // Extract only valid Training fields
    const cleanUpdates: Partial<CreateTrainingInput> = {};
    
    const validFields: (keyof CreateTrainingInput)[] = [
      'student_id', 'title', 'organization', 'start_date', 'end_date', 'duration',
      'description', 'status', 'completed_modules', 'total_modules', 'hours_spent',
      'course_id', 'source', 'approval_status', 'approval_authority', 'approved_by',
      'approved_at', 'rejected_by', 'rejected_at', 'approval_notes', 'enabled',
      'has_pending_edit', 'pending_edit_data', 'verified_data'
    ];
    
    validFields.forEach(field => {
      if (updates[field] !== undefined) {
        (cleanUpdates as any)[field] = updates[field];
      }
    });

    // Check if training is verified/approved
    const isVerified = currentTraining.approval_status === 'verified' || currentTraining.approval_status === 'approved';

    let updateData: any = {
      ...cleanUpdates,
      updated_at: new Date().toISOString(),
    };

    if (isVerified) {
      // If verified, store changes as pending edit
      updateData = {
        has_pending_edit: true,
        pending_edit_data: cleanUpdates,
        updated_at: new Date().toISOString(),
      };
      
      // Store current verified data if not already stored
      if (!currentTraining.verified_data) {
        updateData.verified_data = {
          title: currentTraining.title,
          organization: currentTraining.organization,
          start_date: currentTraining.start_date,
          end_date: currentTraining.end_date,
          duration: currentTraining.duration,
          description: currentTraining.description,
          status: currentTraining.status,
          completed_modules: currentTraining.completed_modules,
          total_modules: currentTraining.total_modules,
          hours_spent: currentTraining.hours_spent,
        };
      }
    }

    const { data, error } = await supabase
      .from('trainings')
      .update(updateData)
      .eq('id', trainingId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update training', error, { trainingId });
      return { success: false, data: null, error: error.message };
    }

    // Handle skills synchronization if skills array is provided
    if (Array.isArray(skills) && data) {
      // Get existing skills for this training
      const { data: existingSkills } = await supabase
        .from('skills')
        .select('*')
        .eq('training_id', trainingId);

      const existingSkillsMap = new Map(
        (existingSkills || []).map((s: any) => [s.name.toLowerCase(), s])
      );

      const newSkillNames = new Set(
        skills.map((skill: any) => (skill.name || skill).toLowerCase())
      );

      // Delete skills that are no longer in the list
      const skillsToDelete = (existingSkills || []).filter(
        (s: any) => !newSkillNames.has(s.name.toLowerCase())
      );

      if (skillsToDelete.length > 0) {
        const idsToDelete = skillsToDelete.map((s: any) => s.id);
        await supabase
          .from('skills')
          .delete()
          .in('id', idsToDelete);
      }

      // Add new skills that don't exist yet
      const newSkills = skills.filter((skill: any) => {
        const skillName = (skill.name || skill).toLowerCase();
        return !existingSkillsMap.has(skillName);
      });

      if (newSkills.length > 0) {
        const skillRecords = newSkills.map((skill: any) => ({
          student_id: data.student_id,
          training_id: trainingId,
          name: skill.name || skill,
          type: skill.type || 'technical',
          level: skill.level || null,
          proficiency_level: skill.proficiency_level || null,
          description: skill.description || null,
          verified: false,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        await supabase
          .from('skills')
          .insert(skillRecords);
      }
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in updateTraining', err, { trainingId });
    return { success: false, data: null, error: err.message };
  }
}

export async function deleteTraining(trainingId: string): Promise<ServiceResponse<void>> {
  try {
    // Delete associated skills first
    await supabase
      .from('skills')
      .delete()
      .eq('training_id', trainingId);

    // Delete the training
    const { error } = await supabase
      .from('trainings')
      .delete()
      .eq('id', trainingId);

    if (error) {
      logger.error('Failed to delete training', error, { trainingId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: null, error: null };
  } catch (err: any) {
    logger.error('Exception in deleteTraining', err, { trainingId });
    return { success: false, data: null, error: err.message };
  }
}

export async function bulkUpsertTrainings(
  studentId: string,
  trainingRecords: any[]
): Promise<ServiceResponse<Training[]>> {
  try {
    const validFields = [
      'id', 'student_id', 'title', 'organization', 'start_date', 'end_date',
      'duration', 'description', 'status', 'completed_modules', 'total_modules',
      'hours_spent', 'course_id', 'source', 'approval_status', 'approval_authority',
      'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'approval_notes',
      'enabled', 'has_pending_edit', 'pending_edit_data', 'verified_data',
      'created_at', 'updated_at'
    ];
    
    // Store skills separately before cleaning records
    const skillsByTrainingId: { [key: string]: any[] } = {};
    
    // Get existing training records to check verification status
    const existingIds = trainingRecords.filter(r => r.id).map(r => r.id);
    let existingTrainings: any[] = [];
    
    if (existingIds.length > 0) {
      const { data } = await supabase
        .from('trainings')
        .select('*')
        .in('id', existingIds);
      existingTrainings = data || [];
    }
    
    const records = trainingRecords.map(record => {
      // Extract skills separately
      const skills = record.skills || record.skillsList || [];
      
      const cleanRecord: any = {
        student_id: studentId,
        updated_at: new Date().toISOString(),
      };
      
      // Helper to convert empty strings to null for date fields
      const cleanDateField = (value: any) => {
        if (value === '' || value === null || value === undefined) return null;
        return value;
      };
      
      // Map common field name variations to DB columns
      if (record.course) cleanRecord.title = record.course;
      if (record.courseName) cleanRecord.title = record.courseName;
      if (record.training_name) cleanRecord.title = record.training_name;
      if (record.provider) cleanRecord.organization = record.provider;
      if (record.completedModules !== undefined) cleanRecord.completed_modules = record.completedModules;
      if (record.totalModules !== undefined) cleanRecord.total_modules = record.totalModules;
      if (record.hoursSpent !== undefined) cleanRecord.hours_spent = record.hoursSpent;
      if (record.startDate) cleanRecord.start_date = cleanDateField(record.startDate);
      if (record.endDate) cleanRecord.end_date = cleanDateField(record.endDate);
      if (record.courseId) cleanRecord.course_id = record.courseId;
      
      // Also clean direct date fields
      if (record.start_date !== undefined) cleanRecord.start_date = cleanDateField(record.start_date);
      if (record.end_date !== undefined) cleanRecord.end_date = cleanDateField(record.end_date);
      
      // Find existing training if updating
      const existingTraining = existingTrainings.find(t => t.id === record.id);
      const isVerified = existingTraining && (existingTraining.approval_status === 'verified' || existingTraining.approval_status === 'approved');
      
      if (isVerified) {
        // For verified trainings, store changes as pending edit
        // CRITICAL: Keep all existing fields to avoid NOT NULL violations
        cleanRecord.id = record.id;
        
        // Copy all existing fields from the database
        Object.keys(existingTraining).forEach(key => {
          if (key !== 'updated_at' && existingTraining[key] !== undefined) {
            cleanRecord[key] = existingTraining[key];
          }
        });
        
        // Now set the versioning metadata
        cleanRecord.has_pending_edit = true;
        cleanRecord.pending_edit_data = {};
        
        // Store current verified data if not already stored
        if (!existingTraining.verified_data) {
          cleanRecord.verified_data = {
            title: existingTraining.title,
            organization: existingTraining.organization,
            start_date: existingTraining.start_date,
            end_date: existingTraining.end_date,
            duration: existingTraining.duration,
            description: existingTraining.description,
            status: existingTraining.status,
            completed_modules: existingTraining.completed_modules,
            total_modules: existingTraining.total_modules,
            hours_spent: existingTraining.hours_spent,
          };
        } else {
          cleanRecord.verified_data = existingTraining.verified_data;
        }
        
        // Build pending_edit_data with the changes
        validFields.forEach(field => {
          if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at' && field !== 'id' && 
              field !== 'has_pending_edit' && field !== 'pending_edit_data' && field !== 'verified_data') {
            const value = record[field];
            // Clean empty strings for date fields
            if ((field === 'start_date' || field === 'end_date') && value === '') {
              cleanRecord.pending_edit_data[field] = null;
            } else {
              cleanRecord.pending_edit_data[field] = value;
            }
          }
        });
        
        // Also handle mapped fields
        if (record.course) cleanRecord.pending_edit_data.title = record.course;
        if (record.courseName) cleanRecord.pending_edit_data.title = record.courseName;
        if (record.training_name) cleanRecord.pending_edit_data.title = record.training_name;
        if (record.provider) cleanRecord.pending_edit_data.organization = record.provider;
        if (record.completedModules !== undefined) cleanRecord.pending_edit_data.completed_modules = record.completedModules;
        if (record.totalModules !== undefined) cleanRecord.pending_edit_data.total_modules = record.totalModules;
        if (record.hoursSpent !== undefined) cleanRecord.pending_edit_data.hours_spent = record.hoursSpent;
        if (record.startDate) cleanRecord.pending_edit_data.start_date = cleanDateField(record.startDate);
        if (record.endDate) cleanRecord.pending_edit_data.end_date = cleanDateField(record.endDate);
        if (record.courseId) cleanRecord.pending_edit_data.course_id = record.courseId;
      } else {
        // For new or unverified trainings, update normally
        validFields.forEach(field => {
          if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
            cleanRecord[field] = record[field];
          }
        });
        
        // Set has_pending_edit to false for new/unverified trainings
        if (cleanRecord.has_pending_edit === undefined) {
          cleanRecord.has_pending_edit = false;
        }
      }
      
      // Store skills for later processing (don't include in upsert)
      if (cleanRecord.id) {
        skillsByTrainingId[cleanRecord.id] = skills;
      }
      
      return cleanRecord;
    });

    const { data, error } = await supabase
      .from('trainings')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) {
      logger.error('Failed to bulk upsert trainings', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    // Handle skills synchronization for each training record
    if (data && Array.isArray(data)) {
      for (const training of data) {
        const skills = skillsByTrainingId[training.id] || [];

        if (Array.isArray(skills) && skills.length > 0) {
          // Get existing skills for this training
          const { data: existingSkills } = await supabase
            .from('skills')
            .select('*')
            .eq('training_id', training.id);

          const existingSkillsMap = new Map(
            (existingSkills || []).map((s: any) => [s.name.toLowerCase(), s])
          );

          const newSkillNames = new Set(
            skills.map((skill: any) => (skill.name || skill).toLowerCase())
          );

          // Delete skills that are no longer in the list
          const skillsToDelete = (existingSkills || []).filter(
            (s: any) => !newSkillNames.has(s.name.toLowerCase())
          );

          if (skillsToDelete.length > 0) {
            const idsToDelete = skillsToDelete.map((s: any) => s.id);
            await supabase
              .from('skills')
              .delete()
              .in('id', idsToDelete);
          }

          // Add new skills that don't exist yet
          const newSkills = skills.filter((skill: any) => {
            const skillName = (skill.name || skill).toLowerCase();
            return !existingSkillsMap.has(skillName);
          });

          if (newSkills.length > 0) {
            const skillRecords = newSkills.map((skill: any) => ({
              student_id: training.student_id,
              training_id: training.id,
              name: skill.name || skill,
              type: skill.type || 'technical',
              level: skill.level || null,
              proficiency_level: skill.proficiency_level || null,
              description: skill.description || null,
              verified: false,
              enabled: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));

            await supabase
              .from('skills')
              .insert(skillRecords);
          }
        }
      }
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in bulkUpsertTrainings', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}
