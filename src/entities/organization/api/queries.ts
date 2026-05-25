/**
 * Organization Entity - API Queries
 * Data fetching functions for organization data
 */

import { supabase } from '@/shared/api';
import type { 
  Organization, 
  OrganizationType, 
  OrganizationFilters,
  OrganizationSubscription,
  OrganizationMember,
  FetchMembersOptions,
  FetchMembersResult
} from '../model/types';

// ============================================================================
// Organization Queries
// ============================================================================

export const getOrganizationByAdminId = async (
  adminId: string, 
  organizationType?: OrganizationType
): Promise<Organization | null> => {
  let query = supabase
    .from('organizations')
    .select('*')
    .eq('admin_id', adminId);

  if (organizationType) {
    query = query.eq('organization_type', organizationType);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
};

export const getOrganizationById = async (
  organizationId: string
): Promise<Organization | null> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getOrganizations = async (
  filters?: OrganizationFilters
): Promise<Organization[]> => {
  let query = supabase
    .from('organizations')
    .select('*')
    .order('name');

  if (filters?.organizationType) {
    query = query.eq('organization_type', filters.organizationType);
  }

  if (filters?.adminId) {
    query = query.eq('admin_id', filters.adminId);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters?.approvalStatus) {
    query = query.eq('approval_status', filters.approvalStatus);
  }

  if (filters?.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }

  if (filters?.state) {
    query = query.ilike('state', `%${filters.state}%`);
  }

  if (filters?.searchTerm) {
    query = query.ilike('name', `%${filters.searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getSchools = async (
  filters?: Omit<OrganizationFilters, 'organizationType'>
): Promise<Organization[]> => {
  return getOrganizations({ ...filters, organizationType: 'school' });
};

export const getColleges = async (
  filters?: Omit<OrganizationFilters, 'organizationType'>
): Promise<Organization[]> => {
  return getOrganizations({ ...filters, organizationType: 'college' });
};

export const getUniversities = async (
  filters?: Omit<OrganizationFilters, 'organizationType'>
): Promise<Organization[]> => {
  return getOrganizations({ ...filters, organizationType: 'university' });
};

export const getOrganizationByEmail = async (
  email: string,
  organizationType?: OrganizationType
): Promise<Organization | null> => {
  let query = supabase
    .from('organizations')
    .select('*')
    .eq('email', email);

  if (organizationType) {
    query = query.eq('organization_type', organizationType);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
};

// ============================================================================
// Organization Subscription Queries
// ============================================================================

export const getOrganizationSubscriptions = async (
  organizationId: string,
  organizationType: OrganizationType
): Promise<OrganizationSubscription[]> => {
  const { data, error } = await supabase
    .from('subscription_cache')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('organization_type', organizationType)
    .eq('is_organization_subscription', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getSubscriptionById = async (
  subscriptionId: string
): Promise<OrganizationSubscription | null> => {
  const { data, error } = await supabase
    .from('subscription_cache')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// Organization Member Queries
// ============================================================================

export const getOrganizationMembers = async (
  options: FetchMembersOptions
): Promise<FetchMembersResult> => {
  // This would use the OrganizationMemberService logic
  // For now, return empty result
  return { members: [], total: 0, hasMore: false };
};

export const getMemberCounts = async (
  organizationId: string,
  organizationType: OrganizationType
): Promise<{ learners: number; educators: number; total: number }> => {
  let learnerCount = 0;
  let educatorCount = 0;

  // Count learners
  let learnerQuery = supabase
    .from('learners')
    .select('id', { count: 'exact', head: true });

  if (organizationType === 'school') {
    learnerQuery = learnerQuery.eq('school_id', organizationId);
  } else if (organizationType === 'college') {
    learnerQuery = learnerQuery.eq('college_id', organizationId);
  } else {
    learnerQuery = learnerQuery.eq('universityId', organizationId);
  }

  learnerQuery = learnerQuery.or('is_deleted.is.null,is_deleted.eq.false');

  const { count: sCount } = await learnerQuery;
  learnerCount = sCount || 0;

  // Count educators
  if (organizationType === 'school') {
    const { count: eCount } = await supabase
      .from('school_educators')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', organizationId);
    educatorCount = eCount || 0;
  } else if (organizationType === 'college') {
    const { count: eCount } = await supabase
      .from('college_lecturers')
      .select('id', { count: 'exact', head: true })
      .eq('collegeId', organizationId);
    educatorCount = eCount || 0;
  }

  return {
    learners: learnerCount,
    educators: educatorCount,
    total: learnerCount + educatorCount,
  };
};
