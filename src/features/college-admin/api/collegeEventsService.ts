import { apiPost } from '@/shared/api/apiClient';

export const collegeEventsService = {
  async getCollegeEvents(collegeId?: string) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'get-events',
      college_id: collegeId
    });

    if (!result.success) throw new Error(result.error || 'Failed to fetch events');
    return result.data;
  },

  async createCollegeEvent(eventData: any, collegeId: string, userId?: string) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'create-event',
      ...eventData,
      college_id: collegeId,
      created_by: userId
    });

    if (!result.success) throw new Error(result.error || 'Failed to create event');
  },

  async updateCollegeEvent(id: string, updates: any) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'update-event',
      id,
      ...updates
    });

    if (!result.success) throw new Error(result.error || 'Failed to update event');
  },

  async deleteCollegeEvent(id: string) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'delete-event',
      id
    });

    if (!result.success) throw new Error(result.error || 'Failed to delete event');
  },

  async publishCollegeEvent(id: string) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'publish-event',
      id
    });

    if (!result.success) throw new Error(result.error || 'Failed to publish event');
  },

  async cancelCollegeEvent(id: string) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'cancel-event',
      id
    });

    if (!result.success) throw new Error(result.error || 'Failed to cancel event');
  },

  async rescheduleCollegeEvent(id: string, startDate: string, endDate: string) {
    const result = await apiPost<any>('/college-admin/events', {
      action: 'reschedule-event',
      id,
      start_date: startDate,
      end_date: endDate
    });

    if (!result.success) throw new Error(result.error || 'Failed to reschedule event');
  }
};
