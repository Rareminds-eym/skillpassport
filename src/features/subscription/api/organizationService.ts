/**
 * Organization Subscription Service
 * Handles organization-specific subscription operations
 */

import { apiGet } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organization-service');

/**
 * Get organization subscription details
 */
export const getOrganizationSubscription = async (organizationId: string) => {
  try {
    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      `/payments/organization-queries?action=getOrganizationSubscription&orgId=${organizationId}`
    );

    return {
      success: result.success ?? true,
      data: result.data,
      error: result.error
    };
  } catch (error: any) {
    logger.error('Error fetching organization subscription', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error'
    };
  }
};

/**
 * Get organization members with license assignments
 */
export const getOrganizationMembers = async (organizationId: string) => {
  try {
    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      `/payments/organization-queries?action=getOrganizationMembers&orgId=${organizationId}`
    );

    return {
      success: result.success ?? true,
      data: result.data || [],
      error: result.error
    };
  } catch (error: any) {
    logger.error('Error fetching organization members', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error'
    };
  }
};

/**
 * Get user's organization license assignment
 */
export const getUserLicenseAssignment = async (userId: string) => {
  try {
    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      `/payments/organization-queries?action=getUserLicenseAssignment`
    );

    return {
      success: result.success ?? true,
      data: result.data,
      error: result.error
    };
  } catch (error: any) {
    logger.error('Error fetching license assignment', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error'
    };
  }
};
