import { SKILLPASSPORT_PRODUCT_ID } from '../../subscription-config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet } from '../../../api/internal/subscriptions/projection';
import { readApplicationPlanProjection, stageApplicationPlanProjection } from '../publication';
const mocks = vi.hoisted(() => ({ inventory: vi.fn(), database: vi.fn() }));
vi.mock('../catalog-inventory', () => ({ readApplicationFeatureInventory: mocks.inventory, catalogInventoryDatabase: mocks.database }));
const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const planId = id(1), revisionId = id(2), productId = SKILLPASSPORT_PRODUCT_ID, actorId = id(4);
const feature = { id: id(5), feature_key: 'capacity', feature_type: 'numeric_limit', value_options: null };
function projection() {
  return {
    schemaVersion: 1, bundle: {
      schemaVersion: 1, draft: {
        schemaVersion: 2, id: revisionId,
        plan: { id: planId, productId, code: `pln_${'a'.repeat(32)}` }, revisionNumber: 1, name: 'Synthetic',
        audiences: ['learner'], purchaseMode: 'self_service', prices: [],
        features: [{ key: 'capacity', type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: 0 } }]
      },
      includedCredits: { schemaVersion: 1, id: id(6), revisionId, funding: 'included', rules: [] }
    },
    entitlements: [{ plan_id: planId, feature_id: id(5), is_enabled: true, value_numeric: 0, value_text: null }]
  };
}
const receipt = (value = projection()) => ({ projection: value, stagedBy: actorId, stagedAt: '2026-11-19T00:00:00.123456Z' });
function database(value: unknown = receipt(), error: unknown = null) {
  const result = { data: value, error };
  const query = { select: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue(result), abortSignal: vi.fn().mockResolvedValue(result) };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  query.abortSignal.mockImplementation(() => Object.assign(Promise.resolve(result), { single: query.single }));
  return { rpc: vi.fn().mockReturnValue(query), from: vi.fn().mockReturnValue(query), query };
}
beforeEach(() => { vi.clearAllMocks(); mocks.inventory.mockResolvedValue([feature]); });
describe('immutable application projection boundary', () => {
  it('stores an explicit free offer without inventing a paid billing interval', async () => {
    const value = projection(); value.bundle.draft.purchaseMode = 'free';
    const db = database(receipt(value));
    await expect(stageApplicationPlanProjection(db as unknown as SupabaseClient, value, productId, actorId)).resolves.toEqual(receipt(value));
    expect(db.rpc).toHaveBeenCalledOnce();
  });
  it('rejects a free offer carrying a checkout price before storage', async () => {
    const value = projection(); value.bundle.draft.purchaseMode = 'free';
    value.bundle.draft.prices = [{
      id: id(12), currency: 'INR', minorUnit: 2, amountMinor: 100,
      intervalUnit: 'month', intervalCount: 1, quantityBasis: 'subscription', audiences: ['learner']
    }] as never;
    const db = database(receipt(value));
    await expect(stageApplicationPlanProjection(db as unknown as SupabaseClient, value, productId, actorId)).rejects.toThrow();
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('retains finite zero and complete immutable receipt', async () => {
    const db = database(); expect(await stageApplicationPlanProjection(db as unknown as SupabaseClient, projection(), productId, actorId)).toEqual(receipt());
    expect(db.rpc).toHaveBeenCalledWith('stage_subscription_plan_projection', { p_projection: projection(), p_product_id: productId, p_actor_id: actorId });
  });
  it('retains unlimited separately from finite zero', async () => {
    const value = projection(); value.bundle.draft.features[0].limit = { kind: 'unlimited' } as never;
    value.entitlements[0].value_numeric = null as never;
    expect((await stageApplicationPlanProjection(database(receipt(value)) as unknown as SupabaseClient, value, productId, actorId)).projection).toEqual(value);
  });
  it.each(['product', 'feature-id', 'feature-type', 'zero-null', 'contract', 'unknown', 'policy-revision'])('rejects %s before RPC', async mutation => {
    const value = projection();
    if (mutation === 'product') value.bundle.draft.plan.productId = id(8);
    if (mutation === 'feature-id') value.entitlements[0].feature_id = id(8);
    if (mutation === 'feature-type') mocks.inventory.mockResolvedValue([{ ...feature, feature_type: 'boolean' }]);
    if (mutation === 'zero-null') value.entitlements[0].value_numeric = null as never;
    if (mutation === 'contract') value.bundle.draft.features[0].limit = { kind: 'contract_required' } as never;
    if (mutation === 'unknown') Object.assign(value, { ready: true });
    if (mutation === 'policy-revision') value.bundle.includedCredits.revisionId = id(8);
    const db = database(); await expect(stageApplicationPlanProjection(db as unknown as SupabaseClient, value, productId, actorId)).rejects.toThrow();
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('stores sales-led negotiated terms display-only: the Custom limit row is disabled', async () => {
    const value = projection(); value.bundle.draft.purchaseMode = 'contact_sales';
    value.bundle.draft.features[0].limit = { kind: 'contract_required' } as never;
    value.entitlements[0] = { ...value.entitlements[0], is_enabled: false, value_numeric: null as never };
    expect((await stageApplicationPlanProjection(database(receipt(value)) as unknown as SupabaseClient, value, productId, actorId)).projection).toEqual(value);
    // An enabled NULL row would read as unlimited.
    const enabled = structuredClone(value); enabled.entitlements[0].is_enabled = true;
    const db = database(receipt(enabled));
    await expect(stageApplicationPlanProjection(db as unknown as SupabaseClient, enabled, productId, actorId)).rejects.toThrow('binding differs');
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('refuses negotiated terms on a sales-led offer that still carries a checkout price', async () => {
    const value = projection(); value.bundle.draft.purchaseMode = 'contact_sales';
    value.bundle.draft.prices = [{
      id: id(12), currency: 'INR', minorUnit: 2, amountMinor: 100,
      intervalUnit: 'month', intervalCount: 1, quantityBasis: 'subscription', audiences: ['learner']
    }] as never;
    value.bundle.draft.features[0].limit = { kind: 'contract_required' } as never;
    value.entitlements[0] = { ...value.entitlements[0], is_enabled: false, value_numeric: null as never };
    const db = database(receipt(value));
    await expect(stageApplicationPlanProjection(db as unknown as SupabaseClient, value, productId, actorId)).rejects.toThrow('sales-led');
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it.each(['actor', 'terms', 'missing', 'database'])('rejects %s acknowledgement', async mutation => {
    const result = receipt();
    if (mutation === 'actor') result.stagedBy = id(8);
    if (mutation === 'terms') result.projection.bundle.draft.name = 'Changed';
    const db = database(mutation === 'missing' ? null : result, mutation === 'database' ? { message: 'private failure' } : null);
    await expect(stageApplicationPlanProjection(db as unknown as SupabaseClient, projection(), productId, actorId)).rejects.toThrow();
  });
  it('accepts exact replay and object key order changes', async () => {
    const original = projection(); const result = receipt({ entitlements: original.entitlements, bundle: original.bundle, schemaVersion: 1 });
    const db = database(result);
    await expect(stageApplicationPlanProjection(db as unknown as SupabaseClient, original, productId, actorId)).resolves.toEqual(result);
  });
  it('binds stored readback to all owner scope columns', async () => {
    const value = receipt(); const db = database({ projection: value.projection, staged_by: actorId, staged_at: value.stagedAt });
    expect(await readApplicationPlanProjection(db as unknown as SupabaseClient, planId, revisionId, productId)).toEqual(value);
    expect(db.query.eq.mock.calls).toEqual([['plan_id', planId], ['revision_id', revisionId], ['product_id', productId]]);
    await expect(readApplicationPlanProjection(db as unknown as SupabaseClient, planId, id(8), productId)).rejects.toThrow();
  });
  it.each(['undefined', 'cyclic'])('rejects invalid %s encoding before RPC', async kind => {
    const value: Record<string, unknown> | undefined = kind === 'undefined' ? undefined : {};
    if (value) value.cycle = value;
    const db = database(); await expect(stageApplicationPlanProjection(db as unknown as SupabaseClient, value, productId, actorId)).rejects.toThrow('projection');
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('retains complete metered policy without flattening quantities', async () => {
    const value = projection();
    value.bundle.draft.features = [{ key: 'capacity', type: 'metered', enabled: true, limit: { kind: 'allocation_policy' } }] as never;
    value.entitlements[0].value_numeric = null as never;
    value.bundle.includedCredits.rules = [{
      id: id(9), featureKey: 'capacity', poolKey: 'synthetic_pool', recipient: 'subscriber',
      audiences: ['learner'], quantity: { kind: 'finite', value: 10 }, cadence: { kind: 'monthly', timePolicyId: id(10) },
      expiry: { kind: 'allocation_period_end' }, rollover: { kind: 'none' }
    }] as never;
    mocks.inventory.mockResolvedValue([{ ...feature, feature_type: 'metered' }]);
    expect((await stageApplicationPlanProjection(database(receipt(value)) as unknown as SupabaseClient, value, productId, actorId)).projection).toEqual(value);
    value.bundle.includedCredits.rules = [];
    await expect(stageApplicationPlanProjection(database(receipt(value)) as unknown as SupabaseClient, value, productId, actorId)).rejects.toThrow('Missing included allocation');
  });
  it('checks current enum options against the owning registry', async () => {
    const value = projection(); value.bundle.draft.features = [{ key: 'capacity', type: 'enum', enabled: true, value: 'basic' }] as never;
    value.entitlements[0].value_numeric = null as never; value.entitlements[0].value_text = 'basic' as never;
    mocks.inventory.mockResolvedValue([{ ...feature, feature_type: 'enum', value_options: ['basic'] }]);
    await expect(stageApplicationPlanProjection(database(receipt(value)) as unknown as SupabaseClient, value, productId, actorId)).resolves.toBeDefined();
    mocks.inventory.mockResolvedValue([{ ...feature, feature_type: 'enum', value_options: ['other'] }]);
    await expect(stageApplicationPlanProjection(database(receipt(value)) as unknown as SupabaseClient, value, productId, actorId)).rejects.toThrow();
  });
});
async function get(query: string, secret?: string, configured = 'synthetic-secret', product = productId) {
  return onRequestGet({
    request: new Request(`https://example.test/api/internal/subscriptions/projection${query}`, { headers: secret ? { Authorization: `Bearer ${secret}` } : {} }),
    env: { INTERNAL_WEBHOOK_SECRET: configured, SKILLPASSPORT_PRODUCT_ID: product }
  } as never);
}
describe('internal projection readback', () => {
  it('denies anonymous and wrong-secret requests before any database access', async () => {
    expect((await get('')).status).toBe(401); expect((await get('', 'wrong')).status).toBe(401); expect(mocks.database).not.toHaveBeenCalled();
  });
  it('fails closed when the service secret is missing', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => { });
    expect((await get('', undefined, '')).status).toBe(500); log.mockRestore();
  });
  it.each(['', '?planId=bad&revisionId=bad', `?planId=${planId}&revisionId=${revisionId}&ready=true`, `?planId=${planId}&planId=${planId}&revisionId=${revisionId}`])('rejects malformed query %s', async query => {
    expect((await get(query, 'synthetic-secret')).status).toBe(400); expect(mocks.database).not.toHaveBeenCalled();
  });
  it('returns actual owner readback with no-store', async () => {
    const result = receipt(); mocks.database.mockReturnValue(database({ projection: result.projection, staged_by: actorId, staged_at: result.stagedAt }));
    const response = await get(`?planId=${planId}&revisionId=${revisionId}`, 'synthetic-secret');
    expect(response.status).toBe(200); expect(await response.json()).toEqual(result); expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('returns bounded storage errors without raw details', async () => {
    mocks.database.mockReturnValue(database(null, { message: 'sensitive details' }));
    const response = await get(`?planId=${planId}&revisionId=${revisionId}`, 'synthetic-secret');
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('sensitive');
  });
});
