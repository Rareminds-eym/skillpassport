// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ client: vi.fn(), allocate: vi.fn(), create: vi.fn(), updateSubscription: vi.fn(), worker: vi.fn(), sync: vi.fn(), user: { id: 'u', email: 'u@example.test', roles: ['learner'], org_id: undefined as string | undefined } }));
vi.mock('../lib/auth', () => ({ getContextUser: () => mocks.user, withAuth: (handler: unknown) => handler }));
vi.mock('../lib/supabase', () => ({ getServiceClient: mocks.client }));
vi.mock('../shared/lib/entitlement-service', () => ({ allocateInitialPlanCredits: mocks.allocate }));
vi.mock('../lib/sso-client', () => ({ ssoCreateSubscription: mocks.create, ssoUpdateSubscriptionField: mocks.updateSubscription }));
vi.mock('../lib/sync-shadow', () => ({ syncUserShadow: vi.fn(), syncSubscriptionCache: mocks.sync }));
vi.mock('../api/payments/lib/paymentBinding', () => ({ getPaymentWorker: mocks.worker, rpcErrorResponse: () => new Response(null, { status: 500 }) }));
import { handleCreateOrder } from '../api/payments/handlers/create-order';
import { assertPlanPurchaseScope, subscriptionForUpgrade } from '../api/payments/lib/salesPlan';

type Row = Record<string, any>;
let tables: Record<string, Row[]>;
function db(): any {
  return { from(table: string) {
    let rows = [...(tables[table] ?? [])]; let update: Row | undefined;
    const q: any = {
      select: () => q, limit: () => q, order: () => q,
      eq: (key: string, value: unknown) => { rows = rows.filter(row => row[key] === value); return q; },
      in: (key: string, values: unknown[]) => { rows = rows.filter(row => values.includes(row[key])); return q; },
      update: (value: Row) => { update = value; return q; },
      maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
      single: async () => { if (update) rows.forEach(row => Object.assign(row, update)); return { data: rows[0] ?? null, error: null }; },
      then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve),
    }; return q;
  } };
}
const free = { id: 'actual-free-id', plan_code: 'catalogue-free-code', name: 'Current free plan', business_type: 'b2c', applicable_entities: ['all'], is_active: true, pricing_matrix: { all: { yearly: 0 } }, entity_config: { all: { duration: 'lifetime' } }, base_features: ['profile'] };
function checkout(planId: string, amount = 0) { return handleCreateOrder({ env: {}, request: new Request('https://example.test', { method: 'POST', body: JSON.stringify({ planId, amount }) }) } as any); }
beforeEach(() => {
  vi.clearAllMocks(); mocks.allocate.mockResolvedValue({ success: true, allocated: 0 }); mocks.user.roles = ['learner']; mocks.user.org_id = undefined;
  tables = { plans_cache: [free], subscription_cache: [], users: [{ id: 'u', metadata: { referralCode: 'KEEP', subscription_selection_required: true } }],
    organizations: [{ id: 'org', organization_type: 'college', admin_id: 'u' }], organization_members: [{ user_id: 'u', organization_id: 'org', role: 'owner', status: 'active' }] };
  mocks.client.mockImplementation(db);
  mocks.sync.mockImplementation(async (_db, sub) => {
    const index = tables.subscription_cache.findIndex(row => row.id === sub.id);
    if (index < 0) tables.subscription_cache.push(sub);
    else tables.subscription_cache[index] = sub;
  });
  mocks.updateSubscription.mockImplementation(async (_env, id, values) => ({ ...tables.subscription_cache.find(row => row.id === id), ...values }));
  mocks.create.mockImplementation(async (_env, values) => ({ id: 'new-sub', status: 'active', ...values }));
});
describe('Explicit catalogue checkout', () => {
  const prior = { id: 'old', user_id: 'u', plan_id: 'old-free', plan_name: 'Old default', plan_amount: 0, status: 'active', is_organization_subscription: false, billing_cycle: 'lifetime', subscription_end_date: null };
  it('replaces an unselected zero-cost default with the explicitly selected free plan', async () => {
    tables.subscription_cache = [{ ...prior }];
    expect((await checkout(free.id)).status).toBe(200);
    expect(mocks.updateSubscription).toHaveBeenCalledWith(expect.anything(), prior.id, { status: 'expired' });
    expect(mocks.create).toHaveBeenCalled();
    expect(tables.users[0].metadata.subscription_selection_required).toBe(false);
  });
  it('retains recruiter-free credit allocation with the same subscription reference on retry', async () => {
    mocks.user.roles = ['company_admin']; mocks.user.org_id = 'org';
    tables.organizations[0].organization_type = 'company';
    tables.plans_cache[0] = { ...free, business_type: 'b2b', applicable_entities: ['recruitment'] };
    expect((await checkout(free.id)).status).toBe(200);
    expect((await checkout(free.id)).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.allocate).toHaveBeenCalledTimes(2);
    for (const call of mocks.allocate.mock.calls) {
      expect(call.slice(1)).toEqual(['org', free.id, true, expect.any(String), 'new-sub']);
    }
  });
  it('does not complete plan selection when initial credit allocation fails', async () => {
    mocks.allocate.mockResolvedValueOnce({ success: false, error: 'Unavailable' });
    expect((await checkout(free.id)).status).toBe(503);
    expect(tables.users[0].metadata.subscription_selection_required).toBe(true);
  });
  it('preserves a previously selected free plan and explains the conflict', async () => {
    tables.users[0].metadata.subscription_selection_required = false;
    tables.subscription_cache = [{ ...prior }];
    const response = await checkout(free.id);
    expect(response.status).toBe(409);
    expect(await response.text()).toContain('Open My Subscription');
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('never replaces current paid coverage even when onboarding is incomplete', async () => {
    tables.subscription_cache = [{ ...prior, plan_name: 'Paid plan', plan_amount: '749.00' }];
    const response = await checkout(free.id);
    expect(response.status).toBe(409);
    expect(await response.text()).toContain('Paid plan');
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('explains pending activation without retiring the pending contract', async () => {
    tables.subscription_cache = [{ ...prior, status: 'pending' }];
    const response = await checkout(free.id);
    expect(response.status).toBe(409);
    expect(await response.text()).toContain('still being activated');
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
  });
  it('renews an expired free row instead of reporting false success', async () => {
    tables.subscription_cache = [{ ...prior, plan_id: free.id, subscription_end_date: '2020-01-01', billing_cycle: 'yearly' }];
    expect((await checkout(free.id)).status).toBe(200);
    expect(mocks.updateSubscription).toHaveBeenCalledWith(expect.anything(), prior.id, { status: 'expired' });
    expect(mocks.create).toHaveBeenCalled();
  });
  it('reuses current matching coverage without creating or retiring subscriptions', async () => {
    tables.subscription_cache = [{ ...prior, plan_id: free.id }];
    expect((await checkout(free.id)).status).toBe(200);
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('validates all conflicts before retiring any replaceable default', async () => {
    tables.subscription_cache = [{ ...prior }, { ...prior, id: 'paid', plan_amount: 749 }];
    expect((await checkout(free.id)).status).toBe(409);
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
  });
  it('does not treat a subscription with unknown pricing as a zero-cost default', async () => {
    tables.subscription_cache = [{ ...prior, plan_amount: null }];
    expect((await checkout(free.id)).status).toBe(409);
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
  });
  it('gives an actionable message when another checkout wins a concurrent request', async () => {
    mocks.create.mockRejectedValueOnce(new Error('duplicate key 23505'));
    const response = await checkout(free.id);
    expect(response.status).toBe(409);
    expect(await response.text()).toContain('Refresh the page');
    expect(tables.users[0].metadata.subscription_selection_required).toBe(true);
  });
  it('activates the selected free plan, without substituting Freemium', async () => {
    expect((await checkout(free.id)).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ plan_id: free.id, plan_code: free.plan_code }));
    expect(tables.users[0].metadata).toEqual({ referralCode: 'KEEP', subscription_selection_required: false });
  });
  it('does not activate a paid plan when the client submits zero', async () => {
    tables.plans_cache = [{ ...free, pricing_matrix: { all: { yearly: 749 } } }];
    expect((await checkout(free.id)).status).toBe(400); expect(mocks.create).not.toHaveBeenCalled();
  });
  it('does not fabricate a plan when given the old freemium placeholder', async () => {
    expect((await checkout('freemium')).status).toBe(404); expect(mocks.create).not.toHaveBeenCalled();
  });
  it('rejects individual learner checkout for an admin-only identity', async () => {
    mocks.user.roles = ['college_admin']; mocks.user.org_id = 'org';
    expect((await checkout(free.id)).status).toBe(403);
  });
  it('still lets an organization admin buy learner plans through bulk checkout', async () => {
    mocks.user.roles = ['college_admin']; mocks.user.org_id = 'org';
    await expect(assertPlanPurchaseScope(db(), free, mocks.user, 'org')).resolves.toMatchObject({ organizationId: 'org' });
  });
  it('preserves catalogue institution trials instead of substituting a learner plan', async () => {
    mocks.user.roles = ['college_admin']; mocks.user.org_id = 'org';
    tables.plans_cache = [{ ...free, business_type: 'b2b', applicable_entities: ['college'] }];
    expect((await checkout(free.id)).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ organization_id: 'org', is_organization_subscription: true, plan_id: free.id }));
  });
  it('does not overwrite the buyer bulk contract during an individual upgrade', async () => {
    tables.subscription_cache = [
      { id: 'bulk', user_id: 'u', plan_id: free.id, is_organization_subscription: true, status: 'active' },
      { id: 'personal', user_id: 'u', plan_id: free.id, is_organization_subscription: false, status: 'active' },
    ];
    expect((await subscriptionForUpgrade(db(), 'u', free))?.id).toBe('personal');
  });
  it('uses a verified institution role while a new organization type is still being synchronized', async () => {
    mocks.user.roles = ['college_admin']; mocks.user.org_id = 'org';
    tables.organizations[0].organization_type = null;
    tables.plans_cache = [{ ...free, business_type: 'b2b', applicable_entities: ['college'] }];
    expect((await checkout(free.id)).status).toBe(200);
  });
});

it('blocks a second paid checkout for the same active plan before contacting Razorpay', async () => {
  tables.plans_cache = [{ ...free, pricing_matrix: { all: { yearly: 749 } } }];
  tables.subscription_cache = [{ id: 'current', user_id: 'u', plan_id: free.id, plan_amount: 749,
    is_organization_subscription: false, status: 'active', billing_cycle: 'yearly', subscription_end_date: '2098-01-01' }];
  const response = await checkout(free.id, 74900);
  expect(response.status).toBe(409); expect(await response.text()).toContain('no new payment is required');
  expect(mocks.worker).not.toHaveBeenCalled();
});
it('blocks another paid order while the same-audience subscription is pending', async () => {
  tables.plans_cache = [{ ...free, pricing_matrix: { all: { yearly: 749 } } }];
  tables.subscription_cache = [{ id: 'current', user_id: 'u', plan_id: free.id,
    is_organization_subscription: false, status: 'pending' }];
  expect((await checkout(free.id, 74900)).status).toBe(409); expect(mocks.worker).not.toHaveBeenCalled();
});
