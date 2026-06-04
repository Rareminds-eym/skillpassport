import { apiPost } from '@/shared/api/apiClient';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('message-service');

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
  
  // Soft delete fields
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
  
  // Joined data
  learner?: any;
  recruiter?: any;
  educator?: any;
  application?: any;
  opportunity?: any;
  class?: any;
}

export class MessageService {
  /**
   * Fetch educator details for conversations based on conversation type
   */
  static async fetchEducatorDetails(conversations: Conversation[]): Promise<Conversation[]> {
    if (!conversations || conversations.length === 0) return conversations;
    try {
      const resp = await apiPost<ApiResp<Conversation[]>>('/messaging/actions', { action: 'fetch-educator-details', conversations });
      return resp.data;
    } catch (error) {
      logger.error('Error fetching educator details', error instanceof Error ? error : new Error(String(error)));
      return conversations;
    }
  }

  /**
   * Get or create conversation between learner and recruiter
   * Optimized with request deduplication
   */
  static async getOrCreateConversation(
    learnerId: string,
    recruiterId: string,
    applicationId?: number | string,
    opportunityId?: number | string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `${learnerId}:${recruiterId}:${applicationId || 'null'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }
    
    const request = (async () => {
      try {
        const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
          action: 'get-or-create-conversation',
          learnerId, recruiterId, applicationId, opportunityId, subject
        });
        return resp.data;
      } catch (error) {
        logger.error('Error in getOrCreateConversation', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();
    
    pendingRequests.set(cacheKey, request);
    
    try {
      const result = await request;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get or create conversation between learner and educator
   * For school class-related discussions, assignments, etc.
   */
  static async getOrCreatelearnerEducatorConversation(
    learnerId: string,
    educatorId: string,
    classId?: string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `learner_educator:${learnerId}:${educatorId}:${classId || 'null'}:${subject || 'general'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }
    
    const request = (async () => {
      try {
        const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
          action: 'get-or-create-learner-educator-conversation',
          learnerId, educatorId, classId, subject
        });
        return resp.data;
      } catch (error) {
        logger.error('Error in getOrCreatelearnerEducatorConversation', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();
    
    pendingRequests.set(cacheKey, request);
    
    try {
      const result = await request;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get or create a conversation between a learner and college lecturer
   * For college course-related discussions, assignments, etc.
   */
  static async getOrCreatelearnerCollegeLecturerConversation(
    learnerId: string,
    collegeLecturerId: string,
    collegeId: string,
    programSectionId?: string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `learner_college_lecturer_${learnerId}_${collegeLecturerId}_${subject || 'general'}`;
    
    if (conversationCache.has(cacheKey)) {
      const cached = conversationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }
    
    const request = (async () => {
      try {
        const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
          action: 'get-or-create-learner-college-lecturer-conversation',
          learnerId, collegeLecturerId, collegeId, programSectionId, subject
        });
        return resp.data;
      } catch (error) {
        logger.error('Error in getOrCreatelearnerCollegeLecturerConversation', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();
    
    // Cache the promise result
    request.then(result => {
      conversationCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      // Clear cache after duration
      setTimeout(() => {
        conversationCache.delete(cacheKey);
      }, CACHE_DURATION);
    });
    
    return request;
  }

  /**
   * Send a message
   * Optimized with cache invalidation
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'learner' | 'recruiter' | 'educator' | 'college_educator' | 'school_admin' | 'college_admin',
    receiverId: string,
    receiverType: 'learner' | 'recruiter' | 'educator' | 'college_educator' | 'school_admin' | 'college_admin',
    messageText: string,
    applicationId?: number | string,
    opportunityId?: number | string,
    classId?: string,
    subject?: string,
    attachments?: any[]
  ): Promise<Message> {
    try {
      const resp = await apiPost<ApiResp<Message>>('/messaging/actions', {
        action: 'send-message',
        conversationId, senderId, senderType, receiverId, receiverType, messageText,
        applicationId, opportunityId, classId, subject, attachments
      });

      // Clear caches after sending message
      this.clearMessageCache(conversationId);
      this.clearConversationCache(senderId);
      this.clearConversationCache(receiverId);
      
      return resp.data;
    } catch (error) {
      logger.error('Error in sendMessage', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send a learner-educator message
   * Convenience method for learner-educator messaging
   */
  static async sendlearnerEducatorMessage(
    conversationId: string,
    learnerId: string,
    messageText: string,
    classId?: string,
    subject?: string,
    attachments?: any[]
  ): Promise<Message> {
    try {
      const resp = await apiPost<ApiResp<Message>>('/messaging/actions', {
        action: 'send-learner-educator-message',
        conversationId, learnerId, messageText, classId, subject, attachments
      });

      // Clear caches
      this.clearMessageCache(conversationId);
      this.clearConversationCache(learnerId);
      
      return resp.data;
    } catch (error) {
      logger.error('Error in sendlearnerEducatorMessage', error instanceof Error ? error : new Error(String(error)), { conversationId, learnerId });
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   * Optimized with caching and pagination support
   */
  static async getConversationMessages(
    conversationId: string,
    options?: { limit?: number; offset?: number; useCache?: boolean }
  ): Promise<Message[]> {
    const { limit, offset = 0, useCache = true } = options || {};
    const cacheKey = `${conversationId}:${limit || 'all'}:${offset}`;

    // Check cache
    if (useCache) {
      const cached = messageCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    // Deduplicate concurrent requests
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

        // Update cache
        if (useCache) {
          messageCache.set(cacheKey, { data: messages, timestamp: Date.now() });

          // Cleanup old cache entries
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
   * Clear message cache for a conversation
   */
  static clearMessageCache(conversationId?: string): void {
    if (conversationId) {
      // Clear specific conversation cache
      for (const key of messageCache.keys()) {
        if (key.startsWith(conversationId)) {
          messageCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      messageCache.clear();
    }
  }

  /**
   * Get all conversations for a user (excluding archived and deleted)
   * Optimized with selective field fetching and caching
   */
  static async getUserConversations(
    userId: string,
    userType: 'learner' | 'recruiter' | 'educator' | 'college_educator',
    includeArchived: boolean = false,
    useCache: boolean = true,
    conversationType?: string
  ): Promise<Conversation[]> {
    const cacheKey = `conversations:${userId}:${userType}:${includeArchived}:${conversationType || 'all'}`;
    
    // Check cache
    if (useCache) {
      const cached = conversationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }
    
    // Deduplicate concurrent requests
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

        // Update cache
        if (useCache) {
          conversationCache.set(cacheKey, { data: conversations, timestamp: Date.now() });
          this._cleanupCache();
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
   * Clear conversation cache
   */
  static clearConversationCache(userId?: string): void {
    if (userId) {
      // Clear specific user cache
      for (const key of conversationCache.keys()) {
        if (key.includes(userId)) {
          conversationCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      conversationCache.clear();
    }
  }

  /**
   * Cleanup old cache entries
   */
  private static _cleanupCache(): void {
    // Keep cache size manageable
    if (conversationCache.size > 20) {
      const entries = Array.from(conversationCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      // Remove oldest 5 entries
      for (let i = 0; i < 5; i++) {
        conversationCache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId: number): Promise<void> {
    try {
      await apiPost<ApiResp<void>>('/messaging/actions', {
        action: 'mark-as-read',
        messageId
      });
    } catch (error) {
      logger.error('Error in markAsRead', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Mark all messages in conversation as read
   * Optimized with batch updates and cache invalidation
   */
  static async markConversationAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      await apiPost<ApiResp<void>>('/messaging/actions', {
        action: 'mark-conversation-as-read',
        conversationId, userId
      });

      // Clear message cache
      this.clearMessageCache(conversationId);

    } catch (error) {
      logger.error('Error in markConversationAsRead', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Subscribe to new messages in a conversation (real-time via WebSocket)
   */
  static subscribeToConversationMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ): () => void {
    const wsClient = getWSClient();
    return wsClient.subscribe('messages', {
      event: 'INSERT',
      filter: `conversation_id=eq.${conversationId}`,
    }, (event) => {
      if (event.type === 'change') {
        onMessage(event.payload as Message);
      }
    });
  }

  /**
   * Subscribe to all messages for a user (real-time via WebSocket)
   */
  static subscribeToUserMessages(
    userId: string,
    onMessage: (message: Message) => void
  ): () => void {
    const wsClient = getWSClient();
    return wsClient.subscribe('messages', {
      event: 'INSERT',
      filter: `receiver_id=eq.${userId}`,
    }, (event) => {
      if (event.type === 'change') {
        onMessage(event.payload as Message);
      }
    });
  }

  /**
   * Get unread message count for user
   */
  static async getUnreadCount(
    userId: string,
    userType: 'learner' | 'recruiter' | 'educator'
  ): Promise<number> {
    try {
      const resp = await apiPost<ApiResp<number>>('/messaging/actions', {
        action: 'get-unread-count',
        userId, userType
      });
      return resp.data ?? 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Subscribe to conversation list updates (real-time via WebSocket)
   * Listens for changes in unread counts, new messages, etc.
   */
  static subscribeToUserConversations(
    userId: string,
    userType: 'learner' | 'recruiter' | 'educator' | 'college_educator' | 'school_admin' | 'college_admin' | 'university_admin',
    onUpdate: (conversation: Conversation) => void
  ): () => void {
    let filter: string;
    
    switch (userType) {
      case 'learner':
        filter = `learner_id=eq.${userId}`;
        break;
      case 'recruiter':
        filter = `recruiter_id=eq.${userId}`;
        break;
      case 'educator':
      case 'college_educator':
        filter = `educator_id=eq.${userId}`;
        break;
      case 'school_admin':
        filter = `school_id=eq.${userId}`;
        break;
      case 'college_admin':
        filter = `college_id=eq.${userId}`;
        break;
      default:
        throw new Error(`Invalid user type: ${userType}`);
    }

    const wsClient = getWSClient();
    const unsubUpdate = wsClient.subscribe('conversations', {
      event: 'UPDATE',
      filter,
    }, (event) => {
      if (event.type === 'change') {
        onUpdate(event.payload as Conversation);
      }
    });
    const unsubInsert = wsClient.subscribe('conversations', {
      event: 'INSERT',
      filter,
    }, (event) => {
      if (event.type === 'change') {
        onUpdate(event.payload as Conversation);
      }
    });

    return () => {
      unsubUpdate();
      unsubInsert();
    };
  }

  /**
   * Get conversation with learner details for recruiter
   */
  static async getConversationWithLearner(
    conversationId: string
  ): Promise<Conversation | null> {
    try {
      const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
        action: 'get-conversation-with-learner',
        conversationId
      });
      return resp.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Archive a conversation
   */
  static async archiveConversation(conversationId: string): Promise<void> {
    try {
      await apiPost<ApiResp<void>>('/messaging/actions', {
        action: 'archive-conversation',
        conversationId
      });
    } catch (error) {
      logger.error('Error archiving conversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Unarchive a conversation
   */
  static async unarchiveConversation(conversationId: string): Promise<void> {
    try {
      await apiPost<ApiResp<void>>('/messaging/actions', {
        action: 'unarchive-conversation',
        conversationId
      });
    } catch (error) {
      logger.error('Error unarchiving conversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get or create conversation between learner and school admin
   * For school-related discussions, issues, etc.
   */
  static async getOrCreatelearnerAdminConversation(
    learnerId: string,
    schoolId: string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `learner_admin:${learnerId}:${schoolId}:${subject || 'general'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const request = (async () => {
      try {
        const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
          action: 'get-or-create-learner-admin-conversation',
          learnerId, schoolId, subject
        });
        return resp.data;
      } catch (error) {
        logger.error('Error creating learner-admin conversation', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();

    pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Soft delete a conversation (only from current user's view)
   * This is similar to WhatsApp's "Delete Conversation" feature
   */
  static async deleteConversationForUser(
    conversationId: string,
    userId: string,
    userType: 'learner' | 'recruiter' | 'educator' | 'college_educator' | 'school_admin' | 'college_admin' | 'university_admin'
  ): Promise<void> {
    try {
      await apiPost<ApiResp<void>>('/messaging/actions', {
        action: 'delete-conversation-for-user',
        conversationId, userId, userType
      });
    } catch (error) {
      logger.error('Error deleting conversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Restore a deleted conversation
   */
  static async restoreConversation(
    conversationId: string,
    userId: string,
    userType: 'learner' | 'recruiter' | 'educator' | 'college_educator' | 'school_admin' | 'college_admin' | 'university_admin'
  ): Promise<void> {
    try {
      await apiPost<ApiResp<void>>('/messaging/actions', {
        action: 'restore-conversation',
        conversationId, userId, userType
      });
    } catch (error) {
      logger.error('Error restoring conversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Permanently delete a conversation and all its messages
   * WARNING: This is irreversible and will affect both parties
   * Use with caution - typically only for admin/moderation purposes
   */
  static async permanentlyDeleteConversation(conversationId: string): Promise<void> {
    try {
      await apiPost<ApiResp<void>>('/messaging/actions', {
        action: 'permanently-delete-conversation',
        conversationId
      });
    } catch (error) {
      logger.error('Error permanently deleting conversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get or create conversation between learner and college admin
   * For college-related discussions, issues, etc.
   */
  static async getOrCreatelearnerCollegeAdminConversation(
    learnerId: string,
    collegeId: string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `learner_college_admin:${learnerId}:${collegeId}:${subject || 'general'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const request = (async () => {
      try {
        const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
          action: 'get-or-create-learner-college-admin-conversation',
          learnerId, collegeId, subject
        });
        return resp.data;
      } catch (error) {
        logger.error('Error creating learner-college_admin conversation', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();

    pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get or create conversation between educator and school admin
   * For school-related discussions, issues, etc.
   */
  static async getOrCreateEducatorAdminConversation(
    educatorId: string,
    schoolId: string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `educator_admin:${educatorId}:${schoolId}:${subject || 'general'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const request = (async () => {
      try {
        const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
          action: 'get-or-create-educator-admin-conversation',
          educatorId, schoolId, subject
        });
        return resp.data;
      } catch (error) {
        logger.error('Error creating educator-admin conversation', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();

    pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Get or create conversation between college educator and college admin
   * For college-related discussions, issues, etc.
   */
  static async getOrCreateCollegeEducatorAdminConversation(
    educatorId: string,
    collegeId: string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `college_educator_admin:${educatorId}:${collegeId}:${subject || 'general'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const request = (async () => {
      try {
        const resp = await apiPost<ApiResp<Conversation>>('/messaging/actions', {
          action: 'get-or-create-college-educator-admin-conversation',
          educatorId, collegeId, subject
        });
        return resp.data;
      } catch (error) {
        logger.error('Error creating college educator-admin conversation', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    })();

    pendingRequests.set(cacheKey, request);

    try {
      const result = await request;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }
}

export default MessageService;
