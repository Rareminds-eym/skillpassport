import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { indexingBlocked } from '../lib/job-index-health';

const now = new Date('2026-11-11T00:00:00Z');
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now); });
afterEach(() => vi.useRealTimers());
const environment = (getIndexingStatus: () => Promise<unknown>) => ({ JOB_INDEX_SERVICE: { getIndexingStatus } });

it.each(['blocked', 'stale', 'unknown', 'unrecognized'])('treats processor state %s as blocked and disposes its RPC result', async state => {
  const dispose = vi.fn();
  await expect(indexingBlocked(environment(async () => ({ state, lastAttemptAt: now.toISOString(), [Symbol.dispose]: dispose })))).resolves.toBe(true);
  expect(dispose).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it.each(['running', 'idle'])('accepts healthy %s heartbeat without confusing last-success age with current liveness', async state => {
  const dispose = vi.fn();
  await expect(indexingBlocked(environment(async () => ({ state, lastAttemptAt: new Date(now.getTime() - 60000).toISOString(),
    lastSuccessAt: '2025-01-01T00:00:00Z', [Symbol.dispose]: dispose })))).resolves.toBe(false);
  expect(dispose).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it.each(['running', 'idle'])('rejects expired %s heartbeat', async state => {
  await expect(indexingBlocked(environment(async () => ({ state, lastAttemptAt: new Date(now.getTime() - 720001).toISOString() })))).resolves.toBe(true);
});

it.each([undefined, null, 'not-a-date'])('rejects missing or invalid heartbeat %s', async lastAttemptAt => {
  await expect(indexingBlocked(environment(async () => ({ state: 'running', lastAttemptAt })))).resolves.toBe(true);
});

it('treats null status and RPC rejection as blocked without leaking or throwing provider details', async () => {
  await expect(indexingBlocked(environment(async () => null))).resolves.toBe(true);
  await expect(indexingBlocked(environment(async () => { throw new Error('private details'); }))).resolves.toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it('bounds a stalled read and disposes a result delivered after timeout', async () => {
  let finish!: (status: unknown) => void;
  const dispose = vi.fn();
  const pending = indexingBlocked(environment(() => new Promise(resolve => { finish = resolve; })));
  await vi.advanceTimersByTimeAsync(2999);
  let complete = false;
  pending.then(() => { complete = true; });
  await Promise.resolve(); expect(complete).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  await expect(pending).resolves.toBe(true);
  finish({ state: 'running', lastAttemptAt: now.toISOString(), [Symbol.dispose]: dispose });
  await vi.advanceTimersByTimeAsync(0);
  expect(dispose).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it('preserves rolling compatibility when the new method or app binding is missing', async () => {
  const embeddingHealth = vi.fn();
  await expect(indexingBlocked({})).resolves.toBe(false);
  await expect(indexingBlocked({ JOB_INDEX_SERVICE: {}, EMBEDDING_SERVICE: { getIndexingStatus: embeddingHealth } })).resolves.toBe(false);
  expect(embeddingHealth).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
