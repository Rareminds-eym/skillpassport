/**
 * AddOnAnalyticsService
 * 
 * Service for tracking and analyzing add-on subscription analytics
 */

import { apiPost } from '@/shared/api/apiClient';

class AddOnAnalyticsService {
  async trackEvent(userId: string, eventType: string, featureKey: string, metadata = {}) {
    try {
      const result = await apiPost('/payments/addon-analytics', { action: 'trackEvent', userId, eventType, featureKey, metadata });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAddOnRevenue(options = {}) {
    try {
      const result = await apiPost('/payments/addon-analytics', { action: 'getAddOnRevenue', options });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getChurnRate(featureKey: string, options = {}) {
    try {
      const result = await apiPost('/payments/addon-analytics', { action: 'getChurnRate', featureKey, options });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCohortAnalysis(cohortDate: any, options = {}) {
    try {
      const result = await apiPost('/payments/addon-analytics', { action: 'getCohortAnalysis', cohortDate, options });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getFeatureUsage(featureKey: string, options = {}) {
    try {
      const result = await apiPost('/payments/addon-analytics', { action: 'getFeatureUsage', featureKey, options });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAdoptionMetrics() {
    try {
      const result = await apiPost('/payments/addon-analytics', { action: 'getAdoptionMetrics' });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

const addOnAnalyticsService = new AddOnAnalyticsService();
export default addOnAnalyticsService;
export { AddOnAnalyticsService };
