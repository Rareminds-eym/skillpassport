import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-11T00:00:00Z'));
});
afterEach(() => vi.useRealTimers());

it('wakes application indexing without invoking the embedding provider', async () => {
  const { wakeJobIndex } = await import('../lib/wake-job-index');
  const dispose = vi.fn();
  const kickJobIndexing = vi.fn(async () => ({ accepted: true, [Symbol.dispose]: dispose }));
  const providerKick = vi.fn();
  const env = { JOB_INDEX_SERVICE: { kickJobIndexing }, EMBEDDING_SERVICE: { kickJobIndexing: providerKick } };
  await Promise.all(Array.from({ length: 50 }, () => wakeJobIndex(env)));
  expect(kickJobIndexing).toHaveBeenCalledOnce();
  expect(dispose).toHaveBeenCalledOnce();
  expect(providerKick).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(30000);
  await wakeJobIndex(env);
  expect(kickJobIndexing).toHaveBeenCalledTimes(2);
});

it('does not fall back to embedding-provider orchestration when the app binding is missing', async () => {
  const { wakeJobIndex } = await import('../lib/wake-job-index');
  const providerKick = vi.fn();
  await expect(wakeJobIndex({ EMBEDDING_SERVICE: { kickJobIndexing: providerKick } })).resolves.toBeUndefined();
  expect(providerKick).not.toHaveBeenCalled();
});

it('bounds unavailable orchestration without failing a committed opportunity write', async () => {
  const { wakeJobIndex } = await import('../lib/wake-job-index');
  const pending = wakeJobIndex({ JOB_INDEX_SERVICE: { kickJobIndexing: () => new Promise(() => {}) } });
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    await vi.advanceTimersByTimeAsync(3000);
    await expect(pending).resolves.toBeUndefined();
    expect(warning).toHaveBeenCalledWith('job_index_wake_deferred');
    expect(vi.getTimerCount()).toBe(0);
  } finally { warning.mockRestore(); }
});
