import { apiPost } from '@/shared/api/apiClient';

export const collegeTimetableSlotsService = {
  async createSlot(slotData: any) {
    const result = await apiPost('/college-admin/classes', { action: 'create-timetable-slot', ...slotData });
    if (!result.success) throw new Error(result.error || 'Failed to create timetable slot');
  },

  async updateSlot(id: string, slotData: any) {
    const result = await apiPost('/college-admin/classes', { action: 'update-timetable-slot', id, ...slotData });
    if (!result.success) throw new Error(result.error || 'Failed to update timetable slot');
  },

  async deleteSlot(id: string) {
    const result = await apiPost('/college-admin/classes', { action: 'delete-timetable-slot', id });
    if (!result.success) throw new Error(result.error || 'Failed to delete timetable slot');
  }
};
