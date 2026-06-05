import { apiGet } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organization-helper');

export type OrganizationType = 'school' | 'college' | 'university';

interface OrganizationResult {
  id: string | null;
  name: string | null;
  error: string | null;
}

export async function getCurrentUserOrganizationId(
  organizationType: OrganizationType
): Promise<OrganizationResult> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { id: null, name: null, error: 'User not authenticated' };

    const result = await apiGet<any>(`/organization?action=getOrganizationByAdminId&adminId=${encodeURIComponent(user.id)}&orgType=${organizationType}`);
    const d = result?.data;
    if (d) return { id: d.id, name: d.name, error: null };
    return { id: null, name: null, error: null };
  } catch (err) {
    logger.error('Unexpected error in organizationHelper', err as Error);
    return { id: null, name: null, error: 'An unexpected error occurred' };
  }
}

export async function getCurrentSchoolId(): Promise<string | null> {
  const result = await getCurrentUserOrganizationId('school');
  return result.id;
}

export async function getCurrentCollegeId(): Promise<string | null> {
  const result = await getCurrentUserOrganizationId('college');
  return result.id;
}

export async function getCurrentUniversityId(): Promise<string | null> {
  const result = await getCurrentUserOrganizationId('university');
  return result.id;
}

export async function getOrganizationById(
  organizationId: string
): Promise<OrganizationResult & { data?: any }> {
  try {
    const result = await apiGet<any>(`/organization?action=getOrganizationById&id=${encodeURIComponent(organizationId)}`);
    const d = result?.data;
    if (!d) return { id: null, name: null, error: 'Organization not found' };
    return { id: d.id, name: d.name, error: null, data: d };
  } catch (err) {
    return { id: null, name: null, error: 'An unexpected error occurred' };
  }
}

export async function getOrganizationName(organizationId: string): Promise<string | null> {
  const result = await getOrganizationById(organizationId);
  return result.name;
}

export default { getCurrentUserOrganizationId, getCurrentSchoolId, getCurrentCollegeId, getCurrentUniversityId, getOrganizationById, getOrganizationName };
