import { RealtimeChannel, REALTIME_LISTEN_TYPES, REALTIME_PRESENCE_LISTEN_EVENTS } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface UserPresence {
  userId: string;
  userType: 'student' | 'recruiter' | 'educator';
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
  userType: 'student' | 'recruiter' | 'educator';
  status: 'online' | 'away' | 'busy';
  joinedAt: string;
}

// ============================================================================
// REALTIME SERVICE
// ============================================================================

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();

  // ==========================================================================
  // CHANNEL: Database Changes (Already implemented in messageService)
  // ==========================================================================

  /**
   * Subscribe to conversation messages (database changes)
   * This is already implemented in MessageService but included here for completeness
   */
  static subscribeToConversationMessages(
    conversationId: string,
    onInsert?: (payload: any) => void,
    onUpdate?: (payload: any) => void,
    onDelete?: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `conversation-messages:${conversationId}`;
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName);


    const channel = supabase.channel(channelName);

    if (onInsert) {
      channel.on(
        'postgres_changes' as REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        onInsert
      );
    }

    if (onUpdate) {
      channel.on(
        'postgres_changes' as REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        onUpdate
      );
    }

    if (onDelete) {
      channel.on(
        'postgres_changes' as REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        onDelete
      );
    }

    channel.subscribe((status) => {
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to all user messages (for notifications)
   */
  static subscribeToUserMessages(
    userId: string,
    userType: 'student' | 'recruiter' | 'educator',
    onMessage: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `user-messages:${userId}`;
    
    this.unsubscribe(channelName);


    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        onMessage
      )
      .subscribe((status) => {
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  // ==========================================================================
  // BROADCAST: Send/Receive real-time events
  // ==========================================================================

  /**
   * Create a broadcast channel for sending/receiving real-time events
   */
  static createBroadcastChannel(
    channelName: string,
    onReceive: (payload: BroadcastMessage) => void
  ): RealtimeChannel {
    this.unsubscribe(channelName);


    const channel = supabase
      .channel(channelName)
      .on(
        'broadcast' as REALTIME_LISTEN_TYPES.BROADCAST,
        { event: 'message' },
        (payload) => {
          onReceive(payload.payload as BroadcastMessage);
        }
      )
      .subscribe((status) => {
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Send a broadcast message to a channel
   */
  static async sendBroadcast(
    channelName: string,
    message: BroadcastMessage
  ): Promise<'ok' | 'timed out' | 'rate limited'> {
    const channel = this.channels.get(channelName);
    
    if (!channel) {
      // Create channel if it doesn't exist
      const newChannel = supabase.channel(channelName);
      await newChannel.subscribe();
      this.channels.set(channelName, newChannel);
    }

    const targetChannel = this.channels.get(channelName)!;
    
    
    const result = await targetChannel.send({
      type: 'broadcast',
      event: 'message',
      payload: message
    });

    return result;
  }

  /**
   * Send typing indicator to a conversation
   */
  static async sendTypingIndicator(
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<'ok' | 'timed out' | 'rate limited'> {
    const channelName = `conversation:${conversationId}`;
    
    const typingMessage: BroadcastMessage = {
      type: 'typing',
      payload: {
        userId,
        userName,
        conversationId,
        isTyping
      } as TypingIndicator,
      from: userId,
      timestamp: new Date().toISOString()
    };

    return this.sendBroadcast(channelName, typingMessage);
  }

  /**
   * Subscribe to typing indicators in a conversation
   */
  static subscribeToTypingIndicators(
    conversationId: string,
    onTyping: (indicator: TypingIndicator) => void
  ): RealtimeChannel {
    const channelName = `conversation:${conversationId}`;
    
    return this.createBroadcastChannel(channelName, (message) => {
      if (message.type === 'typing') {
        onTyping(message.payload as TypingIndicator);
      }
    });
  }

  /**
   * Send a notification broadcast
   */
  static async sendNotificationBroadcast(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: string;
      link?: string;
    }
  ): Promise<'ok' | 'timed out' | 'rate limited'> {
    const channelName = `user-notifications:${userId}`;
    
    const notificationMessage: BroadcastMessage = {
      type: 'notification',
      payload: notification,
      from: 'system',
      timestamp: new Date().toISOString()
    };

    return this.sendBroadcast(channelName, notificationMessage);
  }

  /**
   * Subscribe to notification broadcasts
   */
  static subscribeToNotificationBroadcasts(
    userId: string,
    onNotification: (notification: any) => void
  ): RealtimeChannel {
    const channelName = `user-notifications:${userId}`;
    
    return this.createBroadcastChannel(channelName, (message) => {
      if (message.type === 'notification') {
        onNotification(message.payload);
      }
    });
  }

  // ==========================================================================
  // PRESENCE: Track online/offline users
  // ==========================================================================

  /**
   * Join a presence channel and track user status
   */
  static async joinPresenceChannel(
    channelName: string,
    userPresence: UserPresence,
    onJoin?: (user: OnlineUser) => void,
    onLeave?: (user: OnlineUser) => void,
    onSync?: (users: OnlineUser[]) => void
  ): Promise<RealtimeChannel> {
    this.unsubscribe(channelName);


    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userPresence.userId
        }
      }
    });

    // Handle presence events
    if (onJoin) {
      channel.on(
        'presence' as REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.JOIN },
        (payload) => {
          const joins = payload.newPresences;
          joins.forEach((presence: any) => {
            onJoin({
              userId: presence.userId,
              userName: presence.userName,
              userType: presence.userType,
              status: presence.status,
              joinedAt: new Date().toISOString()
            });
          });
        }
      );
    }

    if (onLeave) {
      channel.on(
        'presence' as REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.LEAVE },
        (payload) => {
          const leaves = payload.leftPresences;
          leaves.forEach((presence: any) => {
            onLeave({
              userId: presence.userId,
              userName: presence.userName,
              userType: presence.userType,
              status: presence.status,
              joinedAt: presence.joinedAt
            });
          });
        }
      );
    }

    if (onSync) {
      channel.on(
        'presence' as REALTIME_LISTEN_TYPES.PRESENCE,
        { event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
        () => {
          const state = channel.presenceState();
          const users: OnlineUser[] = [];
          
          Object.values(state).forEach((presences: any) => {
            presences.forEach((presence: any) => {
              users.push({
                userId: presence.userId,
                userName: presence.userName,
                userType: presence.userType,
                status: presence.status,
                joinedAt: presence.joinedAt || new Date().toISOString()
              });
            });
          });
          
          onSync(users);
        }
      );
    }

    // Subscribe and track presence
    await channel.subscribe(async (status) => {
      
      if (status === 'SUBSCRIBED') {
        // Track this user's presence
        await channel.track({
          userId: userPresence.userId,
          userName: userPresence.userName,
          userType: userPresence.userType,
          status: userPresence.status,
          lastSeen: userPresence.lastSeen,
          conversationId: userPresence.conversationId,
          joinedAt: new Date().toISOString()
        });
      }
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Update user presence status
   */
  static async updatePresenceStatus(
    channelName: string,
    userId: string,
    status: 'online' | 'away' | 'busy'
  ): Promise<void> {
    const channel = this.channels.get(channelName);
    
    if (!channel) {
      return;
    }


    const currentState = channel.presenceState();
    const userPresences = currentState[userId];
    
    if (userPresences && userPresences.length > 0) {
      const currentPresence = userPresences[0];
      
      await channel.track({
        ...currentPresence,
        status,
        lastSeen: new Date().toISOString()
      });
    }
  }

  /**
   * Get all online users in a presence channel
   */
  static getOnlineUsers(channelName: string): OnlineUser[] {
    const channel = this.channels.get(channelName);
    
    if (!channel) {
      return [];
    }

    const state = channel.presenceState();
    const users: OnlineUser[] = [];
    
    Object.values(state).forEach((presences: any) => {
      presences.forEach((presence: any) => {
        users.push({
          userId: presence.userId,
          userName: presence.userName,
          userType: presence.userType,
          status: presence.status,
          joinedAt: presence.joinedAt || new Date().toISOString()
        });
      });
    });
    
    return users;
  }

  /**
   * Check if a specific user is online
   */
  static isUserOnline(channelName: string, userId: string): boolean {
    const onlineUsers = this.getOnlineUsers(channelName);
    return onlineUsers.some(user => user.userId === userId);
  }

  // ==========================================================================
  // CHANNEL MANAGEMENT
  // ==========================================================================

  /**
   * Unsubscribe from a specific channel
   */
  static async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  static async unsubscribeAll(): Promise<void> {
    
    const unsubscribePromises = Array.from(this.channels.entries()).map(
      async ([name, channel]) => {
        await channel.unsubscribe();
      }
    );
    
    await Promise.all(unsubscribePromises);
    this.channels.clear();
  }

  /**
   * Get active channel
   */
  static getChannel(channelName: string): RealtimeChannel | undefined {
    return this.channels.get(channelName);
  }

  /**
   * Get all active channels
   */
  static getAllChannels(): Map<string, RealtimeChannel> {
    return this.channels;
  }

  /**
   * Check if channel exists
   */
  static hasChannel(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

export default RealtimeService;
