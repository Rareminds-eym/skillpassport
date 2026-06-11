import { apiPost } from '@/shared/api/apiClient';

export const collegeBreaksService = {
  async createBreak(breakData: any) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'create-break',
      ...breakData
    });

    if (!result.success) throw new Error(result.error || 'Failed to create break');
  },

  async deleteBreak(breakId: string) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'delete-break',
      id: breakId
    });

    if (!result.success) throw new Error(result.error || 'Failed to delete break');
  },

  async updateBreak(breakId: string, breakData: any) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'update-break',
      id: breakId,
      ...breakData
    });

    if (!result.success) throw new Error(result.error || 'Failed to update break');
  }
};
