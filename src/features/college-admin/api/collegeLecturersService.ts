import { apiPost } from '@/shared/api/apiClient';

export const collegeLecturersService = {
  async getCollegeLecturer(userId: string) {
    const result = await apiPost('/college-admin/faculty', { action: 'get-college-lecturer', user_id: userId });
    if (!result.success) throw new Error(result.error || 'Failed to get college lecturer');
    return result.data;
  },

  async createLecturer(lecturerData: any) {
    const result = await apiPost('/college-admin/faculty', { action: 'create-lecturer', ...lecturerData });
    if (!result.success) throw new Error(result.error || 'Failed to create lecturer');
  }
};
