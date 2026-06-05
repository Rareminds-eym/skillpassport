import { apiGet } from '@/shared/api/apiClient';

export const courseDetailsService = {
  async getCourseSkills(courseIds: string[]) {
    return apiGet<any[]>(`/courses/details/skills?courseIds=${courseIds.join(',')}`);
  },

  async getCourseClasses(courseIds: string[]) {
    return apiGet<any[]>(`/courses/details/classes?courseIds=${courseIds.join(',')}`);
  },

  async getCourseModules(courseIds: string[]) {
    return apiGet<any[]>(`/courses/details/modules?courseIds=${courseIds.join(',')}`);
  }
};
