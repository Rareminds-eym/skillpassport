// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ insert: vi.fn(), authenticated: true }));
vi.mock('../lib/auth', () => ({
  withAuth: (handler: (context: unknown) => unknown) => (context: unknown) => f.authenticated ? handler(context) : new Response(null, { status: 401 }),
  getContextUser: () => ({ id: 'authenticated_buyer' }),
}));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ from: () => ({ insert: f.insert }) }) }));
import { onRequest } from '../api/log-error';
function request(body: unknown) {
  type WorkerContext = Parameters<typeof onRequest>[0];
  // Node supplies the Fetch API used by this handler; only the worker-specific
  // type extensions are adapted here. Production request types remain intact.
  const incoming = new Request('https://example.test/api/log-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) as unknown as WorkerContext['request'];
  const workerResponse = new Response() as unknown as Awaited<ReturnType<WorkerContext['next']>>;
  return onRequest({
    env: { ASSETS: { fetch: vi.fn(async () => workerResponse) } }, data: {}, params: {}, functionPath: '/api/log-error',
    waitUntil: vi.fn(), passThroughOnException: vi.fn(), next: vi.fn(async () => workerResponse),
    request: incoming,
  });
}
beforeEach(() => { vi.clearAllMocks(); f.authenticated = true; f.insert.mockResolvedValue({ error: null }); });
it('attributes diagnostics to verified identity instead of the client userId', async () => {
  const response = await request({ userId: 'forged_buyer', errorType: 'MOCK', errorMessage: 'Synthetic error' });
  expect(response.status).toBe(200);
  expect(f.insert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ user_id: 'authenticated_buyer' }));
});
it('does not require clients to supply their own identity', async () => {
  expect((await request({ errorType: 'MOCK', errorMessage: 'Synthetic' })).status).toBe(200);
});
it('returns an explicit failure when the database did not store the diagnostic', async () => {
  f.insert.mockResolvedValue({ error: { message: 'relation does not exist' } });
  const response = await request({ errorType: 'MOCK', errorMessage: 'Synthetic' });
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ success: false, error: { code: 'LOG_STORAGE_UNAVAILABLE' } });
});
it('rejects unauthenticated requests before persistence', async () => {
  f.authenticated = false; expect((await request({ errorType: 'MOCK', errorMessage: 'Synthetic' })).status).toBe(401);
  expect(f.insert).not.toHaveBeenCalled();
});
it.each([null, {}, { errorType: 'MOCK', errorMessage: 'x'.repeat(2001) }])('rejects invalid diagnostic payloads (%j)', async body => {
  expect((await request(body)).status).toBe(400); expect(f.insert).not.toHaveBeenCalled();
});
