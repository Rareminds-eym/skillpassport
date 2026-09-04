/**
 * Resilience helpers — timeout + retry + circuit breaker
 * Industrial-grade 2026 pattern: Bulkhead → CircuitBreaker → Retry → Timeout
 * Inline (no new dep) to keep skillpassport lean; cockatiel-compatible shape.
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private readonly opts: { failureThreshold: number; recoveryTimeout: number; successThreshold: number },
  ) {}

  getState(): CircuitState {
    if (this.state === CircuitState.OPEN && Date.now() - this.lastFailureTime > this.opts.recoveryTimeout) {
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
    return this.state;
  }

  async execute<T>(op: () => Promise<T>, fallback?: () => T): Promise<T> {
    const s = this.getState();
    if (s === CircuitState.OPEN) {
      if (fallback) return fallback();
      throw new Error('Circuit OPEN');
    }
    try {
      const r = await op();
      this.onSuccess();
      return r;
    } catch (e) {
      this.onFailure();
      if (fallback) return fallback();
      throw e;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.opts.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.opts.failureThreshold) this.state = CircuitState.OPEN;
  }
}

// Singleton breakers per SSO method (in-memory per isolate)
const breakers = new Map<string, CircuitBreaker>();
export function getBreaker(key: string): CircuitBreaker {
  if (!breakers.has(key)) {
    breakers.set(key, new CircuitBreaker({ failureThreshold: 5, recoveryTimeout: 30_000, successThreshold: 3 }));
  }
  return breakers.get(key)!;
}

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let id: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    id = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (id) clearTimeout(id);
  }
}

export async function withRetry<T>(
  op: () => Promise<T>,
  opts: { maxRetries?: number; baseDelay?: number; maxDelay?: number; jitter?: boolean } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 500, maxDelay = 4000, jitter = true } = opts;
  let last: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await op();
    } catch (e) {
      last = e as Error;
      // Don't retry 4xx client errors (detect via status or word-boundary error code)
      const status = (e as any)?.status || (e as any)?.statusCode;
      if (typeof status === 'number' && status >= 400 && status < 500) throw e;
      const msg = String((e as any)?.message || e);
      if (/\b(400|401|403|404|422)\b/.test(msg)) throw e;
      if (attempt === maxRetries) break;
      const d = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const delay = jitter ? d * (0.5 + Math.random() * 0.5) : d;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw last;
}

export async function withResilience<T>(
  key: string,
  op: () => Promise<T>,
  opts: { timeoutMs?: number; maxRetries?: number } = {},
): Promise<T> {
  const breaker = getBreaker(key);
  const { timeoutMs = 5000, maxRetries = 2 } = opts;
  return breaker.execute(() => withRetry(() => withTimeout(op(), timeoutMs), { maxRetries }));
}
