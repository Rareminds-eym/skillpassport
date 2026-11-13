import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: mocks.post, apiPut: mocks.put }));
import { updatelearnerInstitutionSettings } from '../learnerSettingsService';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.put.mockResolvedValue({ success: true, learner: { id: 'owned-learner' } });
  mocks.post.mockResolvedValue({ data: { id: 'owned-learner', universityId: 'university', specialization: 'AI' } });
});

describe('institution settings persistence', () => {
  it('uses the owner endpoint and refreshes saved institution fields without forwarding unrelated drafts', async () => {
    const result = await updatelearnerInstitutionSettings('owner@example.test', {
      universityId: 'university', specialization: 'AI', name: 'Unsaved name', approval_status: 'approved', learnerId: 'foreign',
    });
    expect(mocks.put).toHaveBeenCalledWith('/learners/profile', { universityId: 'university', specialization: 'AI' });
    expect(mocks.post).toHaveBeenCalledWith('/learner-profile/actions', { action: 'fetch-learner-settings-by-email', email: 'owner@example.test' });
    expect(result).toMatchObject({ success: true, data: { universityId: 'university', specialization: 'AI' } });
  });
  it('preserves explicit cleared institution fields', async () => {
    await updatelearnerInstitutionSettings('owner@example.test', { schoolId: null, programId: '' });
    expect(mocks.put).toHaveBeenCalledWith('/learners/profile', { schoolId: null, programId: '' });
  });
  it('reports a rejected write without claiming success or reloading stale data', async () => {
    mocks.put.mockRejectedValue(new Error('Save rejected'));
    expect(await updatelearnerInstitutionSettings('owner@example.test', {})).toEqual({ success: false, error: 'Save rejected' });
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it('rejects malformed save acknowledgements', async () => {
    mocks.put.mockResolvedValue({ success: true });
    expect((await updatelearnerInstitutionSettings('owner@example.test', {})).success).toBe(false);
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
