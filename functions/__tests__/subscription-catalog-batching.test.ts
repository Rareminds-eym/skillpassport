import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { SKILLPASSPORT_PRODUCT_ID } from '../lib/subscription-config';
import { readApplicationFeatureInventory } from '../lib/subscriptions/catalog-inventory';
import { publishedSubscriptionCatalogEndpoint, verifyPublishedTermsAgainstProjections } from '../lib/subscriptions/discovery';
import { readApplicationPlanProjections, type ApplicationPlanProjection } from '../lib/subscriptions/publication';
import { subscriptionAdminEndpoint } from '../lib/subscriptions/admin';

const io = vi.hoisted(() => ({ database: vi.fn(), user: {} as Record<string, unknown> }));
vi.mock('../lib/auth', () => ({ getAuthInstance: () => ({
  authenticate: (handler: (request: Request, identity: unknown) => Promise<Response>) => (request: Request) =>
    handler(request, { user: io.user }),
}) }));
vi.mock('../lib/subscriptions/catalog-inventory', async importOriginal => ({
  ...await importOriginal<typeof import('../lib/subscriptions/catalog-inventory')>(),
  catalogInventoryDatabase: io.database,
}));

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const product = SKILLPASSPORT_PRODUCT_ID;
const inventory = [
  { id: id(1), feature_key: 'capacity', display_name: 'Capacity', feature_type: 'numeric_limit', category: 'synthetic', value_options: null },
  { id: id(2), feature_key: 'choice', display_name: 'Choice', feature_type: 'enum', category: 'synthetic', value_options: ['basic'] },
  { id: id(3), feature_key: 'credits', display_name: 'Credits', feature_type: 'metered', category: 'synthetic', value_options: null },
] as const;
function projection(index: number): ApplicationPlanProjection {
  const planId = id(100 + index), revisionId = id(200 + index);
  return {
    schemaVersion: 1, bundle: {
      schemaVersion: 1, draft: {
        schemaVersion: 2, id: revisionId, revisionNumber: 1,
        plan: { id: planId, productId: product, code: `pln_${index.toString(16).padStart(32, '0')}` },
        name: 'Synthetic offer', audiences: ['individual'], purchaseMode: 'self_service',
        prices: [{ id: id(300 + index), currency: 'INR', minorUnit: 2, amountMinor: 250000,
          intervalUnit: 'year', intervalCount: 1, quantityBasis: 'subscription', audiences: ['individual'] }],
        features: [
          { key: 'capacity', type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: 0 } },
          { key: 'choice', type: 'enum', enabled: true, value: 'basic' },
          { key: 'credits', type: 'metered', enabled: true, limit: { kind: 'allocation_policy' } },
        ],
      },
      includedCredits: { schemaVersion: 1, id: id(400 + index), revisionId, funding: 'included', rules: [{
        id: id(500 + index), featureKey: 'credits', poolKey: 'synthetic', recipient: 'subscriber', audiences: ['individual'],
        quantity: { kind: 'finite', value: 10 }, cadence: { kind: 'subscription_period' },
        expiry: { kind: 'subscription_end' }, rollover: { kind: 'none' },
      }] },
    },
    entitlements: inventory.map(feature => ({ plan_id: planId, feature_id: feature.id,
      is_enabled: true, value_numeric: feature.feature_key === 'capacity' ? 0 : null,
      value_text: feature.feature_key === 'choice' ? 'basic' : null })),
  };
}
function fixture(count = 2) {
  const projections = Array.from({ length: count }, (_, index) => projection(index + 1));
  const rows = projections.map(value => ({ plan_id: value.bundle.draft.plan.id, revision_id: value.bundle.draft.id, product_id: product,
    projection: value, staged_by: id(4), staged_at: '2026-11-24T00:00:00Z' }));
  const references = projections.map(value => ({ planId: value.bundle.draft.plan.id, revisionId: value.bundle.draft.id }));
  const plans = projections.map(value => {
    const { id: revisionId, schemaVersion: _, ...draft } = structuredClone(value.bundle.draft);
    return { ...draft, revisionId, presentation: { priceLabel: 'exact' as const, taxInclusive: false, badge: null, copy: null } };
  });
  let failure = false;
  const cache = new Map<string, unknown>();
  const transport = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    expect(init?.method ?? 'GET').toBe(String(input).includes('/rpc/') ? 'POST' : 'GET');
    const url = new URL(String(input));
    if (url.pathname.endsWith('/read_subscription_read_cache')) {
      const body = JSON.parse(String(init?.body));
      return Response.json({ generation: id(900), entry: cache.get(body.p_cache_key) ?? null });
    }
    if (url.pathname.endsWith('/write_subscription_read_cache')) {
      const body = JSON.parse(String(init?.body));
      cache.set(body.p_cache_key, { payload: body.p_payload, cachedAt: new Date().toISOString() });
      return Response.json(true);
    }
    if (url.pathname.endsWith('/features')) return Response.json(url.searchParams.has('id') ? [] : inventory);
    if (url.pathname.endsWith('/subscription_plan_projections')) {
      return failure ? Response.json({ message: 'Synthetic outage' }, { status: 503 }) : Response.json(rows);
    }
    throw new Error('Unexpected database request');
  });
  const database = createClient('https://isolated.example.invalid', 'synthetic-test-key', {
    auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: transport },
  });
  return { database, transport, rows, references, plans, fail: () => { failure = true; } };
}

describe('batched application catalog verification through the real PostgREST client', () => {
  it.each([1, 22, 50])('verifies %i projections with one projection request and one inventory traversal', async count => {
    const f = fixture(count);
    f.rows.reverse();
    await expect(verifyPublishedTermsAgainstProjections(f.database, f.plans, product)).resolves.toBeUndefined();
    expect(f.transport).toHaveBeenCalledTimes(3); // Two inventory pages, independent of plan count.
    const urls = f.transport.mock.calls.map(([input]) => new URL(String(input)));
    const queries = urls.filter(url => url.pathname.endsWith('/subscription_plan_projections'));
    expect(queries).toHaveLength(1);
    expect(queries[0].searchParams.get('product_id')).toBe(`eq.${product}`);
    expect(queries[0].searchParams.get('or')).toBe('(' + f.references.map(item =>
      `and(plan_id.eq.${item.planId},revision_id.eq.${item.revisionId})`).join(',') + ')');
    expect(queries[0].searchParams.get('limit')).toBe(String(count + 1));
  });
  it('reuses the registry already read for the SSO request, without refreshing it per projection', async () => {
    const f = fixture(50);
    const definitions = await readApplicationFeatureInventory(f.database);
    f.transport.mockClear();
    await verifyPublishedTermsAgainstProjections(f.database, f.plans, product, definitions);
    expect(f.transport).toHaveBeenCalledTimes(1);
  });
  it('does no projection or feature IO for an empty catalog', async () => {
    const f = fixture(0);
    await verifyPublishedTermsAgainstProjections(f.database, [], product);
    expect(await readApplicationPlanProjections(f.database, [], product)).toEqual(new Map());
    expect(f.transport).not.toHaveBeenCalled();
  });
  it.each(['missing', 'duplicate', 'extra', 'foreign-plan', 'foreign-revision', 'foreign-product', 'cross-pair', 'swapped-projections', 'row-product'])('rejects %s readback', async defect => {
    const f = fixture();
    if (defect === 'missing') f.rows.pop();
    if (defect === 'extra') f.rows.push(f.rows[0]);
    if (defect === 'duplicate') f.rows[1] = f.rows[0];
    if (defect === 'swapped-projections') {
      [f.rows[0].projection, f.rows[1].projection] = [f.rows[1].projection, f.rows[0].projection];
    }
    if (defect === 'row-product') f.rows[0].product_id = id(999);
    const draft = f.rows[0].projection.bundle.draft;
    if (defect === 'foreign-plan') draft.plan.id = id(999);
    if (defect === 'foreign-revision') draft.id = id(999);
    if (defect === 'foreign-product') draft.plan.productId = id(999);
    if (defect === 'cross-pair') draft.plan.id = f.rows[1].projection.bundle.draft.plan.id;
    if (defect === 'foreign-plan' || defect === 'cross-pair') {
      f.rows[0].projection.entitlements.forEach(item => { item.plan_id = draft.plan.id; });
    }
    if (defect === 'foreign-revision') f.rows[0].projection.bundle.includedCredits.revisionId = draft.id;
    await expect(verifyPublishedTermsAgainstProjections(f.database, f.plans, product)).rejects.toThrow();
  });
  it.each(['price', 'name', 'feature', 'enum', 'allocation', 'staging-time', 'finite-zero', 'unresolved-contract'])('retains %s validation in the batch path', async defect => {
    const f = fixture(), row = f.rows[0], value = row.projection;
    if (defect === 'price') value.bundle.draft.prices[0].amountMinor++;
    if (defect === 'name') value.bundle.draft.name = 'Different offer';
    if (defect === 'feature') value.entitlements[0].is_enabled = false;
    if (defect === 'enum') value.entitlements[1].value_text = 'unregistered';
    if (defect === 'allocation') value.bundle.includedCredits.rules = [];
    if (defect === 'staging-time') row.staged_at = 'invalid';
    if (defect === 'finite-zero') value.entitlements[0].value_numeric = null;
    if (defect === 'unresolved-contract') value.bundle.draft.features[0] = {
      key: 'capacity', type: 'numeric_limit', enabled: false, limit: { kind: 'contract_required' },
    };
    await expect(verifyPublishedTermsAgainstProjections(f.database, f.plans, product)).rejects.toThrow();
  });
  it('surfaces storage failures once without retries or substitute success', async () => {
    const f = fixture(); f.fail();
    await expect(verifyPublishedTermsAgainstProjections(f.database, f.plans, product)).rejects.toThrow('unavailable');
    expect(f.transport).toHaveBeenCalledTimes(1);
  });
  it('rejects malformed, duplicate and oversized requests before IO', async () => {
    const f = fixture();
    await expect(readApplicationPlanProjections(f.database, [f.references[0], f.references[0]], product)).rejects.toThrow();
    await expect(readApplicationPlanProjections(f.database, [{ planId: 'bad&limit=100', revisionId: id(1) }], product)).rejects.toThrow();
    await expect(readApplicationPlanProjections(f.database, Array(51).fill(f.references[0]), product)).rejects.toThrow();
    f.plans[0].plan.productId = id(999);
    await expect(verifyPublishedTermsAgainstProjections(f.database, f.plans, product)).rejects.toThrow('product differs');
    expect(f.transport).not.toHaveBeenCalled();
  });
});

// Authentication is isolated here. These tests exercise the actual route, registry,
// batch projection validation and commercial comparison together, not live JWT verification.
describe('customer and administrative catalog route integration', () => {
  it.each(['customer', 'administrator'])('shares one inventory through the %s request', async surface => {
    const f = fixture(22), actor = id(4), platform = '00000000-0000-0000-0000-000000000001';
    const admin = surface === 'administrator';
    io.user = { sub: actor, org_id: admin ? platform : id(5), membership_status: 'active',
      is_email_verified: true, roles: [admin ? 'super_admin' : 'learner'] };
    io.database.mockReturnValue(f.database);
    const page = { schemaVersion: 1, actorId: actor, productId: product,
      tax: { kind: 'gst', rateBasisPoints: 1800, priceDisplay: 'exclusive' },
      plans: f.plans, nextCursor: f.plans.at(-1)!.plan.id,
      ...(!admin ? { audience: 'individual', subjectKind: 'user' } : {}),
    };
    const owner = vi.fn().mockResolvedValue(page);
    const handler = admin ? subscriptionAdminEndpoint('published') : publishedSubscriptionCatalogEndpoint;
    const run = () => handler({
      request: new Request('https://isolated.example.invalid/api/subscriptions/catalog', {
        headers: { authorization: 'Bearer synthetic-token' },
      }),
      env: { SSO_SERVICE: {
        listPublishedSubscriptionPlans: owner, listPublishedCatalogForAdministration: owner,
        getUserById: async () => ({ id: actor, is_blocked: false, is_email_verified: true }),
        getUserMemberships: async () => ({ memberships: [{ org_id: platform, status: 'active', roles: ['super_admin'] }] }),
      } },
    } as never);
    const response = await run();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual(admin ? page : { ...page, eligiblePlanId: null, offerAccepted: false });
    expect(owner).toHaveBeenCalledTimes(1);
    expect(f.transport).toHaveBeenCalledTimes(admin ? 3 : 5);
    if (!admin) {
      const hit = await run();
      expect(hit.status).toBe(200); expect(await hit.json()).toEqual(admin ? page : { ...page, eligiblePlanId: null, offerAccepted: false });
      expect(owner).toHaveBeenCalledTimes(1); expect(f.transport).toHaveBeenCalledTimes(6);
    }
  });
});
