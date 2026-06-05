import { apiGet } from '@/shared/api/apiClient';
import type { Organization, OrganizationType, OrganizationFilters, OrganizationSubscription, OrganizationMember, FetchMembersOptions, FetchMembersResult } from '../model/types';

export const getOrganizationByAdminId = async (
  adminId: string, organizationType?: OrganizationType
): Promise<Organization | null> => {
  const params = new URLSearchParams({ action: 'getOrganizationByAdminId', adminId });
  if (organizationType) params.set('orgType', organizationType);
  return apiGet<Organization | null>(`/organization?${params.toString()}`);
};

export const getOrganizationById = async (organizationId: string): Promise<Organization | null> => {
  return apiGet<Organization | null>(`/organization?action=getOrganizationById&id=${encodeURIComponent(organizationId)}`);
};

export const getOrganizations = async (filters?: OrganizationFilters): Promise<Organization[]> => {
  const params = new URLSearchParams({ action: 'getOrganizations' });
  if (filters?.organizationType) params.set('orgType', filters.organizationType);
  if (filters?.adminId) params.set('adminId', filters.adminId);
  if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
  if (filters?.approvalStatus) params.set('approvalStatus', filters.approvalStatus);
  if (filters?.city) params.set('city', filters.city);
  if (filters?.state) params.set('state', filters.state);
  if (filters?.searchTerm) params.set('searchTerm', filters.searchTerm);
  return apiGet<Organization[]>(`/organization?${params.toString()}`);
};

export const getSchools = async (filters?: Omit<OrganizationFilters, 'organizationType'>): Promise<Organization[]> => {
  return getOrganizations({ ...filters, organizationType: 'school' });
};

export const getColleges = async (filters?: Omit<OrganizationFilters, 'organizationType'>): Promise<Organization[]> => {
  return getOrganizations({ ...filters, organizationType: 'college' });
};

export const getUniversities = async (filters?: Omit<OrganizationFilters, 'organizationType'>): Promise<Organization[]> => {
  return getOrganizations({ ...filters, organizationType: 'university' });
};

export const getOrganizationByEmail = async (email: string, organizationType?: OrganizationType): Promise<Organization | null> => {
  const params = new URLSearchParams({ action: 'getOrganizationByEmail', email });
  if (organizationType) params.set('orgType', organizationType);
  return apiGet<Organization | null>(`/organization?${params.toString()}`);
};

export const getOrganizationSubscriptions = async (
  organizationId: string, organizationType: OrganizationType
): Promise<OrganizationSubscription[]> => {
  return apiGet<OrganizationSubscription[]>(`/organization?action=getSubscriptions&orgId=${encodeURIComponent(organizationId)}&orgType=${organizationType}`);
};

export const getSubscriptionById = async (subscriptionId: string): Promise<OrganizationSubscription | null> => {
  return apiGet<OrganizationSubscription | null>(`/organization?action=getSubscriptions&subId=${encodeURIComponent(subscriptionId)}`);
};

export const getOrganizationMembers = async (options: FetchMembersOptions): Promise<FetchMembersResult> => {
  return { members: [], total: 0, hasMore: false };
};

export const getMemberCounts = async (
  organizationId: string, organizationType: OrganizationType
): Promise<{ learners: number; educators: number; total: number }> => {
  return apiGet(`/organization?action=getMemberCounts&orgId=${encodeURIComponent(organizationId)}&orgType=${organizationType}`);
};
