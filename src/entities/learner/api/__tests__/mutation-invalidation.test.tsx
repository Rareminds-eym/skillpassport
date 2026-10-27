import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn(), fetch: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiGet: f.get, apiPut: f.put, apiPost: f.post }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: f.fetch } }));
vi.mock('@/shared/model/authStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'user-A' } }) } }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }) }));
vi.mock('@/entities/learner/api', async () => import('../learnerService'));

import {
  updateCertificatesByEmail, updateEducationByEmail, updateExperienceByEmail,
  updateProjectsByEmail, updateSkillsByEmail, updateSoftSkillsByEmail,
  updateTechnicalSkillsByEmail, updateTrainingByEmail, updatelearnerByEmail,
} from '../learnerService';
import { useLearnerDataByEmail } from '../../model/useLearnerDataByEmail';

const email = 'learner@example.test';
const learnerId = 'learner-A';
const events: string[] = [];
const onChange = (event: Event) => events.push((event as CustomEvent).detail.learnerId);
const readProfile = () => ({ json: async () => ({ success: true, data: { id: learnerId, email, name: 'Learner A' } }) });

beforeEach(() => {
  vi.resetAllMocks();
  events.length = 0;
  window.addEventListener('learner-profile-updated', onChange);
  f.get.mockImplementation(async (path: string) => path.includes('find-by-email') ? { data: { id: learnerId } } : { data: [] });
  f.put.mockResolvedValue({ success: true });
  f.post.mockResolvedValue({ data: { learner: { id: learnerId } } });
  f.fetch.mockRejectedValue(new Error('Profile read unavailable'));
});
afterEach(() => {
  cleanup();
  window.removeEventListener('learner-profile-updated', onChange);
});

describe('acknowledged learner mutation invalidation', () => {
  it.each([
    ['technical skills', updateTechnicalSkillsByEmail], ['soft skills', updateSoftSkillsByEmail],
    ['education', updateEducationByEmail], ['experience', updateExperienceByEmail],
    ['certificates', updateCertificatesByEmail], ['projects', updateProjectsByEmail],
  ] as const)('%s remains saved and invalidates when its refresh fails', async (_name, update) => {
    const result = await update(email, []);
    expect(result).toMatchObject({ success: true, committed: true, error: null, refreshError: 'Profile read unavailable' });
    expect(events).toEqual([learnerId]);
  });

  it('dispatches before awaiting the profile read, with the resolved learner rather than user/email', async () => {
    f.fetch.mockImplementation(async () => {
      expect(events).toEqual([learnerId]);
      throw new Error('Read failed after acknowledgement');
    });
    await updateTechnicalSkillsByEmail(email, []);
    expect(events).toEqual([learnerId]);
  });

  it('does not emit on a failed write or attempt a post-save read', async () => {
    f.put.mockRejectedValue(new Error('Write rejected'));
    const result = await updateTechnicalSkillsByEmail(email, []);
    expect(result).toMatchObject({ success: false, error: 'Write rejected' });
    expect(events).toEqual([]);
    expect(f.fetch).not.toHaveBeenCalled();
  });

  it('returns a complete refreshed profile without emitting a second event', async () => {
    f.fetch.mockResolvedValue(readProfile());
    const result = await updateTechnicalSkillsByEmail(email, []);
    expect(result).toMatchObject({ success: true, committed: true, data: { id: learnerId } });
    expect(result.refreshError).toBeUndefined();
    expect(events).toEqual([learnerId]);
  });

  it('does not emit when the learner cannot be resolved', async () => {
    f.get.mockResolvedValue({ data: null });
    expect((await updateTechnicalSkillsByEmail(email, [])).success).toBe(false);
    expect(events).toEqual([]);
    expect(f.put).not.toHaveBeenCalled();
  });

  it('invalidates a core profile save independently of its refresh', async () => {
    const result = await updatelearnerByEmail(email, { name: 'Updated' });
    expect(result).toMatchObject({ success: true, committed: true, refreshError: 'Profile read unavailable' });
    expect(events).toEqual([learnerId]);
  });

  it('reports a partial training update and invalidates the acknowledged first write', async () => {
    f.get.mockImplementation(async (path: string) => {
      if (path.endsWith('/skills')) throw new Error('Skill read failed');
      return path.includes('find-by-email') ? { data: { id: learnerId } } : { data: [] };
    });
    const result = await updateTrainingByEmail(email, []);
    expect(result).toMatchObject({ success: false, committed: true, partial: true });
    expect(result.error).toContain('Training changes were saved');
    expect(events).toEqual([learnerId]);
    expect(f.put).toHaveBeenCalledTimes(1);
  });

  it('does not claim training was committed when its first write failed', async () => {
    f.put.mockRejectedValue(new Error('Training write failed'));
    const result = await updateTrainingByEmail(email, []);
    expect(result).toMatchObject({ success: false, committed: false });
    expect(events).toEqual([]);
  });

  it('invalidates both acknowledged training and skill writes before the refresh', async () => {
    const result = await updateTrainingByEmail(email, [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Course', skills: ['TypeScript'] }]);
    expect(f.put).toHaveBeenCalledTimes(2);
    expect(events).toEqual([learnerId, learnerId]);
    expect(result).toMatchObject({ success: true, committed: true, refreshError: 'Profile read unavailable' });
  });

  it('retains partial-save information when the second skill type fails', async () => {
    f.put.mockResolvedValueOnce({ success: true }).mockRejectedValueOnce(new Error('Soft skill write failed'));
    const result = await updateSkillsByEmail(email, [{ name: 'TypeScript', type: 'technical' }, { name: 'Communication', type: 'soft' }]);
    expect(result).toMatchObject({ success: false, committed: true, partial: true });
    expect(result.error).toContain('Technical skills were saved');
    expect(events).toEqual([learnerId]);
  });

  it('does not claim a read-only empty combined update committed a write', async () => {
    const result = await updateSkillsByEmail(email, []);
    expect(result.success).toBe(false);
    expect(result.committed).toBeUndefined();
    expect(events).toEqual([]);
    expect(f.put).not.toHaveBeenCalled();
  });

  it('preserves the last complete hook profile and surfaces refresh failure after a saved mutation', async () => {
    f.fetch.mockResolvedValueOnce(readProfile());
    const hook = renderHook(() => useLearnerDataByEmail(email, false));
    await act(async () => {});
    const previous = hook.result.current.learnerData;
    expect(previous.id).toBe(learnerId);
    let result: any;
    await act(async () => { result = await hook.result.current.updateTechnicalSkills([]); });
    expect(result).toMatchObject({ success: true, refreshError: 'Profile read unavailable' });
    expect(hook.result.current.learnerData).toBe(previous);
    expect(hook.result.current.error).toContain('Changes were saved');
    expect(events).toEqual([learnerId]);
  });

  it('does not let an old account save or refresh failure overwrite the new account profile', async () => {
    f.fetch.mockResolvedValueOnce(readProfile());
    const hook = renderHook(({ address }) => useLearnerDataByEmail(address, false), { initialProps: { address: email } });
    await act(async () => {});
    let acknowledge!: (value: unknown) => void;
    f.put.mockReturnValueOnce(new Promise(resolve => { acknowledge = resolve; }));
    let save!: Promise<any>;
    act(() => { save = hook.result.current.updateTechnicalSkills([]); });
    await act(async () => {});
    f.fetch.mockResolvedValueOnce({ json: async () => ({ success: true, data: { id: 'learner-B', email: 'B@example.test' } }) });
    hook.rerender({ address: 'B@example.test' });
    await act(async () => {});
    await act(async () => { acknowledge({ success: true }); await save; });
    expect(hook.result.current.learnerData.id).toBe('learner-B');
    expect(hook.result.current.error).toBeNull();
    expect(events).toEqual([learnerId]);
  });

  it('keeps a single-training save successful if its separate hook refresh fails', async () => {
    f.fetch.mockResolvedValueOnce(readProfile());
    f.put.mockResolvedValue({ data: { training: { id: 'training-A', learner_id: learnerId } } });
    const hook = renderHook(() => useLearnerDataByEmail(email, false));
    await act(async () => {});
    const previous = hook.result.current.learnerData;
    let result: any;
    await act(async () => { result = await hook.result.current.updateSingleTraining('training-A', { title: 'Updated course' }); });
    expect(result).toMatchObject({ success: true, refreshError: 'Profile read unavailable' });
    expect(hook.result.current.learnerData).toBe(previous);
    expect(events).toEqual([learnerId]);
  });
});
