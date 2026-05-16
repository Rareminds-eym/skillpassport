/**
 * Cross-environment replacement for AbortSignal.timeout().
 * 
 * AbortSignal.timeout() requires Chrome 103+, Safari 15.4+, Node 17.3+.
 * This works from Chrome 66+, Safari 12.1+, Node 14+.
 * 
 * @param ms - Timeout in milliseconds (default: 15000)
 * @returns AbortSignal that aborts after the specified timeout, or undefined if AbortController is unavailable
 */
export function createTimeoutSignal(ms = 15_000): AbortSignal | undefined {
  if (typeof AbortController === 'undefined') return undefined;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  // Clear the timer if the request completes before the timeout fires.
  // Without this, every successful request keeps a live timer until ms elapses.
  controller.signal.addEventListener('abort', () => clearTimeout(id), { once: true });

  return controller.signal;
}
