import { supabase } from '../lib/supabaseClient';

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
  sender_type: 'student' | 'recruiter';
  receiver_id: string;
  receiver_type: 'student' | 'recruiter';
  message_text: string;
  attachments?: any[];
  application_id?: number;
  opportunity_id?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  student_id: string;
  recruiter_id: string;
  application_id?: number;
  opportunity_id?: number;
  subject?: string;
  status: 'active' | 'archived' | 'closed';
  last_message_at?: string;
  last_message_preview?: string;
  last_message_sender?: string;
  student_unread_count: number;
  recruiter_unread_count: number;
  created_at: string;
  updated_at: string;
  
  // Soft delete fields
  deleted_by_student?: boolean;
  deleted_by_recruiter?: boolean;
  student_deleted_at?: string;
  recruiter_deleted_at?: string;
  
  // Joined data
  student?: any;
  recruiter?: any;
  application?: any;
  opportunity?: any;
}

export class MessageService {
  /**
   * Get or create conversation between student and recruiter
   * Optimized with request deduplication
   */
  static async getOrCreateConversation(
    studentId: string,
    recruiterId: string,
    applicationId?: number,
    opportunityId?: number,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `${studentId}:${recruiterId}:${applicationId || 'null'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }
    
    const request = this._getOrCreateConversationInternal(
      studentId,
      recruiterId,
      applicationId,
      opportunityId,
      subject
    );
    
    pendingRequests.set(cacheKey, request);
    
    try {
      const result = await request;
      return result;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  private static async _getOrCreateConversationInternal(
    studentId: string,
    recruiterId: string,
    applicationId?: number,
    opportunityId?: number,
    subject?: string
  ): Promise<Conversation> {
    try {
      // Optimized query: fetch only necessary fields initially
      let query = supabase
        .from('conversations')
        .select('id, status, deleted_by_student, deleted_by_recruiter, student_id, recruiter_id, application_id, opportunity_id, subject, created_at, updated_at')
        .eq('student_id', studentId)
        .eq('recruiter_id', recruiterId)
        .limit(1);
      
      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }
      
      const { data: existing, error: fetchError } = await query.maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existing) {
        // If conversation was deleted, restore it (WhatsApp behavior)
        if (existing.deleted_by_student || existing.deleted_by_recruiter) {
          console.log('📥 Restoring previously deleted conversation:', existing.id);
          
          const { data: restored, error: restoreError } = await supabase
            .from('conversations')
            .update({
              deleted_by_student: false,
              deleted_by_recruiter: false,
              student_deleted_at: null,
              recruiter_deleted_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();
          
          if (restoreError) {
            console.warn('⚠️ Could not restore conversation, using as-is');
            return existing as Conversation;
          }
          
          console.log('✅ Conversation restored with full message history');
          return restored;
        }
        
        return existing as Conversation;
      }
      
      // Create new conversation
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          student_id: studentId,
          recruiter_id: recruiterId,
          application_id: applicationId,
          opportunity_id: opportunityId,
          subject: subject,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send a message
   * Optimized with cache invalidation
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'student' | 'recruiter',
    receiverId: string,
    receiverType: 'student' | 'recruiter',
    messageText: string,
    applicationId?: number,
    opportunityId?: number,
    attachments?: any[]
  ): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          sender_type: senderType,
          receiver_id: receiverId,
          receiver_type: receiverType,
          message_text: messageText,
          application_id: applicationId,
          opportunity_id: opportunityId,
          attachments: attachments
        })
        .select('id, conversation_id, sender_id, sender_type, receiver_id, receiver_type, message_text, is_read, read_at, created_at, updated_at')
        .single();
      
      if (error) throw error;
      
      // Clear caches after sending message
      this.clearMessageCache(conversationId);
      this.clearConversationCache(senderId);
      this.clearConversationCache(receiverId);
      
      return data;
    } catch (error) {
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
        let query = supabase
          .from('messages')
          .select('id, conversation_id, sender_id, sender_type, receiver_id, receiver_type, message_text, is_read, read_at, created_at, updated_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (limit) {
          query = query.range(offset, offset + limit - 1);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const messages = data || [];
        
        // Update cache
        if (useCache) {
          messageCache.set(cacheKey, { data: messages, timestamp: Date.now() });
          
          // Cleanup old cache entries
          if (messageCache.size > 50) {
            const oldestKey = messageCache.keys().next().value;
            messageCache.delete(oldestKey);
          }
        }
        
        return messages;
      } catch (error) {
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
    userType: 'student' | 'recruiter',
    includeArchived: boolean = false,
    useCache: boolean = true
  ): Promise<Conversation[]> {
    const cacheKey = `conversations:${userId}:${userType}:${includeArchived}`;
    
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
    
    const request = this._getUserConversationsInternal(
      userId,
      userType,
      includeArchived,
      cacheKey,
      useCache
    );
    
    pendingRequests.set(cacheKey, request);
    
    try {
      return await request;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  }

  private static async _getUserConversationsInternal(
    userId: string,
    userType: 'student' | 'recruiter',
    includeArchived: boolean,
    cacheKey: string,
    useCache: boolean
  ): Promise<Conversation[]> {
    try {
      const column = userType === 'student' ? 'student_id' : 'recruiter_id';
      const deletedColumn = userType === 'student' ? 'deleted_by_student' : 'deleted_by_recruiter';
      
      // Optimized: Fetch only necessary fields to reduce payload size
      let query = supabase
        .from('conversations')
        .select(`
          id,
          student_id,
          recruiter_id,
          application_id,
          opportunity_id,
          subject,
          status,
          last_message_at,
          last_message_preview,
          last_message_sender,
          student_unread_count,
          recruiter_unread_count,
          created_at,
          updated_at,
          deleted_by_student,
          deleted_by_recruiter,
          student:students(id, profile, email),
          recruiter:recruiters(id, name, email, phone),
          opportunity:opportunities(id, title, company_name, location, employment_type),
          application:applied_jobs(id, application_status)
        `)
        .eq(column, userId);
      
      // Try to filter by deleted column if it exists
      try {
        query = query.eq(deletedColumn, false);
      } catch (e) {
        // Silently handle missing column
      }
      
      // Exclude archived conversations by default
      if (!includeArchived) {
        query = query.neq('status', 'archived');
      }
      
      // Optimized sorting with limit to improve performance
      query = query
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(100); // Reasonable limit for most use cases
      
      const { data, error } = await query;
      
      if (error) {
        // If error is about missing column, try query without deleted filter
        if (error.message?.includes('deleted_by') || error.code === '42703') {
          let retryQuery = supabase
            .from('conversations')
            .select(`
              id,
              student_id,
              recruiter_id,
              application_id,
              opportunity_id,
              subject,
              status,
              last_message_at,
              last_message_preview,
              last_message_sender,
              student_unread_count,
              recruiter_unread_count,
              created_at,
              updated_at,
              student:students(id, profile, email),
              recruiter:recruiters(id, name, email, phone),
              opportunity:opportunities(id, title, company_name, location, employment_type),
              application:applied_jobs(id, application_status)
            `)
            .eq(column, userId);
          
          if (!includeArchived) {
            retryQuery = retryQuery.neq('status', 'archived');
          }
          
          retryQuery = retryQuery
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .limit(100);
          
          const { data: retryData, error: retryError } = await retryQuery;
          if (retryError) throw retryError;
          
          const conversations = retryData || [];
          
          // Update cache
          if (useCache) {
            conversationCache.set(cacheKey, { data: conversations, timestamp: Date.now() });
            this._cleanupCache();
          }
          
          return conversations;
        }
        throw error;
      }
      
      const conversations = data || [];
      
      // Update cache
      if (useCache) {
        conversationCache.set(cacheKey, { data: conversations, timestamp: Date.now() });
        this._cleanupCache();
      }
      
      return conversations;
    } catch (error) {
      throw error;
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
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId);
      
      if (error) throw error;
    } catch (error) {
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
      // Use RPC or batch update for better performance
      const readAt = new Date().toISOString();
      
      // Parallel execution for better performance
      const [messageResult, conversationResult] = await Promise.allSettled([
        // Mark messages as read (only select count for efficiency)
        supabase
          .from('messages')
          .update({ is_read: true, read_at: readAt })
          .eq('conversation_id', conversationId)
          .eq('receiver_id', userId)
          .eq('is_read', false)
          .select('id', { count: 'exact', head: true }),
        
        // Get conversation details
        supabase
          .from('conversations')
          .select('student_id, recruiter_id')
          .eq('id', conversationId)
          .single()
      ]);
      
      if (messageResult.status === 'rejected') {
        console.error('❌ Error marking messages as read:', messageResult.reason);
        throw messageResult.reason;
      }
      
      if (conversationResult.status === 'fulfilled' && conversationResult.value.data) {
        const conversation = conversationResult.value.data;
        const isStudent = conversation.student_id === userId;
        const updateField = isStudent ? 'student_unread_count' : 'recruiter_unread_count';
        
        // Update unread count without awaiting (fire and forget for speed)
        supabase
          .from('conversations')
          .update({ [updateField]: 0 })
          .eq('id', conversationId)
          .then(() => {
            // Clear conversation cache after update
            this.clearConversationCache(userId);
          })
          .catch(() => {
            // Silently fail - realtime will sync eventually
          });
      }
      
      // Clear message cache
      this.clearMessageCache(conversationId);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Subscribe to new messages in a conversation (real-time)
   */
  static subscribeToConversation(
    conversationId: string,
    onMessage: (message: Message) => void
  ) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to all messages for a user (real-time)
   */
  static subscribeToUserMessages(
    userId: string,
    onMessage: (message: Message) => void
  ) {
    return supabase
      .channel(`user-messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();
  }

  /**
   * Get unread message count for user
   */
  static async getUnreadCount(
    userId: string,
    userType: 'student' | 'recruiter'
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('receiver_type', userType)
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Subscribe to conversation list updates (real-time)
   * Listens for changes in unread counts, new messages, etc.
   */
  static subscribeToUserConversations(
    userId: string,
    userType: 'student' | 'recruiter',
    onUpdate: (conversation: Conversation) => void
  ) {
    const column = userType === 'student' ? 'student_id' : 'recruiter_id';

    return supabase
      .channel(`user-conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `${column}=eq.${userId}`
        },
        (payload) => {
          onUpdate(payload.new as Conversation);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `${column}=eq.${userId}`
        },
        (payload) => {
          onUpdate(payload.new as Conversation);
        }
      )
      .subscribe();
  }

  /**
   * Get conversation with student details for recruiter
   */
  static async getConversationWithStudent(
    conversationId: string
  ): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          student:students(id, profile),
          application:applied_jobs(
            id,
            application_status,
            applied_at,
            opportunity:opportunities(id, job_title, company_name, location, employment_type)
          )
        `)
        .eq('id', conversationId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Archive a conversation
   */
  static async archiveConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unarchive a conversation
   */
  static async unarchiveConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete a conversation (only from current user's view)
   * This is similar to WhatsApp's "Delete Conversation" feature
   */
  static async deleteConversationForUser(
    conversationId: string,
    userId: string,
    userType: 'student' | 'recruiter'
  ): Promise<void> {
    try {
      const deletedColumn = userType === 'student' ? 'deleted_by_student' : 'deleted_by_recruiter';
      const deletedAtColumn = userType === 'student' ? 'student_deleted_at' : 'recruiter_deleted_at';
      
      const { error } = await supabase
        .from('conversations')
        .update({ 
          [deletedColumn]: true,
          [deletedAtColumn]: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Restore a deleted conversation
   */
  static async restoreConversation(
    conversationId: string,
    userId: string,
    userType: 'student' | 'recruiter'
  ): Promise<void> {
    try {
      const deletedColumn = userType === 'student' ? 'deleted_by_student' : 'deleted_by_recruiter';
      const deletedAtColumn = userType === 'student' ? 'student_deleted_at' : 'recruiter_deleted_at';
      
      const { error } = await supabase
        .from('conversations')
        .update({ 
          [deletedColumn]: false,
          [deletedAtColumn]: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error restoring conversation:', error);
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
      // Messages will be cascade deleted due to foreign key constraint
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error permanently deleting conversation:', error);
      throw error;
    }
  }
}

export default MessageService;
