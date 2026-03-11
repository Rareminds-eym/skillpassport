/**
 * Student Service - Core CRUD Operations
 * Clean, ID-based backend communication layer
 * 
 * Responsibilities:
 * - Database operations only
 * - ID-based queries only
 * - Consistent error handling
 * - No state management
 * - No business logic
 */

import { supabase } from '../../lib/supabaseClient';
import { getLogger } from '../../config/logging';
import type {
  Student,
  StudentProfile,
  ServiceResponse,
  CreateStudentInput,
  UpdateStudentInput,
} from './types';

const logger = getLogger('student-service');

// ==================== STUDENT CRUD ====================

/**
 * Get student by ID
 */
export async function getStudentById(studentId: string): Promise<ServiceResponse<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      logger.error('Failed to fetch student', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in getStudentById', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Get student by user_id (auth.users FK)
 */
export async function getStudentByUserId(userId: string): Promise<ServiceResponse<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch student by user_id', error, { userId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in getStudentByUserId', err, { userId });
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Get full student profile with all related entities
 */
export async function getStudentProfile(studentId: string): Promise<ServiceResponse<StudentProfile>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        education (*),
        experience (*),
        skills (*),
        projects (*),
        trainings (*),
        certificates (*)
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      logger.error('Failed to fetch student profile', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in getStudentProfile', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Create student record
 */
export async function createStudent(input: CreateStudentInput): Promise<ServiceResponse<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([{
        user_id: input.user_id,
        email: input.email,
        name: input.name || null,
        student_type: input.student_type || 'direct',
        school_id: input.school_id || null,
        college_id: input.college_id || null,
        contact_number: input.contact_number || null,
        date_of_birth: input.date_of_birth || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create student', error, { userId: input.user_id });
      return { success: false, data: null, error: error.message };
    }

    logger.info('Student created successfully', { studentId: data.id });
    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in createStudent', err, { userId: input.user_id });
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Update student by ID
 */
export async function updateStudent(
  studentId: string,
  updates: UpdateStudentInput
): Promise<ServiceResponse<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update student', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    logger.info('Student updated successfully', { studentId });
    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in updateStudent', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Delete student by ID (soft delete)
 */
export async function deleteStudent(studentId: string, deletedBy: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('students')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
      })
      .eq('id', studentId);

    if (error) {
      logger.error('Failed to delete student', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    logger.info('Student deleted successfully', { studentId });
    return { success: true, data: null, error: null };
  } catch (err: any) {
    logger.error('Exception in deleteStudent', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Check if student exists by user_id
 */
export async function studentExistsByUserId(userId: string): Promise<ServiceResponse<boolean>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to check student existence', error, { userId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: !!data, error: null };
  } catch (err: any) {
    logger.error('Exception in studentExistsByUserId', err, { userId });
    return { success: false, data: null, error: err.message };
  }
}
