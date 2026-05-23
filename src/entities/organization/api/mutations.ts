/**
 * Organization Entity - API Mutations
 * Data modification functions for organization data
 */

import { supabase } from '@/shared/api';
import type { Organization, OrganizationSubscription, RenewalOptions } from '../model/types';

// ============================================================================
// Organization Mutations
// ============================================================================

export const createOrganization = async (
  organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
): Promise<Organization> => {
  const { data, error } = await supabase
    .from('organizations')
    .insert(organization)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateOrganization = async (
  organizationId: string,
  updates: Partial<Organization>
): Promise<Organization> => {
  const { data, error } = await supabase
    .from('organizations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', organizationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteOrganization = async (organizationId: string): Promise<void> => {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId);

  if (error) throw error;
};

export const checkOrganizationNameExists = async (
  name: string,
  organizationType: string,
  excludeId?: string
): Promise<boolean> => {
  let query = supabase
    .from('organizations')
    .select('id')
    .ilike('name', name)
    .eq('organization_type', organizationType);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data !== null;
};

// ============================================================================
// Organization Subscription Mutations
// ============================================================================

export const updateSeatCount = async (
  subscriptionId: string,
  newSeatCount: number
): Promise<OrganizationSubscription> => {
  const { data, error } = await supabase
    .from('subscription_cache')
    .update({
      seat_count: newSeatCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .eq('is_org_subscription', true)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const cancelSubscription = async (
  subscriptionId: string,
  reason: string
): Promise<void> => {
  const { error } = await supabase
    .from('subscription_cache')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      auto_renew: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .eq('is_org_subscription', true);

  if (error) throw error;
};

export const renewSubscription = async (
  subscriptionId: string,
  options?: RenewalOptions
): Promise<OrganizationSubscription> => {
  const updateData: any = {
    status: 'active',
    updated_at: new Date().toISOString()
  };

  if (options?.seatCount !== undefined) {
    updateData.total_seats = options.seatCount;
  }

  if (options?.autoRenew !== undefined) {
    updateData.auto_renew = options.autoRenew;
  }

  const { data, error } = await supabase
    .from('subscription_cache')
    .update(updateData)
    .eq('id', subscriptionId)
    .eq('is_org_subscription', true)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const upgradeSubscription = async (
  subscriptionId: string,
  newPlanId: string
): Promise<OrganizationSubscription> => {
  const { data, error } = await supabase
    .from('subscription_cache')
    .update({
      plan_id: newPlanId,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .eq('is_org_subscription', true)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// Organization Member Mutations
// ============================================================================

export const removeMember = async (
  memberId: string,
  memberType: 'educator' | 'learner',
  organizationType: 'school' | 'college' | 'university',
  organizationId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (memberType === 'learner') {
      const updateData: Record<string, any> = {};
      
      if (organizationType === 'school') {
        updateData.school_id = null;
      } else if (organizationType === 'college' || organizationType === 'university') {
        updateData.college_id = null;
      }

      const { error } = await supabase
        .from('learners')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;
      return { success: true, message: 'Learner removed from organization' };
    } else {
      if (organizationType === 'school') {
        const { error } = await supabase
          .from('school_educators')
          .update({ school_id: null })
          .eq('id', memberId);

        if (error) throw error;
      } else if (organizationType === 'college') {
        const { error } = await supabase
          .from('college_lecturers')
          .update({ collegeId: null })
          .eq('id', memberId);

        if (error) throw error;
      }

      return { success: true, message: 'Educator removed from organization' };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to remove member' 
    };
  }
};
