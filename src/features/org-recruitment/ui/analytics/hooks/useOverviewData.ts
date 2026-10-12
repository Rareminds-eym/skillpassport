/**
 * Overview Data Hook
 * Fetches overview analytics data from the API
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import { useAnalyticsFilters } from './useAnalyticsFilters';
import type { OverviewData } from '../types';

interface UseOverviewDataOptions {
  enabled?: boolean;
  orgId?: string;
}

/**
 * Fetch overview analytics data
 */
async function fetchOverviewData(
  orgId: string,
  filters: Record<string, any>
): Promise<OverviewData> {
  const params: Record<string, string> = {
    org_id: orgId,
  };

  // Add filter parameters
  if (filters.dateRange?.from) params.from = filters.dateRange.from;
  if (filters.dateRange?.to) params.to = filters.dateRange.to;
  if (filters.departments?.length > 0) params.departments = filters.departments.join(',');
  if (filters.locations?.length > 0) params.locations = filters.locations.join(',');
  if (filters.jobTypes?.length > 0) params.jobTypes = filters.jobTypes.join(',');
  if (filters.recruiters?.length > 0) params.recruiters = filters.recruiters.join(',');

  console.log('[useOverviewData] Fetching with params:', params);

  const response = await apiGet('/recruitment/analytics/overview', params);
  console.log('[useOverviewData] Response:', response);

  return response.data;
}

/**
 * Hook to fetch and manage overview analytics data
 */
export function useOverviewData(options: UseOverviewDataOptions = {}) {
  const { filters } = useAnalyticsFilters();
  const { enabled = true, orgId } = options;

  const query = useQuery({
    queryKey: ['analytics', 'overview', orgId, filters],
    queryFn: () => {
      if (!orgId) throw new Error('Organization ID is required');
      return fetchOverviewData(orgId, filters);
    },
    enabled: enabled && !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
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
