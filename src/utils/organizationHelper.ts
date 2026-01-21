/**
 * Organization Helper Utilities
 *
 * Helper functions for getting organization IDs from the unified organizations table.
 * Use these helpers instead of querying schools/colleges/universities tables directly.
 */

import { supabase } from '../lib/supabaseClient';

export type OrganizationType = 'school' | 'college' | 'university';

interface OrganizationResult {
  id: string | null;
  name: string | null;
  error: string | null;
}

/**
 * Get the current user's organization ID based on their role
 * Checks the organizations table using admin_id or email
 */
export async function getCurrentUserOrganizationId(
  organizationType: OrganizationType
): Promise<OrganizationResult> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { id: null, name: null, error: 'User not authenticated' };
    }

    // Query organizations table by admin_id or email
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('organization_type', organizationType)
      .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    if (error) {
      console.error(`[organizationHelper] Error fetching ${organizationType}:`, error);
      return { id: null, name: null, error: error.message };
    }

    if (org) {
      return { id: org.id, name: org.name, error: null };
    }

    return { id: null, name: null, error: null };
  } catch (err) {
    console.error('[organizationHelper] Unexpected error:', err);
    return { id: null, name: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Get school ID for the current user
 */
export async function getCurrentSchoolId(): Promise<string | null> {
  const result = await getCurrentUserOrganizationId('school');
  return result.id;
}

/**
 * Get college ID for the current user
 */
export async function getCurrentCollegeId(): Promise<string | null> {
  const result = await getCurrentUserOrganizationId('college');
  return result.id;
}

/**
 * Get university ID for the current user
 */
export async function getCurrentUniversityId(): Promise<string | null> {
  const result = await getCurrentUserOrganizationId('university');
  return result.id;
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(
  organizationId: string
): Promise<OrganizationResult & { data?: any }> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .maybeSingle();

    if (error) {
      return { id: null, name: null, error: error.message };
    }

    if (!data) {
      return { id: null, name: null, error: 'Organization not found' };
    }

    return { id: data.id, name: data.name, error: null, data };
  } catch (err) {
    return { id: null, name: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Get organization name by ID
 */
export async function getOrganizationName(organizationId: string): Promise<string | null> {
  const result = await getOrganizationById(organizationId);
  return result.name;
}

export default {
  getCurrentUserOrganizationId,
  getCurrentSchoolId,
  getCurrentCollegeId,
  getCurrentUniversityId,
  getOrganizationById,
  getOrganizationName,
};
