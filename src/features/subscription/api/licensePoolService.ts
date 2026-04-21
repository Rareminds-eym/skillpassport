/**
 * License Pool Service
 * Handles license pool management for organization subscriptions
 */

import { supabase } from '@/shared/api/supabaseClient';

/**
 * Get all license pools for an organization
 */
export const getLicensePools = async (organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from('license_pools')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching license pools:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get license pool by ID
 */
export const getLicensePoolById = async (poolId: string) => {
  try {
    const { data, error } = await supabase
      .from('license_pools')
      .select('*')
      .eq('id', poolId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching license pool:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get license assignments for a pool
 */
export const getPoolAssignments = async (poolId: string) => {
  try {
    const { data, error } = await supabase
      .from('license_assignments')
      .select(`
        *,
        users (
          id,
          email,
          full_name
        )
      `)
      .eq('license_pool_id', poolId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching pool assignments:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};
