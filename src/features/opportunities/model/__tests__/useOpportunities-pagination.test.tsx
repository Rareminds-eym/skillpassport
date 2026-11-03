import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ page: vi.fn() }));
vi.mock('@/features/opportunities', () => ({
  opportunitiesService: {
    getPaginatedOpportunities: f.page,
    formatOpportunityForDisplay: (job: unknown) => job,
  },
}));
import { useOpportunities } from '../useOpportunities';
beforeEach(() => {
  f.page.mockReset();
});
afterEach(cleanup);
it('does not mark a bookmarked last page resolved using initial placeholder counts', async () => {
  let resolve: (value: unknown) => void = () => {};
  f.page.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const { result } = renderHook(() =>
    useOpportunities({ serverSidePagination: true, page: 106, pageSize: 6 }),
  );
  expect(result.current.hasLoadedPage).toBe(false);
  expect(result.current.loading).toBe(true);
  await act(async () => resolve({ data: [{ id: 'last-job' }], count: 633 }));
  expect(result.current.hasLoadedPage).toBe(true);
  expect(result.current.totalPages).toBe(106);
});
it('cancels obsolete pages and never replaces the newest page with a late response', async () => {
  let first: (value: unknown) => void = () => {};
  f.page
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          first = r;
        }),
    )
    .mockResolvedValueOnce({ data: [{ id: 'second-page' }], count: 20 });
  const { result, rerender } = renderHook(
    ({ page }) => useOpportunities({ serverSidePagination: true, page }),
    { initialProps: { page: 1 } },
  );
  const signal = f.page.mock.calls[0][0].signal;
  await act(async () => rerender({ page: 2 }));
  expect(signal.aborted).toBe(true);
  await act(async () => first({ data: [{ id: 'obsolete' }], count: 100 }));
  expect(result.current.opportunities).toEqual([{ id: 'second-page' }]);
  expect(result.current.totalCount).toBe(20);
});
