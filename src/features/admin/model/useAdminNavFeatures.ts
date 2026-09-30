import { useQuery } from '@tanstack/react-query';

import { useUser } from '@/shared/model/authStore';
import { apiGet } from '@/shared/api/apiClient';

/**
 * One row of the admin-dashboard nav feature catalog (synced from sso-worker's
 * public.feature_keys — see functions/api/admin-nav-features.ts). Maps a
 * nav item's path to the Hybrid-plan feature key that gates it.
 */
export interface AdminNavFeature {
  key: string;
  role: string;
  nav_group: string | null;
  nav_label: string;
  nav_path: string;
  display_order: number;
}

const STALE_TIME = 30 * 60 * 1000; // 30 minutes — this catalog changes rarely

/**
 * Fetches the admin-dashboard nav feature catalog for the given role.
 *
 * Used by Sidebar.tsx to decide which nav items a Hybrid-plan org's
 * subscription grants access to, by matching each nav item's `path` against
 * a catalog row's `nav_path` — nothing about which keys exist or what they
 * unlock is hardcoded in the frontend; it all comes from this catalog.
 */
export function useAdminNavFeatures(role: string | null | undefined) {
  const user = useUser();
  const query = useQuery<{ featureKeys: AdminNavFeature[]; isHybrid: boolean; features: string[] }>({
    queryKey: ['admin-nav-features', user?.id, user?.orgId, role],
    queryFn: async () => {
      const response: any = await apiGet(`/admin-nav-features?role=${encodeURIComponent(role as string)}`);
      return response.data;
    },
    enabled: !!user && ['college_admin', 'school_admin', 'university_admin'].includes(role || ''),
    staleTime: 60_000,
    gcTime: STALE_TIME,
    refetchOnWindowFocus: true,
  });

  return {
    navFeatures: query.data?.featureKeys || [],
    isHybrid: query.data?.isHybrid ?? false,
    features: query.data?.features || [],
    ready: !!query.data && !query.isError,
    loading: query.isLoading,
    error: query.error,
  };
}
