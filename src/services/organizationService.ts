/**
 * Centralized Organization Service
 *
 * This service provides a unified interface for fetching organization data.
 * All organization queries should go through this service to ensure consistency.
 *
 * The service uses the unified `organizations` table as the primary source.
 */

import { supabase } from '../lib/supabaseClient';

export type OrganizationType = 'school' | 'college' | 'university';

export interface Organization {
  id: string;
  name: string;
  organization_type: OrganizationType;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  admin_id?: string;
  is_active?: boolean;
  verification_status?: string;
  approval_status?: string;
  account_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationFilters {
  organizationType?: OrganizationType;
  adminId?: string;
  isActive?: boolean;
  approvalStatus?: string;
  searchTerm?: string;
  city?: string;
  state?: string;
}

/**
 * Get organization by admin user ID
 */
export async function getOrganizationByAdminId(
  adminId: string,
  organizationType?: OrganizationType
): Promise<{ data: Organization | null; error: string | null }> {
  try {
    let query = supabase.from('organizations').select('*').eq('admin_id', adminId);

    if (organizationType) {
      query = query.eq('organization_type', organizationType);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[OrganizationService] Error fetching organization by admin:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Organization | null, error: null };
  } catch (err) {
    console.error('[OrganizationService] Unexpected error:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(
  organizationId: string
): Promise<{ data: Organization | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .maybeSingle();

    if (error) {
      console.error('[OrganizationService] Error fetching organization by ID:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Organization, error: null };
  } catch (err) {
    console.error('[OrganizationService] Unexpected error:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all organizations with optional filters
 */
export async function getOrganizations(
  filters?: OrganizationFilters
): Promise<{ data: Organization[]; error: string | null }> {
  try {
    let query = supabase.from('organizations').select('*').order('name');

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

    if (error) {
      console.error('[OrganizationService] Error fetching organizations:', error);
      return { data: [], error: error.message };
    }

    return { data: (data || []) as Organization[], error: null };
  } catch (err) {
    console.error('[OrganizationService] Unexpected error:', err);
    return { data: [], error: 'An unexpected error occurred' };
  }
}

/**
 * Get schools (organizations with type 'school')
 */
export async function getSchools(
  filters?: Omit<OrganizationFilters, 'organizationType'>
): Promise<{ data: Organization[]; error: string | null }> {
  return getOrganizations({ ...filters, organizationType: 'school' });
}

/**
 * Get colleges (organizations with type 'college')
 */
export async function getColleges(
  filters?: Omit<OrganizationFilters, 'organizationType'>
): Promise<{ data: Organization[]; error: string | null }> {
  return getOrganizations({ ...filters, organizationType: 'college' });
}

/**
 * Get universities (organizations with type 'university')
 */
export async function getUniversities(
  filters?: Omit<OrganizationFilters, 'organizationType'>
): Promise<{ data: Organization[]; error: string | null }> {
  return getOrganizations({ ...filters, organizationType: 'university' });
}

/**
 * Create a new organization
 */
export async function createOrganization(
  organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Organization | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert(organization)
      .select()
      .single();

    if (error) {
      console.error('[OrganizationService] Error creating organization:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Organization, error: null };
  } catch (err) {
    console.error('[OrganizationService] Unexpected error:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Update an organization
 */
export async function updateOrganization(
  organizationId: string,
  updates: Partial<Organization>
): Promise<{ data: Organization | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('[OrganizationService] Error updating organization:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Organization, error: null };
  } catch (err) {
    console.error('[OrganizationService] Unexpected error:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete an organization
 */
export async function deleteOrganization(
  organizationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('organizations').delete().eq('id', organizationId);

    if (error) {
      console.error('[OrganizationService] Error deleting organization:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('[OrganizationService] Unexpected error:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Check if organization name exists
 */
export async function checkOrganizationNameExists(
  name: string,
  organizationType: OrganizationType,
  excludeId?: string
): Promise<{ exists: boolean; error: string | null }> {
  try {
    let query = supabase
      .from('organizations')
      .select('id')
      .ilike('name', name)
      .eq('organization_type', organizationType);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[OrganizationService] Error checking organization name:', error);
      return { exists: false, error: error.message };
    }

    return { exists: data !== null, error: null };
  } catch (err) {
    console.error('[OrganizationService] Unexpected error:', err);
    return { exists: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get organization by user email (checks admin_id user's email)
 */
export async function getOrganizationByEmail(
  email: string,
  organizationType?: OrganizationType
): Promise<{ data: Organization | null; error: string | null }> {
  try {
    let query = supabase.from('organizations').select('*').eq('email', email);

    if (organizationType) {
      query = query.eq('organization_type', organizationType);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[OrganizationService] Error fetching organization by email:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Organization | null, error: null };
  } catch (err) {
    console.error('[OrganizationService] Unexpected error:', err);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

export default {
  getOrganizationByAdminId,
  getOrganizationById,
  getOrganizations,
  getSchools,
  getColleges,
  getUniversities,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  checkOrganizationNameExists,
  getOrganizationByEmail,
};
