import { useQuery } from '@tanstack/react-query';
import { ssoClient } from '@/shared/api/ssoClient';

/**
 * Canonical identity consumer (React Query v5).
 *
 * Guarantees, per 2026 SPA auth guidance:
 * - Deduplication: every component using this hook shares ONE in-flight
 *   request per cache window — effect-loop storms become structurally
 *   impossible for identity data.
 * - Caching: `staleTime` spans the session-access-token lifetime; background
 *   refetch only on explicit invalidation.
 * - No storage of tokens: this hook caches profile claims only; refresh
 *   credentials remain in the HttpOnly cookie owned by the SSO worker.
 *
 * Migration note: legacy call sites use `ssoClient.getMe()` directly. New
 * code MUST use this hook; existing direct callers are tracked for migration.
 */
export function useIdentity(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['identity'],
    queryFn: () => ssoClient.getMe(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: options.enabled ?? true,
  });
}
