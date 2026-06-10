import { apiDelete } from '@/shared/api/apiClient';

export const lessonPlansService = {
  async deleteLessonPlan(id: string) {
    await apiDelete(`/courses/lesson-plans/${id}`);
  }
};
