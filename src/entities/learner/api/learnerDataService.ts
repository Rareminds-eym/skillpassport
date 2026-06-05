import { apiPost } from '@/shared/api/apiClient';

function postProfile(action: string, payload?: Record<string, unknown>) {
  return apiPost<any>('/learners/profile', { action, ...payload });
}

function extractAddArgs(first: any, second: any) {
  return typeof first === 'string' ? { item: second } : { item: first };
}

function extractUpdateArgs(first: any, second: any, third?: any) {
  return typeof first === 'string'
    ? { itemId: second, updates: third }
    : { itemId: first, updates: second };
}

function extractDeleteArgs(first: any, second?: any) {
  return typeof first === 'string'
    ? { itemId: second }
    : { itemId: first };
}

export const getCompleteLearnerData = async (userId: string) => {
  try {
    const response = await postProfile('get');
    return {
      profile: response.data.profile,
      education: response.data.education,
      training: response.data.training,
      experience: response.data.experience,
      technicalSkills: response.data.technicalSkills,
      softSkills: response.data.softSkills,
      opportunities: [],
      recentUpdates: [],
      suggestions: []
    };
  } catch (error: unknown) {
    return { errors: (error as Error).message };
  }
};

export const updateLearnerProfile = async (userId: string, updates: any) => {
  try {
    const response = await postProfile('update-profile', { updates });
    return { data: response.data.data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const addEducation = async (userIdOrData: any, educationData?: any) => {
  try {
    const response = await postProfile('add-education', extractAddArgs(userIdOrData, educationData));
    return { data: response.data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const updateEducation = async (first: any, second: any, third?: any) => {
  try {
    await postProfile('update-education', extractUpdateArgs(first, second, third));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const deleteEducation = async (first: any, second?: any) => {
  try {
    await postProfile('delete-education', extractDeleteArgs(first, second));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const addTraining = async (userIdOrData: any, trainingData?: any) => {
  try {
    const response = await postProfile('add-training', extractAddArgs(userIdOrData, trainingData));
    return { data: response.data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const updateTraining = async (first: any, second: any, third?: any) => {
  try {
    await postProfile('update-training', extractUpdateArgs(first, second, third));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const deleteTraining = async (first: any, second?: any) => {
  try {
    await postProfile('delete-training', extractDeleteArgs(first, second));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const addExperience = async (userIdOrData: any, experienceData?: any) => {
  try {
    const response = await postProfile('add-experience', extractAddArgs(userIdOrData, experienceData));
    return { data: response.data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const updateExperience = async (first: any, second: any, third?: any) => {
  try {
    await postProfile('update-experience', extractUpdateArgs(first, second, third));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const deleteExperience = async (first: any, second?: any) => {
  try {
    await postProfile('delete-experience', extractDeleteArgs(first, second));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const addTechnicalSkill = async (userIdOrData: any, skillData?: any) => {
  try {
    const response = await postProfile('add-technical-skills', extractAddArgs(userIdOrData, skillData));
    return { data: response.data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const updateTechnicalSkill = async (first: any, second: any, third?: any) => {
  try {
    await postProfile('update-technical-skills', extractUpdateArgs(first, second, third));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const deleteTechnicalSkill = async (first: any, second?: any) => {
  try {
    await postProfile('delete-technical-skills', extractDeleteArgs(first, second));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const addSoftSkill = async (userIdOrData: any, skillData?: any) => {
  try {
    const response = await postProfile('add-soft-skills', extractAddArgs(userIdOrData, skillData));
    return { data: response.data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const updateSoftSkill = async (first: any, second: any, third?: any) => {
  try {
    await postProfile('update-soft-skills', extractUpdateArgs(first, second, third));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

export const deleteSoftSkill = async (first: any, second?: any) => {
  try {
    await postProfile('delete-soft-skills', extractDeleteArgs(first, second));
    return { data: { error: null }, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};
