import { apiPost, apiGet } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('resume-data-service');

/**
 * Save parsed resume data to separate tables
 * @param {Object} parsedData - The parsed resume data
 * @param {string} learnerId - The learner's ID (from learners table)
 * @param {string} userEmail - The learner's email
 * @returns {Promise<Object>} Result with success status and details
 */
export const saveResumeToTables = async (parsedData, learnerId, userEmail) => {
  try {
    const body: any = { learnerId };

    if (parsedData.education) body.education = parsedData.education;
    if (parsedData.experience) body.experience = parsedData.experience;
    if (parsedData.technicalSkills) body.technicalSkills = parsedData.technicalSkills;
    if (parsedData.softSkills) body.softSkills = parsedData.softSkills;
    if (parsedData.certificates) body.certificates = parsedData.certificates;
    if (parsedData.projects) body.projects = parsedData.projects;
    if (parsedData.training) body.training = parsedData.training;
    if (parsedData.name) body.name = parsedData.name;
    if (parsedData.contact_number) body.contact_number = parsedData.contact_number;
    if (parsedData.alternate_number) body.alternate_number = parsedData.alternate_number;
    if (parsedData.age) body.age = parsedData.age;
    if (parsedData.date_of_birth) body.date_of_birth = parsedData.date_of_birth;
    if (parsedData.address) body.address = parsedData.address;
    if (parsedData.city) body.city = parsedData.city;
    if (parsedData.state) body.state = parsedData.state;
    if (parsedData.country) body.country = parsedData.country;
    if (parsedData.pincode) body.pincode = parsedData.pincode;
    if (parsedData.university) body.university = parsedData.university;
    if (parsedData.branch_field) body.branch_field = parsedData.branch_field;
    if (parsedData.college_school_name) body.college_school_name = parsedData.college_school_name;
    if (parsedData.registration_number) body.registration_number = parsedData.registration_number;
    if (parsedData.district_name) body.district_name = parsedData.district_name;
    if (parsedData.bio) body.bio = parsedData.bio;
    if (parsedData.linkedin_link) body.linkedin_link = parsedData.linkedin_link;
    if (parsedData.github_link) body.github_link = parsedData.github_link;
    if (parsedData.portfolio_link) body.portfolio_link = parsedData.portfolio_link;
    if (parsedData.twitter_link) body.twitter_link = parsedData.twitter_link;
    if (parsedData.facebook_link) body.facebook_link = parsedData.facebook_link;
    if (parsedData.instagram_link) body.instagram_link = parsedData.instagram_link;
    if (parsedData.interests) body.interests = parsedData.interests;
    if (parsedData.languages) body.languages = parsedData.languages;
    if (parsedData.hobbies) body.hobbies = parsedData.hobbies;

    const response: any = await apiPost('/resume/save', body);
    const result = response?.data ?? response;
    return result;
  } catch (error: any) {
    logger.error('saveResumeToTables failed', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      saved: {},
      errors: [{ general: error.message || 'Unknown error' }]
    };
  }
};

/**
 * Get summary of learner's resume data from all tables
 * @param {string} learnerId - The learner's ID
 * @returns {Promise<Object>} Summary of all resume data
 */
export const getResumeDataSummary = async (learnerId) => {
  try {
    const tables = ['education', 'experience', 'skills', 'certificates', 'projects', 'trainings'];
    const results = await Promise.all(
      tables.map(table => apiGet<any>(`/learners/data/${learnerId}/${table}`))
    );

    const summary: any = {};
    tables.forEach((table, i) => {
      const data = results[i];
      summary[table] = data?.data ?? data ?? [];
    });

    return summary;
  } catch (error) {
    return null;
  }
};
