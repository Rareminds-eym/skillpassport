import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('message-query-service');

// Response wrapper from backend
interface ApiResp<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

// Cache configuration
const CACHE_DURATION = 30000; // 30 seconds
const conversationCache = new Map<string, { data: any; timestamp: number }>();
const messageCache = new Map<string, { data: Message[]; timestamp: number }>();

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

// Types
export interface Message {
  id: number;
  conversation_id: string;
  sender_id: string;
  sender_type: 'learner' | 'recruiter' | 'educator' | 'college_educator' | 'school_admin' | 'college_admin' | 'university_admin';
  receiver_id: string;
  receiver_type: 'learner' | 'recruiter' | 'educator' | 'college_educator' | 'school_admin' | 'college_admin' | 'university_admin';
  message_text: string;
  attachments?: any[];
  application_id?: number;
  opportunity_id?: number;
  class_id?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  learner_id?: string;
  recruiter_id?: string;
  educator_id?: string;
  school_id?: string;
  college_id?: string;
  application_id?: number;
  opportunity_id?: number;
  class_id?: number;
  subject?: string;
  status: 'active' | 'archived' | 'closed';
  conversation_type: 'learner_recruiter' | 'learner_educator' | 'educator_recruiter' | 'learner_admin' | 'learner_college_admin' | 'learner_college_educator' | 'educator_admin' | 'college_educator_admin';
  last_message_at?: string;
  last_message_preview?: string;
  last_message_sender?: string;
  learner_unread_count: number;
  recruiter_unread_count: number;
  educator_unread_count: number;
  admin_unread_count?: number;
  college_admin_unread_count?: number;
  created_at: string;
  updated_at: string;
  deleted_by_learner?: boolean;
  deleted_by_recruiter?: boolean;
  deleted_by_educator?: boolean;
  deleted_by_admin?: boolean;
  deleted_by_college_admin?: boolean;
  learner_deleted_at?: string;
  recruiter_deleted_at?: string;
  educator_deleted_at?: string;
  admin_deleted_at?: string;
  college_admin_deleted_at?: string;
  learner?: any;
  recruiter?: any;
  educator?: any;
  application?: any;
  opportunity?: any;
  class?: any;
}

/**
 * Query service for message and conversation read operations
 * Handles all GET requests, caching, and subscriptions
 */
export class MessageQueryService {
  /**
   * Get messages for a conversation with caching and pagination
   */
  static async getConversationMessages(
    conversationId: string,
    options?: { limit?: number; offset?: number; useCache?: boolean }
  ): Promise<Message[]> {
    const { limit, offset = 0, useCache = true } = options || {};
    const cacheKey = `${conversationId}:${limit || 'all'}:${offset}`;

    if (useCache) {
      const cached = messageCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const request = (async () => {
      try {
        const resp = await apiPost<ApiResp<Message[]>>('/messaging/actions', {
          action: 'get-conversation-messages',
          conversationId, limit, offset
        });

        const messages = resp.data || [];

        if (useCache) {
          messageCache.set(cacheKey, { data: messages, timestamp: Date.now() });

          if (messageCache.size > 50) {
            const oldestKey = messageCache.keys().next().value;
            if (oldestKey) {
              messageCache.delete(oldestKey);
            }
          }
        }

        return messages;
      } catch (error) {
        logger.error('Error in getConversationMessages', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();

    pendingRequests.set(cacheKey, request);

    try {
      return await request;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get all conversations for a user with caching
   */
  static async getUserConversations(
    userId: string,
    userType: 'learner' | 'recruiter' | 'educator' | 'college_educator',
    includeArchived: boolean = false,
    useCache: boolean = true,
    conversationType?: string
  ): Promise<Conversation[]> {
    const cacheKey = `conversations:${userId}:${userType}:${includeArchived}:${conversationType || 'all'}`;

    if (useCache) {
      const cached = conversationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const request = (async () => {
      try {
        const resp = await apiPost<ApiResp<Conversation[]>>('/messaging/actions', {
          action: 'get-user-conversations',
          userId, userType, includeArchived, conversationType
        });

        const conversations = resp.data || [];

        if (useCache) {
          conversationCache.set(cacheKey, { data: conversations, timestamp: Date.now() });

          if (conversationCache.size > 20) {
            const oldestKey = conversationCache.keys().next().value;
            if (oldestKey) {
              conversationCache.delete(oldestKey);
            }
          }
        }

        return conversations;
      } catch (error) {
        logger.error('Error in getUserConversations', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();

    pendingRequests.set(cacheKey, request);

    try {
      return await request;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string, userType: string): Promise<number> {
    try {
      const resp = await apiPost<ApiResp<{ count: number }>>('/messaging/actions', {
        action: 'get-unread-count',
        userId, userType
      });
      return resp.data?.count || 0;
    } catch (error) {
      logger.error('Error in getUnreadCount', error instanceof Error ? error : new Error(String(error)));
      return 0;
    }
  }

  /**
   * Fetch educator details for conversations
   */
  static async fetchEducatorDetails(conversations: Conversation[]): Promise<Conversation[]> {
    if (!conversations || conversations.length === 0) return conversations;
    try {
      const resp = await apiPost<ApiResp<Conversation[]>>('/messaging/actions', {
        action: 'fetch-educator-details',
        conversations
      });
      return resp.data;
    } catch (error) {
      logger.error('Error fetching educator details', error instanceof Error ? error : new Error(String(error)));
      return conversations;
    }
  }

  /**
   * Get a specific conversation with a learner
   */
  static async getConversationWithLearner(
    userId: string,
    learnerId: string,
    userType: string
  ): Promise<Conversation | null> {
    try {
      const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
        action: 'get-conversation-with-learner',
        userId, learnerId, userType
      });
      return resp.data || null;
    } catch (error) {
      logger.error('Error getting conversation with learner', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Clear message cache
   */
  static clearMessageCache(conversationId?: string): void {
    if (conversationId) {
      for (const key of messageCache.keys()) {
        if (key.startsWith(conversationId)) {
          messageCache.delete(key);
        }
      }
    } else {
      messageCache.clear();
    }
  }

  /**
   * Clear conversation cache
   */
  static clearConversationCache(userId?: string): void {
    if (userId) {
      for (const key of conversationCache.keys()) {
        if (key.includes(userId)) {
          conversationCache.delete(key);
        }
      }
    } else {
      conversationCache.clear();
    }
  }
}
