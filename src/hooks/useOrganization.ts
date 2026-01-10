/**
 * useOrganization Hook
 * 
 * A React hook for fetching and managing organization data.
 * Uses the centralized organizationService for all queries.
 */

import { useCallback, useEffect, useState } from 'react';
// @ts-ignore - AuthContext is a JS file
import { useAuth } from '../context/AuthContext';
import {
    getOrganizationByAdminId,
    getOrganizationById,
    getOrganizations,
    Organization,
    OrganizationFilters,
    OrganizationType,
} from '../services/organizationService';

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

/**
 * Hook to get the current user's organization
 */
export function useCurrentOrganization(
  organizationType?: OrganizationType
): UseOrganizationResult {
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

    const { data, error: fetchError } = await getOrganizationByAdminId(
      user.id,
      organizationType
    );

    if (fetchError) {
      setError(fetchError);
      setOrganization(null);
    } else {
      setOrganization(data);
    }

    setLoading(false);
  }, [user?.id, organizationType]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return {
    organization,
    loading,
    error,
    refetch: fetchOrganization,
  };
}

/**
 * Hook to get an organization by ID
 */
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

    const { data, error: fetchError } = await getOrganizationById(organizationId);

    if (fetchError) {
      setError(fetchError);
      setOrganization(null);
    } else {
      setOrganization(data);
    }

    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return {
    organization,
    loading,
    error,
    refetch: fetchOrganization,
  };
}

/**
 * Hook to get a list of organizations with filters
 */
export function useOrganizations(
  filters?: OrganizationFilters
): UseOrganizationsResult {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getOrganizations(filters);

    if (fetchError) {
      setError(fetchError);
      setOrganizations([]);
    } else {
      setOrganizations(data);
    }

    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    loading,
    error,
    refetch: fetchOrganizations,
  };
}

/**
 * Hook to get schools
 */
export function useSchools(
  filters?: Omit<OrganizationFilters, 'organizationType'>
): UseOrganizationsResult {
  return useOrganizations({ ...filters, organizationType: 'school' });
}

/**
 * Hook to get colleges
 */
export function useColleges(
  filters?: Omit<OrganizationFilters, 'organizationType'>
): UseOrganizationsResult {
  return useOrganizations({ ...filters, organizationType: 'college' });
}

/**
 * Hook to get universities
 */
export function useUniversities(
  filters?: Omit<OrganizationFilters, 'organizationType'>
): UseOrganizationsResult {
  return useOrganizations({ ...filters, organizationType: 'university' });
}

export default {
  useCurrentOrganization,
  useOrganizationById,
  useOrganizations,
  useSchools,
  useColleges,
  useUniversities,
};
