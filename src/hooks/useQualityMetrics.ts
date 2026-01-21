import { useQuery } from '@tanstack/react-query';
import { FunnelRangePreset, getQualityMetrics } from '../services/analyticsService';

interface UseQualityMetricsOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

/**
 * Hook for fetching quality metrics (hired candidates only)
 * Returns total hired, avg AI score, avg CGPA, and gender diversity
 */
export const useQualityMetrics = ({
  preset,
  startDate,
  endDate,
  enabled = true,
}: UseQualityMetricsOptions) => {
  return useQuery({
    queryKey: ['quality-metrics', { preset, startDate, endDate }],
    queryFn: async () => {
      const { data, error } = await getQualityMetrics(preset, startDate, endDate);
      if (error) throw error;
      return data;
    },
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    placeholderData: (previousData: any) => previousData,
  });
};
