/**
 * Pipeline Data Hook
 * Fetches pipeline analytics data from the API
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import { useAnalyticsFilters } from './useAnalyticsFilters';
import type { PipelineData } from '../types';

interface UsePipelineDataOptions {
  enabled?: boolean;
  orgId?: string;
}

async function fetchPipelineData(
  orgId: string,
  filters: Record<string, any>
): Promise<PipelineData> {
  const params: Record<string, string> = {
    org_id: orgId,
  };

  if (filters.dateRange?.from) params.from = filters.dateRange.from;
  if (filters.dateRange?.to) params.to = filters.dateRange.to;
  if (filters.departments?.length > 0) params.departments = filters.departments.join(',');
  if (filters.locations?.length > 0) params.locations = filters.locations.join(',');
  if (filters.jobTypes?.length > 0) params.jobTypes = filters.jobTypes.join(',');
  if (filters.recruiters?.length > 0) params.recruiters = filters.recruiters.join(',');

  const response = await apiGet('/recruitment/analytics/pipeline', params);
  return response.data;
}

export function usePipelineData(options: UsePipelineDataOptions = {}) {
  const { filters } = useAnalyticsFilters();
  const { enabled = true, orgId } = options;

  const query = useQuery({
    queryKey: ['analytics', 'pipeline', orgId, filters],
    queryFn: () => {
      if (!orgId) throw new Error('Organization ID is required');
      return fetchPipelineData(orgId, filters);
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
