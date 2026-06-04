import { useCallback, useEffect, useState } from 'react';
import {
  getOrganizationByAdminId,
  getOrganizationById,
  getOrganizations,
  Organization,
  OrganizationFilters,
  OrganizationType,
} from '@/entities/organization';

interface UseOrganizationResult {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseOrganizationsResult {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface User {
  id: string;
  email?: string;
}

export function useCurrentOrganization(
  user: User | null,
  organizationType?: OrganizationType
): UseOrganizationResult {
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
      const data = await getOrganizationByAdminId(user.id, organizationType);
      setOrganization(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch organization');
      setOrganization(null);
    }
    setLoading(false);
  }, [user?.id, organizationType]);

  useEffect(() => { fetchOrganization(); }, [fetchOrganization]);

  return { organization, loading, error, refetch: fetchOrganization };
}

export function useOrganizationById(
  organizationId: string | null | undefined
): UseOrganizationResult {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      setOrganization(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getOrganizationById(organizationId);
      setOrganization(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch organization');
      setOrganization(null);
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { fetchOrganization(); }, [fetchOrganization]);

  return { organization, loading, error, refetch: fetchOrganization };
}

export function useOrganizations(
  filters?: OrganizationFilters
): UseOrganizationsResult {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrganizations(filters);
      setOrganizations(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch organizations');
      setOrganizations([]);
    }
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchOrganizations(); }, [fetchOrganizations]);

  return { organizations, loading, error, refetch: fetchOrganizations };
}

export function useSchools(
  filters?: Omit<OrganizationFilters, 'organizationType'>
): UseOrganizationsResult {
  return useOrganizations({ ...filters, organizationType: 'school' });
}

export function useColleges(
  filters?: Omit<OrganizationFilters, 'organizationType'>
): UseOrganizationsResult {
  return useOrganizations({ ...filters, organizationType: 'college' });
}

export function useUniversities(
  filters?: Omit<OrganizationFilters, 'organizationType'>
): UseOrganizationsResult {
  return useOrganizations({ ...filters, organizationType: 'university' });
}

export default {
  useCurrentOrganization, useOrganizationById, useOrganizations,
  useSchools, useColleges, useUniversities,
};
