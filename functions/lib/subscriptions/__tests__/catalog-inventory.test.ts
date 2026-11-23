import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogInventoryDatabase, loadSubscriptionCatalogInventory } from '../catalog-inventory';

const env = { SUPABASE_URL: 'https://application.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-key' };
const id = (value: number) => `a0000000-0000-4000-8000-${value.toString(16).padStart(12, '0')}`;
const item = (value = 1) => ({ id: id(value), feature_key: `feature_${value}`, display_name: `Feature ${value}`, feature_type: 'boolean', value_options: null, category: 'learning' });
const catalog = () => ({ schemaVersion: 1, plans: [{ id: id(1), code: 'hybrid', productId: null, name: 'Existing name', isActive: true, applicableEntities: ['college'] }] });
let transport = vi.fn<typeof fetch>();
beforeEach(() => {
  transport = vi.fn<typeof fetch>().mockImplementation(async input => new Response(JSON.stringify(
    new URL(String(input)).searchParams.has('id') ? [] : [item()],
  ), { headers: { 'Content-Type': 'application/json' } }));
  vi.stubGlobal('fetch', transport);
});
afterEach(() => vi.unstubAllGlobals());
const binding = () => ({ getSubscriptionCatalogInventory: vi.fn().mockResolvedValue(catalog()) });

describe('owner-backed subscription catalog inventory', () => {
  it('preserves a configured unordered enum domain', async () => {
    transport.mockResolvedValueOnce(Response.json([{ ...item(), feature_type: 'enum', value_options: ['option_b', 'option_a'] }]))
      .mockResolvedValueOnce(Response.json([]));
    const result = await loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env));
    expect(result.features[0]).toMatchObject({ type: 'enum', options: ['option_b', 'option_a'] });
  });
  it.each([{ options: null }, { options: [] }, { options: ['same', 'same'] }, { options: [' leading'] }, { options: [null] }])('rejects malformed enum domains %j', async ({ options }) => {
    transport.mockResolvedValueOnce(Response.json([{ ...item(), feature_type: 'enum', value_options: options }]));
    await expect(loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env))).rejects.toThrow();
  });
  it('rejects option domains on non-enum types and absent schema columns', async () => {
    transport.mockResolvedValueOnce(Response.json([{ ...item(), value_options: ['unexpected'] }]));
    await expect(loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env))).rejects.toThrow('Invalid feature option domain');
    const { value_options, ...missing } = item();
    transport.mockResolvedValueOnce(Response.json([missing]));
    await expect(loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env))).rejects.toThrow();
  });
  it('uses the actual Supabase SDK against the explicit application target and returns typed definitions', async () => {
    const sso = binding();
    const result = await loadSubscriptionCatalogInventory(sso, catalogInventoryDatabase(env));
    expect(result).toEqual({ ...catalog(), features: [{ id: id(1), key: 'feature_1', name: 'Feature 1', type: 'boolean', category: 'learning' }] });
    expect(sso.getSubscriptionCatalogInventory).toHaveBeenCalledExactlyOnceWith();
    const url = new URL(String(transport.mock.calls[0][0]));
    expect(url.origin).toBe(env.SUPABASE_URL);
    expect(url.pathname).toBe('/rest/v1/features');
    expect(url.searchParams.get('select')).toBe('id,feature_key,display_name,feature_type,category,value_options');
    expect(transport.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('reads past a complete feature page using a UUID cursor', async () => {
    transport.mockResolvedValueOnce(new Response(JSON.stringify(Array.from({ length: 200 }, (_, i) => item(i + 1)))))
      .mockResolvedValueOnce(new Response(JSON.stringify([item(201)])));
    const result = await loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env));
    expect(result.features).toHaveLength(201);
    expect(new URL(String(transport.mock.calls[1][0])).searchParams.get('id')).toBe(`gt.${id(200)}`);
  });

  it('continues when the application server caps a page below the requested size', async () => {
    transport.mockResolvedValueOnce(new Response(JSON.stringify([item(1)])))
      .mockResolvedValueOnce(new Response(JSON.stringify([item(2)])))
      .mockResolvedValueOnce(new Response('[]'));
    const result = await loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env));
    expect(result.features.map(feature => feature.id)).toEqual([id(1), id(2)]);
    expect(transport).toHaveBeenCalledTimes(3);
  });

  it.each([
    {}, { VITE_SUPABASE_URL: env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: 'another-target-key' },
    { ...env, SUPABASE_SERVICE_ROLE_KEY: '' }, { ...env, SUPABASE_URL: 'ftp://application.invalid' },
    { ...env, SUPABASE_SERVICE_ROLE_KEY: ' ' }, { ...env, SUPABASE_URL: ` ${env.SUPABASE_URL}` },
    { ...env, SUPABASE_URL: 'https://user:synthetic@example.invalid' },
  ])('rejects missing or ambiguous owner configuration without substituting another target %j', configuration => {
    expect(() => catalogInventoryDatabase(configuration)).toThrow();
    expect(transport).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, reason: 'Expected array, received null' },
    { data: [{ ...item(), feature_type: 'navigation' }], reason: 'Invalid enum value' },
    { data: [{ ...item(), id: 'invalid' }], reason: 'Invalid uuid' },
    { data: [item(), { ...item(2), feature_key: item().feature_key }], reason: 'Application feature inventory is inconsistent' },
    { data: [item(2), item(1)], reason: 'Application feature inventory is inconsistent' },
  ])('rejects malformed or inconsistent feature data for the intended reason %j', async ({ data, reason }) => {
    transport.mockResolvedValue(new Response(JSON.stringify(data)));
    await expect(loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env))).rejects.toThrow(reason);
  });

  it.each([
    { response: null, reason: 'Expected object, received null' },
    { response: { plans: [] }, reason: 'Invalid literal value' },
    { response: { ...catalog(), schemaVersion: 2 }, reason: 'Invalid literal value' },
    { response: { ...catalog(), plans: [catalog().plans[0], catalog().plans[0]] }, reason: 'Canonical plan inventory is inconsistent' },
    { response: { ...catalog(), plans: [catalog().plans[0], { ...catalog().plans[0], id: id(2) }] }, reason: 'Canonical plan inventory is inconsistent' },
  ])('rejects malformed, duplicate or unsupported canonical responses for the intended reason %j', async ({ response, reason }) => {
    const sso = binding(); sso.getSubscriptionCatalogInventory.mockResolvedValue(response);
    await expect(loadSubscriptionCatalogInventory(sso, catalogInventoryDatabase(env))).rejects.toThrow(reason);
  });

  it('surfaces either owner failure without cached, empty or partial success', async () => {
    transport.mockResolvedValue(new Response(JSON.stringify({ message: 'Synthetic internal detail' }), { status: 403 }));
    await expect(loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env))).rejects.toThrow('Application feature inventory is unavailable');
    const sso = binding(), failure = new Error('SSO unavailable'); sso.getSubscriptionCatalogInventory.mockRejectedValue(failure);
    transport.mockResolvedValue(new Response('[]'));
    await expect(loadSubscriptionCatalogInventory(sso, catalogInventoryDatabase(env))).rejects.toBe(failure);
  });

  it('does not let SDK default retries hide a transient application-owner failure', async () => {
    transport.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Synthetic unavailable owner' }),
      { status: 503, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(new Response('[]'));
    await expect(loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env)))
      .rejects.toThrow('Application feature inventory is unavailable');
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('does not retry an application-owner network rejection', async () => {
    transport.mockRejectedValue(new TypeError('Synthetic unreachable owner'));
    await expect(loadSubscriptionCatalogInventory(binding(), catalogInventoryDatabase(env)))
      .rejects.toThrow('Application feature inventory is unavailable');
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('returns empty lists only when both owners actually return empty data', async () => {
    transport.mockResolvedValue(new Response('[]'));
    const sso = binding(); sso.getSubscriptionCatalogInventory.mockResolvedValue({ schemaVersion: 1, plans: [] });
    await expect(loadSubscriptionCatalogInventory(sso, catalogInventoryDatabase(env))).resolves.toEqual({ schemaVersion: 1, plans: [], features: [] });
  });
});
