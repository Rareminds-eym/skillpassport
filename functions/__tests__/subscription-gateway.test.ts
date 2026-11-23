// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ resolve: vi.fn(), heal: vi.fn(), sync: vi.fn(), cache: vi.fn(), owner: vi.fn() }));
vi.mock('../shared/lib/org-subscription', async importOriginal => ({ ...(await importOriginal<any>()), resolveUserEntitlement: mocks.resolve }));
vi.mock('../lib/auth', () => ({ getContextUser: () => ({ id: actor, email: 'u@example.test', roles: ['learner'] }) }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({}), getAuthToken: () => 'synthetic-token' }));
vi.mock('../lib/healConfig', () => ({ isHealEnabled: mocks.heal }));
vi.mock('../lib/sso-client', () => ({ ssoSyncSubscription: mocks.sync }));
vi.mock('../lib/sync-shadow', () => ({ syncUserShadow: vi.fn(), syncSubscriptionCache: mocks.cache }));
vi.mock('../lib/resilience', () => ({ withResilience: (_key: string, call: () => Promise<unknown>) => call() }));
import { handleGetActiveSubscription } from '../api/payments/handlers/get-active-subscription';
const actor = 'a0000000-0000-4000-8000-000000000001', product = 'b0000000-0000-4000-8000-000000000001';
const subscription = 'c0000000-0000-4000-8000-000000000001', plan = 'd0000000-0000-4000-8000-000000000001', revision = 'e0000000-0000-4000-8000-000000000001';
const run = (scope = '') => handleGetActiveSubscription({ request: new Request(`https://example.test/api/payments/get-active-subscription${scope ? `?scope=${scope}` : ''}`),
  env: { SKILLPASSPORT_PRODUCT_ID: product, SSO_SERVICE: { getCurrentSubscriptionExecution: mocks.owner } } } as any);
beforeEach(() => { vi.clearAllMocks(); mocks.heal.mockResolvedValue(false); mocks.resolve.mockResolvedValue(null); });
it('returns no subscription for a verified user without applicable coverage', async () => {
  expect(await (await run()).json()).toMatchObject({ data: null });
});
it('returns verification errors instead of an empty success response', async () => {
  mocks.resolve.mockRejectedValue(new Error('Database offline'));
  expect((await run()).status).toBe(503);
});
it('does not mask a source-of-truth failure as no subscription', async () => {
  mocks.heal.mockResolvedValue(true); mocks.sync.mockRejectedValue(new Error('SSO offline'));
  expect((await run()).status).toBe(503);
});
it('revalidates synced data instead of granting access from the raw RPC payload', async () => {
  mocks.heal.mockResolvedValue(true); mocks.sync.mockResolvedValue({ subscription: { id: 'wrong-plan' }, plan: {} });
  expect(await (await run()).json()).toMatchObject({ data: null });
  expect(mocks.resolve).toHaveBeenCalledTimes(2);
});
it('rejects a requested dashboard missing from the authenticated roles', async () => {
  expect((await run('college_admin')).status).toBe(403);
  expect(mocks.resolve).not.toHaveBeenCalled();
});

const candidate = () => ({ id: subscription, user_id: actor, plan_id: plan, plan_revision_id: revision, product_id: product,
  status: 'cancelled', billing_cycle: 'free', subscription_end_date: null });
const ownerSnapshot = () => ({ schemaVersion: 1, actorId: actor, audience: 'individual', activatedAt: 100,
  subscriptionEndsAt: null, pools: [], access: 'read_only', state: {
    id: subscription, planId: plan, revisionId: revision, productId: product, version: 2, subject: { kind: 'user', id: actor },
    status: 'cancelled', periodStartsAt: 100, periodEndsAt: null, validity: 'perpetual', trialEndsAt: null,
    renewalEnabled: false, cancelledAt: 200, paymentFailedAt: null, scheduledChange: null,
  } });
function useOwnerRead() {
  mocks.resolve.mockImplementation((_db, _user, _identity, options) => options.authorizeRead(candidate()));
  mocks.owner.mockResolvedValue(ownerSnapshot());
}
it('uses live owner read-only access for the cancelled perpetual free contract', async () => {
  useOwnerRead(); const result = await run();
  expect(result.status).toBe(200);
  expect(result.headers.get('cache-control')).toBe('private, no-store');
  expect(await result.json()).toMatchObject({ data: { status: 'cancelled', lifecycle_access: 'read_only', subscription_end_date: null, auto_renew: false } });
  expect(mocks.owner).toHaveBeenCalledExactlyOnceWith('synthetic-token', subscription, product);
  expect(mocks.cache).not.toHaveBeenCalled();
});
it('does not admit a cancelled contract when the live owner suspends access', async () => {
  useOwnerRead(); mocks.owner.mockResolvedValue({ ...ownerSnapshot(), access: 'suspended' });
  expect(await (await run()).json()).toMatchObject({ data: null });
});
it('surfaces owner failure without using cached access or rewriting cancellation', async () => {
  useOwnerRead(); mocks.owner.mockRejectedValue(new Error('owner unavailable'));
  expect((await run()).status).toBe(503); expect(mocks.cache).not.toHaveBeenCalled(); expect(mocks.sync).not.toHaveBeenCalled();
});
it('preserves an explicit owner denial as forbidden instead of an outage or empty successful read', async () => {
  useOwnerRead(); mocks.heal.mockResolvedValue(true); mocks.owner.mockResolvedValue({ kind: 'forbidden' });
  const result = await run();
  expect(result.status).toBe(403);
  expect(await result.json()).toMatchObject({ error: { code: 'SUBSCRIPTION_FORBIDDEN' } });
  expect(mocks.sync).not.toHaveBeenCalled(); expect(mocks.cache).not.toHaveBeenCalled();
});
it.each(['actor', 'subject', 'subscription', 'product', 'plan', 'revision'])('rejects altered owner %s scope', async defect => {
  useOwnerRead(); const snapshot = ownerSnapshot();
  if (defect === 'actor') snapshot.actorId = product;
  if (defect === 'subject') snapshot.state.subject.id = product;
  if (defect === 'subscription') snapshot.state.id = actor;
  if (defect === 'product') snapshot.state.productId = actor;
  if (defect === 'plan') snapshot.state.planId = actor;
  if (defect === 'revision') snapshot.state.revisionId = actor;
  mocks.owner.mockResolvedValue(snapshot);
  expect((await run()).status).toBe(503); expect(mocks.cache).not.toHaveBeenCalled();
});
