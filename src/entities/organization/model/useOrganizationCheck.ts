import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '@/shared/api/apiClient';

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

interface User {
  id: string;
  email?: string;
}

export function useOrganizationCheck(
  organizationType: OrganizationType,
  user: User | null
): UseOrganizationCheckResult {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id !== lastUserId.current) {
      hasInitialized.current = false;
      lastUserId.current = user?.id || null;
    }
  }, [user?.id]);

  const fetchOrganization = useCallback(async () => {
    if (hasInitialized.current) return;
    if (!user?.id) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ action: 'getOrganizationByAdminId', adminId: user.id, orgType: organizationType });
      const result = await apiGet<any>(`/organization?${params.toString()}`);

      if (result?.data) {
        setOrganization(result.data as Organization);
      } else {
        setOrganization(null);
      }
      hasInitialized.current = true;
    } catch (err) {
      setError(`Failed to check ${organizationType} status`);
      setOrganization(null);
      hasInitialized.current = true;
    } finally {
      setLoading(false);
    }
  }, [user?.id, organizationType]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const refetch = useCallback(async () => {
    hasInitialized.current = false;
    await fetchOrganization();
  }, [fetchOrganization]);

  return { organization, loading, error, hasOrganization: organization !== null, refetch };
}

export default useOrganizationCheck;
