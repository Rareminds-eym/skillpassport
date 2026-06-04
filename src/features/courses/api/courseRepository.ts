import { apiGet } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('course-repository');

export const fetchCoursesWithEmbeddings = async () => {
  try {
    return await apiGet<any[]>('/courses/embeddings');
  } catch (error) {
    logger.error('Error fetching courses with embeddings', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const fetchCoursesBySkillType = async (skillType) => {
  try {
    return await apiGet<any[]>(`/courses/by-skill-type?skillType=${encodeURIComponent(skillType)}`);
  } catch (error) {
    logger.error(`Error fetching ${skillType} courses`, error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const fetchBasicCourses = async (limit = 10) => {
  try {
    return await apiGet<any[]>(`/courses/basic?limit=${limit}`);
  } catch (error) {
    logger.error('Error fetching basic courses', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const fetchCoursesBySkillName = async (skillName) => {
  try {
    return await apiGet<any[]>(`/courses/by-skill-name?skillName=${encodeURIComponent(skillName)}`);
  } catch (error) {
    logger.error('Error in fetchCoursesBySkillName', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};
