// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ resolve: vi.fn(), heal: vi.fn(), sync: vi.fn(), cache: vi.fn() }));
vi.mock('../shared/lib/org-subscription', async importOriginal => ({ ...(await importOriginal<any>()), resolveUserEntitlement: mocks.resolve }));
vi.mock('../lib/auth', () => ({ getContextUser: () => ({ id: 'u', email: 'u@example.test', roles: ['learner'] }) }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({}) }));
vi.mock('../lib/healConfig', () => ({ isHealEnabled: mocks.heal }));
vi.mock('../lib/sso-client', () => ({ ssoSyncSubscription: mocks.sync }));
vi.mock('../lib/sync-shadow', () => ({ syncUserShadow: vi.fn(), syncSubscriptionCache: mocks.cache }));
vi.mock('../lib/resilience', () => ({ withResilience: (_key: string, call: () => Promise<unknown>) => call() }));
import { handleGetActiveSubscription } from '../api/payments/handlers/get-active-subscription';
const run = (scope = '') => handleGetActiveSubscription({ request: new Request(`https://example.test/api/payments/get-active-subscription${scope ? `?scope=${scope}` : ''}`), env: {} } as any);
beforeEach(() => { vi.clearAllMocks(); mocks.heal.mockResolvedValue(false); mocks.resolve.mockResolvedValue(null); });
it('returns no subscription for a verified user without applicable coverage', async () => {
  expect((await (await run()).json()).data).toBeNull();
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
  expect((await (await run()).json()).data).toBeNull();
  expect(mocks.resolve).toHaveBeenCalledTimes(2);
});
it('rejects a requested dashboard missing from the authenticated roles', async () => {
  expect((await run('college_admin')).status).toBe(403);
  expect(mocks.resolve).not.toHaveBeenCalled();
});
