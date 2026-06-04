import { apiPost } from '@/shared/api/apiClient';

export const organizationsService = {
  async getCollegeOrganization(userId: string, userEmail: string) {
    const result = await apiPost('/college-admin/faculty', { action: 'get-college-organization', user_id: userId, email: userEmail });
    if (!result.success) throw new Error(result.error || 'Failed to get college organization');
    return result.data;
  }
};
