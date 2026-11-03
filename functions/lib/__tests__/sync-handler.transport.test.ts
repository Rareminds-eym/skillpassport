/**
 * Pins the failure transport the educator sync design depends on
 * (handleSyncRequest -> HTTP status -> auth-sync-consumer retry behaviour):
 *   NOT_FOUND -> 404 (retried), thrown -> 500 (retried), any other failure -> 400 (acked, not retried).
 */
import { describe, expect, it, vi } from 'vitest';
import { handleSyncRequest } from '../sync-handler';
import type { SyncResult } from '../sync-service';

const SECRET = 'test-internal-secret';
// Dummy values only so SyncService can be constructed; no request leaves the process (handlers are stubbed).
const ENV = {
  INTERNAL_WEBHOOK_SECRET: SECRET,
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
} as never;

function call(handler: () => Promise<SyncResult>): Promise<Response> {
  const request = new Request('http://localhost:8788/sync/membership', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
    body: JSON.stringify({ action: 'created', data: {} }),
  });
  return handleSyncRequest({ request, env: ENV }, { created: handler });
}

describe('handleSyncRequest failure transport', () => {
  it('NOT_FOUND (retryable) -> 404', async () => {
    const res = await call(async () => ({ success: false, errorCode: 'NOT_FOUND', error: 'x', retryable: true }));
    expect(res.status).toBe(404);
  });

  it('a thrown handler error -> 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await call(async () => { throw new Error('transient'); });
    expect(res.status).toBe(500);
  });

  it('any other failure, even flagged retryable, -> 400 (the flag is discarded)', async () => {
    const retryable = await call(async () => ({ success: false, errorCode: 'DB_ERROR', error: 'x', retryable: true }));
    const permanent = await call(async () => ({ success: false, errorCode: 'PROFILE_CONFLICT', error: 'x', retryable: false }));
    expect(retryable.status).toBe(400);
    expect(permanent.status).toBe(400);
  });

  it('success -> 200', async () => {
    expect((await call(async () => ({ success: true }))).status).toBe(200);
  });
});
