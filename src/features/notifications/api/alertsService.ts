import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('alerts-service');

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  urgent: boolean;
  source: 'talent_pool' | 'shortlists' | 'interviews' | 'offers' | 'pipelines';
  actionData?: any;
}

export const getTalentPoolAlerts = async (): Promise<Alert[]> => {
  try {
    const response: any = await apiPost('/alerts', { action: 'get-talent-pool-alerts' });
    const data = response?.data ?? response;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error('Failed to fetch talent pool alerts', error as Error);
    return [];
  }
};

export const getShortlistAlerts = async (): Promise<Alert[]> => {
  try {
    const response: any = await apiPost('/alerts', { action: 'get-shortlist-alerts' });
    const data = response?.data ?? response;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error('Failed to fetch shortlist alerts', error as Error);
    return [];
  }
};

export const getInterviewAlerts = async (): Promise<Alert[]> => {
  try {
    const response: any = await apiPost('/alerts', { action: 'get-interview-alerts' });
    const data = response?.data ?? response;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error('Failed to fetch interview alerts', error as Error);
    return [];
  }
};

export const getOffersAlerts = async (): Promise<Alert[]> => {
  try {
    const response: any = await apiPost('/alerts', { action: 'get-offers-alerts' });
    const data = response?.data ?? response;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error('Failed to fetch offers alerts', error as Error);
    return [];
  }
};

export const getPipelineAlerts = async (): Promise<Alert[]> => {
  try {
    const response: any = await apiPost('/alerts', { action: 'get-pipeline-alerts' });
    const data = response?.data ?? response;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error('Failed to fetch pipeline alerts', error as Error);
    return [];
  }
};

export const getAllAlerts = async (): Promise<Alert[]> => {
  try {
    const response: any = await apiPost('/alerts', { action: 'get-all-alerts' });
    const data = response?.data ?? response;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error('Failed to fetch all alerts', error as Error);
    return [];
  }
};