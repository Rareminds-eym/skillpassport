import { apiGet } from '@/shared/api/apiClient';
import { LearnerProfile } from '@/features/learner-profile/model';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('profile-service');

/**
 * Profile Service
 * Handles fetching and parsing learner profiles from database
 */

export async function fetchlearnerProfile(learnerId: string): Promise<LearnerProfile | null> {
  try {
    const response: any = await apiGet(`/career/profile`);
    return response.data as LearnerProfile;
  } catch (error) {
    logger.error('Exception in fetchlearnerProfile', error instanceof Error ? error : new Error(String(error)), {
      learnerId
    });
    return null;
  }
}

/**
 * Fetch opportunities from database
 */
export async function fetchOpportunities(): Promise<any[]> {
  try {
    const response: any = await apiGet('/career/opportunities');
    return response.data || [];
  } catch (error) {
    logger.error('Exception in fetchOpportunities', error instanceof Error ? error : new Error(String(error)), {
      operation: 'fetchOpportunities'
    });
    return [];
  }
}
