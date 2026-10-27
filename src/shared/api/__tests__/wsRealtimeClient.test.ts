import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({
  fetch: vi.fn(),
  listener: null as null | ((event: unknown) => void),
  phase: 'authenticated',
  subject: 'user-a',
  unsubscribe: vi.fn(),
  rawToken: vi.fn(() => {
    throw Error('Private token must not be read');
  }),
}));
vi.mock('../ssoClient', () => ({
  ssoClient: {
    fetch: f.fetch,
    getAccessToken: f.rawToken,
    onAuthStateChange: (listener: (event: unknown) => void) => {
      f.listener = listener;
      listener({
        state: {
          phase: f.phase,
          identity: { subject: f.subject, organizationId: 'org-a' },
        },
      });
      return f.unsubscribe;
    },
  },
}));
import { WSRealtimeClient } from '../wsRealtimeClient';
const token = '3.1800000000000.' + 'a'.repeat(64);
class Socket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instances: Socket[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.();
  });
  constructor(
    public url: string,
    public protocols: string[],
  ) {
    Socket.instances.push(this);
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
    this.onmessage?.({
      data: JSON.stringify({ type: 'connected', connId: 'connection' }),
    });
  }
}
let client: WSRealtimeClient;
const flush = () => vi.advanceTimersByTimeAsync(0);
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  Socket.instances = [];
  vi.stubGlobal('WebSocket', Socket);
  f.phase = 'authenticated';
  f.subject = 'user-a';
  f.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { ticket: token } }),
  });
});
afterEach(() => {
  client?.destroy();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('waits for session readiness without polling or consuming reconnect attempts', async () => {
  f.phase = 'initializing';
  client = new WSRealtimeClient();
  client.subscribeToBroadcast('maintenance', vi.fn());
  await vi.advanceTimersByTimeAsync(300000);
  expect(f.fetch).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
  f.listener?.({
    state: {
      phase: 'authenticated',
      identity: { subject: 'user-a', organizationId: 'org-a' },
    },
  });
  await flush();
  expect(Socket.instances).toHaveLength(1);
  expect(f.rawToken).not.toHaveBeenCalled();
});
it('uses same-origin authenticated tickets and resubscribes after a verified socket connection', async () => {
  vi.stubEnv('VITE_REALTIME_WS_PORT', '');
  client = new WSRealtimeClient();
  client.subscribeToBroadcast('maintenance', vi.fn());
  await flush();
  expect(f.fetch).toHaveBeenCalledWith(
    '/api/realtime-ticket',
    expect.objectContaining({ method: 'POST' }),
  );
  expect(Socket.instances[0].protocols).toEqual(['connection_ticket', token]);
  Socket.instances[0].open();
  expect(Socket.instances[0].url).toBe(
    `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/realtime-stream`,
  );
  expect(client.getConnectionId()).toBe('connection');
  expect(Socket.instances[0].send).toHaveBeenCalled();
});
it('does not open a late socket after disconnect during ticket creation', async () => {
  let resolve: (value: unknown) => void = () => {};
  f.fetch.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  client = new WSRealtimeClient();
  client.subscribeToBroadcast('maintenance', vi.fn());
  client.disconnect();
  resolve({
    ok: true,
    status: 200,
    json: async () => ({ data: { ticket: token } }),
  });
  await flush();
  expect(Socket.instances).toHaveLength(0);
});
it('stops on session rejection instead of reconnecting without a token', async () => {
  f.fetch.mockResolvedValue({ ok: false, status: 401 });
  client = new WSRealtimeClient();
  client.subscribeToBroadcast('maintenance', vi.fn());
  await vi.runAllTimersAsync();
  expect(f.fetch).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
it('bounds transient failures and never restarts exhausted retries for new subscriptions', async () => {
  f.fetch.mockRejectedValue(new Error('offline'));
  client = new WSRealtimeClient();
  const handler = vi.fn();
  client.onAny(handler);
  await vi.runAllTimersAsync();
  const count = f.fetch.mock.calls.length;
  expect(count).toBeLessThanOrEqual(11);
  for (let i = 0; i < 15; i++)
    client.subscribeToBroadcast(`channel-${i}`, vi.fn());
  await vi.runAllTimersAsync();
  expect(f.fetch).toHaveBeenCalledTimes(count);
  expect(
    handler.mock.calls.filter(([event]) => event.type === 'error'),
  ).toHaveLength(1);
});
it('closes and clears old subscriptions when the authenticated identity changes', async () => {
  client = new WSRealtimeClient();
  client.subscribeToBroadcast('old-user-channel', vi.fn());
  await flush();
  const first = Socket.instances[0];
  first.open();
  f.listener?.({
    state: {
      phase: 'authenticated',
      identity: { subject: 'user-b', organizationId: 'org-b' },
    },
  });
  await flush();
  expect(first.close).toHaveBeenCalled();
  expect(Socket.instances).toHaveLength(1);
  client.subscribeToBroadcast('new-user-channel', vi.fn());
  await flush();
  Socket.instances[1].open();
  expect(
    Socket.instances[1].send.mock.calls.map(([json]) => JSON.parse(json).table),
  ).toEqual(['__broadcast:new-user-channel']);
});
