/**
 * Course Repository
 * Handles all database operations for fetching courses.
 */

import { apiGet } from '@/shared/api/apiClient';

/**
 * Fetch all active courses with embeddings from the database.
 * Only returns courses that have embeddings and are active.
 *
 * @returns {Promise<Array>} - Array of courses with embeddings
 *
 * Requirements: 3.3
 */
export const fetchCoursesWithEmbeddings = async () => {
  try {
    const response = await apiGet('/courses/embeddings');
    return response?.data ?? [];
  } catch (error) {
    console.error('Error fetching courses with embeddings:', error);
    throw error;
  }
};

/**
 * Fetch courses by skill type (technical or soft) with embeddings.
 *
 * @param {string} skillType - 'technical' or 'soft'
 * @returns {Promise<Array>} - Array of courses with embeddings
 */
export const fetchCoursesBySkillType = async (skillType) => {
  try {
    const response = await apiGet(`/courses/by-skill-type?skillType=${encodeURIComponent(skillType)}`);
    return response?.data ?? [];
  } catch (error) {
    console.error(`Error fetching ${skillType} courses:`, error);
    return [];
  }
};

/**
 * Fetch basic course info without embeddings (for fallback).
 *
 * @param {number} limit - Maximum courses to return
 * @returns {Promise<Array>} - Array of courses
 */
export const fetchBasicCourses = async (limit = 10) => {
  try {
    const response = await apiGet(`/courses/basic?limit=${limit}`);
    return response?.data ?? [];
  } catch (error) {
    console.error('Error fetching basic courses:', error);
    return [];
  }
};

/**
 * Fetch courses that match a skill name via course_skills table.
 *
 * @param {string} skillName - The skill name to search for
 * @returns {Promise<Array>} - Array of matching courses with details
 */
export const fetchCoursesBySkillName = async (skillName) => {
  try {
    const response = await apiGet(`/courses/by-skill-name?skillName=${encodeURIComponent(skillName)}`);
    return response?.data ?? [];
  } catch (error) {
    console.error('Error in fetchCoursesBySkillName:', error);
    return [];
  }
};
