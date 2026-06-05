import { apiPost } from '@/shared/api/apiClient';

export interface TeacherWorkload {
  total_periods: number;
  max_consecutive: number;
  exceeds_limit: boolean;
  consecutive_violation: boolean;
}

const API_PATH = '/college-admin/school-admin';

export const timetableSlotsService = {
  async createSlot(slotData: any) {
    const result = await apiPost(API_PATH, {
      action: 'create-timetable-slot',
      slot_data: slotData,
    });
    return result;
  },

  async deleteSlot(slotId: string) {
    await apiPost(API_PATH, {
      action: 'delete-timetable-slot',
      slot_id: slotId,
    });
  },

  async calculateTeacherWorkload(
    teacherId: string,
    timetableId: string
  ): Promise<TeacherWorkload | null> {
    const data = await apiPost(API_PATH, {
      action: 'calculate-teacher-workload',
      teacher_id: teacherId,
      timetable_id: timetableId,
    });
    return data as TeacherWorkload | null;
  }
};
