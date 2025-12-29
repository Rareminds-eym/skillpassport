/**
 * Student Service
 * Handles student registration and profile management
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Create a user record in the users table
 * This is required before creating student record due to FK constraint
 * @param {string} userId - Auth user ID
 * @param {Object} userData - User data
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createUserRecord = async (userId, userData) => {
  try {
    const { email, firstName, lastName, user_role, role } = userData;

    const userRecord = {
      id: userId,
      email: email,
      firstName: firstName || null,
      lastName: lastName || null,
      role: role || user_role || 'school_student',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([userRecord])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user record:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    console.log('✅ User record created successfully:', data.id);
    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error creating user record:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Create a student record in the students table
 * @param {Object} studentData - Student data
 * @param {string} userId - Auth user ID
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createStudent = async (studentData, userId) => {
  try {
    const {
      name,
      email,
      phone,
      studentType, // 'school', 'college', or 'university'
      schoolId,
      collegeId,
      country,
      state,
      city,
      preferredLanguage,
      referralCode
    } = studentData;

    // Normalize studentType - handle both simple types and hyphenated types
    // e.g., 'college', 'college-student' -> 'college'
    const normalizedStudentType = studentType?.toLowerCase().replace('-student', '').replace('-educator', '') || 'school';
    
    // Prepare student record
    // IMPORTANT: id must match userId due to FK constraint students_id_fkey -> users.id
    // Note: first_name and last_name are stored in public.users table only
    const student = {
      id: userId, // Required: students.id must reference users.id
      user_id: userId,
      name: name,
      email: email,
      contact_number: phone || null, // Use contact_number instead of phone
      student_type: normalizedStudentType,
      school_id: schoolId || null,
      college_id: collegeId || null,
      country: country || null,
      state: state || null,
      city: city || null,
      preferred_language: preferredLanguage || 'en',
      referral_code: referralCode || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('students')
      .insert([student])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating student record:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    console.log('✅ Student record created successfully:', data.id);
    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error creating student:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Complete student registration (creates both user and student records)
 * @param {string} userId - Auth user ID
 * @param {Object} registrationData - Complete registration data
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const completeStudentRegistration = async (userId, registrationData) => {
  try {
    const {
      fullName,
      firstName,
      lastName,
      email,
      phone,
      studentType,
      schoolId,
      collegeId,
      country,
      state,
      city,
      preferredLanguage,
      referralCode
    } = registrationData;

    // Use provided firstName/lastName or split from fullName as fallback, and capitalize
    const finalFirstName = capitalizeFirstLetter(firstName || (fullName ? fullName.trim().split(' ')[0] : ''));
    const finalLastName = capitalizeFirstLetter(lastName || (fullName ? fullName.trim().split(' ').slice(1).join(' ') : ''));
    const finalFullName = fullName || `${finalFirstName} ${finalLastName}`.trim();

    // Step 1: Create user record
    // Map studentType to user_role - handle both simple types and hyphenated types
    // e.g., 'college', 'college-student', 'school', 'school-student', 'university', 'university-student'
    const normalizedType = studentType?.toLowerCase().replace('-student', '').replace('-educator', '') || 'school';
    const userRoleMap = {
      'school': 'school_student',
      'college': 'college_student',
      'university': 'college_student' // University students use college_student role
    };
    const userResult = await createUserRecord(userId, {
      email: email,
      firstName: finalFirstName,
      lastName: finalLastName,
      user_role: userRoleMap[normalizedType] || 'school_student'  // user_role is passed to createUserRecord which maps to 'role' column
    });

    if (!userResult.success) {
      throw new Error(userResult.error || 'Failed to create user record');
    }

    // Step 2: Create student record (first_name/last_name stored in users table only)
    const studentResult = await createStudent({
      name: finalFullName,
      email: email,
      phone: phone,
      studentType: studentType,
      schoolId: schoolId,
      collegeId: collegeId,
      country: country,
      state: state,
      city: city,
      preferredLanguage: preferredLanguage,
      referralCode: referralCode
    }, userId);

    if (!studentResult.success) {
      // Try to rollback user record if student creation fails
      await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      throw new Error(studentResult.error || 'Failed to create student record');
    }

    return {
      success: true,
      data: {
        user: userResult.data,
        student: studentResult.data
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error completing student registration:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get student by user ID
 * @param {string} userId - Auth user ID
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getStudentByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching student:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching student:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Update student profile
 * @param {string} userId - Auth user ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const updateStudentProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating student profile:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error updating student profile:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all colleges for selection dropdown
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getAllColleges = async () => {
  try {
    const { data, error } = await supabase
      .from('colleges')
      .select('id, name, city, state')
      .order('name');

    if (error) {
      console.error('❌ Error fetching colleges:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching colleges:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all schools for selection dropdown
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getAllSchools = async () => {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, city, state')
      .order('name');

    if (error) {
      console.error('❌ Error fetching schools:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching schools:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Update student by student ID
 * @param {string} studentId - Student ID
 * @param {Object} updates - Student data updates
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const updateStudent = async (studentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating student:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error updating student:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Soft delete a student by student ID
 * @param {string} studentId - Student ID
 * @param {string} educatorId - Educator ID performing the deletion
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const softDeleteStudent = async (studentId, educatorId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: educatorId,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error soft deleting student:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    console.log('✅ Student soft deleted successfully:', data.id);
    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error soft deleting student:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};
