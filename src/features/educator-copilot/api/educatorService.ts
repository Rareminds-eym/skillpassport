import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('educator-service');

/**
 * Get the current logged-in educator's record (school_educator or college_lecturer)
 * @returns {Promise<{data: object | null, error: string | null}>}
 */
export const getCurrentEducator = async () => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getCurrentEducator',
    });

    if (result?.error) {
      logger.error('Fetch educator failed', new Error(result.error.message));
      return { data: null, error: result.error.message };
    }

    return { data: result?.data || null, error: null };
  } catch (error: any) {
    logger.error('Get current educator exception', error instanceof Error ? error : new Error(String(error)));
    return {
      data: null,
      error: error?.message || 'Failed to fetch educator information'
    };
  }
};

/**
 * Get educator ID for the current logged-in user
 * @returns {Promise<string | null>} The school_educator.id or null
 */
export const getCurrentEducatorId = async () => {
  const { data } = await getCurrentEducator();
  return data?.id || null;
};
