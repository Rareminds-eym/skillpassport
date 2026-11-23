import { beforeEach, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
const f = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('@/entities/learner/api', () => ({ getlearnerByEmail: f.read }));
import { useLearnerDataByEmail } from '../useLearnerDataByEmail';
beforeEach(() => { vi.clearAllMocks(); });
it('reloads saved institution settings instead of continuing with the original DTO', async () => {
  f.read.mockResolvedValueOnce({ success: true, data: { id: 'learner', school_id: null } })
    .mockResolvedValueOnce({ success: true, data: { id: 'learner', school_id: 'saved-school' } });
  const { result, unmount } = renderHook(() => useLearnerDataByEmail('learner@example.test'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => window.dispatchEvent(new CustomEvent('learner_settings_updated')));
  await waitFor(() => expect(result.current.learnerData?.school_id).toBe('saved-school'));
  unmount();
  act(() => window.dispatchEvent(new CustomEvent('learner_settings_updated')));
  expect(f.read).toHaveBeenCalledTimes(2);
});
it('does not retain stale eligibility data when the settings refresh fails', async () => {
  f.read.mockResolvedValueOnce({ success: true, data: { id: 'learner', school_id: 'old-school' } })
    .mockRejectedValueOnce(new Error('Read failed'));
  const { result } = renderHook(() => useLearnerDataByEmail('learner@example.test'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => window.dispatchEvent(new CustomEvent('learner_settings_updated')));
  await waitFor(() => expect(result.current.error).toContain('Unable to refresh'));
  expect(result.current.learnerData).toBeNull();
});
