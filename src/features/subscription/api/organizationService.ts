/**
 * Organization Subscription Service
 * Handles organization-specific subscription operations
 */

import { supabase } from '@/shared/api/supabaseClient';
import { checkAuthentication } from '@/features/auth';

/**
 * Get organization subscription details
 */
export const getOrganizationSubscription = async (organizationId: string) => {
  try {
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select(`
        *,
        subscription_plans (
          id,
          name,
          plan_code,
          features
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching organization subscription:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get organization members with license assignments
 */
export const getOrganizationMembers = async (organizationId: string) => {
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
      .eq('organization_id', organizationId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching organization members:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get user's organization license assignment
 */
export const getUserLicenseAssignment = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('license_assignments')
      .select(`
        *,
        organization_subscriptions (
          id,
          status,
          start_date,
          end_date,
          subscription_plans (
            name,
            plan_code
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching license assignment:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};
