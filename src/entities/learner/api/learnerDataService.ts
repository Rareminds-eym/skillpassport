/**
 * Learner Data Service
 * Handles fetching and managing complete learner profile data
 */

import { supabase } from '@/shared/api/supabaseClient';

/**
 * Get complete learner data including profile, education, training, experience, and skills
 */
export const getCompleteLearnerData = async (userId: string) => {
  try {
    // Fetch learner profile
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (learnerError) {
      return { errors: learnerError.message };
    }

    if (!learner) {
      return { errors: 'Learner not found' };
    }

    // Return learner data with profile structure
    return {
      profile: learner,
      education: learner.profile?.education || [],
      training: learner.profile?.training || [],
      experience: learner.profile?.experience || [],
      technicalSkills: learner.profile?.technicalSkills || [],
      softSkills: learner.profile?.softSkills || [],
      opportunities: [],
      recentUpdates: [],
      suggestions: []
    };
  } catch (error: unknown) {
    return { errors: (error as Error).message };
  }
};

/**
 * Update learner profile
 */
export const updateLearnerProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('learners')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Add education record
 */
export const addEducation = async (userId: string, educationData: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const education = profile.education || [];
    
    const newEducation = {
      id: Date.now(),
      ...educationData,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          education: [...education, newEducation]
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data: newEducation, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Update education record
 */
export const updateEducation = async (userId: string, educationId: number, updates: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const education = profile.education || [];
    
    const updatedEducation = education.map((edu: any) =>
      edu.id === educationId ? { ...edu, ...updates } : edu
    );

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          education: updatedEducation
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Delete education record
 */
export const deleteEducation = async (userId: string, educationId: number) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const education = profile.education || [];
    
    const filteredEducation = education.filter((edu: any) => edu.id !== educationId);

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          education: filteredEducation
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Add training record
 */
export const addTraining = async (userId: string, trainingData: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const training = profile.training || [];
    
    const newTraining = {
      id: Date.now(),
      ...trainingData,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          training: [...training, newTraining]
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data: newTraining, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Update training record
 */
export const updateTraining = async (userId: string, trainingId: number, updates: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const training = profile.training || [];
    
    const updatedTraining = training.map((tr: any) =>
      tr.id === trainingId ? { ...tr, ...updates } : tr
    );

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          training: updatedTraining
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Delete training record
 */
export const deleteTraining = async (userId: string, trainingId: number) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const training = profile.training || [];
    
    const filteredTraining = training.filter((tr: any) => tr.id !== trainingId);

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          training: filteredTraining
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Add experience record
 */
export const addExperience = async (userId: string, experienceData: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const experience = profile.experience || [];
    
    const newExperience = {
      id: Date.now(),
      ...experienceData,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          experience: [...experience, newExperience]
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data: newExperience, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Update experience record
 */
export const updateExperience = async (userId: string, experienceId: number, updates: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const experience = profile.experience || [];
    
    const updatedExperience = experience.map((exp: any) =>
      exp.id === experienceId ? { ...exp, ...updates } : exp
    );

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          experience: updatedExperience
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Delete experience record
 */
export const deleteExperience = async (userId: string, experienceId: number) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const experience = profile.experience || [];
    
    const filteredExperience = experience.filter((exp: any) => exp.id !== experienceId);

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          experience: filteredExperience
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Add technical skill
 */
export const addTechnicalSkill = async (userId: string, skillData: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const technicalSkills = profile.technicalSkills || [];
    
    const newSkill = {
      id: Date.now(),
      ...skillData,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          technicalSkills: [...technicalSkills, newSkill]
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data: newSkill, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Update technical skill
 */
export const updateTechnicalSkill = async (userId: string, skillId: number, updates: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const technicalSkills = profile.technicalSkills || [];
    
    const updatedSkills = technicalSkills.map((skill: any) =>
      skill.id === skillId ? { ...skill, ...updates } : skill
    );

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          technicalSkills: updatedSkills
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Delete technical skill
 */
export const deleteTechnicalSkill = async (userId: string, skillId: number) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const technicalSkills = profile.technicalSkills || [];
    
    const filteredSkills = technicalSkills.filter((skill: any) => skill.id !== skillId);

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          technicalSkills: filteredSkills
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Add soft skill
 */
export const addSoftSkill = async (userId: string, skillData: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const softSkills = profile.softSkills || [];
    
    const newSkill = {
      id: Date.now(),
      ...skillData,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          softSkills: [...softSkills, newSkill]
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data: newSkill, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Update soft skill
 */
export const updateSoftSkill = async (userId: string, skillId: number, updates: any) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const softSkills = profile.softSkills || [];
    
    const updatedSkills = softSkills.map((skill: any) =>
      skill.id === skillId ? { ...skill, ...updates } : skill
    );

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          softSkills: updatedSkills
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};

/**
 * Delete soft skill
 */
export const deleteSoftSkill = async (userId: string, skillId: number) => {
  try {
    const { data: learner } = await supabase
      .from('learners')
      .select('profile')
      .eq('user_id', userId)
      .single();

    const profile = learner?.profile || {};
    const softSkills = profile.softSkills || [];
    
    const filteredSkills = softSkills.filter((skill: any) => skill.id !== skillId);

    const { data, error } = await supabase
      .from('learners')
      .update({
        profile: {
          ...profile,
          softSkills: filteredSkills
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    return { data, error: null };
  } catch (error) {
    return { error: error.message, data: null };
  }
};
