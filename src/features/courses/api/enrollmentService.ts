import { apiGet, apiPost, apiPut } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('enrollment-service');

export async function enrollLearner(learnerEmail: string, courseId: string) {
  try {
    const res = await apiPost<any>('/courses/enroll', { learnerEmail, courseId });
    const inner = res?.data ?? res;
    return {
      success: true,
      message: inner ? 'Enrolled successfully' : 'Already enrolled',
      data: inner
    };
  } catch (error: any) {
    logger.error('Error enrolling learner', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message || 'Failed to enroll learner'
    };
  }
}

export async function updateProgress(learnerEmail: string, courseId: string, completedLessons: string[]) {
  try {
    const res = await apiPut<any>('/courses/enrollment/progress', { learnerEmail, courseId, completedLessons });
    return {
      success: true,
      data: res?.data ?? res
    };
  } catch (error: any) {
    logger.error('Error updating progress', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getEnrollment(learnerEmail: string, courseId: string) {
  try {
    const res = await apiGet<any>(`/courses/enrollment?learnerEmail=${encodeURIComponent(learnerEmail)}&courseId=${encodeURIComponent(courseId)}`);
    return {
      success: true,
      data: res?.data ?? res ?? null
    };
  } catch (error: any) {
    logger.error('Error getting enrollment', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getlearnerEnrollments(learnerEmail: string) {
  try {
    const res = await apiGet<any>(`/courses/enrollment/learner?learnerEmail=${encodeURIComponent(learnerEmail)}`);
    const items = res?.data ?? res ?? [];
    return {
      success: true,
      data: Array.isArray(items) ? items : []
    };
  } catch (error: any) {
    logger.error('Error getting learner enrollments', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

export async function getCourseEnrollments(courseId: string) {
  try {
    const res = await apiGet<any>(`/courses/enrollment/course?courseId=${encodeURIComponent(courseId)}`);
    const items = res?.data ?? res ?? [];
    return {
      success: true,
      data: Array.isArray(items) ? items : []
    };
  } catch (error: any) {
    logger.error('Error getting course enrollments', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

export async function getEducatorEnrollmentStats(educatorId: string) {
  try {
    const res = await apiGet<any>(`/courses/enrollment/educator-stats?educatorId=${encodeURIComponent(educatorId)}`);
    return {
      success: true,
      data: res?.data ?? res
    };
  } catch (error: any) {
    logger.error('Error getting educator stats', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message
    };
  }
}

export const enrollmentService = {
  enrollLearner,
  updateProgress,
  getEnrollment,
  getlearnerEnrollments,
  getCourseEnrollments,
  getEducatorEnrollmentStats,
};

export default enrollmentService;
