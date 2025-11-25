import { supabase } from '../utils/api';

/**
 * Student Service - Handles all Supabase operations for student data
 */

// ==================== STUDENT PROFILE ====================

/**
 * Get student profile by ID
 */
export const getStudentProfile = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return { data: null, error };
  }
};

/**
 * Update student profile
 */
export const updateStudentProfile = async (studentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating student profile:', error);
    return { data: null, error };
  }
};

/**
 * Create a new student profile
 */
export const createStudentProfile = async (studentData) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating student profile:', error);
    return { data: null, error };
  }
};

// ==================== EDUCATION ====================

/**
 * Get all education records for a student
 */
export const getEducation = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('education')
      .select('*')
      .eq('student_id', studentId)
      .order('year_of_passing', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching education:', error);
    return { data: null, error };
  }
};

/**
 * Add education record
 */
export const addEducation = async (educationData) => {
  try {
    const { data, error } = await supabase
      .from('education')
      .insert([educationData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding education:', error);
    return { data: null, error };
  }
};

/**
 * Update education record
 */
export const updateEducation = async (educationId, updates) => {
  try {
    const { data, error } = await supabase
      .from('education')
      .update(updates)
      .eq('id', educationId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating education:', error);
    return { data: null, error };
  }
};

/**
 * Delete education record
 */
export const deleteEducation = async (educationId) => {
  try {
    const { error } = await supabase
      .from('education')
      .delete()
      .eq('id', educationId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting education:', error);
    return { error };
  }
};

// ==================== TRAINING ====================

/**
 * Get all training records for a student
 */
export const getTraining = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('training')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching training:', error);
    return { data: null, error };
  }
};

/**
 * Add training record
 */
export const addTraining = async (trainingData) => {
  try {
    const { data, error } = await supabase
      .from('training')
      .insert([trainingData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding training:', error);
    return { data: null, error };
  }
};

/**
 * Update training record
 */
export const updateTraining = async (trainingId, updates) => {
  try {
    const { data, error } = await supabase
      .from('training')
      .update(updates)
      .eq('id', trainingId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating training:', error);
    return { data: null, error };
  }
};

/**
 * Delete training record
 */
export const deleteTraining = async (trainingId) => {
  try {
    const { error } = await supabase
      .from('training')
      .delete()
      .eq('id', trainingId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting training:', error);
    return { error };
  }
};

// ==================== EXPERIENCE ====================

/**
 * Get all experience records for a student
 */
export const getExperience = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('experience')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching experience:', error);
    return { data: null, error };
  }
};

/**
 * Add experience record
 */
export const addExperience = async (experienceData) => {
  try {
    const { data, error } = await supabase
      .from('experience')
      .insert([experienceData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding experience:', error);
    return { data: null, error };
  }
};

/**
 * Update experience record
 */
export const updateExperience = async (experienceId, updates) => {
  try {
    const { data, error } = await supabase
      .from('experience')
      .update(updates)
      .eq('id', experienceId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating experience:', error);
    return { data: null, error };
  }
};

/**
 * Delete experience record
 */
export const deleteExperience = async (experienceId) => {
  try {
    const { error } = await supabase
      .from('experience')
      .delete()
      .eq('id', experienceId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting experience:', error);
    return { error };
  }
};

// ==================== TECHNICAL SKILLS ====================

/**
 * Get all technical skills for a student
 */
export const getTechnicalSkills = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('technical_skills')
      .select('*')
      .eq('student_id', studentId)
      .order('level', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching technical skills:', error);
    return { data: null, error };
  }
};

/**
 * Add technical skill
 */
export const addTechnicalSkill = async (skillData) => {
  try {
    const { data, error } = await supabase
      .from('technical_skills')
      .insert([skillData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding technical skill:', error);
    return { data: null, error };
  }
};

/**
 * Update technical skill
 */
export const updateTechnicalSkill = async (skillId, updates) => {
  try {
    const { data, error } = await supabase
      .from('technical_skills')
      .update(updates)
      .eq('id', skillId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating technical skill:', error);
    return { data: null, error };
  }
};

/**
 * Delete technical skill
 */
export const deleteTechnicalSkill = async (skillId) => {
  try {
    const { error } = await supabase
      .from('technical_skills')
      .delete()
      .eq('id', skillId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting technical skill:', error);
    return { error };
  }
};

// ==================== SOFT SKILLS ====================

/**
 * Get all soft skills for a student
 */
export const getSoftSkills = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('soft_skills')
      .select('*')
      .eq('student_id', studentId)
      .order('level', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching soft skills:', error);
    return { data: null, error };
  }
};

/**
 * Add soft skill
 */
export const addSoftSkill = async (skillData) => {
  try {
    const { data, error } = await supabase
      .from('soft_skills')
      .insert([skillData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding soft skill:', error);
    return { data: null, error };
  }
};

/**
 * Update soft skill
 */
export const updateSoftSkill = async (skillId, updates) => {
  try {
    const { data, error } = await supabase
      .from('soft_skills')
      .update(updates)
      .eq('id', skillId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating soft skill:', error);
    return { data: null, error };
  }
};

/**
 * Delete soft skill
 */
export const deleteSoftSkill = async (skillId) => {
  try {
    const { error } = await supabase
      .from('soft_skills')
      .delete()
      .eq('id', skillId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting soft skill:', error);
    return { error };
  }
};

// ==================== OPPORTUNITIES ====================

/**
 * Get all opportunities
 */
export const getOpportunities = async (filters = {}) => {
  try {
    let query = supabase
      .from('opportunities')
      .select('*')
      .order('deadline', { ascending: true });

    // Apply filters if provided
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return { data: null, error };
  }
};

// ==================== RECENT UPDATES ====================

/**
 * Get recent updates for a student
 */
export const getRecentUpdates = async (studentId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('recent_updates')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching recent updates:', error);
    return { data: null, error };
  }
};

/**
 * Add a recent update
 */
export const addRecentUpdate = async (updateData) => {
  try {
    const { data, error } = await supabase
      .from('recent_updates')
      .insert([updateData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding recent update:', error);
    return { data: null, error };
  }
};

// ==================== SUGGESTIONS ====================

/**
 * Get suggestions for a student
 */
export const getSuggestions = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return { data: null, error };
  }
};

// ==================== EDUCATOR STUDENT MANAGEMENT ====================

/**
 * Update student information (for educators)
 */
export const updateStudent = async (studentId, updates) => {
  try {
    const { error } = await supabase
      .from('students')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating student:', error);
    return {
      success: false,
      error: error?.message || 'Failed to update student'
    };
  }
};

/**
 * Soft delete a student (marks as deleted without removing from database)
 */
export const softDeleteStudent = async (studentId, deletedBy) => {
  try {
    const { error } = await supabase
      .from('students')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return {
      success: false,
      error: error?.message || 'Failed to delete student'
    };
  }
};

/**
 * Restore a soft-deleted student
 */
export const restoreStudent = async (studentId) => {
  try {
    const { error } = await supabase
      .from('students')
      .update({
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error restoring student:', error);
    return {
      success: false,
      error: error?.message || 'Failed to restore student'
    };
  }
};

/**
 * Get a single student by ID
 */
export const getStudentById = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) throw error;

    return { data };
  } catch (error) {
    console.error('Error fetching student:', error);
    return {
      data: null,
      error: error?.message || 'Failed to fetch student'
    };
  }
};

// ==================== COMPLETE STUDENT DATA ====================

/**
 * Get complete student data (profile + all related data)
 */
export const getCompleteStudentData = async (studentId) => {
  try {
    const [
      profileResult,
      educationResult,
      trainingResult,
      experienceResult,
      technicalSkillsResult,
      softSkillsResult,
      opportunitiesResult,
      recentUpdatesResult,
      suggestionsResult
    ] = await Promise.all([
      getStudentProfile(studentId),
      getEducation(studentId),
      getTraining(studentId),
      getExperience(studentId),
      getTechnicalSkills(studentId),
      getSoftSkills(studentId),
      getOpportunities(),
      getRecentUpdates(studentId),
      getSuggestions(studentId)
    ]);

    // Check for any errors
    const errors = [
      profileResult.error,
      educationResult.error,
      trainingResult.error,
      experienceResult.error,
      technicalSkillsResult.error,
      softSkillsResult.error,
      opportunitiesResult.error,
      recentUpdatesResult.error,
      suggestionsResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error('Errors fetching complete student data:', errors);
    }

    return {
      profile: profileResult.data,
      education: educationResult.data || [],
      training: trainingResult.data || [],
      experience: experienceResult.data || [],
      technicalSkills: technicalSkillsResult.data || [],
      softSkills: softSkillsResult.data || [],
      opportunities: opportunitiesResult.data || [],
      recentUpdates: recentUpdatesResult.data || [],
      suggestions: suggestionsResult.data || [],
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('Error fetching complete student data:', error);
    throw error;
  }
};
