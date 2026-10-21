/**
 * Jobs Data Hook
 * Fetches jobs analytics data from the API
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import { useAnalyticsFilters } from './useAnalyticsFilters';
import type { JobsData } from '../types';

interface UseJobsDataOptions {
  enabled?: boolean;
  orgId?: string;
}

async function fetchJobsData(
  orgId: string,
  filters: Record<string, any>
): Promise<JobsData> {
  const params: Record<string, string> = {
    org_id: orgId,
  };

  if (filters.dateRange?.from) params.from = filters.dateRange.from;
  if (filters.dateRange?.to) params.to = filters.dateRange.to;
  if (filters.departments?.length > 0) params.departments = filters.departments.join(',');
  if (filters.locations?.length > 0) params.locations = filters.locations.join(',');
  if (filters.jobTypes?.length > 0) params.jobTypes = filters.jobTypes.join(',');

  const response = await apiGet('/recruitment/analytics/jobs', params);
  return response.data;
}

export function useJobsData(options: UseJobsDataOptions = {}) {
  const { filters } = useAnalyticsFilters();
  const { enabled = true, orgId } = options;

  const query = useQuery({
    queryKey: ['analytics', 'jobs', orgId, filters],
    queryFn: () => {
      if (!orgId) throw new Error('Organization ID is required');
      return fetchJobsData(orgId, filters);
    },
    enabled: enabled && !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
