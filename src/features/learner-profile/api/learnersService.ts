import { apiPost } from '@/shared/api/apiClient';

export const learnersService = {
  async getLearners(limit?: number) {
    const result = await apiPost<any[]>('/learner-profile/actions', { action: 'fetch-learners', limit });
    return result?.data || [];
  }
};
