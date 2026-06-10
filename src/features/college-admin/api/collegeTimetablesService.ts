import { apiPost } from '@/shared/api/apiClient';

export const collegeTimetablesService = {
  async publishTimetable(timetableId: string) {
    const result = await apiPost('/college-admin/classes', { action: 'publish-timetable', timetableId });
    if (!result.success) throw new Error(result.error || 'Failed to publish timetable');
  }
};
