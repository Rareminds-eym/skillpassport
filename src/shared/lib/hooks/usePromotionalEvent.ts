import { useQuery } from '@tanstack/react-query';
import { apiPost } from '@/shared/api/apiClient';
import { queryKeys } from '@/shared/lib/queryKeys';

/**
 * Hook for fetching active promotional event
 * Returns the most recent active promotional event within date range
 */
export const usePromotionalEvent = () => {
  return useQuery({
    queryKey: queryKeys.subscription.promotions.active(),
    queryFn: async () => {
      try {
        const data = await apiPost('/shared-widgets/actions', {
          action: 'get-promotional-event',
        });
        return data;
      } catch (error: any) {
        if (error?.code === 'UNAUTHORIZED' || error?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
