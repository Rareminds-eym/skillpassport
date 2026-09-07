/**
 * Resilience helpers — timeout + retry + circuit breaker
 * Industrial-grade 2026 pattern: Bulkhead → CircuitBreaker → Retry → Timeout
 * Inline (no new dep) to keep skillpassport lean; cockatiel-compatible shape.
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
  DISABLED = 'DISABLED',
  FORCED_OPEN = 'FORCED_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
  failureRateThreshold?: number; // 2026: % (default 50)
  slowCallRateThreshold?: number; // 2026: % (default 100)
  slowCallDurationThreshold?: number; // ms (default 60000)
  slidingWindowSize?: number; // default 100
  permittedNumberOfCallsInHalfOpenState?: number; // alias for successThreshold
  minimumNumberOfCalls?: number; // default 10
}

const DEFAULT_CB_CONFIG: Required<CircuitBreakerConfig> = {
  failureThreshold: 5,
  recoveryTimeout: 30_000,
  successThreshold: 3,
  failureRateThreshold: 50,
  slowCallRateThreshold: 100,
  slowCallDurationThreshold: 60_000,
  slidingWindowSize: 100,
  permittedNumberOfCallsInHalfOpenState: 10,
  minimumNumberOfCalls: 10,
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  // ponytail: per-isolate in-memory sliding window, bounded 100
  private callHistory: boolean[] = [];

  constructor(
    private readonly opts: CircuitBreakerConfig,
  ) {
    this.opts = { ...DEFAULT_CB_CONFIG, ...opts };
  }

  getState(): CircuitState {
    if (this.state === CircuitState.DISABLED || this.state === CircuitState.FORCED_OPEN) return this.state;
    if (this.state === CircuitState.OPEN && Date.now() - this.lastFailureTime > this.opts.recoveryTimeout) {
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
    return this.state;
  }

  disable(): void { this.state = CircuitState.DISABLED; }
  forceOpen(): void { this.state = CircuitState.FORCED_OPEN; this.lastFailureTime = Date.now(); }
  enable(): void {
    if (this.state === CircuitState.DISABLED || this.state === CircuitState.FORCED_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.successCount = 0;
      this.callHistory = [];
    }
  }

  async execute<T>(op: () => Promise<T>, fallback?: () => T): Promise<T> {
    const s = this.getState();
    if (s === CircuitState.DISABLED) {
      return op();
    }
    if (s === CircuitState.FORCED_OPEN) {
      if (fallback) return fallback();
      throw new Error('Circuit FORCED_OPEN');
    }
    if (s === CircuitState.OPEN) {
      if (fallback) return fallback();
      throw new Error('Circuit OPEN');
    }
    const start = Date.now();
    try {
      const r = await op();
      const duration = Date.now() - start;
      const isSlow = duration > (this.opts.slowCallDurationThreshold ?? 60000);
      this.onSuccess(isSlow);
      return r;
    } catch (e) {
      this.onFailure();
      if (fallback) return fallback();
      throw e;
    }
  }

  private onSuccess(isSlow = false): void {
    this.callHistory.push(!isSlow);
    if (this.callHistory.length > (this.opts.slidingWindowSize ?? 100)) this.callHistory.shift();
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      const required = this.opts.permittedNumberOfCallsInHalfOpenState ?? this.opts.successThreshold ?? 3;
      if (this.successCount >= required) {
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
    this.callHistory.push(false);
    if (this.callHistory.length > (this.opts.slidingWindowSize ?? 100)) this.callHistory.shift();
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      return;
    }
    // Rate-based trip when window filled
    if (this.callHistory.length >= (this.opts.minimumNumberOfCalls ?? 10)) {
      const failures = this.callHistory.filter(v => !v).length;
      const rate = (failures / this.callHistory.length) * 100;
      if (rate >= (this.opts.failureRateThreshold ?? 50)) {
        this.state = CircuitState.OPEN;
        return;
      }
    }
    if (this.failureCount >= (this.opts.failureThreshold ?? 5)) this.state = CircuitState.OPEN;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      historySize: this.callHistory.length,
      failureRate: this.callHistory.length ? (this.callHistory.filter(v => !v).length / this.callHistory.length) * 100 : 0,
    };
  }
}

// Singleton breakers per SSO method (in-memory per isolate)
const breakers = new Map<string, CircuitBreaker>();
export function getBreaker(key: string, overrides?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  if (!breakers.has(key)) {
    breakers.set(key, new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 30_000,
      successThreshold: 3,
      ...overrides,
    }));
  }
  const breaker = breakers.get(key)!;
  // Allow env-driven DISABLED/FORCED_OPEN without redeploy via heal flag
  return breaker;
}

export function getBreakerWithEnv(key: string, env?: Record<string, unknown>): CircuitBreaker {
  const breaker = getBreaker(key);
  const healDisabled = env && (env.HEAL_MODE === 'disabled' || (() => {
    try { const cats = JSON.parse((env.HEAL_CATEGORIES as string) || '{}'); return cats['resilience-breaker'] === 'disabled'; } catch { return false; }
  })());
  const forcedOpen = env && (() => {
    try { const cats = JSON.parse((env.HEAL_CATEGORIES as string) || '{}'); return cats['resilience-breaker'] === 'forced_open'; } catch { return false; }
  })();
  if (healDisabled) breaker.disable();
  else if (forcedOpen) breaker.forceOpen();
  else breaker.enable();
  return breaker;
}

export function resetBreakersForTest(): void { breakers.clear(); }

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
  opts: { timeoutMs?: number; maxRetries?: number; env?: Record<string, unknown> } = {},
): Promise<T> {
  const breaker = opts.env ? getBreakerWithEnv(key, opts.env) : getBreaker(key);
  const { timeoutMs = 5000, maxRetries = 2 } = opts;
  return breaker.execute(() => withRetry(() => withTimeout(op(), timeoutMs), { maxRetries }));
}
