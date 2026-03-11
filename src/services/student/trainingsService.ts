/**
 * Trainings Service - CRUD for student training records
 */

import { supabase } from '../../lib/supabaseClient';
import { getLogger } from '../../config/logging';
import type { Training, ServiceResponse, CreateTrainingInput } from './types';

const logger = getLogger('trainings-service');

export async function getTrainingsByStudentId(studentId: string): Promise<ServiceResponse<Training[]>> {
  try {
    console.log('🔵 [trainingsService] getTrainingsByStudentId called', { studentId });
    
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('student_id', studentId)
      .order('start_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch trainings', error, { studentId });
      console.error('🔴 [trainingsService] Failed to fetch trainings from DB', error);
      return { success: false, data: null, error: error.message };
    }

    console.log('🔵 [trainingsService] Trainings fetched from DB', { count: data?.length, trainings: data });

    // Fetch related skills for each training
    if (data && Array.isArray(data)) {
      const trainingsWithSkills = await Promise.all(
        data.map(async (training) => {
          const { data: skills } = await supabase
            .from('skills')
            .select('*')
            .eq('training_id', training.id);
          
          console.log('🔵 [trainingsService] Skills fetched for training', { trainingId: training.id, skillsCount: skills?.length, skills });
          
          return {
            ...training,
            skills: skills || []
          };
        })
      );
      
      console.log('🔵 [trainingsService] All trainings with skills loaded', { count: trainingsWithSkills.length });
      return { success: true, data: trainingsWithSkills, error: null };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in getTrainingsByStudentId', err, { studentId });
    console.error('🔴 [trainingsService] Exception in getTrainingsByStudentId', err);
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

    const { data, error } = await supabase
      .from('trainings')
      .update({
        ...cleanUpdates,
        updated_at: new Date().toISOString(),
      })
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
    
    const records = trainingRecords.map(record => {
      // Extract skills separately
      const skills = record.skills || record.skillsList || [];
      
      const cleanRecord: any = {
        student_id: studentId,
        updated_at: new Date().toISOString(),
      };
      
      // Map common field name variations to DB columns
      if (record.course) cleanRecord.title = record.course;
      if (record.courseName) cleanRecord.title = record.courseName;
      if (record.training_name) cleanRecord.title = record.training_name;
      if (record.provider) cleanRecord.organization = record.provider;
      if (record.completedModules !== undefined) cleanRecord.completed_modules = record.completedModules;
      if (record.totalModules !== undefined) cleanRecord.total_modules = record.totalModules;
      if (record.hoursSpent !== undefined) cleanRecord.hours_spent = record.hoursSpent;
      if (record.startDate) cleanRecord.start_date = record.startDate;
      if (record.endDate) cleanRecord.end_date = record.endDate;
      if (record.courseId) cleanRecord.course_id = record.courseId;
      
      // Copy only valid fields (these will override the mappings above if present)
      validFields.forEach(field => {
        if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
          cleanRecord[field] = record[field];
        }
      });
      
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
