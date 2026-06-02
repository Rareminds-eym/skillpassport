import { ssoClient } from './ssoClient';
import { apiPost } from './apiClient';

const API_BASE = '/api';

export type SSEEventType = 'connected' | 'change' | 'reconnect' | 'error' | 'broadcast' | 'presence_sync';

export interface SSESubscriptionConfig {
  table?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  schema?: string;
  type?: 'table' | 'broadcast' | 'presence';
  channel?: string;
}

export interface SSEChangeEvent {
  type: 'change';
  table: string;
  event: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface SSEBroadcastEvent {
  type: 'broadcast';
  channel: string;
  payload: Record<string, any>;
  eventType: string;
  from: string;
  timestamp: string;
}

export interface SSEPresenceSyncEvent {
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

export interface SSEConnectedEvent {
  type: 'connected';
  subscriptions: string[];
}

export interface SSEReconnectEvent {
  type: 'reconnect';
}

export interface SSEErrorEvent {
  type: 'error';
  message?: string;
}

export type SSEEvent = SSEConnectedEvent | SSEChangeEvent | SSEReconnectEvent | SSEErrorEvent | SSEBroadcastEvent | SSEPresenceSyncEvent;

export type SSEEventHandler = (event: SSEEvent) => void;

export class SSERealtimeClient {
  private subscriptions: SSESubscriptionConfig[] = [];
  // table → eventType → Set<handler> — so dispatch filters by both table and event type
  private changeHandlers: Map<string, Map<string, Set<SSEEventHandler>>> = new Map();
  private broadcastHandlers: Map<string, Set<SSEEventHandler>> = new Map();
  private presenceHandlers: Map<string, Set<SSEEventHandler>> = new Map();
  private globalHandlers: Set<SSEEventHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelayMs = 1000;
  private activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private connectionGen = 0;
  private disconnected = false;

  subscribe(
    table: string,
    config: Omit<SSESubscriptionConfig, 'table'>,
    handler: SSEEventHandler
  ): () => void {
    const subConfig: SSESubscriptionConfig = { table, ...config, type: 'table' };
    if (!this.subscriptions.some(s => s.type === 'table' && s.table === table && s.event === config.event && s.filter === config.filter)) {
      this.subscriptions.push(subConfig);
    }

    const eventType = config.event || '*';

    if (!this.changeHandlers.has(table)) {
      this.changeHandlers.set(table, new Map());
    }
    const eventMap = this.changeHandlers.get(table)!;
    if (!eventMap.has(eventType)) {
      eventMap.set(eventType, new Set());
    }
    eventMap.get(eventType)!.add(handler);

    this.ensureConnected();

    return () => {
      this.unsubscribeTable(table, eventType, handler);
    };
  }

  subscribeToBroadcast(
    channel: string,
    handler: SSEEventHandler
  ): () => void {
    const subConfig: SSESubscriptionConfig = { type: 'broadcast', channel };
    if (!this.subscriptions.some(s => s.type === 'broadcast' && s.channel === channel)) {
      this.subscriptions.push(subConfig);
    }

    if (!this.broadcastHandlers.has(channel)) {
      this.broadcastHandlers.set(channel, new Set());
    }
    this.broadcastHandlers.get(channel)!.add(handler);

    this.ensureConnected();

    return () => {
      const handlers = this.broadcastHandlers.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.broadcastHandlers.delete(channel);
          this.subscriptions = this.subscriptions.filter(s => !(s.type === 'broadcast' && s.channel === channel));
        }
      }
      this.checkDisconnect();
    };
  }

  subscribeToPresence(
    channel: string,
    handler: SSEEventHandler
  ): () => void {
    const subConfig: SSESubscriptionConfig = { type: 'presence', channel };
    if (!this.subscriptions.some(s => s.type === 'presence' && s.channel === channel)) {
      this.subscriptions.push(subConfig);
    }

    if (!this.presenceHandlers.has(channel)) {
      this.presenceHandlers.set(channel, new Set());
    }
    this.presenceHandlers.get(channel)!.add(handler);

    this.ensureConnected();

    return () => {
      const handlers = this.presenceHandlers.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.presenceHandlers.delete(channel);
          this.subscriptions = this.subscriptions.filter(s => !(s.type === 'presence' && s.channel === channel));
        }
      }
      this.checkDisconnect();
    };
  }

  onAny(handler: SSEEventHandler): () => void {
    this.globalHandlers.add(handler);
    this.ensureConnected();
    return () => {
      this.globalHandlers.delete(handler);
      this.checkDisconnect();
    };
  }

  private unsubscribeTable(table: string, eventType: string, handler: SSEEventHandler): void {
    const eventMap = this.changeHandlers.get(table);
    if (!eventMap) { this.checkDisconnect(); return; }
    const handlers = eventMap.get(eventType);
    if (!handlers) { this.checkDisconnect(); return; }

    handlers.delete(handler);
    if (handlers.size === 0) {
      eventMap.delete(eventType);
      if (eventMap.size === 0) {
        this.changeHandlers.delete(table);
        this.subscriptions = this.subscriptions.filter(s => s.table !== table);
      }
    }
    this.checkDisconnect();
  }

  private ensureConnected(): void {
    if (this.activeReader) return;
    if (this.subscriptions.length === 0 && this.globalHandlers.size === 0) return;
    this.disconnected = false;
    this.connect();
  }

  private checkDisconnect(): void {
    if (this.subscriptions.length === 0 && this.globalHandlers.size === 0) {
      this.disconnect();
    }
  }

  private async connect(): Promise<void> {
    if (this.subscriptions.length === 0 && this.globalHandlers.size === 0) return;

    const params = new URLSearchParams();
    for (const sub of this.subscriptions) {
      params.append('sub', JSON.stringify(sub));
    }

    const url = `${API_BASE}/realtime-stream?${params.toString()}`;

    const gen = ++this.connectionGen;

    try {
      const response = await ssoClient.fetch(url);

      if (!response.ok) {
        console.error('[SSE] Connection failed:', response.status);
        this.scheduleReconnect();
        return;
      }

      if (!response.body) {
        console.error('[SSE] No response body');
        this.scheduleReconnect();
        return;
      }

      const reader = response.body.getReader();
      this.activeReader = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      this.reconnectAttempts = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data) as SSEEvent;
              this.dispatchEvent(event);
            } catch {
              console.warn('[SSE] Failed to parse event:', data);
            }
          }
        }
      }

      if (!this.disconnected) {
        this.scheduleReconnect();
      }
    } catch (error) {
      console.error('[SSE] Connection error:', error);
      if (!this.disconnected) {
        this.scheduleReconnect();
      }
    } finally {
      if (gen === this.connectionGen) {
        this.activeReader = null;
      }
    }
  }

  private dispatchEvent(event: SSEEvent): void {
    this.globalHandlers.forEach(handler => handler(event));

    if (event.type === 'change') {
      const eventMap = this.changeHandlers.get(event.table);
      if (eventMap) {
        // Fire handlers registered for this specific event type
        const typeHandlers = eventMap.get(event.event);
        if (typeHandlers) {
          typeHandlers.forEach(handler => handler(event));
        }
        // Fire handlers registered for '*' (all events)
        const wildcardHandlers = eventMap.get('*');
        if (wildcardHandlers) {
          wildcardHandlers.forEach(handler => handler(event));
        }
      }
    } else if (event.type === 'broadcast') {
      const channelHandlers = this.broadcastHandlers.get(event.channel);
      if (channelHandlers) {
        channelHandlers.forEach(handler => handler(event));
      }
    } else if (event.type === 'presence_sync') {
      const channelHandlers = this.presenceHandlers.get(event.channel);
      if (channelHandlers) {
        channelHandlers.forEach(handler => handler(event));
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnect attempts reached');
      this.dispatchEvent({ type: 'error', message: 'Max reconnect attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.subscriptions.length > 0 && !this.disconnected) {
        this.connect();
      }
    }, delay);
  }

  disconnect(): void {
    this.disconnected = true;
    if (this.activeReader) {
      this.activeReader.cancel().catch(() => {});
      this.activeReader = null;
    }
    this.subscriptions = [];
    this.changeHandlers.clear();
    this.broadcastHandlers.clear();
    this.presenceHandlers.clear();
    this.globalHandlers.clear();
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.activeReader !== null;
  }
}

let sseClient: SSERealtimeClient | null = null;

export function getSSEClient(): SSERealtimeClient {
  if (!sseClient) {
    sseClient = new SSERealtimeClient();
  }
  return sseClient;
}

export function destroySSEClient(): void {
  if (sseClient) {
    sseClient.disconnect();
    sseClient = null;
  }
}
