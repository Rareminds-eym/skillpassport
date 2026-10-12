import { useEffect } from 'react';

/** Refresh pending accounting sequentially; stop when settled or unmounted. */
export function useCreditSettlementRefresh(
  pending: boolean,
  refresh: (canonical: boolean) => Promise<void>,
) {
  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let delay = 2000;
    const schedule = () => {
      timer = setTimeout(async () => {
        try {
          await refresh(true);
        } catch {
          // Keep pending after a failed read and retry; never infer settlement.
        } finally {
          if (!cancelled) {
            delay = Math.min(delay * 2, 10000);
            schedule();
          }
        }
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pending, refresh]);
}
