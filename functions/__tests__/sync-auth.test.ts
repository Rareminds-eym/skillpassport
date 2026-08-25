/**
 * Tests for the internal-webhook auth gate protecting /sync/* and
 * /api/sync/check-user (fail-closed; timing-safe comparison).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleSyncRequest } from '../lib/sync-handler';
import { onRequest } from '../api/sync/check-user';

const SECRET = 'test-internal-secret';

function syncRequest(body: unknown, secret?: string): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(secret !== undefined ? { Authorization: `Bearer ${secret}` } : {}),
  };
  return new Request('http://localhost:8788/sync/user', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function checkRequest(body: unknown, secret?: string): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(secret !== undefined ? { Authorization: `Bearer ${secret}` } : {}),
  };
  return new Request('http://localhost:8788/api/sync/check-user', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

const HANDLERS = { created: () => Promise.resolve({ success: true }) };
const ENV_OK = { INTERNAL_WEBHOOK_SECRET: SECRET } as never;

beforeEach(() => vi.restoreAllMocks());

describe('handleSyncRequest webhook gate', () => {
  it('rejects a missing Authorization header with 401', async () => {
    const res = await handleSyncRequest(
      { request: syncRequest({ action: 'created' }), env: ENV_OK },
      HANDLERS,
    );
    expect(res.status).toBe(401);
  });

  it('rejects a wrong secret with 401', async () => {
    const res = await handleSyncRequest(
      { request: syncRequest({ action: 'created' }, 'wrong'), env: ENV_OK },
      HANDLERS,
    );
    expect(res.status).toBe(401);
  });

  it('fails closed with 500 when the server-side secret is not configured', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await handleSyncRequest(
      { request: syncRequest({ action: 'created' }, SECRET), env: {} as never },
      HANDLERS,
    );
    errorSpy.mockRestore();
    expect(res.status).toBe(500);
  });

  it('passes the gate with the correct secret and proceeds to validation', async () => {
    const res = await handleSyncRequest(
      { request: syncRequest({}, SECRET), env: ENV_OK },
      HANDLERS,
    );
    // Past the gate; empty body fails action validation instead.
    expect(res.status).toBe(400);
    const body = await res.json() as { error?: { code?: string } };
    expect(body.error?.code).toBe('VALIDATION_ERROR');
  });
});

describe('check-user webhook gate', () => {
  it('returns 405 for non-POST before any auth evaluation', async () => {
    const res = await onRequest({
      request: new Request('http://localhost:8788/api/sync/check-user'),
      env: ENV_OK,
      params: {},
      data: {},
      waitUntil: () => {},
      next: () => Promise.resolve(new Response(null)),
    } as never);
    expect(res.status).toBe(405);
  });

  it('rejects a wrong secret with 401', async () => {
    const res = await onRequest({
      request: checkRequest({ userId: 'u1' }, 'wrong'),
      env: ENV_OK,
      params: {},
      data: {},
      waitUntil: () => {},
      next: () => Promise.resolve(new Response(null)),
    } as never);
    expect(res.status).toBe(401);
  });

  it('fails closed with 500 when the server-side secret is not configured', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await onRequest({
      request: checkRequest({ userId: 'u1' }, SECRET),
      env: {} as never,
      params: {},
      data: {},
      waitUntil: () => {},
      next: () => Promise.resolve(new Response(null)),
    } as never);
    errorSpy.mockRestore();
    expect(res.status).toBe(500);
  });

  it('passes the gate with the correct secret and reaches userId validation', async () => {
    const res = await onRequest({
      request: checkRequest({}, SECRET),
      env: ENV_OK,
      params: {},
      data: {},
      waitUntil: () => {},
      next: () => Promise.resolve(new Response(null)),
    } as never);
    expect(res.status).toBe(400);
    const body = await res.json() as { error?: string };
    expect(body.error).toContain('userId is required');
  });
});
