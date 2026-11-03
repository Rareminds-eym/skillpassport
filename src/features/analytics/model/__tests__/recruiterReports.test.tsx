import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ kpis: vi.fn(), quality: vi.fn(), geography: vi.fn(), colleges: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'recruiter-test' }) }));
vi.mock('@/shared/api/wsRealtimeClient', () => ({ getWSClient: () => ({ subscribe: () => mocks.unsubscribe }) }));
vi.mock('../../api/analyticsService', () => ({ getAnalyticsKPIMetrics: mocks.kpis }));
vi.mock('@/features/educator-copilot', () => ({ getQualityMetrics: mocks.quality, getGeographicDistribution: mocks.geography, getTopHiringColleges: mocks.colleges }));

import { useAnalyticsKPIs } from '../useAnalyticsKPIs';
import { useRecruitmentFunnel } from '@/entities/user/model/useRecruitmentFunnel';
import { useQualityMetrics } from '@/features/educator/model/useQualityMetrics';
import { useDiversityData } from '@/features/educator/model/useDiversityData';

let client: QueryClient;
function Wrapper({ children }: PropsWithChildren) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
const first = { preset: 'custom' as const, startDate: '2025-09-01T00:00:00Z', endDate: '2025-09-15T23:59:59Z' };
const second = { ...first, startDate: '2025-09-16T00:00:00Z', endDate: '2025-09-30T23:59:59Z' };
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.kpis.mockImplementation(async (_, start: string) => ({ data: { totalCandidates: start === first.startDate ? 10 : 20 }, error: null }));
  mocks.quality.mockImplementation(async (_, start: string) => ({ data: { totalHired: start === first.startDate ? 1 : 2 }, error: null }));
  mocks.geography.mockImplementation(async (_, start: string) => ({ data: [{ city: start === first.startDate ? 'Chennai' : 'Bengaluru' }], error: null }));
  mocks.colleges.mockImplementation(async (_, start: string) => ({ data: [{ name: start === first.startDate ? 'College A' : 'College B' }], error: null }));
});
afterEach(() => { cleanup(); client.clear(); });

describe('Recruiter analytics report queries', () => {
  it('loads real KPI results and refetches for a second custom range', async () => {
    const hook = renderHook(options => useAnalyticsKPIs(options), { initialProps: first, wrapper: Wrapper });
    await waitFor(() => expect(hook.result.current.data?.totalCandidates).toBe(10));
    hook.rerender(second);
    await waitFor(() => expect(hook.result.current.data?.totalCandidates).toBe(20));
    expect(mocks.kpis).toHaveBeenLastCalledWith('custom', second.startDate, second.endDate);
  });

  it('exposes KPI failures for retry rather than returning an empty success', async () => {
    mocks.kpis.mockResolvedValue({ data: null, error: new Error('Unavailable') });
    const hook = renderHook(() => useAnalyticsKPIs(first), { wrapper: Wrapper });
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    mocks.kpis.mockResolvedValue({ data: { totalCandidates: 3 }, error: null });
    await act(async () => { await hook.result.current.refetch(); });
    await waitFor(() => expect(hook.result.current.data?.totalCandidates).toBe(3));
  });

  it('propagates funnel service failures to the report', async () => {
    const getStats = vi.fn().mockResolvedValue({ data: null, error: new Error('Unavailable') });
    const hook = renderHook(() => useRecruitmentFunnel(first, getStats), { wrapper: Wrapper });
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
  });

  it('separates quality, geography, and college reports for custom ranges', async () => {
    const hook = renderHook(options => ({ quality: useQualityMetrics(options), diversity: useDiversityData(options) }), { initialProps: first, wrapper: Wrapper });
    await waitFor(() => expect(hook.result.current.quality.data?.totalHired).toBe(1));
    await waitFor(() => expect(hook.result.current.diversity.geographic.data?.[0].city).toBe('Chennai'));
    hook.rerender(second);
    await waitFor(() => expect(hook.result.current.quality.data?.totalHired).toBe(2));
    await waitFor(() => expect(hook.result.current.diversity.geographic.data?.[0].city).toBe('Bengaluru'));
    await waitFor(() => expect(hook.result.current.diversity.colleges.data?.[0].name).toBe('College B'));
    expect(mocks.quality).toHaveBeenLastCalledWith('custom', second.startDate, second.endDate);
  });
});
