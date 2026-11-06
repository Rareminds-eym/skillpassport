export const MAX_PENDING_RESPONSES = 5;
export const MAX_PROCESSING_MS = 120_000;
export type PollBudget = { startedAt: number; responses: number; nextAt: number };
export type PendingResult = { state: 'processing' | 'index_building'; retryAfterSeconds: number; retryAt?: number };
export const processingTimeout = () => Object.assign(new Error('Recommendations are taking longer than expected. Please try again later.'), { code: 'RECOMMENDATIONS_PROCESSING_TIMEOUT' });
export const pollExhausted = (budget: PollBudget | null | undefined) => Boolean(budget && (budget.responses >= MAX_PENDING_RESPONSES || Date.now() >= budget.startedAt + MAX_PROCESSING_MS));

/** Abort only the resource request. Shared authentication refresh stays owned
 * by auth-client; a transport ignoring abort still cannot keep polling alive. */
export async function loadBeforeDeadline<T>(load: (signal: AbortSignal) => Promise<T>, signal: AbortSignal, deadline: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel: () => void = () => {};
  try {
    return await new Promise<T>((resolve, reject) => {
      cancel = () => { controller.abort(); reject(new DOMException('Aborted', 'AbortError')); };
      if (signal.aborted) { cancel(); return; }
      signal.addEventListener('abort', cancel, { once: true });
      timer = setTimeout(() => { controller.abort(); reject(processingTimeout()); }, Math.max(0, deadline - Date.now()));
      Promise.resolve().then(() => {
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        if (Date.now() >= deadline) throw processingTimeout();
        return load(controller.signal);
      }).then(value => {
        if (Date.now() >= deadline) { controller.abort(); reject(processingTimeout()); }
        else resolve(value);
      }, reject);
    });
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
