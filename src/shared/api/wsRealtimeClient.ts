/**
 * WebSocket Realtime Client
 *
 * Persistent WebSocket connection to the realtime-worker Durable Object hub.
 * Provides subscription,
 * broadcast, and presence APIs so the migration is transparent to consumers.
 *
 * Key design decisions:
 *   - Auth via Sec-WebSocket-Protocol subprotocol (browser WS API has no custom headers)
 *   - Auto-reconnect with exponential backoff (1s → 2s → 4s → 8s → max 30s)
 *   - Re-subscribes to all tables/channels after reconnect
 *   - Heartbeat intervals for presence are managed per-channel
 */
import { ssoClient } from './ssoClient';

// ─── Types ──────────────────────────────────────────────────────────────────

export type WSEventType = 'connected' | 'change' | 'broadcast' | 'presence_sync' | 'error';

export interface WSChangeEvent {
  type: 'change';
  table: string;
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface WSBroadcastEvent {
  type: 'broadcast';
  channel: string;
  payload: Record<string, unknown>;
  eventType: string;
  from: string;
  timestamp: string;
}

export interface WSPresenceSyncEvent {
  type: 'presence_sync';
  channel: string;
  users: Array<{
    userId: string;
    userName: string;
    userType: string;
    status: string;
    lastSeen: string;
    conversationId?: string;
  }>;
  timestamp: string;
}

export interface WSConnectedEvent {
  type: 'connected';
  connId: string;
}

export interface WSErrorEvent {
  type: 'error';
  message: string;
}

export type WSEvent = WSConnectedEvent | WSChangeEvent | WSBroadcastEvent | WSPresenceSyncEvent | WSErrorEvent;
export type WSEventHandler = (event: WSEvent) => void;

// ─── Subscription tracking (for re-subscribe after reconnect) ───────────────

interface TableSubscription {
  type: 'table';
  table: string;
  event: string;
  filter?: string;
}

interface BroadcastSubscription {
  type: 'broadcast';
  channel: string;
}

interface PresenceSubscription {
  type: 'presence';
  channel: string;
}

type TrackedSubscription = TableSubscription | BroadcastSubscription | PresenceSubscription;

// ─── Client ─────────────────────────────────────────────────────────────────

export class WSRealtimeClient {
  private ws: WebSocket | null = null;
  private connId: string | null = null;

  // Handler maps
  // table → eventType → Set<handler>
  private changeHandlers: Map<string, Map<string, Set<WSEventHandler>>> = new Map();
  private broadcastHandlers: Map<string, Set<WSEventHandler>> = new Map();
  private presenceHandlers: Map<string, Set<WSEventHandler>> = new Map();
  private globalHandlers: Set<WSEventHandler> = new Set();

  // Track active subscriptions for re-subscribe after reconnect
  private trackedSubs: TrackedSubscription[] = [];

  // Presence heartbeat intervals (channel → intervalId)
  private heartbeatIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  // Presence user info (channel → { userName, userType, status, conversationId })
  private presenceUserInfo: Map<string, {
    userName: string;
    userType: string;
    status: string;
    conversationId?: string;
  }> = new Map();

  // Reconnect state
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalDisconnect = false;

  // Connection state
  private connecting = false;
  private connectionGen = 0;

  private authReady = false;
  private authIdentity: string | null = null;
  private requestAbort: AbortController | null = null;
  private readonly unsubscribeAuth: () => void;
  private exhaustedReported = false;
  private readonly onOnline = () => {
    if (!this.authReady || !this.hasActiveSubscriptions()) return;
    this.reconnectAttempts = 0;
    this.exhaustedReported = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connect();
  };

  constructor() {
    this.unsubscribeAuth = ssoClient.onAuthStateChange(
      (event) => {
        const phase = event.state.phase;
        if (phase !== 'authenticated' && phase !== 'refreshing') {
          this.authReady = false;
          if (
            phase === 'unauthenticated' ||
            phase === 'logging_out' ||
            phase === 'destroyed'
          )
            this.disconnect();
          else this.closeTransport();
          return;
        }
        const identity = `${event.state.identity.subject}:${event.state.identity.organizationId}`;
        const changed =
          this.authIdentity !== null && this.authIdentity !== identity;
        if (changed) this.disconnect();
        const resume = !this.authReady || changed;
        this.authIdentity = identity;
        this.authReady = true;
        if (resume) {
          this.reconnectAttempts = 0;
          this.exhaustedReported = false;
        }
        if (this.hasActiveSubscriptions()) this.connect();
      },
      { emitCurrent: true },
    );
    window.addEventListener('online', this.onOnline);
  }

  /** The SDK authenticates this HTTP request without exposing its private JWT. */
  connect(): void {
    if (!this.authReady || this.connecting || this.exhaustedReported) return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    )
      return;
    if (!this.hasActiveSubscriptions()) return;
    this.connecting = true;
    this.intentionalDisconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const gen = ++this.connectionGen;
    this.requestAbort = new AbortController();
    void this.connectWithTicket(gen, this.requestAbort.signal);
  }

  private async connectWithTicket(
    gen: number,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      const response = await ssoClient.fetch('/api/realtime-ticket', {
        method: 'POST',
        signal,
      });
      if (gen !== this.connectionGen || !this.authReady) return;
      if (response.status === 401 || response.status === 403) {
        this.authReady = false;
        this.connecting = false;
        return;
      }
      if (!response.ok) throw new Error('Connection ticket unavailable');
      const body: { success?: boolean; data?: { ticket?: string } } =
        await response.json();
      const ticket = body.data?.ticket;
      if (
        body.success === false ||
        typeof ticket !== 'string' ||
        !/^\d+\.\d{13}\.[a-f0-9]{64}$/.test(ticket)
      )
        throw new Error('Invalid connection ticket');
      if (
        gen !== this.connectionGen ||
        !this.authReady ||
        !this.hasActiveSubscriptions()
      )
        return;
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      let host = location.host;
      const localPort = import.meta.env.VITE_REALTIME_WS_PORT;
      if (
        localPort &&
        (import.meta.env.DEV ||
          ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname))
      )
        host = `${location.hostname}:${localPort}`;
      const socket = new WebSocket(`${protocol}//${host}/api/realtime-stream`, [
        'connection_ticket',
        ticket,
      ]);
      this.ws = socket;
      socket.onopen = () => {
        if (gen !== this.connectionGen) return;
        this.connecting = false;
        this.resubscribeAll();
      };
      socket.onmessage = (event) => {
        if (gen !== this.connectionGen) return;
        try {
          const data = JSON.parse(event.data as string) as WSEvent;
          if (data.type === 'connected') {
            this.connId = data.connId;
            this.reconnectAttempts = 0;
            this.exhaustedReported = false;
          }
          this.dispatchEvent(data);
        } catch {
          console.warn('[WS] Invalid realtime message');
        }
      };
      socket.onclose = () => {
        if (gen !== this.connectionGen) return;
        this.connecting = false;
        this.ws = null;
        this.connId = null;
        this.scheduleReconnect();
      };
      // Browsers dispatch close after an error; only one reconnect is scheduled.
      socket.onerror = () => {};
    } catch {
      if (gen !== this.connectionGen) return;
      this.connecting = false;
      this.scheduleReconnect();
    }
  }

  private closeTransport(): void {
    this.connectionGen++;
    this.requestAbort?.abort();
    this.requestAbort = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      )
        this.ws.close();
      this.ws = null;
    }
    this.connId = null;
    this.connecting = false;
  }

  // ─── Ensure Connected ─────────────────────────────────────────────────

  private ensureConnected(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    this.connect();
  }

  // ─── Send ─────────────────────────────────────────────────────────────

  private send(data: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else if (this.authReady && data.action === 'broadcast') {
      console.warn('[WS] Dropping message (not connected):', data.action || 'unknown');
    }
  }

  // ─── Subscribe to Table Changes ───────────────────────────────────────

  /**
   * Subscribe to database table change events.
   * Returns an unsubscribe function.
   */
  subscribe(
    table: string,
    config: { event?: string; filter?: string },
    handler: WSEventHandler
  ): () => void {
    const eventType = config.event || '*';

    if (!this.changeHandlers.has(table)) {
      this.changeHandlers.set(table, new Map());
    }
    const eventMap = this.changeHandlers.get(table)!;
    if (!eventMap.has(eventType)) {
      eventMap.set(eventType, new Set());
    }
    eventMap.get(eventType)!.add(handler);

    // Track subscription for re-subscribe after reconnect
    const subKey: TableSubscription = { type: 'table', table, event: eventType, filter: config.filter };
    if (!this.trackedSubs.some(s => s.type === 'table' && (s as TableSubscription).table === table && (s as TableSubscription).event === eventType && (s as TableSubscription).filter === config.filter)) {
      this.trackedSubs.push(subKey);
    }

    // Send subscribe message to DO
    this.ensureConnected();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        action: 'subscribe',
        table,
        event: eventType,
        filter: config.filter || null,
      });
    }

    return () => {
      const em = this.changeHandlers.get(table);
      if (!em) return;
      const handlers = em.get(eventType);
      if (!handlers) return;
      handlers.delete(handler);
      if (handlers.size === 0) {
        em.delete(eventType);
        if (em.size === 0) {
          this.changeHandlers.delete(table);
          this.trackedSubs = this.trackedSubs.filter(s => !(s.type === 'table' && (s as TableSubscription).table === table));
        }
      }
      this.checkDisconnect();
    };
  }

  // ─── Subscribe to Broadcasts ──────────────────────────────────────────

  /**
   * Subscribe to broadcast channel events.
   * Returns an unsubscribe function.
   */
  subscribeToBroadcast(channel: string, handler: WSEventHandler): () => void {
    if (!this.broadcastHandlers.has(channel)) {
      this.broadcastHandlers.set(channel, new Set());
    }
    this.broadcastHandlers.get(channel)!.add(handler);

    // Track for re-subscribe
    const subKey: BroadcastSubscription = { type: 'broadcast', channel };
    if (!this.trackedSubs.some(s => s.type === 'broadcast' && (s as BroadcastSubscription).channel === channel)) {
      this.trackedSubs.push(subKey);
    }

    // Send subscribe message
    this.ensureConnected();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        action: 'subscribe',
        table: `__broadcast:${channel}`,
        event: '*',
      });
    }

    return () => {
      const handlers = this.broadcastHandlers.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.broadcastHandlers.delete(channel);
          this.trackedSubs = this.trackedSubs.filter(s => !(s.type === 'broadcast' && (s as BroadcastSubscription).channel === channel));
        }
      }
      this.checkDisconnect();
    };
  }

  // ─── Subscribe to Presence ────────────────────────────────────────────

  /**
   * Subscribe to presence sync events for a channel.
   * Returns an unsubscribe function.
   */
  subscribeToPresence(channel: string, handler: WSEventHandler): () => void {
    if (!this.presenceHandlers.has(channel)) {
      this.presenceHandlers.set(channel, new Set());
    }
    this.presenceHandlers.get(channel)!.add(handler);

    // Track for re-subscribe
    const subKey: PresenceSubscription = { type: 'presence', channel };
    if (!this.trackedSubs.some(s => s.type === 'presence' && (s as PresenceSubscription).channel === channel)) {
      this.trackedSubs.push(subKey);
    }

    // Subscribe to the presence channel's internal table
    this.ensureConnected();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        action: 'subscribe',
        table: `__presence:${channel}`,
        event: '*',
      });
    }

    return () => {
      const handlers = this.presenceHandlers.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.presenceHandlers.delete(channel);
          this.trackedSubs = this.trackedSubs.filter(s => !(s.type === 'presence' && (s as PresenceSubscription).channel === channel));
        }
      }
      this.checkDisconnect();
    };
  }

  // ─── Global Handler ───────────────────────────────────────────────────

  /**
   * Register a handler for ALL events (useful for debugging/logging).
   */
  onAny(handler: WSEventHandler): () => void {
    this.globalHandlers.add(handler);
    this.ensureConnected();
    return () => {
      this.globalHandlers.delete(handler);
      this.checkDisconnect();
    };
  }

  // ─── Send Broadcast ───────────────────────────────────────────────────

  /**
   * Send a broadcast message to a channel.
   */
  sendBroadcast(channel: string, eventType: string, payload: unknown): void {
    this.ensureConnected();
    this.send({
      action: 'send-broadcast',
      channel,
      eventType,
      payload,
    });
  }

  // ─── Presence ─────────────────────────────────────────────────────────

  /**
   * Join a presence channel and start heartbeat.
   */
  joinPresence(
    channel: string,
    userName: string,
    userType: string,
    status: string = 'online',
    conversationId?: string
  ): void {
    this.presenceUserInfo.set(channel, { userName, userType, status, conversationId });

    this.ensureConnected();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        action: 'join-presence',
        channel,
        userName,
        userType,
        status,
        conversationId,
      });
    }

    // Start heartbeat (30 second interval)
    this.stopHeartbeat(channel);
    const interval = setInterval(() => {
      const info = this.presenceUserInfo.get(channel);
      if (info) {
        this.send({
          action: 'heartbeat',
          channel,
          status: info.status,
        });
      }
    }, 30_000);
    this.heartbeatIntervals.set(channel, interval);
  }

  /**
   * Leave a presence channel and stop heartbeat.
   */
  leavePresence(channel: string): void {
    this.stopHeartbeat(channel);
    this.presenceUserInfo.delete(channel);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        action: 'leave-presence',
        channel,
      });
    }
  }

  /**
   * Send a heartbeat with an updated status.
   */
  sendHeartbeat(channel: string, status: string): void {
    const info = this.presenceUserInfo.get(channel);
    if (info) {
      info.status = status;
    }

    this.send({
      action: 'heartbeat',
      channel,
      status,
    });
  }

  private stopHeartbeat(channel: string): void {
    const interval = this.heartbeatIntervals.get(channel);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(channel);
    }
  }

  // ─── Event Dispatch ───────────────────────────────────────────────────

  private dispatchEvent(event: WSEvent): void {
    // Global handlers get everything
    this.globalHandlers.forEach((handler) => handler(event));

    if (event.type === 'change') {
      const changeEvent = event as WSChangeEvent;
      const eventMap = this.changeHandlers.get(changeEvent.table);
      if (eventMap) {
        // Fire handlers for the specific event type
        const typeHandlers = eventMap.get(changeEvent.event);
        if (typeHandlers) {
          typeHandlers.forEach((handler) => handler(event));
        }
        // Fire wildcard handlers
        const wildcardHandlers = eventMap.get('*');
        if (wildcardHandlers) {
          wildcardHandlers.forEach((handler) => handler(event));
        }
      }
    } else if (event.type === 'broadcast') {
      const broadcastEvent = event as WSBroadcastEvent;
      const channelHandlers = this.broadcastHandlers.get(broadcastEvent.channel);
      if (channelHandlers) {
        channelHandlers.forEach((handler) => handler(event));
      }
    } else if (event.type === 'presence_sync') {
      const presenceEvent = event as WSPresenceSyncEvent;
      const channelHandlers = this.presenceHandlers.get(presenceEvent.channel);
      if (channelHandlers) {
        channelHandlers.forEach((handler) => handler(event));
      }
    }
  }

  // ─── Reconnect ────────────────────────────────────────────────────────

  private scheduleReconnect(): void {
    if (
      !this.authReady ||
      this.intentionalDisconnect ||
      !this.hasActiveSubscriptions() ||
      this.reconnectTimer
    )
      return;
    // Gated by ws-reconnect-heal flag (Vite env VITE_HEAL_MODE / VITE_HEAL_CATEGORIES)
    const viteFlagDisabled = (() => {
      try {
        const mode = (import.meta as unknown as { env: Record<string, string> })
          .env?.VITE_HEAL_MODE;
        const catsRaw = (
          import.meta as unknown as { env: Record<string, string> }
        ).env?.VITE_HEAL_CATEGORIES;
        if (mode === 'disabled')
          return catsRaw
            ? (() => {
                try {
                  const cats = JSON.parse(catsRaw);
                  return cats['ws-reconnect-heal'] !== 'enabled';
                } catch {
                  return true;
                }
              })()
            : true;
        if (catsRaw) {
          try {
            const cats = JSON.parse(catsRaw);
            if (cats['ws-reconnect-heal'] === 'disabled') return true;
          } catch {
            // Invalid optional flags retain the default reconnect policy.
          }
        }
      } catch {
            // Invalid optional flags retain the default reconnect policy.
          }
      return false;
    })();
    if (viteFlagDisabled) {
      console.warn('[WS] Reconnect disabled by ws-reconnect-heal flag');
      this.dispatchEvent({
        type: 'error',
        message: 'Reconnect disabled by flag',
      });
      return;
    }
    if (this.intentionalDisconnect) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (!this.exhaustedReported) {
        this.exhaustedReported = true;
        this.dispatchEvent({
          type: 'error',
          message:
            'Live updates could not reconnect. Reconnect to the network or sign in again.',
        });
      }
      return;
    }

    this.reconnectAttempts++;
    const baseDelay = 1000;
    const maxDelay = 30_000;
    const delay = Math.min(
      baseDelay * Math.pow(2, this.reconnectAttempts - 1),
      maxDelay,
    );
    // Add jitter to prevent thundering herd
    const jitter = delay * (0.5 + Math.random() * 0.5);

    console.info(
      `[WS] Reconnecting in ${Math.round(jitter)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.intentionalDisconnect && this.hasActiveSubscriptions()) {
        this.connect();
      }
    }, jitter);
  }

  /**
   * Re-sends all tracked subscriptions and re-joins presence after reconnect.
   */
  private resubscribeAll(): void {
    for (const sub of this.trackedSubs) {
      if (sub.type === 'table') {
        this.send({
          action: 'subscribe',
          table: sub.table,
          event: sub.event,
          filter: sub.filter || null,
        });
      } else if (sub.type === 'broadcast') {
        this.send({
          action: 'subscribe',
          table: `__broadcast:${sub.channel}`,
          event: '*',
        });
      } else if (sub.type === 'presence') {
        this.send({
          action: 'subscribe',
          table: `__presence:${sub.channel}`,
          event: '*',
        });
      }
    }

    // Re-join all presence channels
    for (const [channel, info] of this.presenceUserInfo) {
      this.send({
        action: 'join-presence',
        channel,
        userName: info.userName,
        userType: info.userType,
        status: info.status,
        conversationId: info.conversationId,
      });
    }
  }

  // ─── Disconnect ───────────────────────────────────────────────────────

  /** Close transport and release subscriptions without leaking pending requests. */
  disconnect(): void {
    this.intentionalDisconnect = true;
    this.closeTransport();
    for (const [channel] of this.heartbeatIntervals) this.stopHeartbeat(channel);
    this.presenceUserInfo.clear();
    this.trackedSubs = [];
    this.changeHandlers.clear();
    this.broadcastHandlers.clear();
    this.presenceHandlers.clear();
    this.globalHandlers.clear();
    this.reconnectAttempts = 0;
    this.exhaustedReported = false;
  }

  destroy(): void {
    this.disconnect();
    this.unsubscribeAuth();
    window.removeEventListener('online', this.onOnline);
  }

  // ─── Utilities ────────────────────────────────────────────────────────

  private hasActiveSubscriptions(): boolean {
    return (
      this.trackedSubs.length > 0 ||
      this.globalHandlers.size > 0
    );
  }

  private checkDisconnect(): void {
    if (!this.hasActiveSubscriptions()) {
      this.disconnect();
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionId(): string | null {
    return this.connId;
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

let wsClient: WSRealtimeClient | null = null;

/**
 * Returns the singleton WebSocket realtime client.
 */
export function getWSClient(): WSRealtimeClient {
  if (!wsClient) {
    wsClient = new WSRealtimeClient();
  }
  return wsClient;
}

export function destroyWSClient(): void {
  if (wsClient) {
    wsClient.destroy();
    wsClient = null;
  }
}
