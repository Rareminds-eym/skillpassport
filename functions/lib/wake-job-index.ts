let nextWake = 0;
/** Best-effort wake after commit. The database outbox and scheduled reconciliation
 * survive a lost signal; a search outage must not turn a committed write into an
 * apparent failure (and cause callers to create duplicate opportunities). */
export async function wakeJobIndex(env: Record<string, any>): Promise<void> {
  if (Date.now() < nextWake) return;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    if (typeof env.JOB_INDEX_SERVICE?.kickJobIndexing === 'function') {
      nextWake = Date.now() + 30000;
      await Promise.race([(async () => { const result = await env.JOB_INDEX_SERVICE.kickJobIndexing(); result?.[Symbol.dispose]?.(); })(), new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Wake deferred')), 3000);
      })]);
    }
  } catch { nextWake = Date.now() + 30000; console.warn('job_index_wake_deferred'); }
  finally { clearTimeout(timeout); }
}
