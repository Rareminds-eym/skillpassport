// @vitest-environment node
import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { promoPaymentRequired } from '../../shared/lib/promo-access';
import { completePlanSelection, isSubscriptionCurrent, resolveUserEntitlement, subscriptionScope } from '../../shared/lib/org-subscription';

type Row = Record<string, any>;
let tables: Record<string, Row[]>;
const personalPlan = { id: 'personal', plan_code: 'custom-personal', name: 'Current personal plan', business_type: 'b2c', applicable_entities: ['all'], is_active: true };
const orgPlan = { id: 'institution', plan_code: 'custom-institution', name: 'Current institution plan', business_type: 'b2b', applicable_entities: ['college'], is_active: true };
const personal = { id: 'individual', user_id: 'user', plan_id: personalPlan.id, status: 'active', is_organization_subscription: false, subscription_end_date: '2099-01-01' };
const coverage = { id: 'org-sub', user_id: 'buyer', plan_id: orgPlan.id, organization_id: 'org', is_organization_subscription: true, status: 'active', subscription_end_date: '2099-01-01' };

// Check selected/filter columns against the real migration, rather than accepting invented fields.
const schema = readFileSync(new URL('../../../supabase/migrations/20260526000000_schema.sql', import.meta.url), 'utf8');
function validateColumn(table: string, column: string) {
  if (!['license_assignments', 'learners'].includes(table)) return;
  const definition = schema.split(`CREATE TABLE IF NOT EXISTS "public"."${table}" (`)[1]?.split('\n);')[0];
  if (!definition || !new RegExp(`^\\s+"${column}"\\s`, 'm').test(definition)) throw new Error(`Unknown column ${table}.${column}`);
}

function client(failingTable?: string): SupabaseClient {
  return {
    from(table: string) {
      let rows = [...(tables[table] ?? [])];
      let update: Row | undefined;
      const result = () => ({ data: rows, count: rows.length, error: table === failingTable ? { message: 'database unavailable' } : null });
      const query: any = {
        select: (columns: string) => { if (columns !== '*') columns.split(',').forEach(column => validateColumn(table, column.trim())); return query; },
        eq: (key: string, value: unknown) => { validateColumn(table, key); rows = rows.filter(row => row[key] === value); return query; },
        not: (key: string, _operator: string, value: unknown) => { rows = rows.filter(row => row[key] !== value && row[key] !== undefined); return query; },
        in: (key: string, values: unknown[]) => { rows = rows.filter(row => values.includes(row[key])); return query; },
        order: () => query,
        limit: (count: number) => { rows = rows.slice(0, count); return query; },
        update: (value: Row) => { update = value; return query; },
        maybeSingle: async () => ({ ...result(), data: rows[0] ?? null }),
        single: async () => { if (update) rows.forEach(row => Object.assign(row, update)); return { ...result(), data: rows[0] ?? null }; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
      };
      return query;
    }
  } as unknown as SupabaseClient;
}
const resolve = (roles = ['learner'], scope?: any) => resolveUserEntitlement(client(), 'user', { roles, org_id: 'org', scope });

beforeEach(() => {
  tables = {
    users: [{ id: 'user', metadata: {} }],
    organizations: [{ id: 'org', organization_type: 'college', admin_id: 'buyer' }],
    organization_members: [{ user_id: 'user', organization_id: 'org', status: 'active', role: 'learner' }],
    license_assignments: [], learners: [], plans_cache: [personalPlan, orgPlan], subscription_cache: [],
  };
});

describe('Catalogue-backed subscription gateway', () => {
  it('passes a cancelled initialized free contract to the live dashboard authorizer without changing it', async () => {
    tables.plans_cache = [{ ...personalPlan, plan_family: 'individual' }];
    tables.subscription_cache = [{ ...personal, status: 'cancelled', billing_cycle: 'free', subscription_end_date: null, plan_revision_id: 'revision' }];
    const snapshot = JSON.stringify(tables);
    const authorizeRead = vi.fn(async sub => ({ ...sub, lifecycle_access: 'read_only' }));
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'] }, { authorizeRead }))
      .toMatchObject({ status: 'cancelled', lifecycle_access: 'read_only' });
    expect(authorizeRead).toHaveBeenCalledOnce(); expect(JSON.stringify(tables)).toBe(snapshot);
    authorizeRead.mockResolvedValueOnce(null);
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'] }, { authorizeRead })).toBeNull();
  });
  it('does not pass another organization or a revoked seat to the live dashboard authorizer', async () => {
    const authorizeRead = vi.fn(async sub => sub);
    tables.subscription_cache = [{ ...coverage, plan_revision_id: 'revision', status: 'cancelled', subscription_end_date: null, billing_cycle: 'free' }];
    tables.license_assignments = [{ id: 'seat', user_id: 'user', organization_subscription_id: coverage.id, status: 'revoked' }];
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'] }, { authorizeRead })).toBeNull();
    tables.subscription_cache[0].organization_id = 'another-org';
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['college_admin'] }, { authorizeRead })).toBeNull();
    expect(authorizeRead).not.toHaveBeenCalled();
  });
  it('preserves organization dashboard and assigned-seat coverage without calling the personal owner reader', async () => {
    const authorizeRead = vi.fn(async sub => sub);
    tables.subscription_cache = [{ ...coverage, plan_revision_id: 'revision' }];
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['college_admin'], org_id: 'org' }, { authorizeRead })).toMatchObject({ id: coverage.id });
    tables.license_assignments = [{ id: 'seat', user_id: 'user', organization_subscription_id: coverage.id, status: 'active' }];
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'] }, { authorizeRead })).toMatchObject({ license_assignment_id: 'seat' });
    expect(authorizeRead).not.toHaveBeenCalled();
  });
  it('retains a paid old purchase when automatic free access is newer', async () => {
    tables.users[0].metadata.subscription_selection_required = true;
    tables.plans_cache.push({ ...personalPlan, id: 'free-plan', plan_family: 'individual' });
    tables.subscription_cache = [
      { ...personal, id: 'free', plan_id: 'free-plan', billing_cycle: 'free', subscription_end_date: null, plan_amount: 0 },
      { ...personal, plan_amount: 499, plan_revision_id: null, lifecycle_state: null },
    ];
    expect((await resolve())?.id).toBe('individual');
  });
  it('does not revive expired paid access ahead of a valid free subscription', async () => {
    tables.plans_cache.push({ ...personalPlan, id: 'free-plan', plan_family: 'individual' });
    tables.subscription_cache = [
      { ...personal, plan_amount: 499, subscription_end_date: '2020-01-01' },
      { ...personal, id: 'free', plan_id: 'free-plan', billing_cycle: 'free', subscription_end_date: null, plan_amount: 0 },
    ];
    expect((await resolve())?.id).toBe('free');
  });
  it('does not let retained cancelled paid access hide an active free contract', async () => {
    tables.plans_cache.push({ ...personalPlan, id: 'free-plan', plan_family: 'individual' });
    tables.subscription_cache = [
      { ...personal, status: 'cancelled', subscription_end_date: null, plan_amount: 499, plan_revision_id: 'paid-revision' },
      { ...personal, id: 'free', plan_id: 'free-plan', plan_revision_id: 'free-revision', billing_cycle: 'free', subscription_end_date: null, plan_amount: 0 },
    ];
    const authorizeRead = vi.fn(async sub => ({ ...sub, lifecycle_access: sub.status === 'cancelled' ? 'read_only' : 'full' }));
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'] }, { authorizeRead })).toMatchObject({ id: 'free', lifecycle_access: 'full' });
    expect(authorizeRead).toHaveBeenCalledOnce();
  });
  it('keeps an unexpired paid cancellation ahead of free access under its existing date policy', async () => {
    tables.plans_cache.push({ ...personalPlan, id: 'free-plan', plan_family: 'individual' });
    tables.subscription_cache = [
      { ...personal, status: 'cancelled', plan_amount: 499 },
      { ...personal, id: 'free', plan_id: 'free-plan', billing_cycle: 'free', subscription_end_date: null, plan_amount: 0 },
    ];
    expect((await resolve())?.id).toBe(personal.id);
  });
  it('preserves a retired paid plan despite old onboarding selection metadata', async () => {
    tables.users[0].metadata.subscription_selection_required = true;
    tables.plans_cache[0].is_active = false;
    tables.subscription_cache = [{ ...personal, razorpay_payment_id: 'pay_historical' }];
    expect((await resolve())?.id).toBe('individual');
  });
  it('finds assigned bulk coverage through its parent subscription without a license organization_id', async () => {
    tables.organization_members = [];
    tables.subscription_cache = [{ ...coverage, plan_id: personalPlan.id }];
    tables.license_assignments = [{ id: 'seat', user_id: 'user', organization_subscription_id: coverage.id, status: 'active' }];
    const result = await resolveUserEntitlement(client(), 'user', { roles: ['learner'] });
    expect(result?.license_assignment_id).toBe('seat');
    expect(result?.organization_id).toBe('org');
  });
  it.each([false, null])('uses a non-deleted learner organization when is_deleted is %s', async is_deleted => {
    tables.organization_members = [];
    tables.learners = [{ user_id: 'user', college_id: 'org', is_deleted, deleted_at: null }];
    tables.subscription_cache = [coverage];
    expect((await resolveUserEntitlement(client(), 'user', { roles: ['learner'] }))?.organization_wide).toBe(true);
  });
  it.each([{ is_deleted: true, deleted_at: null }, { is_deleted: false, deleted_at: '2026-01-01' }])('does not derive organization coverage from a deleted learner: %j', async deletion => {
    tables.organization_members = [];
    tables.learners = [{ user_id: 'user', college_id: 'org', ...deletion }];
    tables.subscription_cache = [coverage];
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'] })).toBeNull();
  });
  it('grants a personal individual-family catalog plan regardless of the learner organization type', async () => {
    tables.plans_cache = [{ ...personalPlan, applicable_entities: ['individual'], plan_family: 'individual' }, orgPlan];
    tables.organizations = [{ id: 'org', organization_type: null }];
    tables.subscription_cache = [personal];
    expect((await resolve())?.plan_code).toBe(personalPlan.plan_code);
    tables.plans_cache[0] = { ...tables.plans_cache[0], plan_family: 'institution' };
    expect(await resolve()).toBeNull();
    tables.plans_cache[0] = { ...tables.plans_cache[0], plan_family: 'individual' };
    tables.subscription_cache = [{ ...personal, is_organization_subscription: true }];
    expect(await resolve()).toBeNull();
  });
  it('accepts any eligible personal plan without hardcoded names or prices', async () => {
    tables.subscription_cache = [personal];
    expect((await resolve())?.plan_code).toBe(personalPlan.plan_code);
  });
  it('admits the verified perpetual free individual plan without another selection or metadata write', async () => {
    tables.users[0].metadata.subscription_selection_required = true;
    tables.plans_cache = [{ ...personalPlan, plan_family: 'individual', applicable_entities: ['individual'] }];
    tables.subscription_cache = [{ ...personal, billing_cycle: 'free', subscription_end_date: null }];
    const snapshot = JSON.stringify(tables);
    expect(await resolve()).toMatchObject({ id: personal.id, status: 'active', subscription_end_date: null });
    expect(JSON.stringify(tables)).toBe(snapshot);
    expect(await resolve(['school_admin'])).toBeNull();
  });
  it.each(['expired', 'pending', 'cancelled'])('does not admit a %s free subscription', async status => {
    tables.users[0].metadata.subscription_selection_required = true;
    tables.plans_cache = [{ ...personalPlan, plan_family: 'individual' }];
    tables.subscription_cache = [{ ...personal, status, billing_cycle: 'free', subscription_end_date: null }];
    expect(await resolve()).toBeNull();
  });
  it('does not infer automatic free access from a name, price or an unrelated plan family', async () => {
    tables.users[0].metadata.subscription_selection_required = true;
    tables.subscription_cache = [{ ...personal, billing_cycle: 'free', subscription_end_date: null, plan_amount: 0, plan_type: 'Free' }];
    expect(await resolve()).toBeNull();
  });
  it('requires explicit plan selection for a new self-signup despite a default subscription', async () => {
    tables.users[0].metadata.subscription_selection_required = true;
    tables.subscription_cache = [personal];
    expect(await resolve()).toBeNull();
    await completePlanSelection(client(), 'user');
    expect((await resolve())?.id).toBe('individual');
  });
  it('sends an institution-covered imported learner through without individual selection', async () => {
    tables.users[0].metadata.subscription_selection_required = true;
    tables.subscription_cache = [coverage];
    expect((await resolve())?.organization_wide).toBe(true);
  });
  it('preserves educator organization coverage', async () => {
    tables.subscription_cache = [coverage];
    expect((await resolve(['college_educator']))?.id).toBe('org-sub');
  });
  it('never promotes an individual learner plan into admin coverage', async () => {
    tables.subscription_cache = [{ ...personal, organization_id: 'org', is_organization_subscription: true }];
    expect(await resolve(['college_admin'])).toBeNull();
  });
  it('finds an applicable organization plan even with a newer personal default', async () => {
    tables.subscription_cache = [personal, coverage];
    expect((await resolve(['college_admin']))?.id).toBe('org-sub');
  });
  it('rejects an institution plan for the wrong entity and honours catalogue all', async () => {
    tables.subscription_cache = [coverage];
    tables.plans_cache = [personalPlan, { ...orgPlan, applicable_entities: ['school'] }];
    expect(await resolve(['college_admin'])).toBeNull();
    tables.plans_cache[1].applicable_entities = ['all'];
    expect((await resolve(['college_admin']))?.id).toBe('org-sub');
  });
  it('does not inherit coverage from another organization', async () => {
    tables.subscription_cache = [{ ...coverage, organization_id: 'other' }];
    expect(await resolve(['college_admin'])).toBeNull();
  });
  it('supports bulk learner-plan seats without granting the buyer admin coverage', async () => {
    tables.subscription_cache = [{ ...coverage, plan_id: personalPlan.id }];
    const seat = { id: 'seat', user_id: 'user', organization_id: 'org', organization_subscription_id: 'org-sub', status: 'active', expires_at: '2098-01-01' };
    tables.license_assignments = [seat];
    const result = await resolve();
    expect(result?.license_assignment_id).toBe('seat');
    expect(result?.subscription_end_date).toBe('2098-01-01');
    expect(await resolve(['college_admin'])).toBeNull();
    tables.license_assignments = [];
    expect(await resolve()).toBeNull();
  });
  it.each(['revoked', 'suspended', 'expired', 'active'])('does not bypass a disabled or expired %s seat using organization-wide fallback', async status => {
    tables.subscription_cache = [coverage];
    tables.license_assignments = [{ user_id: 'user', organization_id: 'org', organization_subscription_id: 'org-sub', status, expires_at: '2020-01-01' }];
    expect(await resolve()).toBeNull();
  });
  it('validates the requested dashboard for users with more than one role', async () => {
    tables.subscription_cache = [personal];
    expect((await resolve(['learner', 'college_admin'], 'learner'))?.id).toBe('individual');
    expect(await resolve(['learner', 'college_admin'], 'college_admin')).toBeNull();
    expect(() => subscriptionScope({ roles: ['learner'] }, 'college_admin')).toThrow('FORBIDDEN');
  });
  it('does not mask a database error as no subscription or successful access', async () => {
    await expect(resolveUserEntitlement(client('license_assignments'), 'user', { roles: ['learner'] })).rejects.toThrow();
  });
  it('rejects future subscriptions but preserves valid contracts retired from sale', async () => {
    tables.subscription_cache = [{ ...personal, subscription_start_date: '2098-01-01' }];
    expect(await resolve()).toBeNull();
    tables.subscription_cache = [personal];
    tables.plans_cache = [{ ...personalPlan, is_active: false }];
    expect((await resolve())?.id).toBe('individual');
  });
});

describe.each(['school', 'college'])('%s admin learner-plan purchase regression', type => {
  const learnerPlans = [
    ['freemium', 0], ['discover', 0], ['basic', 499], ['professional', 749], ['premium', 999],
  ] as const;
  function setup(code = 'professional', organizationFlag = true) {
    tables.users = [{ id: 'user', metadata: { subscription_selection_required: true } }, { id: 'buyer', metadata: {} }];
    tables.organizations = [{ id: 'org', organization_type: type, admin_id: 'buyer' }];
    tables.plans_cache = [{ ...personalPlan, plan_code: code }, { ...orgPlan, applicable_entities: [type] }];
    tables.subscription_cache = [{ ...coverage, plan_id: personalPlan.id, plan_code: code, is_organization_subscription: organizationFlag }];
    tables.learners = [{ user_id: 'user', [type === 'school' ? 'school_id' : 'college_id']: 'org', is_deleted: false }];
  }
  it.each(learnerPlans.flatMap(([code, price]) => [false, true].map(flag => ({ code, price, flag }))))(
    'does not bypass selection for $code (amount $price, organization flag $flag)', async ({ code, price, flag }) => {
      setup(code, flag);
      tables.subscription_cache[0].plan_amount = price;
      // Even a cached admin-looking label must not override the catalogue's B2C audience.
      tables.subscription_cache[0].plan_type = `${type} administrator plan`;
      tables.subscription_cache[0].features = ['all_features'];
      tables.subscription_cache.push({ ...personal, plan_code: 'discover', plan_amount: 0, billing_cycle: 'lifetime' });
      const snapshot = JSON.stringify(tables);
      expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'], org_id: 'org' })).toBeNull();
      expect(await resolveUserEntitlement(client(), 'buyer', { roles: [`${type}_admin`], org_id: 'org' })).toBeNull();
      expect(JSON.stringify(tables)).toBe(snapshot);
    },
  );
  it('does not cover an unrelated individual learner', async () => {
    setup(); tables.organization_members = []; tables.learners = [];
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'] })).toBeNull();
  });
  it('does not turn membership, profile linkage, or a signed organization claim into a learner license', async () => {
    for (const source of ['membership', 'profile', 'claim']) {
      setup();
      if (source !== 'membership') tables.organization_members = [];
      if (source !== 'profile') tables.learners = [];
      expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'], ...(source === 'claim' ? { org_id: 'org' } : {}) })).toBeNull();
    }
  });
  it('preserves explicitly assigned bulk learner seats, while still denying the buyer admin dashboard', async () => {
    setup();
    tables.license_assignments = [{ id: 'seat', user_id: 'user', organization_subscription_id: coverage.id, status: 'active', expires_at: '2098-01-01' }];
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'] })).toMatchObject({ license_assignment_id: 'seat', organization_wide: false });
    expect(await resolveUserEntitlement(client(), 'buyer', { roles: [`${type}_admin`], org_id: 'org' })).toBeNull();
  });
  it.each(['revoked', 'suspended', 'expired'])('does not grant bulk coverage to a %s learner seat', async status => {
    setup();
    tables.license_assignments = [{ id: 'seat', user_id: 'user', organization_subscription_id: coverage.id, status }];
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'], org_id: 'org' })).toBeNull();
  });
  it('denies an active seat whose bulk subscription has expired', async () => {
    setup(); tables.subscription_cache[0].subscription_end_date = '2020-01-01';
    tables.license_assignments = [{ id: 'seat', user_id: 'user', organization_subscription_id: coverage.id, status: 'active' }];
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'], org_id: 'org' })).toBeNull();
  });
  it('allows genuine B2B organization coverage without requiring individual selection', async () => {
    setup(); tables.subscription_cache = [coverage];
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'], org_id: 'org' })).toMatchObject({ id: coverage.id, organization_wide: true });
    expect(await resolveUserEntitlement(client(), 'buyer', { roles: [`${type}_admin`], org_id: 'org' })).toMatchObject({ id: coverage.id });
  });
  it('allows a new learner after they explicitly select their own plan', async () => {
    setup(); tables.subscription_cache.push(personal);
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'], org_id: 'org' })).toBeNull();
    await completePlanSelection(client(), 'user', personal.plan_id);
    expect(await resolveUserEntitlement(client(), 'user', { roles: ['learner'], org_id: 'org' })).toMatchObject({ id: personal.id, is_organization_license: false });
  });
});

describe('Subscription validity', () => {
  it('does not grant missing-date or expired paid rows', () => {
    expect(isSubscriptionCurrent({ status: 'active' })).toBe(false);
    expect(isSubscriptionCurrent({ status: 'active', subscription_end_date: '2020-01-01' })).toBe(false);
    expect(isSubscriptionCurrent({ status: 'active', billing_cycle: 'lifetime' })).toBe(true);
    expect(isSubscriptionCurrent({ status: 'active', billing_cycle: 'free' })).toBe(true);
    expect(isSubscriptionCurrent({ status: 'active', billing_cycle: 'free', subscription_end_date: '2020-01-01' })).toBe(false);
    expect(isSubscriptionCurrent({ status: 'active', billing_cycle: 'free', subscription_start_date: '2098-01-01' })).toBe(false);
    expect(isSubscriptionCurrent({ status: 'cancelled', billing_cycle: 'lifetime' })).toBe(false);
  });
});


it.each(['inactive', 'suspended', 'expired'])('does not restore removed organization coverage from a stale JWT/profile when membership is %s', async status => {
  tables.subscription_cache = [coverage];
  tables.organization_members[0].status = status;
  tables.learners = [{ user_id: 'user', college_id: 'org', is_deleted: false }];
  expect(await resolve(['learner'])).toBeNull();
  expect(await resolve(['college_admin'])).toBeNull();
});


describe('promo checkout cannot be bypassed with free access', () => {
  function promoAccount(role: string) {
    tables.users[0].metadata = { referralCode: 'TESTCODE' };
    tables.promo_codes = [{ id: 'promo', code: 'TESTCODE', active: true, overall_max_uses: 100, starts_at: '2020-01-01', expires_at: '2099-01-01', role_quotas: { [role]: 100 } }];
    tables.promo_redemptions = [];
    if (role === 'learner') {
      tables.plans_cache = [{ ...personalPlan, plan_family: 'individual' }];
      tables.subscription_cache = [{ ...personal, plan_amount: 0, billing_cycle: 'free', subscription_end_date: null }];
    } else {
      const entity = role.split('_')[0];
      tables.organizations[0].organization_type = entity;
      tables.plans_cache = [{ ...orgPlan, applicable_entities: [entity] }];
      tables.subscription_cache = [{ ...coverage, plan_amount: 0, billing_cycle: 'free', subscription_end_date: null }];
    }
  }
  it.each(['learner', 'college_admin', 'school_admin'])('blocks the %s free plan before and after locking a promo', async role => {
    promoAccount(role);
    expect(await resolve([role])).toBeNull();
    tables.promo_redemptions = [{ promo_code_id: 'promo', user_id: 'user', role, accepted_plan_id: 'paid' }];
    expect(await resolve([role])).toBeNull();
  });
  it.each(['learner', 'college_admin', 'school_admin'])('allows %s after paid coverage is synchronized', async role => {
    promoAccount(role); tables.subscription_cache[0].plan_amount = 100;
    expect(await resolve([role])).not.toBeNull();
  });
  it.each(['learner', 'college_admin', 'school_admin'])('preserves ordinary free access for %s without a promo', async role => {
    promoAccount(role); tables.users[0].metadata = {};
    expect(await resolve([role])).not.toBeNull();
  });
  it.each(['learner', 'college_admin', 'school_admin'])('does not block %s for a never-accepted expired code', async role => {
    promoAccount(role); tables.promo_codes[0].expires_at = '2020-01-02';
    expect(await resolve([role])).not.toBeNull();
  });
  it('retains the paid requirement for an accepted code after campaign expiry', async () => {
    promoAccount('learner'); tables.promo_codes[0].expires_at = '2020-01-02';
    tables.promo_redemptions = [{ promo_code_id: 'promo', user_id: 'user', role: 'learner', accepted_plan_id: 'paid' }];
    expect(await resolve()).toBeNull();
  });
  it('fails closed when promo storage is unavailable', async () => {
    promoAccount('learner');
    await expect(resolveUserEntitlement(client('promo_codes'), 'user', { roles: ['learner'] })).rejects.toThrow('Unable to verify promo');
  });
});


it.each(['learner', 'school_admin', 'college_admin'])('checks normalized code and role ownership without mutating promo records for %s', async role => {
  tables.users[0] = { id: 'user', role, metadata: { referralCode: '  mixedcode  ' } };
  tables.promo_codes = [{ id: 'promo', code: 'MIXEDCODE', active: true, overall_max_uses: 100, starts_at: '2020-01-01', expires_at: '2099-01-01', role_quotas: { [role]: 1 } }];
  tables.promo_redemptions = [];
  const before = JSON.stringify(tables);
  expect(await promoPaymentRequired(client(), 'user')).toBe(true);
  expect(JSON.stringify(tables)).toBe(before);
  tables.promo_codes[0].role_quotas = { recruiter: 10 };
  expect(await promoPaymentRequired(client(), 'user')).toBe(false);
});


it.each(['learner', 'school_admin', 'college_admin'])('cannot bypass an accepted %s promotion by changing the signup code', async role => {
  tables.users[0] = { id: 'user', role, metadata: { referralCode: 'OTHER-CODE' } };
  tables.promo_redemptions = [{ user_id: 'user', role, accepted_plan_id: 'paid', promo_code_id: 'old-campaign' }];
  expect(await promoPaymentRequired(client(), 'user')).toBe(true);
  tables.users[0].metadata = {};
  expect(await promoPaymentRequired(client(), 'user')).toBe(true);
});


it.each(['learner', 'school_admin', 'college_admin'])('does not apply an exhausted promo to a new %s account', async role => {
  tables.users[0] = { id: 'user', role, metadata: { referralCode: 'FULL' } };
  tables.promo_codes = [{ id: 'full', code: 'FULL', active: true, starts_at: '2020-01-01', expires_at: '2099-01-01', overall_max_uses: 1, role_quotas: { [role]: 1 } }];
  tables.promo_redemptions = [{ user_id: 'someone-else', role, promo_code_id: 'full', accepted_plan_id: 'paid' }];
  expect(await promoPaymentRequired(client(), 'user')).toBe(false);
});


it('does not make existing paid access depend on campaign storage availability', async () => {
  tables.users[0].metadata = { referralCode: 'STORED' };
  tables.plans_cache = [personalPlan]; tables.subscription_cache = [{ ...personal, plan_amount: 100 }];
  await expect(resolveUserEntitlement(client('promo_codes'), 'user', { roles: ['learner'] })).resolves.toMatchObject({ id: personal.id });
});
