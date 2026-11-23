import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCreditAuthoringContext } from '../credit-authoring-context';
import { catalogInventoryDatabase } from '../catalog-inventory';

const id = 'a0000000-0000-4000-8000-000000000001', productId = 'b0000000-0000-4000-8000-000000000001';
const env = { SUPABASE_URL: 'https://application.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-key' };
const pool = () => ({ key: 'learner_ai', featureKey: 'ai_credits', recipient: 'managed_learner', audiences: ['college'] });
const calendar = () => ({ id, timeZone: 'Asia/Kolkata', monthlyAnchor: 'subscription_anniversary', monthDayOverflow: 'clamp', ambiguousTime: 'reject', nonexistentTime: 'reject' });
const context = () => ({ schemaVersion: 1, plan: { id, productId, code: `pln_${'a'.repeat(32)}` }, audiences: ['college'], currencies: [{ code: 'INR', minorUnit: 2 }],
  credit: { schemaVersion: 1, pools: [pool()], timePolicies: [calendar()] } });
let transport = vi.fn<typeof fetch>();
beforeEach(() => {
  transport = vi.fn<typeof fetch>().mockImplementation(async input => new Response(JSON.stringify(
    new URL(String(input)).searchParams.has('id') ? [] : [{ id, feature_key: 'ai_credits', display_name: 'AI credits', feature_type: 'metered', value_options: null, category: 'ai' }],
  ))); vi.stubGlobal('fetch', transport);
});
afterEach(() => vi.unstubAllGlobals());
const binding = () => ({ getSubscriptionCreditAuthoringContext: vi.fn().mockResolvedValue(context()) });

describe('credit authoring owner boundary through installed SDK', () => {
  it('joins explicit canonical pool definitions to app-owned metered feature definitions', async () => {
    const sso = binding();
    const result = await loadCreditAuthoringContext(sso, catalogInventoryDatabase(env), id.toUpperCase(), productId);
    expect(result).toEqual({ ...context(), features: [{ id, key: 'ai_credits', name: 'AI credits', type: 'metered', category: 'ai' }] });
    expect(sso.getSubscriptionCreditAuthoringContext).toHaveBeenCalledExactlyOnceWith(id);
    expect(new URL(String(transport.mock.calls[0][0])).pathname).toBe('/rest/v1/features');
  });
  it.each([
    { value: null, reason: 'Expected object' },
    { value: { ...context(), plan: { ...context().plan, id: productId } }, reason: 'requested plan' },
    { value: { ...context(), credit: undefined }, reason: 'Required' },
    { value: { ...context(), credit: { ...context().credit, pools: [pool(), pool()] } }, reason: 'Invalid input' },
    { value: { ...context(), credit: { ...context().credit, pools: [{ ...pool(), audiences: ['school'] }] } }, reason: 'canonical audience scope' },
    { value: { ...context(), credit: { ...context().credit, rolloverApprovalIds: [id] } }, reason: 'Unrecognized key' },
    { value: { ...context(), credit: { ...context().credit, timePolicies: [calendar(), { ...calendar(), id: id.toUpperCase() }] } }, reason: 'Invalid input' },
    { value: { ...context(), credit: { ...context().credit, timePolicies: [{ ...calendar(), timeZone: '+05:30' }] } }, reason: 'Invalid input' },
    { value: { ...context(), credit: { ...context().credit, timePolicies: [{ ...calendar(), timeZone: 'Invalid/Zone' }] } }, reason: 'Invalid input' },
    { value: { ...context(), credit: { ...context().credit, timePolicies: [{ ...calendar(), monthDayOverflow: undefined }] } }, reason: 'Required' },
  ])('rejects untrusted inconsistent owner data before app IO %j', async ({ value, reason }) => {
    const sso = binding(); sso.getSubscriptionCreditAuthoringContext.mockResolvedValue(value);
    await expect(loadCreditAuthoringContext(sso, catalogInventoryDatabase(env), id, productId)).rejects.toThrow(reason);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each(['boolean', 'numeric_limit', 'absent'])('rejects a pool bound to a non-metered or absent feature %s', async type => {
    transport.mockImplementation(async input => new Response(JSON.stringify(
      type === 'absent' || new URL(String(input)).searchParams.has('id') ? []
        : [{ id, feature_key: 'ai_credits', display_name: 'AI credits', feature_type: type, value_options: null, category: 'ai' }],
    )));
    await expect(loadCreditAuthoringContext(binding(), catalogInventoryDatabase(env), id, productId)).rejects.toThrow('app-owned metered feature');
  });
  it('rejects another product before app reads', async () => {
    await expect(loadCreditAuthoringContext(binding(), catalogInventoryDatabase(env), id, id)).rejects.toThrow('another product');
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([{ plan: 'bad', product: productId }, { plan: id, product: '' }])('rejects invalid runtime/request IDs before both owners %j', async value => {
    const sso = binding();
    await expect(loadCreditAuthoringContext(sso, catalogInventoryDatabase(env), value.plan, value.product)).rejects.toThrow('Invalid uuid');
    expect(sso.getSubscriptionCreditAuthoringContext).not.toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled();
  });
  it('surfaces owner failure without partial context, alternate source or SDK retry', async () => {
    transport.mockResolvedValue(new Response('{}', { status: 503 }));
    await expect(loadCreditAuthoringContext(binding(), catalogInventoryDatabase(env), id, productId)).rejects.toThrow('feature inventory is unavailable');
    expect(transport).toHaveBeenCalledTimes(1);
    transport.mockClear(); const sso = binding(); sso.getSubscriptionCreditAuthoringContext.mockRejectedValueOnce(new Error('Synthetic SSO failure'));
    await expect(loadCreditAuthoringContext(sso, catalogInventoryDatabase(env), id, productId)).rejects.toThrow('Synthetic SSO failure');
    expect(transport).not.toHaveBeenCalled();
  });
});
