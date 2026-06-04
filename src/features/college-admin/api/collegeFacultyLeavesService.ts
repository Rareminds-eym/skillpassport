import { apiPost } from '@/shared/api/apiClient';

export const collegeFacultyLeavesService = {
  async createLeave(leaveData: any) {
    const result = await apiPost('/college-admin/faculty', { action: 'create-leave', ...leaveData });
    if (!result.success) throw new Error(result.error || 'Failed to create leave');
  }
};
