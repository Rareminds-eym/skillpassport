/**
 * License Pool Service
 * Handles license pool management for organization subscriptions
 */

import { apiGet } from '@/shared/api/apiClient';

/**
 * Get all license pools for an organization
 */
export const getLicensePools = async (organizationId: string) => {
  try {
    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      `/payments/license-pool-queries?action=getLicensePools&orgId=${organizationId}`
    );

    return {
      success: result.success ?? true,
      data: result.data || [],
      error: result.error
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get license pool by ID
 */
export const getLicensePoolById = async (poolId: string) => {
  try {
    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      `/payments/license-pool-queries?action=getLicensePoolById&poolId=${poolId}`
    );

    return {
      success: result.success ?? true,
      data: result.data,
      error: result.error
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get license assignments for a pool
 */
export const getPoolAssignments = async (poolId: string) => {
  try {
    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      `/payments/license-pool-queries?action=getPoolAssignments&poolId=${poolId}`
    );

    return {
      success: result.success ?? true,
      data: result.data || [],
      error: result.error
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
