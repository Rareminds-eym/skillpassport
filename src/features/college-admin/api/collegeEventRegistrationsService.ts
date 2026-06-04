import { apiPost } from '@/shared/api/apiClient';

export const collegeEventRegistrationsService = {
  async createRegistration(eventId: string, learnerId: string) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'register-for-event',
      event_id: eventId,
      learner_id: learnerId
    });

    if (!result.success) throw new Error(result.error || 'Failed to register for event');
  },

  async deleteRegistration(registrationId: string) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'cancel-registration',
      registration_id: registrationId
    });

    if (!result.success) throw new Error(result.error || 'Failed to cancel registration');
  },

  async updateAttendance(registrationId: string, attended: boolean) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'mark-attendance',
      registration_id: registrationId,
      attended
    });

    if (!result.success) throw new Error(result.error || 'Failed to update attendance');
  }
};
