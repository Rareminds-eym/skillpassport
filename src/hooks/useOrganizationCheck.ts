import { useCallback, useEffect, useState } from 'react';
// @ts-ignore - AuthContext is a JS file
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export type OrganizationType = 'school' | 'college' | 'university';

interface Organization {
  id: string;
  name: string;
  organization_type: OrganizationType;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
}

interface UseOrganizationCheckResult {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  hasOrganization: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to check if an admin user has an organization linked to their account.
 * Used to enforce organization creation before accessing the dashboard.
 * 
 * @param organizationType - The type of organization to check ('school', 'college', 'university')
 * @returns Object containing organization data, loading state, and whether organization exists
 */
export function useOrganizationCheck(organizationType: OrganizationType): UseOrganizationCheckResult {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find organization by admin_id and organization_type in the unified organizations table
      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('id, name, organization_type, address, city, state, country, phone, email, website, logo_url')
        .eq('admin_id', user.id)
        .eq('organization_type', organizationType)
        .maybeSingle();

      if (fetchError) {
        console.error(`[useOrganizationCheck] Error fetching ${organizationType}:`, fetchError);
        setError(`Failed to check ${organizationType} status`);
        setOrganization(null);
      } else if (data) {
        console.log(`[useOrganizationCheck] Found ${organizationType}:`, data.name);
        setOrganization(data as Organization);
      } else {
        // No organization found - this is expected for new admins
        console.log(`[useOrganizationCheck] No ${organizationType} found for user`);
        setOrganization(null);
      }
    } catch (err) {
      console.error(`[useOrganizationCheck] Unexpected error:`, err);
      setError('An unexpected error occurred');
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, organizationType]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return {
    organization,
    loading,
    error,
    hasOrganization: organization !== null,
    refetch: fetchOrganization,
  };
}

export default useOrganizationCheck;
