import { describe, expect, it, vi } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { checkServerFeatureAccess, requireFeature } from '../shared/lib/server-feature-gating';
import { hasAnyFeature, hasFeatureEntitlement } from '../lib/entitlements';

const owner = vi.hoisted(() => ({ database: null as SupabaseClient | null }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => owner.database }));
import { requireFeatureAccess } from '../lib/auth';

const key = 'synthetic_choice';
function fixture(options: { status?: string; selected?: string | null; enabled?: boolean; domain?: string[];
  registryError?: boolean; entitlementError?: boolean; subscriptionError?: boolean; type?: 'boolean' | 'enum' } = {}) {
  let addonReads = 0;
  const transport = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    expect(init?.method ?? 'GET').toBe('GET');
    const url = new URL(String(input));
    const table = url.pathname.split('/').at(-1);
    const definition = { id: 'synthetic-feature', feature_key: key, display_name: 'Synthetic', category: 'synthetic',
      feature_type: options.type ?? 'enum', value_options: options.type === 'boolean' ? null : options.domain ?? ['option_a', 'option_b'] };
    if (table === 'features') {
      if (options.registryError) return Response.json({ message: 'Synthetic registry failure' }, { status: 503 });
      return Response.json(url.searchParams.has('feature_key') ? { feature_type: definition.feature_type } : [definition]);
    }
    if (table === 'subscription_cache') {
      if (options.subscriptionError) return Response.json({ message: 'Synthetic subscription failure' }, { status: 503 });
      const status = options.status ?? 'active';
      const filter = url.searchParams.get('status');
      const included = filter?.startsWith('eq.') ? status === filter.slice(3)
        : filter?.startsWith('in.(') && filter.endsWith(')') && filter.slice(4, -1).split(',').includes(status);
      return Response.json(included ? { id: 'synthetic-subscription', user_id: 'synthetic-user',
        status, plan_id: 'synthetic-plan', plan_code: 'synthetic-plan-code', features: [key],
        synced_at: new Date().toISOString(), subscription_end_date: new Date(Date.now() + 86400000).toISOString() } : null);
    }
    if (table === 'organization_members' || table === 'users') return Response.json(null);
    if (table === 'plans_cache') return Response.json({ id: 'synthetic-plan', plan_code: 'synthetic-plan-code',
      name: 'Synthetic', plan_family: 'individual', entity_config: {} });
    if (table === 'plan_entitlements') return options.entitlementError
      ? Response.json({ message: 'Synthetic terms failure' }, { status: 503 })
      : Response.json([{ plan_id: 'synthetic-plan', feature_id: definition.id, is_enabled: options.enabled ?? true,
        value_numeric: null, value_text: options.selected === undefined ? 'option_b' : options.selected }]);
    if (table === 'tenant_entitlement_overrides') return Response.json([]);
    if (table === 'user_entitlements') { addonReads++; return Response.json({ id: 'synthetic-addon', status: 'active', end_date: null }); }
    throw new Error('Unexpected owner query in isolated enum guard fixture');
  });
  const database = createClient('https://enum-guard.example.invalid', 'synthetic-key',
    { global: { fetch: transport }, auth: { persistSession: false, autoRefreshToken: false } });
  return { database, addonReads: () => addonReads };
}

describe('typed subscription guard composition', () => {
  it('forwards accepted values through the server guard without using a boolean add-on', async () => {
    const current = fixture();
    expect(await checkServerFeatureAccess(current.database, 'synthetic-user', key, ['option_b']))
      .toMatchObject({ hasAccess: true });
    expect(await hasFeatureEntitlement(current.database, 'synthetic-user', key, ['option_b'])).toBe(true);
    expect(await requireFeature(key, ['option_b'])(current.database, 'synthetic-user')).toEqual({ allowed: true });
    expect(current.addonReads()).toBe(0);
  });

  it.each([{ accepted: undefined }, { accepted: [] }, { accepted: ['unknown'] },
    { accepted: ['option_b', 'option_b'] }, { accepted: ['option_a'] }])(
    'does not convert rejected enum requirements %j into cached or boolean add-on access', async ({ accepted }) => {
      const current = fixture();
      expect(await hasFeatureEntitlement(current.database, 'synthetic-user', key, accepted)).toBe(false);
      expect(current.addonReads()).toBe(0);
    });

  it.each([
    { selected: 'unknown' }, { selected: null }, { enabled: false }, { domain: ['duplicate', 'duplicate'] },
    { registryError: true }, { entitlementError: true }, { subscriptionError: true },
  ])('keeps invalid or unavailable enum configuration denied %j', async options => {
    const current = fixture(options);
    expect(await hasFeatureEntitlement(current.database, 'synthetic-user', key, ['option_b'])).toBe(false);
    expect(current.addonReads()).toBe(0);
  });

  it.each(['cancelled', 'grace_period', 'expired'])('does not reinterpret %s cached names as enum values', async status => {
    const current = fixture({ status });
    expect(await hasFeatureEntitlement(current.database, 'synthetic-user', key)).toBe(false);
    expect(await hasFeatureEntitlement(current.database, 'synthetic-user', key, ['option_b'])).toBe(false);
    expect(current.addonReads()).toBe(0);
  });

  it('does not apply an enum value requirement to a boolean grant or add-on', async () => {
    const current = fixture({ type: 'boolean' });
    expect(await hasFeatureEntitlement(current.database, 'synthetic-user', key, ['option_b'])).toBe(false);
    expect(current.addonReads()).toBe(0);
  });

  it('preserves independent boolean add-on composition when the subscription owner fails', async () => {
    const current = fixture({ type: 'boolean', subscriptionError: true });
    expect(await hasFeatureEntitlement(current.database, 'synthetic-user', key)).toBe(true);
    expect(current.addonReads()).toBe(1);
  });

  it('supports typed requirements at the actual handler guard and ANY predicate', async () => {
    const current = fixture(); owner.database = current.database;
    const requirement = { key, acceptedValues: ['option_b'] };
    expect(await hasAnyFeature(current.database, 'synthetic-user', [requirement])).toBe(true);
    const handler = vi.fn(async () => new Response('Synthetic success'));
    const context = { env: {}, data: { user: { id: 'synthetic-user', sub: 'synthetic-user' } } };
    expect((await requireFeatureAccess(requirement, handler)(context)).status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
    handler.mockClear();
    expect((await requireFeatureAccess({ key, acceptedValues: ['option_a'] }, handler)(context)).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(current.addonReads()).toBe(0);
  });
});
