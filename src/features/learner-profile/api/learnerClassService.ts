import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learnerClassService');

export const learnerClassService = {
  async getClassmates(learnerId: string) {
    try {
      const result = await apiPost<any>('/learner-profile/actions', {
        action: 'fetch-learner-class-data',
        learnerId,
      });
      return result?.data?.classmates || [];
    } catch (error) {
      logger.error('Error fetching classmates', error as Error);
      return [];
    }
  },

  async getEducatorAssignments(learnerId: string) {
    try {
      const result = await apiPost<any>('/learner-profile/actions', {
        action: 'fetch-learner-class-data',
        learnerId,
      });
      return result?.data?.educatorAssignments || [];
    } catch (error) {
      logger.error('Error fetching educator assignments', error as Error);
      return [];
    }
  },

  async getTimetable(learnerId: string) {
    try {
      const result = await apiPost<any>('/learner-profile/actions', {
        action: 'fetch-learner-class-data',
        learnerId,
      });
      return result?.data?.timetableSlots || [];
    } catch (error) {
      logger.error('Error fetching timetable', error as Error);
      return [];
    }
  },

  async getTodaysSchedule(learnerId: string) {
    try {
      const result = await apiPost<any>('/learner-profile/actions', {
        action: 'fetch-learner-class-data',
        learnerId,
      });
      const slots = result?.data?.timetableSlots || [];
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      return slots.filter((slot: any) => slot.day_of_week === today);
    } catch (error) {
      logger.error('Error fetching today schedule', error as Error);
      return [];
    }
  },

  async getSchoolClassInfo(learnerId: string) {
    try {
      const result = await apiPost<any>('/learner-profile/actions', {
        action: 'fetch-learner-class-data',
        learnerId,
      });
      return result?.data?.learner || null;
    } catch (error) {
      logger.error('Error fetching school class info', error as Error);
      return null;
    }
  },
};

// Alias for compatibility
export const getlearnerClassInfo = learnerClassService.getSchoolClassInfo;
export const getTodaySchedule = learnerClassService.getTodaysSchedule;
export const getClassTimetable = learnerClassService.getTimetable;
export const getClassmates = learnerClassService.getClassmates;
