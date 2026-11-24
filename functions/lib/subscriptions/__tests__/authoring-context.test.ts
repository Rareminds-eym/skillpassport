import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPlanAuthoringContext } from '../authoring-context';
import { catalogInventoryDatabase } from '../catalog-inventory';

const id = 'a0000000-0000-4000-8000-000000000001', productId = 'b0000000-0000-4000-8000-000000000001';
const env = { SUPABASE_URL: 'https://application.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-key' };
const context = () => ({ schemaVersion: 1, plan: { id, productId, code: `pln_${'a'.repeat(32)}` }, audiences: ['college'], currencies: [{ code: 'INR', minorUnit: 2 }] });
let transport = vi.fn<typeof fetch>();
beforeEach(() => {
  transport = vi.fn<typeof fetch>().mockImplementation(async input => new Response(JSON.stringify(
    new URL(String(input)).searchParams.has('id') ? [] : [{ id, feature_key: 'ai_credits', display_name: 'AI credits', feature_type: 'metered', value_options: null, category: 'ai' }],
  ))); vi.stubGlobal('fetch', transport);
});
afterEach(() => vi.unstubAllGlobals());
const binding = () => ({ getSubscriptionPlanAuthoringContext: vi.fn().mockResolvedValue(context()) });

describe('authoring context owner boundary', () => {
  it('combines canonical settings with the real SDK typed-feature reader', async () => {
    const sso = binding();
    const result = await loadPlanAuthoringContext(sso, catalogInventoryDatabase(env), id.toUpperCase(), productId);
    expect(result).toEqual({ ...context(), features: [{ id, key: 'ai_credits', name: 'AI credits', type: 'metered', category: 'ai' }] });
    expect(sso.getSubscriptionPlanAuthoringContext).toHaveBeenCalledExactlyOnceWith(id);
    expect(new URL(String(transport.mock.calls[0][0])).pathname).toBe('/rest/v1/features');
  });
  it('rejects invalid plan IDs before either owner lookup', async () => {
    const sso = binding();
    await expect(loadPlanAuthoringContext(sso, catalogInventoryDatabase(env), 'invalid', productId)).rejects.toThrow('Invalid uuid');
    expect(sso.getSubscriptionPlanAuthoringContext).not.toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    { value: null, reason: 'Expected object' },
    { value: { ...context(), plan: { ...context().plan, id: productId } }, reason: 'requested plan' },
    { value: { ...context(), currencies: [] }, reason: 'at least 1' },
    { value: { ...context(), currencies: [context().currencies[0], context().currencies[0]] }, reason: 'Invalid input' },
    { value: { ...context(), audiences: ['college', 'college'] }, reason: 'Invalid input' },
    { value: { ...context(), plan: { ...context().plan, code: 'hybrid' } }, reason: 'Invalid' },
    { value: { ...context(), registry: {} }, reason: 'Unrecognized key' },
  ])('rejects malformed owner settings for the intended reason %j', async ({ value, reason }) => {
    const sso = binding(); sso.getSubscriptionPlanAuthoringContext.mockResolvedValue(value);
    await expect(loadPlanAuthoringContext(sso, catalogInventoryDatabase(env), id, productId)).rejects.toThrow(reason);
  });
  it('does not turn either owner failure into empty or partial configuration', async () => {
    transport.mockResolvedValue(new Response('{}', { status: 503 }));
    await expect(loadPlanAuthoringContext(binding(), catalogInventoryDatabase(env), id, productId)).rejects.toThrow('feature inventory is unavailable');
    expect(transport).toHaveBeenCalledTimes(1);
    transport.mockResolvedValue(new Response('[]')); const sso = binding();
    sso.getSubscriptionPlanAuthoringContext.mockRejectedValue(new Error('Synthetic SSO failure'));
    await expect(loadPlanAuthoringContext(sso, catalogInventoryDatabase(env), id, productId)).rejects.toThrow('Synthetic SSO failure');
  });
  it('rejects another product before reading application feature definitions', async () => {
    await expect(loadPlanAuthoringContext(binding(), catalogInventoryDatabase(env), id, id)).rejects.toThrow('another product');
    expect(transport).not.toHaveBeenCalled();
  });
  it('requires an explicit valid runtime product reference before either owner lookup', async () => {
    const sso = binding();
    await expect(loadPlanAuthoringContext(sso, catalogInventoryDatabase(env), id, '')).rejects.toThrow('Invalid uuid');
    expect(sso.getSubscriptionPlanAuthoringContext).not.toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled();
  });
});
