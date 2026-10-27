import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/api', () => ({ apiGet: f.get }));
import { useOpportunityPage } from '../useOpportunityPage';
beforeEach(() => {
  vi.useFakeTimers();
  f.get.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('cancels obsolete requests and ignores stale pages after the filter changes', async () => {
  let firstResolve: (value: unknown) => void = () => {};
  f.get
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          firstResolve = resolve;
        }),
    )
    .mockResolvedValueOnce({
      data: { visits: [{ id: 'new-page' }], total: 12 },
    });
  const { result, rerender } = renderHook(
    ({ path }) => useOpportunityPage(path, 'visits', 'own-user', true),
    { initialProps: { path: '/opportunities/visits?offset=0' } },
  );
  await act(() => vi.advanceTimersByTimeAsync(250));
  const signal = f.get.mock.calls[0][1].signal;
  rerender({ path: '/opportunities/visits?offset=10' });
  expect(signal.aborted).toBe(true);
  expect(result.current.loading).toBe(true);
  await act(() => vi.advanceTimersByTimeAsync(250));
  expect(result.current.rows).toEqual([{ id: 'new-page' }]);
  await act(async () => {
    firstResolve({ data: { visits: [{ id: 'obsolete' }], total: 999 } });
  });
  expect(result.current.total).toBe(12);
  expect(result.current.rows).toEqual([{ id: 'new-page' }]);
});
it('exposes malformed server data as an error instead of a false empty result', async () => {
  f.get.mockResolvedValue({ data: { visits: [] } });
  const { result } = renderHook(() =>
    useOpportunityPage('/opportunities/visits', 'visits', 'own-user', true),
  );
  await act(() => vi.advanceTimersByTimeAsync(250));
  expect(result.current.error).toContain('Invalid page response');
});
it('does not fetch disabled tabs or missing learner identities', async () => {
  renderHook(() =>
    useOpportunityPage(
      '/opportunities/applications',
      'applications',
      undefined,
      false,
    ),
  );
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(f.get).not.toHaveBeenCalled();
});
