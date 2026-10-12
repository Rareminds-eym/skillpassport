/**
 * Trends Data Hook
 * Fetches trends analytics data from the API
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import { useAnalyticsFilters } from './useAnalyticsFilters';
import type { TrendsData } from '../types';

interface UseTrendsDataOptions {
  enabled?: boolean;
  orgId?: string;
  granularity?: 'monthly' | 'weekly';
}

async function fetchTrendsData(
  orgId: string,
  filters: Record<string, any>,
  granularity: 'monthly' | 'weekly'
): Promise<TrendsData> {
  const params: Record<string, string> = {
    org_id: orgId,
    granularity,
  };

  if (filters.dateRange?.from) params.from = filters.dateRange.from;
  if (filters.dateRange?.to) params.to = filters.dateRange.to;
  if (filters.departments?.length > 0) params.departments = filters.departments.join(',');
  if (filters.locations?.length > 0) params.locations = filters.locations.join(',');
  if (filters.jobTypes?.length > 0) params.jobTypes = filters.jobTypes.join(',');
  if (filters.recruiters?.length > 0) params.recruiters = filters.recruiters.join(',');

  const response = await apiGet('/recruitment/analytics/trends', params);
  return response.data;
}

export function useTrendsData(options: UseTrendsDataOptions = {}) {
  const { filters } = useAnalyticsFilters();
  const { enabled = true, orgId, granularity = 'monthly' } = options;

  const query = useQuery({
    queryKey: ['analytics', 'trends', orgId, filters, granularity],
    queryFn: () => {
      if (!orgId) throw new Error('Organization ID is required');
      return fetchTrendsData(orgId, filters, granularity);
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
