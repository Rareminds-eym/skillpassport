import { useEffect, useRef } from 'react';
import { hashKey, QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loadBeforeDeadline, pollExhausted, processingTimeout, MAX_PROCESSING_MS, type PollBudget, type PendingResult } from './polling';
import { recommendationKeys } from '@/shared/lib/queryKeys/recommendations';
import { loadRecommendationRevision } from '@/shared/api/recommendationRevision';

// Provider lifetime covers saves while every recommendation widget is hidden
// or unmounted. Learner UUIDs scope resets across that learner's cached options;
// other learners and unrelated feature caches remain intact.
const bridges = new WeakMap<QueryClient, { users: number; listener: EventListener; channel?: BroadcastChannel }>();
type Observer = { current: { keyHash: string; allowed: boolean } };
const observers = new WeakMap<QueryClient, Map<string, Set<Observer>>>();
type Cooldown = { retryAt: number; error: Error };
function hasLiveObserver(client: QueryClient, keyHash: string) {
  return [...(observers.get(client)?.get(keyHash) || [])].some(observer =>
    observer.current.allowed && observer.current.keyHash === keyHash);
}
const refreshes = new WeakMap<QueryClient, Map<string, Promise<unknown>>>();

export function useRecommendationSaveBridge(client: QueryClient) {
  useEffect(() => {
    let bridge = bridges.get(client);
    if (!bridge) {
      const reset = (learnerId: unknown) => {
        if (typeof learnerId !== 'string' || !learnerId) return;
        void client.resetQueries({ predicate: query =>
          query.queryKey[0] === recommendationKeys.all[0] && query.queryKey[3] === learnerId,
        });
      };
      const channel = typeof window.BroadcastChannel === 'function' ? new window.BroadcastChannel('learner-recommendations-v1') : undefined;
      if (channel) channel.onmessage = event => reset(event.data?.learnerId);
      const listener: EventListener = event => {
        const learnerId = (event as CustomEvent).detail?.learnerId;
        if (typeof learnerId !== 'string' || !learnerId) return;
        reset(learnerId);
        channel?.postMessage({ learnerId });
      };
      bridge = { users: 0, listener, channel };
      bridges.set(client, bridge);
      window.addEventListener('learner-profile-updated', listener);
    }
    bridge.users++;
    return () => {
      if (--bridge!.users === 0) {
        window.removeEventListener('learner-profile-updated', bridge!.listener);
        bridge!.channel?.close();
        bridges.delete(client);
      }
    };
  }, [client]);
}

export function useRecommendationQuery<T>({ actorId, orgId, learnerId, surface, limit = 20, profileRevision = '', enabled, autoFetch = true, pending, load }: {
  actorId: string; orgId: string; learnerId: string; surface: 'semantic' | 'dashboard';
  limit?: number; profileRevision?: string; enabled: boolean; autoFetch?: boolean;
  pending?: (data: T | undefined) => PendingResult | null;
  load: (signal: AbortSignal, force: boolean) => Promise<T>;
}) {
  const client = useQueryClient();
  const key = recommendationKeys.result(actorId, orgId, learnerId, surface, { limit, profileRevision });
  const keyHash = hashKey(key);
  const allowed = enabled && Boolean(actorId && learnerId);
  // Endpoint cooldown is separate from result caches, so a save/reset or new
  // limit/profile revision cannot discard Retry-After. Logout clears it with
  // the existing QueryClient.clear(). No recommendation records live here.
  const policyKey = recommendationKeys.requestPolicy(actorId, orgId, surface);
  const policy = useQuery<Cooldown | null>({ queryKey: policyKey, queryFn: () => null,
    enabled: false, staleTime: Infinity, gcTime: Infinity });
  const coolingDown = Boolean(policy.data && policy.data.retryAt > Date.now());
  const pollKey = [...key, 'poll-budget'] as const;
  const budget = useQuery<PollBudget | null>({ queryKey: pollKey, queryFn: () => null,
    enabled: false, staleTime: Infinity, gcTime: 300_000 });
  const exhausted = pollExhausted(budget.data);
  const runLoad = async (signal: AbortSignal, force: boolean) => {
    const current = client.getQueryData<Cooldown>(policyKey);
    if (current && current.retryAt > Date.now()) throw current.error;
    const previous = client.getQueryData<PollBudget>(pollKey);
    const cached = client.getQueryData<T>(key);
    if (previous && pending?.(cached)) {
      if (pollExhausted(previous)) throw processingTimeout();
      if (Date.now() < previous.nextAt) return cached as T;
    }
    try {
      // Polls always use ordinary reads, including after a forced first request.
      const value = previous
        ? await loadBeforeDeadline(inner => load(inner, false), signal, previous.startedAt + MAX_PROCESSING_MS)
        : await load(signal, force);
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (current && client.getQueryData(policyKey) === current) client.setQueryData(policyKey, null);
      const waiting = pending?.(value);
      if (waiting) client.setQueryData<PollBudget>(pollKey, {
        startedAt: previous?.startedAt ?? Date.now(), responses: (previous?.responses || 0) + 1,
        nextAt: Math.max(Date.now() + waiting.retryAfterSeconds * 1000, waiting.retryAt || 0),
      });
      else if (previous) client.setQueryData(pollKey, null);
      return value;
    } catch (error) {
      const failure = error as Error & { status?: number; retryAt?: number };
      if (failure.status === 429 && failure.retryAt && failure.retryAt > Date.now()) {
        client.setQueryData<Cooldown>(policyKey, old => old && old.retryAt > failure.retryAt! ? old : { retryAt: failure.retryAt!, error: failure });
      }
      throw error;
    }
  };
  const active = useRef({ keyHash, allowed });
  active.current = { keyHash, allowed };
  useEffect(() => {
    active.current = { keyHash, allowed };
    let scopes = observers.get(client);
    if (!scopes) { scopes = new Map(); observers.set(client, scopes); }
    let group = scopes.get(keyHash);
    if (!group) { group = new Set(); scopes.set(keyHash, group); }
    group.add(active);
    return () => {
      active.current.allowed = false;
      group!.delete(active);
      if (!group!.size) scopes!.delete(keyHash);
    };
  }, [client, keyHash, allowed]);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => runLoad(signal, false),
    enabled: allowed && (autoFetch || Boolean(budget.data)) && !coolingDown && !exhausted,
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: observed => {
      const progress = client.getQueryData<PollBudget>(pollKey);
      if (!pending?.(observed.state.data) || observed.state.error || !progress || pollExhausted(progress)) return false;
      return Math.max(1, Math.min(progress.nextAt, progress.startedAt + MAX_PROCESSING_MS) - Date.now());
    },
    placeholderData: undefined,
    // A source revision conflict permits one restart; provider/auth/rate errors
    // and profile-needed successful responses never trigger retry loops.
    retry: (count, error) => count < 1 && (error as { status?: number }).status === 409,
    retryDelay: 0,
  });

  // Cheap metadata reads cover approval/import/server-side producers and other
  // tabs without forcing embeddings when the source revision is unchanged.
  const revision = useQuery({
    queryKey: ['job-recommendation-revision', actorId, orgId, learnerId],
    enabled: allowed && (autoFetch || Boolean(query.data)), staleTime: 30_000, gcTime: 300_000,
    refetchInterval: 30_000, refetchOnWindowFocus: true, refetchOnReconnect: true, retry: false,
    queryFn: async ({ signal }) => {
      const latest = await loadRecommendationRevision(learnerId, signal);
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const stale = client.getQueryCache().findAll({ predicate: entry => {
        const scope = entry.queryKey;
        if (scope[0] !== recommendationKeys.all[0] || scope[1] !== actorId || scope[2] !== orgId || scope[3] !== learnerId || scope.length !== 7) return false;
        const data = entry.state.data as { input_revision?: string; catalog_revision?: string; envelope?: { input_revision?: string; catalog_revision?: string } } | undefined;
        const previous = data?.envelope?.input_revision ?? data?.input_revision;
        const catalog = data?.envelope?.catalog_revision ?? data?.catalog_revision;
        return Boolean((previous && /^\d+$/.test(previous) && BigInt(previous) < BigInt(latest.inputRevision)) || (catalog && /^\d+$/.test(catalog) && BigInt(catalog) < BigInt(latest.catalogRevision)));
      } });
      if (stale.length) await client.resetQueries({ predicate: entry => stale.some(old => hashKey(entry.queryKey.slice(0, 7)) === hashKey(old.queryKey)) });
      return latest;
    },
  });

  useEffect(() => {
    if (allowed) return;
    const existing = client.getQueryCache().find({ queryKey: key, exact: true });
    // A hidden widget must not cancel work still needed by another observer.
    if (existing && !hasLiveObserver(client, keyHash)) void client.cancelQueries({ queryKey: key, exact: true });
  }, [client, allowed, keyHash]);

  const mutation = useMutation({
    mutationKey: [...key, 'regenerate'],
    retry: false,
    mutationFn: async () => {
      if (revision.error) {
        const checked = await revision.refetch();
        if (checked.error) throw checked.error;
      }
      await client.cancelQueries({ queryKey: key, exact: true });
      if (!hasLiveObserver(client, keyHash)) return;
      client.setQueryData(pollKey, null);
      return client.fetchQuery({ queryKey: key, queryFn: ({ signal }) => runLoad(signal, true), staleTime: 0, retry: false });
    },
  });

  const refresh = () => {
    if (!allowed) return Promise.resolve();
    const progress = client.getQueryData<PollBudget>(pollKey);
    if (pending?.(client.getQueryData<T>(key)) && progress && !pollExhausted(progress) && !client.getQueryState(key)?.error) return Promise.resolve();
    const retryAt = client.getQueryData<Cooldown>(policyKey)?.retryAt;
    if (retryAt && Date.now() < retryAt) return Promise.resolve();
    let flights = refreshes.get(client);
    if (!flights) { flights = new Map(); refreshes.set(client, flights); }
    const existing = flights.get(keyHash);
    if (existing) return existing;
    const promise = mutation.mutateAsync().catch(() => undefined).finally(() => {
      if (flights!.get(keyHash) === promise) flights!.delete(keyHash);
    });
    flights.set(keyHash, promise);
    return promise;
  };

  const error = query.error || revision.error || (coolingDown ? policy.data?.error : null) || (exhausted ? processingTimeout() : null);
  const waiting = !error ? pending?.(query.data) : null;
  const denied = [401, 403].includes((error as { status?: number } | null)?.status || 0);
  return {
    data: allowed && !denied ? query.data : undefined,
    loading: allowed && (query.isFetching || Boolean(waiting)),
    processing: allowed ? waiting?.state || null : null,
    error: allowed && error ? error.message : null,
    refresh,
  };
}
