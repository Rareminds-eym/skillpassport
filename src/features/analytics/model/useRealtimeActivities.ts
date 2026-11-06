import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getRecentActivity } from "@/features/analytics/api/dashboardService";
import { queryKeys } from "@/shared/lib/queryKeys";
import { useUser } from "@/shared/model/authStore";
import { useOrgContext } from "@/entities/recruitment/model/useOrgContext";
import { getWSClient } from "@/shared/api/wsRealtimeClient";
export const useRealtimeActivities = (limit = 15) => {
  const user = useUser(),
    { organizationId } = useOrgContext(),
    client = useQueryClient();
  const key = [
    ...queryKeys.analytics.realtime.activities(
      organizationId || user?.orgId || "none",
    ),
    limit,
    user?.id,
    organizationId || user?.orgId,
  ];
  const query = useQuery({
    queryKey: key,
    enabled: !!user?.id,
    queryFn: async () => {
      const result = await getRecentActivity(limit);
      if (result.error) throw result.error;
      return result.data || [];
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    staleTime: 0,
  });
  useEffect(() => {
    const orgId = organizationId || user?.orgId;
    if (!orgId) return;
    const ws = getWSClient();
    // Realtime payloads are never rendered. Only the scoped HTTP response is authoritative.
    const unsubscribe = ["pipeline_candidates", "interviews"].map((table) =>
      ws.subscribe(
        table,
        { event: "*", filter: `organization_id=eq.${orgId}` },
        () =>
          void client.invalidateQueries({
            queryKey: queryKeys.analytics.realtime.all,
          }),
      ),
    );
    return () => unsubscribe.forEach((fn) => fn());
  }, [organizationId, user?.orgId, client]);
  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updatedAt: query.dataUpdatedAt,
  };
};
export const useRefreshActivities = () => {
  const client = useQueryClient();
  return () =>
    void client.invalidateQueries({
      queryKey: queryKeys.analytics.realtime.all,
    });
};
