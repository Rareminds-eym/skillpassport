import { expect, it, vi } from 'vitest';
import { onRequestGet } from '../../api/realtime-stream/index';
const ticket = '7.1800000000000.' + 'a'.repeat(64);
function context(protocol: string) {
  const fetch = vi.fn(async () => new Response('accepted'));
  const namespace = {
    idFromName: vi.fn((name: string) => name),
    get: vi.fn(() => ({ fetch })),
  };
  return {
    ctx: {
      request: new Request('https://app.invalid/api/realtime-stream', {
        headers: { Upgrade: 'websocket', 'Sec-WebSocket-Protocol': protocol },
      }),
      env: { REALTIME_HUB: namespace, REALTIME_PARTITIONS: '10' },
    },
    namespace,
    fetch,
  };
}
it('routes a well-formed ticket to its hub for single-use validation', async () => {
  const { ctx, namespace, fetch } = context(`connection_ticket, ${ticket}`);
  await onRequestGet(ctx as unknown as Parameters<typeof onRequestGet>[0]);
  expect(namespace.idFromName).toHaveBeenCalledWith('partition-7');
  expect(fetch).toHaveBeenCalledOnce();
});
it.each([
  'connection_ticket, malformed',
  `connection_ticket, 99.${ticket.split('.').slice(1).join('.')}`,
])('rejects invalid tickets before routing: %s', async (protocol) => {
  const { ctx, namespace } = context(protocol);
  expect(
    (await onRequestGet(ctx as unknown as Parameters<typeof onRequestGet>[0]))
      .status,
  ).toBe(401);
  expect(namespace.get).not.toHaveBeenCalled();
});
