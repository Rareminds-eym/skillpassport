import { expect, it, vi } from 'vitest';
vi.mock('../../lib/auth', () => ({
  withAuth: (fn: unknown) => fn,
  getContextUser: () => ({ id: 'own-user' }),
}));
import { onRequestPost } from '../../api/realtime-ticket/index';
import { getPartitionId } from '../../lib/partition';
function context(issue?: (user: string) => Promise<unknown>) {
  return {
    request: new Request('https://app.invalid/api/realtime-ticket', {
      method: 'POST',
      body: JSON.stringify({ userId: 'foreign-user' }),
    }),
    env: issue ? { REALTIME_WORKER: { issueConnectionTicket: issue } } : {},
  } as unknown as Parameters<typeof onRequestPost>[0];
}
it('issues only for the verified actor and prevents credential caching', async () => {
  const issue = vi.fn(async () => ({
    ticket: 'opaque-ticket',
    expiresAt: Date.now() + 30000,
  }));
  const r = await onRequestPost(context(issue));
  expect(r.status).toBe(200);
  expect(issue).toHaveBeenCalledWith('own-user');
  expect(r.headers.get('Cache-Control')).toContain('no-store');
});
it('fails explicitly when the realtime worker is unavailable', async () => {
  expect((await onRequestPost(context())).status).toBe(503);
});
it('returns a bounded rate-limit response without revealing internals', async () => {
  const r = await onRequestPost(
    context(async () => {
      throw Error('RATE_LIMITED');
    }),
  );
  expect(r.status).toBe(429);
  expect(((await r.json()) as { error: { code: string } }).error.code).toBe(
    'RATE_LIMITED',
  );
});

it('issues directly through the configured hub when no worker service binding exists', async () => {
  const issue = vi.fn(async () => ({
    ticket: 'hub-ticket',
    expiresAt: Date.now() + 30000,
  }));
  const hub = {
    idFromName: vi.fn((name: string) => name),
    get: vi.fn(() => ({ issueConnectionTicket: issue })),
  };
  const ctx = context();
  Object.assign(ctx.env, { REALTIME_HUB: hub, REALTIME_PARTITIONS: '10' });
  const response = await onRequestPost(ctx);
  expect(response.status).toBe(200);
  expect(hub.idFromName).toHaveBeenCalledWith(
    `partition-${getPartitionId('own-user', 10)}`,
  );
  expect(issue).toHaveBeenCalledWith('own-user');
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});
it('preserves worker routing when both local bindings are present', async () => {
  const issue = vi.fn(async () => ({
    ticket: 'worker-ticket',
    expiresAt: Date.now() + 30000,
  }));
  const hub = { get: vi.fn() };
  const ctx = context(issue);
  Object.assign(ctx.env, { REALTIME_HUB: hub });
  expect((await onRequestPost(ctx)).status).toBe(200);
  expect(issue).toHaveBeenCalledWith('own-user');
  expect(hub.get).not.toHaveBeenCalled();
});
it('reports hub unavailability without accepting an unissued connection', async () => {
  const ctx = context();
  Object.assign(ctx.env, {
    REALTIME_HUB: {
      idFromName: () => {
        throw Error('unavailable');
      },
    },
  });
  expect((await onRequestPost(ctx)).status).toBe(503);
});
