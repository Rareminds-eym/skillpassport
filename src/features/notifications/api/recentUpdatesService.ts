import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('recent-updates-service');

export const recentUpdatesService = {
  async getRecentUpdatesByEmail(email) {
    try {
      const response: any = await apiPost('/recent-updates', {
        action: 'get',
        email,
      });

      const data = response?.data ?? response;
      return { updates: data?.updates || [] };
    } catch (error) {
      logger.error('Failed to get recent updates by email', error as Error, { email });
      throw error;
    }
  },

  async addRecentUpdate(email, newUpdate) {
    try {
      const response: any = await apiPost('/recent-updates', {
        action: 'add',
        email,
        update: newUpdate,
      });

      const data = response?.data ?? response;
      return { updates: data?.updates || [] };
    } catch (error) {
      logger.error('Failed to add recent update', error as Error, { email });
      throw error;
    }
  },

  async clearRecentUpdates(email) {
    try {
      const response: any = await apiPost('/recent-updates', {
        action: 'clear',
        email,
      });

      const data = response?.data ?? response;
      return { updates: data?.updates || [] };
    } catch (error) {
      logger.error('Failed to clear recent updates', error as Error, { email });
      throw error;
    }
  },
};