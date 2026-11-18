import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  withAuth: vi.fn((handler: unknown) => handler),
  entitled: vi.fn(),
  snapshot: vi.fn(),
  refresh: vi.fn(),
  db: {},
}));
vi.mock('../../lib/auth', () => ({
  withAuth: mocks.withAuth,
  getContextUser: (context: any) => context.data.user,
}));
vi.mock('../../lib/supabase', () => ({ getServiceClient: () => mocks.db }));
vi.mock('../../lib/entitlements', () => ({ hasFeatureEntitlement: mocks.entitled }));
vi.mock('../../lib/learning-eligibility', async () => ({
  ...await vi.importActual<any>('../../lib/learning-eligibility'),
  readLearningSnapshot: mocks.snapshot,
  refreshLearningCatalog: mocks.refresh,
}));
import { onRequestGet } from '../../api/learning/catalog';
import { LearningError } from '../../lib/learning-eligibility';

const level = {
  levelId: 'level', capabilityId: 'capability', capabilityName: 'Engineering',
  title: 'Build an API', levelNumber: 2, version: 1, fingerprint: 'a'.repeat(32),
  approved: true, evidence: [{ private: 'learner evidence' }],
};
const snapshot = { levels: [level] };
function context(roles: string[] = []) {
  return {
    request: new Request('https://fixture.invalid/api/learning/catalog'),
    env: {}, data: { user: { id: 'user', roles } },
  } as any;
}
beforeEach(() => {
  mocks.entitled.mockReset().mockResolvedValue(false);
  mocks.snapshot.mockReset().mockResolvedValue(snapshot);
  mocks.refresh.mockReset().mockResolvedValue(undefined);
});

it.each([['hr'], ['recruiter'], ['company_admin'], ['learner'], ['admin'], []])(
  'serves the catalogue without an entitlement for roles %j', async (...roles) => {
    const response = await onRequestGet(context(roles));
    expect(response.status).toBe(200);
    expect(mocks.entitled).not.toHaveBeenCalled();
    expect(mocks.snapshot).toHaveBeenCalledWith({}, null, null);
    expect(mocks.refresh).toHaveBeenCalledWith(mocks.db, snapshot);
    const { approved, evidence, ...publicLevel } = level;
    expect((await response.json()).data).toEqual({ levels: [publicLevel] });
  },
);
it('keeps the endpoint wrapped in the shared authentication middleware', () => {
  expect(mocks.withAuth).toHaveBeenCalledTimes(1);
  expect(onRequestGet).toBe(mocks.withAuth.mock.calls[0][0]);
});
it('does not depend on entitlement service availability', async () => {
  mocks.entitled.mockRejectedValue(new Error('Entitlement service unavailable'));
  expect((await onRequestGet(context(['hr']))).status).toBe(200);
  expect(mocks.entitled).not.toHaveBeenCalled();
});
it('preserves typed catalogue failures', async () => {
  mocks.snapshot.mockRejectedValue(new LearningError('LEARNING_STALE', 'Refresh required', 409));
  const response = await onRequestGet(context());
  expect(response.status).toBe(409);
  expect((await response.json()).error).toEqual({ code: 'LEARNING_STALE', message: 'Refresh required' });
  expect(mocks.refresh).not.toHaveBeenCalled();
});
it.each(['snapshot', 'refresh'] as const)('reports %s failures without exposing internal details', async (operation) => {
  mocks[operation].mockRejectedValue(new Error('private internal detail'));
  const response = await onRequestGet(context());
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.data).toBeNull();
  expect(body.error).toEqual({ code: 'LEARNING_UNAVAILABLE', message: 'Learning catalog is temporarily unavailable.' });
});
