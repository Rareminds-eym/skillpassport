import { describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { checkEntitlement, getTenantEntitlements } from '../shared/lib/entitlement-service';
import { EnumConfigurationError } from '../shared/lib/feature-values';

// Isolated HTTP fixtures exercise the real SDK and resolver; no configured databases or identities.
const feature = { id: 'synthetic-feature', feature_key: 'synthetic_choice', display_name: 'Synthetic choice',
  feature_type: 'enum', category: 'synthetic', value_options: ['option_b', 'option_a'] };
const entitlement = { plan_id: 'synthetic-plan', feature_id: feature.id, is_enabled: true, value_numeric: null, value_text: 'option_b' };
function fixture(options: { feature?: unknown; terms?: unknown[]; overrides?: unknown[]; overrideError?: boolean } = {}) {
  const transport = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    expect(init?.method ?? 'GET').toBe('GET');
    const table = url.pathname.split('/').at(-1);
    if (table === 'subscription_cache') return Response.json({ id: 'synthetic-sub', plan_id: 'synthetic-plan', status: 'active' });
    if (table === 'plans_cache') return Response.json({ id: 'synthetic-plan', plan_code: 'synthetic-code',
      name: 'Synthetic', plan_family: 'individual', hierarchy_order: 0, entity_config: {} });
    if (table === 'features') return Response.json([options.feature ?? feature]);
    if (table === 'plan_entitlements') return Response.json(options.terms ?? [entitlement]);
    if (table === 'tenant_entitlement_overrides') return options.overrideError
      ? Response.json({ message: 'Synthetic failure' }, { status: 403 }) : Response.json(options.overrides ?? []);
    throw new Error('Unexpected table in enum fixture');
  });
  return { transport, database: createClient('https://enum.example.invalid', 'synthetic-key',
    { global: { fetch: transport }, auth: { persistSession: false, autoRefreshToken: false } }) };
}

describe('configured enum entitlement resolution', () => {
  it('preserves the selected text and domain through the existing manifest', async () => {
    const { database, transport } = fixture();
    const manifest = await getTenantEntitlements(database, 'synthetic-tenant');
    expect(manifest.features.synthetic_choice).toEqual({ enabled: true, feature_type: 'enum', category: 'synthetic',
      display_name: 'Synthetic choice', value: 'option_b', options: ['option_b', 'option_a'] });
    expect(transport).toHaveBeenCalledTimes(5);
  });
  it('enforces an explicit set of accepted values without implicit ordering', async () => {
    expect(await checkEntitlement(fixture().database, 'synthetic-tenant', 'synthetic_choice', ['option_b'])).toMatchObject({ allowed: true, value: 'option_b' });
    expect(await checkEntitlement(fixture().database, 'synthetic-tenant', 'synthetic_choice', ['option_a'])).toMatchObject({ allowed: false, value: 'option_b' });
    expect(await checkEntitlement(fixture().database, 'synthetic-tenant', 'synthetic_choice', ['option_a', 'option_b'])).toMatchObject({ allowed: true });
  });
  it.each([{ values: undefined }, { values: [] }, { values: ['unknown'] }, { values: ['option_b', 'option_b'] }])('denies absent or invalid accepted values %j', async ({ values }) => {
    expect(await checkEntitlement(fixture().database, 'synthetic-tenant', 'synthetic_choice', values)).toMatchObject({ allowed: false });
  });
  it('respects explicit disabled, active override and expired override terms', async () => {
    const disabled = { ...entitlement, is_enabled: false, value_text: null };
    const active = { ...entitlement, value_text: 'option_a', expires_at: null };
    expect((await getTenantEntitlements(fixture({ overrides: [disabled] }).database, 'synthetic-tenant')).features.synthetic_choice)
      .toMatchObject({ enabled: false, value: null });
    expect((await getTenantEntitlements(fixture({ overrides: [active] }).database, 'synthetic-tenant')).features.synthetic_choice.value).toBe('option_a');
    expect((await getTenantEntitlements(fixture({ overrides: [{ ...active, expires_at: '2000-01-01T00:00:00Z' }] }).database,
      'synthetic-tenant')).features.synthetic_choice.value).toBe('option_b');
    expect((await getTenantEntitlements(fixture({ terms: [] }).database, 'synthetic-tenant')).features.synthetic_choice)
      .toMatchObject({ enabled: false, value: null });
  });
  it.each([
    { ...entitlement, value_text: 'unregistered' }, { ...entitlement, value_text: null },
    { ...entitlement, is_enabled: false }, { ...entitlement, is_enabled: 'true' },
    { ...entitlement, value_numeric: 1 },
  ])('rejects invalid stored terms and returns a decisive denial from the access check %j', async terms => {
    await expect(getTenantEntitlements(fixture({ terms: [terms] }).database, 'synthetic-tenant')).rejects.toBeInstanceOf(EnumConfigurationError);
    expect(await checkEntitlement(fixture({ terms: [terms] }).database, 'synthetic-tenant', 'synthetic_choice', ['option_b']))
      .toMatchObject({ allowed: false, feature_type: 'enum', reason: 'Enum entitlement configuration is invalid' });
  });
  it.each([{ domain: null }, { domain: [] }, { domain: ['duplicate', 'duplicate'] }, { domain: [' invalid'] }])('rejects invalid registry domains %j', async ({ domain }) => {
    await expect(getTenantEntitlements(fixture({ feature: { ...feature, value_options: domain } }).database,
      'synthetic-tenant')).rejects.toBeInstanceOf(EnumConfigurationError);
  });
  it('does not ignore an unavailable override owner and grant the plan value', async () => {
    expect(await checkEntitlement(fixture({ overrideError: true }).database, 'synthetic-tenant', 'synthetic_choice', ['option_b']))
      .toMatchObject({ allowed: false, reason: 'Enum entitlement configuration is invalid' });
  });
});
