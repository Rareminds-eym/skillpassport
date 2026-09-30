import { describe, it, expect } from 'vitest';
import { CircuitBreaker, CircuitState, getBreaker, resetBreakersForTest, getBreakerWithEnv } from '../resilience';

describe('CircuitBreaker 2026', () => {
  it('DISABLED always executes op', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, recoveryTimeout: 10000, successThreshold: 1 });
    cb.disable();
    expect(cb.getState()).toBe(CircuitState.DISABLED);
    const r = await cb.execute(async () => 42);
    expect(r).toBe(42);
  });

  it('FORCED_OPEN fails fast', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 10, recoveryTimeout: 10000, successThreshold: 1 });
    cb.forceOpen();
    await expect(cb.execute(async () => 1)).rejects.toThrow('FORCED_OPEN');
    cb.enable();
    await expect(cb.execute(async () => 1)).resolves.toBe(1);
  });

  it('OPEN → HALF_OPEN after recoveryTimeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, recoveryTimeout: 10, successThreshold: 1 });
    await expect(cb.execute(async () => { throw new Error('fail'); })).rejects.toThrow();
    expect(cb.getState()).toBe(CircuitState.OPEN);
    await new Promise(r => setTimeout(r, 15));
    expect(cb.getState()).toBe(CircuitState.HALF_OPEN);
  });

  it('getBreakerWithEnv disables when HEAL_MODE disabled', () => {
    resetBreakersForTest();
    const b = getBreakerWithEnv('test-key', { HEAL_MODE: 'disabled', HEAL_CATEGORIES: JSON.stringify({ 'resilience-breaker': 'disabled' }) });
    expect(b.getState()).toBe(CircuitState.DISABLED);
    b.enable();
  });

  it('getBreakerWithEnv forced_open when categories forced_open', () => {
    resetBreakersForTest();
    const b = getBreakerWithEnv('test-key2', { HEAL_CATEGORIES: JSON.stringify({ 'resilience-breaker': 'forced_open' }) });
    expect(b.getState()).toBe(CircuitState.FORCED_OPEN);
    b.enable();
  });

  it('resetBreakersForTest clears', () => {
    getBreaker('x');
    resetBreakersForTest();
    const b = getBreaker('x');
    expect(b.getMetrics().failureCount).toBe(0);
  });
});
