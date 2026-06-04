import { apiGet, apiPost, apiPut } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('course-enrollment-service');

export const courseEnrollmentService = {
  async enrollLearner(learnerEmail, courseId) {
    try {
      const res = await apiPost('/courses/enroll', { learnerEmail, courseId });
      const inner = res?.data ?? res;
      return { success: true, message: inner ? 'Enrolled successfully' : 'Already enrolled', data: inner };
    } catch (error) {
      logger.error('Error enrolling learner', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message || 'Failed to enroll learner' };
    }
  },

  async updateProgress(learnerEmail, courseId, completedLessons) {
    try {
      const res = await apiPut('/courses/enrollment/progress', { learnerEmail, courseId, completedLessons });
      return { success: true, data: res?.data ?? res };
    } catch (error) {
      logger.error('Error updating progress', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async getEnrollment(learnerEmail, courseId) {
    try {
      const res = await apiGet(`/courses/enrollment?learnerEmail=${encodeURIComponent(learnerEmail)}&courseId=${encodeURIComponent(courseId)}`);
      return { success: true, data: res?.data ?? res ?? null };
    } catch (error) {
      logger.error('Error getting enrollment', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async getlearnerEnrollments(learnerEmail) {
    try {
      const res = await apiGet(`/courses/enrollment/learner?learnerEmail=${encodeURIComponent(learnerEmail)}`);
      const items = res?.data ?? res ?? [];
      return { success: true, data: Array.isArray(items) ? items : [] };
    } catch (error) {
      logger.error('Error getting learner enrollments', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message, data: [] };
    }
  },

  async getCourseEnrollments(courseId) {
    try {
      const res = await apiGet(`/courses/enrollment/course?courseId=${encodeURIComponent(courseId)}`);
      const items = res?.data ?? res ?? [];
      return { success: true, data: Array.isArray(items) ? items : [] };
    } catch (error) {
      logger.error('Error getting course enrollments', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message, data: [] };
    }
  },

  async getEducatorEnrollmentStats(educatorId) {
    try {
      const res = await apiGet(`/courses/enrollment/educator-stats?educatorId=${encodeURIComponent(educatorId)}`);
      return { success: true, data: res?.data ?? res };
    } catch (error) {
      logger.error('Error getting educator stats', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  }
};

export default courseEnrollmentService;
