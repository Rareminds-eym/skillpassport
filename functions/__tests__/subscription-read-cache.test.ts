import { createClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { readThroughSubscription, withSubscriptionReadInvalidation } from '../lib/subscriptions/read-cache';
import { readCurrentSubscriptionOwner, type ConsumerContext } from '../lib/subscriptions/current-subscription';

const gateway = vi.hoisted(() => ({ database: {} as unknown, resolve: vi.fn() }));
vi.mock('../lib/supabase', async importOriginal => ({
  ...await importOriginal<typeof import('../lib/supabase')>(),
  getServiceClient: () => gateway.database, getAuthToken: () => 'synthetic-token',
}));
vi.mock('../shared/lib/org-subscription', async importOriginal => ({
  ...await importOriginal<typeof import('../shared/lib/org-subscription')>(), resolveUserEntitlement: gateway.resolve,
}));
import { handleGetActiveSubscription } from '../api/payments/handlers/get-active-subscription';
import { SKILLPASSPORT_PRODUCT_ID } from '../lib/subscription-config';

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const scope = { actorId: id(1), organizationId: id(2), productId: id(3), roles: ['learner'] };
const schema = z.object({ schemaVersion: z.literal(1), value: z.string() }).strict();
const payload = { schemaVersion: 1 as const, value: 'Validated owner data' };
function fixture() {
  const entries = new Map<string, { payload: unknown; cachedAt: string }>();
  let generation = id(4), outage = false;
  const transport = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    expect(init?.method).toBe('POST');
    const path = new URL(String(input)).pathname;
    const body = JSON.parse(String(init?.body));
    if (outage) return Response.json({ message: 'Synthetic unavailable database' }, { status: 503 });
    if (path.endsWith('/read_subscription_read_cache')) {
      return Response.json({ generation, entry: entries.get(body.p_cache_key) ?? null });
    }
    if (path.endsWith('/write_subscription_read_cache')) {
      if (generation !== body.p_generation) return Response.json(false);
      entries.set(body.p_cache_key, { payload: body.p_payload, cachedAt: new Date().toISOString() });
      return Response.json(true);
    }
    if (path.endsWith('/invalidate_subscription_read_cache')) {
      generation = crypto.randomUUID(); entries.clear();
      return new Response(null, { status: 204 });
    }
    throw new Error('Unexpected cache request');
  });
  const database = createClient('https://isolated.example.invalid', 'synthetic-key', {
    auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: transport },
  });
  const load = vi.fn().mockResolvedValue(payload);
  const read = (resource: 'catalog' | 'current' | 'discovery' = 'catalog', identity = scope, input: unknown = { cursor: null }) =>
    readThroughSubscription(database, identity, resource, input, load, value => schema.parse(value));
  return { database, entries, transport, load, read, fail: () => { outage = true; } };
}
afterEach(() => vi.useRealTimers());
describe('cache-first subscription reads through the actual PostgREST client', () => {
  it.each(['catalog', 'discovery', 'current'] as const)('fills a %s miss once and returns subsequent hits without calling SSO', async resource => {
    const f = fixture();
    expect(await f.read(resource)).toEqual(payload);
    expect(f.transport).toHaveBeenCalledTimes(2);
    expect(await f.read(resource)).toEqual(payload);
    expect(f.transport).toHaveBeenCalledTimes(3);
    expect(f.load).toHaveBeenCalledTimes(1);
    expect(f.transport.mock.calls.every(([, init]) => !String(init?.body).includes('Bearer'))).toBe(true);
  });
  it('partitions actors, tenants, roles, products, cursors and resource types', async () => {
    const f = fixture();
    await f.read();
    await f.read('catalog', { ...scope, actorId: id(10) });
    await f.read('catalog', { ...scope, organizationId: id(10) });
    await f.read('catalog', { ...scope, productId: id(10) });
    await f.read('catalog', { ...scope, roles: ['recruiter'] });
    await f.read('catalog', scope, { cursor: id(10) });
    await f.read('discovery');
    expect(f.load).toHaveBeenCalledTimes(7);
    expect(f.entries.size).toBe(7);
    expect([...f.entries.keys()].every(key => /^[a-f0-9]{64}$/.test(key))).toBe(true);
  });
  it('uses the same key for equivalent role sets regardless of ordering', async () => {
    const f = fixture();
    await f.read('catalog', { ...scope, roles: ['learner', 'member'] });
    await f.read('catalog', { ...scope, roles: ['member', 'learner'] });
    expect(f.load).toHaveBeenCalledTimes(1);
  });
  it('refreshes expired entries and never substitutes them when the owner fails', async () => {
    const f = fixture(); await f.read();
    for (const entry of f.entries.values()) entry.cachedAt = '2000-01-01T00:00:00Z';
    f.load.mockRejectedValue(new Error('Owner unavailable'));
    await expect(f.read()).rejects.toThrow('Owner unavailable');
    expect(f.load).toHaveBeenCalledTimes(2);
    f.load.mockResolvedValue(payload);
    expect(await f.read()).toEqual(payload);
    expect(f.load).toHaveBeenCalledTimes(3);
  });
  it('surfaces cache failures without silently bypassing the cache', async () => {
    const f = fixture(); f.fail();
    await expect(f.read()).rejects.toThrow('cache unavailable');
    expect(f.load).not.toHaveBeenCalled();
  });
  it('validates hits and owner replies before returning or storing them', async () => {
    const f = fixture(); f.load.mockResolvedValue({ ...payload, fabricated: true });
    await expect(f.read()).rejects.toThrow(); expect(f.entries.size).toBe(0);
    f.load.mockResolvedValue(payload); await f.read();
    for (const entry of f.entries.values()) entry.payload = { wrong: 'schema' };
    await expect(f.read()).rejects.toThrow(); expect(f.load).toHaveBeenCalledTimes(2);
  });
  it('invalidates before and after a mutation even when its result is uncertain', async () => {
    const f = fixture(); await f.read();
    const execute = vi.fn(async () => {
      expect(f.entries.size).toBe(0);
      await f.read(); // A concurrent read during the authoritative write.
      throw new Error('Uncertain owner outcome');
    });
    await expect(withSubscriptionReadInvalidation(f.database, scope.productId, execute)).rejects.toThrow('Uncertain owner outcome');
    expect(execute).toHaveBeenCalledTimes(1); expect(f.entries.size).toBe(0);
    await f.read(); expect(f.load).toHaveBeenCalledTimes(3);
  });
  it('rejects a fill started before a concurrent invalidation', async () => {
    const f = fixture();
    f.load.mockImplementation(async () => {
      await withSubscriptionReadInvalidation(f.database, scope.productId, async () => undefined);
      return payload;
    });
    await expect(f.read()).rejects.toThrow('cache changed while loading');
    expect(f.entries.size).toBe(0); expect(f.load).toHaveBeenCalledTimes(1);
  });
  it('does not call a mutation if invalidation cannot be confirmed', async () => {
    const f = fixture(); f.fail(); const mutate = vi.fn();
    await expect(withSubscriptionReadInvalidation(f.database, scope.productId, mutate)).rejects.toThrow('invalidation unavailable');
    expect(mutate).not.toHaveBeenCalled();
  });
  it('sends the personal subject scope to both sides of a mutation invalidation', async () => {
    const f=fixture();
    await withSubscriptionReadInvalidation(f.database,scope.productId,async () => undefined,scope.actorId);
    expect(f.transport).toHaveBeenCalledTimes(2);
    for (const [,init] of f.transport.mock.calls) {
      expect(JSON.parse(String(init?.body))).toEqual({p_product_id:scope.productId,p_actor_id:scope.actorId});
    }
  });
});

describe('shared current-subscription owner reader', () => {
  it('avoids owner calls on hits and refreshes at a known subscription time boundary', async () => {
    const f = fixture(), now = Date.now(), subscription = id(20), end = now + 10000;
    const owner = vi.fn().mockResolvedValue({ schemaVersion: 1, actorId: scope.actorId, audience: 'individual', activatedAt: now - 1000,
      subscriptionEndsAt: end, pools: [], access: 'full', state: {
        id: subscription, productId: scope.productId, planId: id(21), revisionId: id(22), version: 1,
        subject: { kind: 'user', id: scope.actorId }, status: 'active', periodStartsAt: now - 1000, periodEndsAt: end,
        trialEndsAt: null, renewalEnabled: false, cancelledAt: null, paymentFailedAt: null, scheduledChange: null,
      } });
    const context = { ...scope, token: 'synthetic-token', env: { SSO_SERVICE: { getCurrentSubscriptionExecution: owner } } } as unknown as ConsumerContext;
    await readCurrentSubscriptionOwner(f.database, context, subscription);
    await readCurrentSubscriptionOwner(f.database, context, subscription);
    expect(owner).toHaveBeenCalledTimes(1);
    vi.spyOn(Date, 'now').mockReturnValue(end + 1);
    await readCurrentSubscriptionOwner(f.database, context, subscription);
    expect(owner).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });
});

it('the active-subscription HTTP gateway serves a validated second read without SSO', async () => {
  const f=fixture(), actor=scope.actorId, subscription=id(30), plan=id(31), revision=id(32);
  gateway.database=f.database;
  const candidate={ id:subscription, user_id:actor, product_id:SKILLPASSPORT_PRODUCT_ID, plan_id:plan,
    plan_revision_id:revision, status:'active', billing_cycle:'free' };
  gateway.resolve.mockImplementation((_db, _user, _identity, options)=>options.authorizeRead(candidate));
  const owner=vi.fn().mockResolvedValue({ schemaVersion:1, actorId:actor, audience:'individual', activatedAt:100,
    subscriptionEndsAt:null, pools:[], access:'full', state:{ id:subscription, productId:SKILLPASSPORT_PRODUCT_ID,
      planId:plan, revisionId:revision, version:1, subject:{kind:'user',id:actor}, status:'active',
      periodStartsAt:100, periodEndsAt:null, validity:'perpetual', trialEndsAt:null, renewalEnabled:false,
      cancelledAt:null, paymentFailedAt:null, scheduledChange:null } });
  const run=()=>handleGetActiveSubscription({ request:new Request('https://isolated.example.invalid/api/payments/get-active-subscription'),
    data:{user:{sub:actor,org_id:scope.organizationId,roles:['learner']}},
    env:{SSO_SERVICE:{getCurrentSubscriptionExecution:owner}} } as never);
  expect((await run()).status).toBe(200);
  const response=await run(); expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({data:{id:subscription,lifecycle_access:'full'}});
  expect(owner).toHaveBeenCalledTimes(1);
});
