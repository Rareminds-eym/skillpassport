import { apiGet, apiPost, apiDelete } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('course-progress-service');

export const courseProgressService = {
  async saveVideoPosition(learnerId, courseId, lessonId, positionSeconds, durationSeconds) {
    try {
      if (!learnerId || !courseId || !lessonId) return { success: false, error: 'Missing required parameters' };
      if (typeof positionSeconds !== 'number' || positionSeconds < 0) return { success: false, error: 'Invalid position value' };
      await apiPost('/courses/progress/video-position', { learnerId, courseId, lessonId, positionSeconds, durationSeconds });
      return { success: true };
    } catch (error) {
      logger.error('Error saving video position', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async getVideoPosition(learnerId, courseId, lessonId) {
    try {
      if (!learnerId || !courseId || !lessonId) return null;
      return await apiGet(`/courses/progress/video-position?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`);
    } catch (error) {
      logger.error('Error getting video position', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  },

  async markVideoCompleted(learnerId, courseId, lessonId) {
    try {
      await apiPost('/courses/progress/video-completed', { learnerId, courseId, lessonId });
      return { success: true };
    } catch (error) {
      logger.error('Error marking video completed', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async saveRestorePoint(learnerId, courseId, moduleIndex, lessonIndex, lessonId, videoPosition = 0) {
    try {
      if (!learnerId || !courseId) return { success: false, error: 'Missing required parameters' };
      await apiPost('/courses/progress/restore-point', { learnerId, courseId, moduleIndex, lessonIndex, lessonId, videoPosition });
      return { success: true };
    } catch (error) {
      logger.error('Error saving restore point', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async getRestorePoint(learnerId, courseId) {
    try {
      if (!learnerId || !courseId) return null;
      return await apiGet(`/courses/progress/restore-point?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}`);
    } catch (error) {
      logger.error('Error getting restore point', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  },

  async clearRestorePoint(learnerId, courseId) {
    try {
      await apiDelete(`/courses/progress/restore-point?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}`);
      return { success: true };
    } catch (error) {
      logger.error('Error clearing restore point', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async getLessonProgress(learnerId, courseId, lessonId) {
    try {
      if (!learnerId || !courseId || !lessonId) return null;
      return await apiGet(`/courses/progress/lesson?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`);
    } catch (error) {
      logger.error('Error getting lesson progress', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  },

  async updateLessonStatus(learnerId, courseId, lessonId, status) {
    try {
      await apiPost('/courses/progress/lesson-status', { learnerId, courseId, lessonId, status });
      return { success: true };
    } catch (error) {
      logger.error('Error updating lesson status', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async saveTimeSpent(learnerId, courseId, lessonId, additionalSeconds) {
    try {
      const result = await apiPost<{ success: boolean; totalTime: number }>('/courses/progress/time-spent', { learnerId, courseId, lessonId, additionalSeconds });
      return { success: true, totalTime: result.totalTime };
    } catch (error) {
      logger.error('Error saving time spent', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async startQuizAttempt(learnerId, courseId, lessonId, quizId, totalQuestions) {
    try {
      const result = await apiPost<any>('/courses/progress/quiz/start', { learnerId, courseId, lessonId, quizId, totalQuestions });
      return { success: true, data: result.data, resumed: result.resumed };
    } catch (error) {
      logger.error('Error starting quiz attempt', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async saveQuizAnswer(learnerId, quizId, attemptNumber, questionId, answer) {
    try {
      await apiPost('/courses/progress/quiz/answer', { learnerId, quizId, attemptNumber, questionId, answer });
      return { success: true };
    } catch (error) {
      logger.error('Error saving quiz answer', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async getQuizProgress(learnerId, quizId) {
    try {
      return await apiGet(`/courses/progress/quiz?learnerId=${encodeURIComponent(learnerId)}&quizId=${encodeURIComponent(quizId)}`);
    } catch (error) {
      logger.error('Error getting quiz progress', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  },

  async submitQuiz(learnerId, quizId, attemptNumber, correctAnswers, totalQuestions) {
    try {
      const result = await apiPost<{ data: any; score: number; passed: boolean }>('/courses/progress/quiz/submit', { learnerId, quizId, attemptNumber, correctAnswers, totalQuestions });
      return { success: true, data: result.data, score: result.score, passed: result.passed };
    } catch (error) {
      logger.error('Error submitting quiz', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  },

  async getCourseProgressSummary(learnerId, courseId) {
    try {
      return await apiGet(`/courses/progress/summary?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}`);
    } catch (error) {
      logger.error('Error getting course progress summary', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  },

  async getAllCoursesProgress(learnerId) {
    try {
      return await apiGet(`/courses/progress/all?learnerId=${encodeURIComponent(learnerId)}`);
    } catch (error) {
      logger.error('Error getting all courses progress', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  },

  async updateCourseTotalTime(learnerId, courseId, additionalSeconds) {
    try {
      const result = await apiPost<{ success: boolean; totalTime: number }>('/courses/progress/course-time', { learnerId, courseId, additionalSeconds });
      return { success: true, totalTime: result.totalTime };
    } catch (error) {
      logger.error('Error updating course total time', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  }
};

export default courseProgressService;
