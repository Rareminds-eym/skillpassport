import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { isJwtExpiryError } from '@/shared/lib/utils/authUtils';
import { queryKeys } from '@/shared/lib/queryKeys';

/**
 * Hook for fetching active promotional event
 * Returns the most recent active promotional event within date range
 */
export const usePromotionalEvent = () => {
  return useQuery({
    queryKey: queryKeys.subscription.promotions.active(),
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('promotional_events')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // JWT errors are handled by AuthContext
        if (isJwtExpiryError(error)) {
          return null;
        }
        throw error;
      }

      return data;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
