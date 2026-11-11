/** Read-only app-to-app health check. No job data or provider access. */
export async function indexingBlocked(env: Record<string, any>): Promise<boolean> {
  if (typeof env.JOB_INDEX_SERVICE?.getIndexingStatus !== 'function') return false; // rolling deployment
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        let status;
        try {
          status = await env.JOB_INDEX_SERVICE.getIndexingStatus();
          if (!['idle', 'running'].includes(status?.state)) return true;
          const attempted = Date.parse(status.lastAttemptAt);
          return !Number.isFinite(attempted) || Date.now() - attempted > 720000;
        } finally { status?.[Symbol.dispose]?.(); }
      })(),
      new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(true), 3000); }),
    ]);
  } catch { return true; }
  finally { clearTimeout(timer); }
}
