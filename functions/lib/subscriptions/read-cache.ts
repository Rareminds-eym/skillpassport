import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { isStale } from '../sync-shadow';

export class SubscriptionReadDenied extends Error {}
export interface SubscriptionReadScope {
  actorId: string;
  organizationId: string | null;
  productId: string;
  roles?: readonly string[];
}
const reference = z.string().uuid();
const envelope = z.object({ generation: reference, entry: z.object({
  payload: z.unknown(), cachedAt: z.string().datetime({ offset: true }),
}).strict().nullable() }).strict();

/** Cache-first reads only. Cache/owner failures remain failures, never stale success. */
export async function readThroughSubscription<T>(database: SupabaseClient, scope: SubscriptionReadScope,
  resource: 'catalog' | 'discovery' | 'current', input: unknown,
  load: () => Promise<unknown>, validate: (value: unknown) => T,
  current: (value: T, cachedAt: number) => boolean = () => true,
): Promise<T> {
  const product = reference.parse(scope.productId);
  const keyInput = JSON.stringify({ schemaVersion: 1, productId: product, actorId: reference.parse(scope.actorId),
    organizationId: reference.nullable().parse(scope.organizationId), roles: scope.roles === undefined ? null : [...scope.roles].sort(), resource, input });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(keyInput));
  const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const { data, error } = await database.rpc('read_subscription_read_cache', { p_product_id: product, p_actor_id: scope.actorId, p_organization_id: scope.organizationId, p_cache_key: key })
    .abortSignal(AbortSignal.timeout(15000));
  if (error) throw new Error('Subscription read cache unavailable');
  const stored = envelope.parse(data);
  if (stored.entry) {
    const cachedAt = Date.parse(stored.entry.cachedAt);
    const value = validate(stored.entry.payload);
    // Reuse the existing shadow-cache freshness policy. Future timestamps are invalid.
    if (cachedAt <= Date.now() && !isStale(stored.entry.cachedAt) && current(value, cachedAt)) return value;
  }
  const value = validate(await load());
  const written = await database.rpc('write_subscription_read_cache', {
    p_product_id: product, p_actor_id: scope.actorId, p_organization_id: scope.organizationId, p_cache_key: key, p_generation: stored.generation, p_payload: value,
  }).abortSignal(AbortSignal.timeout(15000));
  if (written.error || written.data !== true) throw new Error('Subscription cache changed while loading. Please retry.');
  return value;
}

/** Invalidate on either side of a write, including an uncertain owner outcome. */
export async function withSubscriptionReadInvalidation<T>(database: SupabaseClient, productId: string, execute: () => Promise<T>, actorId?: string): Promise<T> {
  const invalidate = async () => {
    const { error } = await database.rpc('invalidate_subscription_read_cache', { p_product_id: reference.parse(productId),
      ...(actorId === undefined ? {} : { p_actor_id: reference.parse(actorId) }) })
      .abortSignal(AbortSignal.timeout(15000));
    if (error) throw new Error('Subscription cache invalidation unavailable');
  };
  await invalidate();
  try { return await execute(); }
  finally { await invalidate(); }
}
