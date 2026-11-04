import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createDb: vi.fn(), rpc: vi.fn(), from: vi.fn(), policy: vi.fn(), upsert: vi.fn() }));
vi.mock('../lib/db', () => ({ createDb: mocks.createDb }));
import { SyncService } from '../lib/sync-service';
const id = '10000000-0000-4000-8000-000000000001';
const env = { ZOHO_CANDIDATE_SOURCE: { getSubjectSyncPolicy: mocks.policy } } as never;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.createDb.mockReturnValue({ rpc: mocks.rpc, from: mocks.from });
  mocks.rpc.mockResolvedValue({ data: { version: 1, genericSyncAllowed: true, requiresCanonicalPolicy: false } });
  mocks.policy.mockResolvedValue({ version: 1, genericSyncAllowed: false });
  mocks.upsert.mockResolvedValue({ error: null }); mocks.from.mockReturnValue({ upsert: mocks.upsert });
});
describe('generic imported identity replay guard', () => {
  it('ignores generic user and membership replay for canonical imports before a local receipt exists', async () => {
    const service = new SyncService(env);
    expect(await service.syncUser({ id, user_metadata: { role: 'learner', activation_pending: false } })).toEqual({ success: true });
    expect(await service.syncMembership({ user_id: id, organization_id: id, roles: ['learner'] })).toEqual({ success: true });
    expect(mocks.policy).toHaveBeenCalledWith({ userId: id }); expect(mocks.from).not.toHaveBeenCalled();
  });
  it('keeps private and tombstoned subjects protected when delivery is paused or binding is missing', async () => {
    mocks.rpc.mockResolvedValue({ data: { version: 1, genericSyncAllowed: false, requiresCanonicalPolicy: true } });
    expect(await new SyncService({}).syncUser({ id })).toEqual({ success: true });
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.policy).not.toHaveBeenCalled();
  });
  it('requires canonical policy once candidate work exists, even when runtime flags are off', async () => {
    mocks.rpc.mockResolvedValue({ data: { version: 1, genericSyncAllowed: true, requiresCanonicalPolicy: true } });
    await expect(new SyncService({}).syncUser({ id })).rejects.toThrow('policy unavailable');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([null, { version: 1, genericSyncAllowed: 'true' }, { version: 1, genericSyncAllowed: true, unexpected: true }])('retries unavailable/malformed canonical policy without mutation %j', async response => {
    mocks.policy.mockResolvedValue(response);
    await expect(new SyncService(env).syncMembership({ user_id: id, organization_id: id, roles: ['learner'] })).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('retries failed local policy reads instead of accepting generic replay', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: 'XX000' } });
    await expect(new SyncService(env).syncUser({ id })).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('preserves ordinary non-imported identity writes', async () => {
    mocks.policy.mockResolvedValue({ version: 1, genericSyncAllowed: true });
    expect(await new SyncService(env).syncUser({ id, email: 'ordinary@fixture.example' })).toEqual({ success: true });
    expect(mocks.upsert).toHaveBeenCalledWith({ id, email: 'ordinary@fixture.example' }, { onConflict: 'id' });
  });
});
