import { supabase } from '../utils/api';

/**
 * Student Service - ADAPTED for existing Supabase schema
 * Works with existing students table that uses JSONB profile column
 * 
 * Table structure:
 * - userId: UUID (FK to auth.users)
 * - universityId: TEXT
 * - profile: JSONB (contains all student data)
 * - id: UUID (PK)
 */

// ==================== STUDENT PROFILE ====================

/**
 * Get student profile by user ID
 */
export const getStudentProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error) throw error;
    
    // Return the profile JSONB with additional metadata
    return { 
      data: {
        ...data,
        profile: data.profile || {}
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return { data: null, error };
  }
};

/**
 * Update student profile
 */
export const updateStudentProfile = async (userId, updates) => {
  try {
    // Get current data
    const { data: current } = await getStudentProfile(userId);
    
    if (!current) {
      throw new Error('Student not found');
    }

    // Merge updates into profile
    const updatedProfile = {
      ...current.profile,
      ...updates
    };

    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('userId', userId)
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
export const createStudentProfile = async (userId, studentData) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([{
        userId: userId,
        universityId: studentData.universityId || null,
        profile: {
          name: studentData.name,
          email: studentData.email,
          department: studentData.department,
          photo: studentData.photo || null,
          verified: false,
          employabilityScore: 0,
          cgpa: studentData.cgpa || '',
          yearOfPassing: studentData.yearOfPassing || '',
          passportId: studentData.passportId || '',
          phone: studentData.phone || '',
          education: [],
          training: [],
          experience: [],
          technicalSkills: [],
          softSkills: [],
          opportunities: [],
          recentUpdates: [],
          suggestions: []
        }
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating student profile:', error);
    return { data: null, error };
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get array from profile
 */
const getProfileArray = (profile, arrayName) => {
  return profile?.[arrayName] || [];
};

/**
 * Generate next ID for array items
 */
const getNextId = (array) => {
  if (!array || array.length === 0) return 1;
  const maxId = Math.max(...array.map(item => item.id || 0));
  return maxId + 1;
};

/**
 * Update profile array
 */
const updateProfileArray = async (userId, arrayName, newArray) => {
  try {
    const { data: current } = await getStudentProfile(userId);
    if (!current) throw new Error('Student not found');

    const updatedProfile = {
      ...current.profile,
      [arrayName]: newArray
    };

    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('userId', userId)
      .select()
      .single();

    if (error) throw error;
    return { data: newArray, error: null };
  } catch (error) {
    console.error(`Error updating ${arrayName}:`, error);
    return { data: null, error };
  }
};

// ==================== EDUCATION ====================

export const getEducation = async (userId) => {
  try {
    const { data } = await getStudentProfile(userId);
    return { data: getProfileArray(data?.profile, 'education'), error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const addEducation = async (userId, educationData) => {
  try {
    const { data } = await getStudentProfile(userId);
    const education = getProfileArray(data?.profile, 'education');
    
    const newEducation = {
      id: getNextId(education),
      ...educationData,
      createdAt: new Date().toISOString()
    };

    const updatedArray = [...education, newEducation];
    await updateProfileArray(userId, 'education', updatedArray);
    
    return { data: newEducation, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateEducation = async (userId, educationId, updates) => {
  try {
    const { data } = await getStudentProfile(userId);
    const education = getProfileArray(data?.profile, 'education');
    
    const updatedArray = education.map(item =>
      item.id === educationId ? { ...item, ...updates } : item
    );

    await updateProfileArray(userId, 'education', updatedArray);
    const updated = updatedArray.find(item => item.id === educationId);
    
    return { data: updated, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteEducation = async (userId, educationId) => {
  try {
    const { data } = await getStudentProfile(userId);
    const education = getProfileArray(data?.profile, 'education');
    
    const updatedArray = education.filter(item => item.id !== educationId);
    await updateProfileArray(userId, 'education', updatedArray);
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ==================== TRAINING ====================

export const getTraining = async (userId) => {
  try {
    const { data } = await getStudentProfile(userId);
    return { data: getProfileArray(data?.profile, 'training'), error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const addTraining = async (userId, trainingData) => {
  try {
    const { data } = await getStudentProfile(userId);
    const training = getProfileArray(data?.profile, 'training');
    
    const newTraining = {
      id: getNextId(training),
      ...trainingData,
      createdAt: new Date().toISOString()
    };

    const updatedArray = [...training, newTraining];
    await updateProfileArray(userId, 'training', updatedArray);
    
    return { data: newTraining, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateTraining = async (userId, trainingId, updates) => {
  try {
    const { data } = await getStudentProfile(userId);
    const training = getProfileArray(data?.profile, 'training');
    
    const updatedArray = training.map(item =>
      item.id === trainingId ? { ...item, ...updates } : item
    );

    await updateProfileArray(userId, 'training', updatedArray);
    const updated = updatedArray.find(item => item.id === trainingId);
    
    return { data: updated, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteTraining = async (userId, trainingId) => {
  try {
    const { data } = await getStudentProfile(userId);
    const training = getProfileArray(data?.profile, 'training');
    
    const updatedArray = training.filter(item => item.id !== trainingId);
    await updateProfileArray(userId, 'training', updatedArray);
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ==================== EXPERIENCE ====================

export const getExperience = async (userId) => {
  try {
    const { data } = await getStudentProfile(userId);
    return { data: getProfileArray(data?.profile, 'experience'), error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const addExperience = async (userId, experienceData) => {
  try {
    const { data } = await getStudentProfile(userId);
    const experience = getProfileArray(data?.profile, 'experience');
    
    const newExperience = {
      id: getNextId(experience),
      ...experienceData,
      createdAt: new Date().toISOString()
    };

    const updatedArray = [...experience, newExperience];
    await updateProfileArray(userId, 'experience', updatedArray);
    
    return { data: newExperience, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateExperience = async (userId, experienceId, updates) => {
  try {
    const { data } = await getStudentProfile(userId);
    const experience = getProfileArray(data?.profile, 'experience');
    
    const updatedArray = experience.map(item =>
      item.id === experienceId ? { ...item, ...updates } : item
    );

    await updateProfileArray(userId, 'experience', updatedArray);
    const updated = updatedArray.find(item => item.id === experienceId);
    
    return { data: updated, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteExperience = async (userId, experienceId) => {
  try {
    const { data } = await getStudentProfile(userId);
    const experience = getProfileArray(data?.profile, 'experience');
    
    const updatedArray = experience.filter(item => item.id !== experienceId);
    await updateProfileArray(userId, 'experience', updatedArray);
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ==================== TECHNICAL SKILLS ====================

export const getTechnicalSkills = async (userId) => {
  try {
    const { data } = await getStudentProfile(userId);
    return { data: getProfileArray(data?.profile, 'technicalSkills'), error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const addTechnicalSkill = async (userId, skillData) => {
  try {
    const { data } = await getStudentProfile(userId);
    const skills = getProfileArray(data?.profile, 'technicalSkills');
    
    const newSkill = {
      id: getNextId(skills),
      ...skillData
    };

    const updatedArray = [...skills, newSkill];
    await updateProfileArray(userId, 'technicalSkills', updatedArray);
    
    return { data: newSkill, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateTechnicalSkill = async (userId, skillId, updates) => {
  try {
    const { data } = await getStudentProfile(userId);
    const skills = getProfileArray(data?.profile, 'technicalSkills');
    
    const updatedArray = skills.map(item =>
      item.id === skillId ? { ...item, ...updates } : item
    );

    await updateProfileArray(userId, 'technicalSkills', updatedArray);
    const updated = updatedArray.find(item => item.id === skillId);
    
    return { data: updated, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteTechnicalSkill = async (userId, skillId) => {
  try {
    const { data } = await getStudentProfile(userId);
    const skills = getProfileArray(data?.profile, 'technicalSkills');
    
    const updatedArray = skills.filter(item => item.id !== skillId);
    await updateProfileArray(userId, 'technicalSkills', updatedArray);
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ==================== SOFT SKILLS ====================

export const getSoftSkills = async (userId) => {
  try {
    const { data } = await getStudentProfile(userId);
    return { data: getProfileArray(data?.profile, 'softSkills'), error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const addSoftSkill = async (userId, skillData) => {
  try {
    const { data } = await getStudentProfile(userId);
    const skills = getProfileArray(data?.profile, 'softSkills');
    
    const newSkill = {
      id: getNextId(skills),
      ...skillData
    };

    const updatedArray = [...skills, newSkill];
    await updateProfileArray(userId, 'softSkills', updatedArray);
    
    return { data: newSkill, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateSoftSkill = async (userId, skillId, updates) => {
  try {
    const { data } = await getStudentProfile(userId);
    const skills = getProfileArray(data?.profile, 'softSkills');
    
    const updatedArray = skills.map(item =>
      item.id === skillId ? { ...item, ...updates } : item
    );

    await updateProfileArray(userId, 'softSkills', updatedArray);
    const updated = updatedArray.find(item => item.id === skillId);
    
    return { data: updated, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteSoftSkill = async (userId, skillId) => {
  try {
    const { data } = await getStudentProfile(userId);
    const skills = getProfileArray(data?.profile, 'softSkills');
    
    const updatedArray = skills.filter(item => item.id !== skillId);
    await updateProfileArray(userId, 'softSkills', updatedArray);
    
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ==================== COMPLETE STUDENT DATA ====================

/**
 * Get complete student data (all profile data at once)
 */
export const getCompleteStudentData = async (userId) => {
  try {
    const { data, error } = await getStudentProfile(userId);
    
    if (error) throw error;

    const profile = data?.profile || {};

    return {
      profile: {
        id: data?.id,
        userId: data?.userId,
        universityId: data?.universityId,
        ...profile,
        // Extract arrays from profile
        education: undefined,
        training: undefined,
        experience: undefined,
        technicalSkills: undefined,
        softSkills: undefined,
        opportunities: undefined,
        recentUpdates: undefined,
        suggestions: undefined
      },
      education: profile.education || [],
      training: profile.training || [],
      experience: profile.experience || [],
      technicalSkills: profile.technicalSkills || [],
      softSkills: profile.softSkills || [],
      opportunities: profile.opportunities || [],
      recentUpdates: profile.recentUpdates || [],
      suggestions: profile.suggestions || [],
      errors: null
    };
  } catch (error) {
    console.error('Error fetching complete student data:', error);
    return {
      profile: null,
      education: [],
      training: [],
      experience: [],
      technicalSkills: [],
      softSkills: [],
      opportunities: [],
      recentUpdates: [],
      suggestions: [],
      errors: [error]
    };
  }
};
