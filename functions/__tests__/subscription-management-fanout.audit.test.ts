import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { SKILLPASSPORT_PRODUCT_ID } from '../lib/subscription-config';

// Isolated transport measurement: no real identities, databases or network calls.
const io = vi.hoisted(() => ({ database: null as unknown, actor: '10000000-0000-4000-8000-000000000001' }));
vi.mock('../lib/auth', () => ({ getAuthInstance: () => ({
  authenticate: (handler: (request: Request, auth: unknown) => Promise<Response>) => (request: Request) =>
    handler(request, { user: { sub: io.actor, membership_status: 'active', is_email_verified: true } }),
}) }));
vi.mock('../lib/subscriptions/catalog-inventory', async importOriginal => ({
  ...await importOriginal<typeof import('../lib/subscriptions/catalog-inventory')>(),
  catalogInventoryDatabase: () => io.database,
}));
import { onRequestPost } from '../api/subscriptions/credits';
import type { PagesFunction } from '../lib/types';

const subscriptionId = '20000000-0000-4000-8000-000000000001';
describe('management credit-pool database transport growth', () => {
  it.each([1, 5, 20])('counts actual BFF database requests for %i pools', async pools => {
    const paths: string[] = [];
    const transport = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = new URL(String(input)); paths.push(url.pathname);
      if (url.pathname.endsWith('/features')) return Response.json(url.searchParams.has('id') ? [] : [{
        id: '30000000-0000-4000-8000-000000000001', feature_key: 'audit_credit', display_name: 'Audit credit',
        feature_type: 'metered', category: 'synthetic', value_options: null,
      }]);
      if (url.pathname.endsWith('/rpc/get_subscription_credit_usage')) {
        const { p_scope } = JSON.parse(String(init?.body));
        return Response.json({ ...p_scope, allocated: 10, consumed: 0, remaining: 10, asOf: '2026-11-24T00:00:00Z' });
      }
      throw new Error('Unexpected database transport request');
    });
    io.database = createClient('https://database.invalid', 'synthetic-isolated-key', {
      global: { fetch: transport }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const prepare = vi.fn(async (_token: string, productId: string, request: { poolKey: string }) => ({
      kind: 'usage', actorId: io.actor, scope: { subscriptionId, productId,
        recipient: { kind: 'subscriber', id: io.actor }, featureKey: 'audit_credit', poolKey: request.poolKey },
    }));
    await Promise.all(Array.from({ length: pools }, async (_, index) => {
      const response = await onRequestPost({
        request: new Request('https://application.invalid/api/subscriptions/credits', { method: 'POST',
          headers: { authorization: 'Bearer synthetic-isolated-token', 'content-type': 'application/json' },
          body: JSON.stringify({ kind: 'usage', subscriptionId, recipientId: io.actor, poolKey: `audit_pool_${index}` }),
        }), env: { SSO_SERVICE: { prepareSubscriptionCreditExecution: prepare } },
        params: {}, data: {}, waitUntil: vi.fn(), next: vi.fn(),
      } as unknown as Parameters<PagesFunction>[0]);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ remaining: 10, poolKey: `audit_pool_${index}` });
    }));
    const inventoryReads = paths.filter(path => path.endsWith('/features')).length;
    const usageReads = paths.filter(path => path.endsWith('/rpc/get_subscription_credit_usage')).length;
    expect(inventoryReads).toBe(0);
    expect(usageReads).toBe(pools);
    expect(prepare).toHaveBeenCalledTimes(pools);
    expect(transport).toHaveBeenCalledTimes(pools);
    console.log('POOL_QUERY_COUNTS ' + JSON.stringify({ pools, inventoryReads, usageReads, ownerPreparations: prepare.mock.calls.length }));
  });
});
