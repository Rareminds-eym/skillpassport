// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreditSettlementRefresh } from '../useCreditSettlementRefresh';

describe('useCreditSettlementRefresh', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('refreshes canonical credits automatically and stops when settlement clears', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ pending }) => useCreditSettlementRefresh(pending, refresh), {
      initialProps: { pending: true },
    });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(refresh).toHaveBeenCalledWith(true);
    rerender({ pending: false });
    await act(() => vi.advanceTimersByTimeAsync(20000));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not overlap requests and cancels after unmount during a read', async () => {
    let resolve!: () => void;
    const refresh = vi.fn(() => new Promise<void>(r => { resolve = r; }));
    const { unmount } = renderHook(() => useCreditSettlementRefresh(true, refresh));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(refresh).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => { resolve(); });
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('retries a failed read without requiring a manual refresh', async () => {
    const refresh = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    renderHook(() => useCreditSettlementRefresh(true, refresh));
    await act(() => vi.advanceTimersByTimeAsync(6000));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('does not poll a settled balance', async () => {
    const refresh = vi.fn();
    renderHook(() => useCreditSettlementRefresh(false, refresh));
    await act(() => vi.advanceTimersByTimeAsync(30000));
    expect(refresh).not.toHaveBeenCalled();
  });
});
