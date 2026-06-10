import { apiGet, apiPost, apiDelete } from '@/shared/api/apiClient';
import type { Organization, OrganizationSubscription, RenewalOptions } from '../model/types';

export const createOrganization = async (
  organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
): Promise<Organization> => {
  return apiPost<Organization>('/organization', { action: 'createOrganization', ...organization });
};

export const updateOrganization = async (
  organizationId: string,
  updates: Partial<Organization>
): Promise<Organization> => {
  return apiPost<Organization>('/organization', { action: 'updateOrganization', id: organizationId, ...updates });
};

export const deleteOrganization = async (organizationId: string): Promise<void> => {
  await apiPost('/organization', { action: 'deleteOrganization', id: organizationId });
};

export const checkOrganizationNameExists = async (
  name: string,
  organizationType: string,
  excludeId?: string
): Promise<boolean> => {
  const params = new URLSearchParams({ action: 'checkOrganizationNameExists', name, orgType: organizationType });
  if (excludeId) params.set('excludeId', excludeId);
  return apiGet<boolean>(`/organization?${params.toString()}`);
};

export const updateSeatCount = async (
  subscriptionId: string,
  newSeatCount: number
): Promise<OrganizationSubscription> => {
  return apiPost<OrganizationSubscription>('/organization', { action: 'updateSeatCount', subscriptionId, newSeatCount });
};

export const cancelSubscription = async (subscriptionId: string, reason: string): Promise<void> => {
  await apiPost('/organization', { action: 'cancelSubscription', subscriptionId, reason });
};

export const renewSubscription = async (
  subscriptionId: string,
  options?: RenewalOptions
): Promise<OrganizationSubscription> => {
  return apiPost<OrganizationSubscription>('/organization', { action: 'renewSubscription', subscriptionId, ...options });
};

export const upgradeSubscription = async (
  subscriptionId: string,
  newPlanId: string
): Promise<OrganizationSubscription> => {
  return apiPost<OrganizationSubscription>('/organization', { action: 'upgradeSubscription', subscriptionId, newPlanId });
};

export const removeMember = async (
  memberId: string,
  memberType: 'educator' | 'learner',
  organizationType: 'school' | 'college' | 'university',
  organizationId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    return await apiPost<{ success: boolean; message: string }>('/organization', {
      action: 'removeMember', memberId, memberType, organizationType, organizationId,
    });
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to remove member' };
  }
};
