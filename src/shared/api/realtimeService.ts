/**
 * Realtime Service — WebSocket Edition (V8)
 *
 * Provides broadcast channels, typing indicators, notification broadcasts,
 * and presence channels over a persistent WebSocket connection.
 */
import { getWSClient, type WSEvent } from './wsRealtimeClient';

export interface UserPresence {
  userId: string;
  userType: 'learner' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin';
  userName: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: string;
  conversationId?: string;
}

export interface BroadcastMessage {
  type: 'notification' | 'alert' | 'update' | 'typing' | 'custom';
  payload: any;
  from: string;
  timestamp: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
}

export interface OnlineUser {
  userId: string;
  userName: string;
  userType: 'learner' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin';
  status: 'online' | 'away' | 'busy';
  joinedAt: string;
}

interface SubscriptionEntry {
  type: 'broadcast' | 'presence';
  channelName: string;
  unsubscribe: () => void;
}

type PresenceHandler = (user: OnlineUser) => void;
type PresenceSyncHandler = (users: OnlineUser[]) => void;

interface PresenceSubscription {
  channelName: string;
  userId: string;
  currentStatus: string;
  onJoin?: PresenceHandler;
  onLeave?: PresenceHandler;
  onSync?: PresenceSyncHandler;
  lastKnownUsers: Map<string, OnlineUser>;
}

const subscriptions = new Map<string, SubscriptionEntry>();
const presenceSubscriptions = new Map<string, PresenceSubscription>();

function cleanupSubscription(channelName: string): void {
  const sub = subscriptions.get(channelName);
  if (sub) {
    sub.unsubscribe();
    subscriptions.delete(channelName);
  }
}

export class RealtimeService {
  static async createBroadcastChannel(
    channelName: string,
    onReceive: (payload: BroadcastMessage) => void
  ): Promise<{ unsubscribe: () => void }> {
    cleanupSubscription(channelName);

    const ws = getWSClient();
    const unsub = ws.subscribeToBroadcast(channelName, (event: WSEvent) => {
      if (event.type === 'broadcast') {
        const msg: BroadcastMessage = {
          type: (event.eventType || 'custom') as BroadcastMessage['type'],
          payload: event.payload,
          from: event.from,
          timestamp: event.timestamp,
        };
        onReceive(msg);
      }
    });

    subscriptions.set(channelName, { type: 'broadcast', channelName, unsubscribe: unsub });
    return { unsubscribe: () => cleanupSubscription(channelName) };
  }

  static async sendBroadcast(
    channelName: string,
    message: BroadcastMessage
  ): Promise<'ok' | 'timed out' | 'rate limited'> {
    try {
      const ws = getWSClient();
      ws.sendBroadcast(channelName, message.type, message.payload);
      return 'ok';
    } catch {
      return 'timed out';
    }
  }

  static async sendTypingIndicator(
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<'ok' | 'timed out' | 'rate limited'> {
    const channelName = `conversation:${conversationId}`;
    try {
      const ws = getWSClient();
      ws.sendBroadcast(channelName, 'typing', { userId, userName, conversationId, isTyping });
      return 'ok';
    } catch {
      return 'timed out';
    }
  }

  static subscribeToTypingIndicators(
    conversationId: string,
    onTyping: (indicator: TypingIndicator) => void
  ): { unsubscribe: () => void } {
    const channelName = `conversation:${conversationId}`;
    cleanupSubscription(channelName);

    const ws = getWSClient();
    const unsub = ws.subscribeToBroadcast(channelName, (event: WSEvent) => {
      if (event.type === 'broadcast' && event.eventType === 'typing') {
        onTyping(event.payload as TypingIndicator);
      }
    });

    subscriptions.set(channelName, { type: 'broadcast', channelName, unsubscribe: unsub });
    return { unsubscribe: () => cleanupSubscription(channelName) };
  }

  static async sendNotificationBroadcast(
    userId: string,
    notification: { title: string; message: string; type: string; link?: string }
  ): Promise<'ok' | 'timed out' | 'rate limited'> {
    const channelName = `user-notifications:${userId}`;
    try {
      const ws = getWSClient();
      ws.sendBroadcast(channelName, 'notification', notification);
      return 'ok';
    } catch {
      return 'timed out';
    }
  }

  static subscribeToNotificationBroadcasts(
    userId: string,
    onNotification: (notification: any) => void
  ): { unsubscribe: () => void } {
    const channelName = `user-notifications:${userId}`;
    cleanupSubscription(channelName);

    const ws = getWSClient();
    const unsub = ws.subscribeToBroadcast(channelName, (event: WSEvent) => {
      if (event.type === 'broadcast' && event.eventType === 'notification') {
        onNotification(event.payload);
      }
    });

    subscriptions.set(channelName, { type: 'broadcast', channelName, unsubscribe: unsub });
    return { unsubscribe: () => cleanupSubscription(channelName) };
  }

  static async joinPresenceChannel(
    channelName: string,
    userPresence: UserPresence,
    onJoin?: (user: OnlineUser) => void,
    onLeave?: (user: OnlineUser) => void,
    onSync?: (users: OnlineUser[]) => void
  ): Promise<{ unsubscribe: () => void }> {
    cleanupSubscription(channelName);

    const ps: PresenceSubscription = {
      channelName,
      userId: userPresence.userId,
      currentStatus: userPresence.status,
      onJoin,
      onLeave,
      onSync,
      lastKnownUsers: new Map(),
    };
    presenceSubscriptions.set(channelName, ps);

    const ws = getWSClient();

    // Join presence channel (handles heartbeat internally)
    ws.joinPresence(
      channelName,
      userPresence.userName,
      userPresence.userType,
      userPresence.status,
      userPresence.conversationId
    );

    // Subscribe to presence sync events
    const unsub = ws.subscribeToPresence(channelName, (event: WSEvent) => {
      if (event.type !== 'presence_sync') return;
      handlePresenceSync(ps, event);
    });

    subscriptions.set(channelName, { type: 'presence', channelName, unsubscribe: unsub });

    return { unsubscribe: () => this.unsubscribe(channelName) };
  }

  static async updatePresenceStatus(
    channelName: string,
    userId: string,
    status: 'online' | 'away' | 'busy'
  ): Promise<void> {
    const ps = presenceSubscriptions.get(channelName);
    if (ps && ps.userId === userId) {
      ps.currentStatus = status;
    }

    try {
      const ws = getWSClient();
      ws.sendHeartbeat(channelName, status);
    } catch {
      // Best-effort
    }
  }

  static getOnlineUsers(channelName: string): OnlineUser[] {
    const ps = presenceSubscriptions.get(channelName);
    if (!ps) return [];
    return Array.from(ps.lastKnownUsers.values());
  }

  static isUserOnline(channelName: string, userId: string): boolean {
    return this.getOnlineUsers(channelName).some(u => u.userId === userId);
  }

  static async unsubscribe(channelName: string): Promise<void> {
    const ps = presenceSubscriptions.get(channelName);
    if (ps) {
      presenceSubscriptions.delete(channelName);

      try {
        const ws = getWSClient();
        ws.leavePresence(channelName);
      } catch {}
    }

    cleanupSubscription(channelName);
  }

  static async unsubscribeAll(): Promise<void> {
    const ws = getWSClient();

    for (const [channelName] of presenceSubscriptions) {
      try {
        ws.leavePresence(channelName);
      } catch {}
    }
    presenceSubscriptions.clear();

    for (const [channelName] of subscriptions) {
      cleanupSubscription(channelName);
    }

    ws.disconnect();
  }

  static getChannel(channelName: string): { unsubscribe: () => void } | undefined {
    return subscriptions.has(channelName) ? { unsubscribe: () => this.unsubscribe(channelName) } : undefined;
  }

  static getAllChannels(): Map<string, { unsubscribe: () => void }> {
    const map = new Map<string, { unsubscribe: () => void }>();
    for (const [name] of subscriptions) {
      map.set(name, { unsubscribe: () => this.unsubscribe(name) });
    }
    return map;
  }

  static hasChannel(channelName: string): boolean {
    return subscriptions.has(channelName);
  }
}

function handlePresenceSync(ps: PresenceSubscription, event: WSEvent): void {
  if (event.type !== 'presence_sync') return;

  const incomingUsers = (event.users || []).reduce((map, u) => {
    map.set(u.userId, {
      userId: u.userId,
      userName: u.userName,
      userType: u.userType as OnlineUser['userType'],
      status: u.status as OnlineUser['status'],
      joinedAt: u.lastSeen,
    });
    return map;
  }, new Map<string, OnlineUser>());

  if (ps.onJoin) {
    for (const [id, user] of incomingUsers) {
      if (!ps.lastKnownUsers.has(id) && id !== ps.userId) {
        ps.onJoin(user);
      }
    }
  }

  if (ps.onLeave) {
    for (const [id, user] of ps.lastKnownUsers) {
      if (!incomingUsers.has(id) && id !== ps.userId) {
        ps.onLeave(user);
      }
    }
  }

  ps.lastKnownUsers = incomingUsers;

  if (ps.onSync) {
    ps.onSync(Array.from(incomingUsers.values()));
  }
}

export default RealtimeService;
