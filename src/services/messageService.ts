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
  sender_type: 'student' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin';
  receiver_id: string;
  receiver_type: 'student' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin';
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
  student_id?: string;
  recruiter_id?: string;
  educator_id?: string;
  school_id?: string;
  college_id?: string;
  application_id?: number;
  opportunity_id?: number;
  class_id?: number;
  subject?: string;
  status: 'active' | 'archived' | 'closed';
  conversation_type: 'student_recruiter' | 'student_educator' | 'educator_recruiter' | 'student_admin' | 'student_college_admin';
  last_message_at?: string;
  last_message_preview?: string;
  last_message_sender?: string;
  student_unread_count: number;
  recruiter_unread_count: number;
  educator_unread_count: number;
  admin_unread_count?: number;
  college_admin_unread_count?: number;
  created_at: string;
  updated_at: string;
  
  // Soft delete fields
  deleted_by_student?: boolean;
  deleted_by_recruiter?: boolean;
  deleted_by_educator?: boolean;
  deleted_by_admin?: boolean;
  deleted_by_college_admin?: boolean;
  student_deleted_at?: string;
  recruiter_deleted_at?: string;
  educator_deleted_at?: string;
  admin_deleted_at?: string;
  college_admin_deleted_at?: string;
  
  // Joined data
  student?: any;
  recruiter?: any;
  educator?: any;
  application?: any;
  opportunity?: any;
  class?: any;
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
            .maybeSingle();
          
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
   * Get or create conversation between student and educator
   * For school class-related discussions, assignments, etc.
   */
  static async getOrCreateStudentEducatorConversation(
    studentId: string,
    educatorId: string,
    classId?: string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `student_educator:${studentId}:${educatorId}:${classId || 'null'}:${subject || 'general'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }
    
    const request = this._getOrCreateStudentEducatorConversationInternal(
      studentId,
      educatorId,
      classId,
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

  private static async _getOrCreateStudentEducatorConversationInternal(
    studentId: string,
    educatorId: string,
    classId?: string,
    subject?: string
  ): Promise<Conversation> {
    try {
      // Check for existing conversation
      let query = supabase
        .from('conversations')
        .select('id, status, deleted_by_student, deleted_by_educator, student_id, educator_id, class_id, subject, created_at, updated_at')
        .eq('student_id', studentId)
        .eq('educator_id', educatorId)
        .eq('conversation_type', 'student_educator')
        .limit(1);
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      if (subject) {
        query = query.eq('subject', subject);
      }
      
      const { data: existing, error: fetchError } = await query.maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existing) {
        // If conversation was deleted, restore it
        if (existing.deleted_by_student || existing.deleted_by_educator) {
          console.log('📥 Restoring previously deleted student-educator conversation:', existing.id);
          
          const { data: restored, error: restoreError } = await supabase
            .from('conversations')
            .update({
              deleted_by_student: false,
              deleted_by_educator: false,
              student_deleted_at: null,
              educator_deleted_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .maybeSingle();
          
          if (restoreError) {
            console.warn('⚠️ Could not restore conversation, using as-is');
            return existing as Conversation;
          }
          
          console.log('✅ Student-educator conversation restored');
          return restored;
        }
        
        return existing as Conversation;
      }
      
      // Create new conversation
      const conversationId = `conv_se_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          student_id: studentId,
          educator_id: educatorId,
          class_id: classId,
          subject: subject || 'General Discussion',
          conversation_type: 'student_educator',
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
    senderType: 'student' | 'recruiter' | 'educator',
    receiverId: string,
    receiverType: 'student' | 'recruiter' | 'educator',
    messageText: string,
    applicationId?: number,
    opportunityId?: number,
    classId?: string,
    subject?: string,
    attachments?: any[]
  ): Promise<Message> {
    try {
      // Validate required fields
      if (!conversationId || !senderId || !receiverId || !messageText?.trim()) {
        throw new Error('Missing required fields for message');
      }

      // Prepare message data, excluding undefined/null values that might cause issues
      const messageData: any = {
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        receiver_id: receiverId,
        receiver_type: receiverType,
        message_text: messageText.trim()
      };

      // Only add optional fields if they have valid values
      if (applicationId) messageData.application_id = applicationId;
      if (opportunityId) messageData.opportunity_id = opportunityId;
      if (classId) messageData.class_id = classId;
      if (subject) messageData.subject = subject;
      if (attachments && attachments.length > 0) messageData.attachments = attachments;

      console.log('📤 Sending message with data:', messageData);

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select('id, conversation_id, sender_id, sender_type, receiver_id, receiver_type, message_text, is_read, read_at, created_at, updated_at')
        .single();
      
      if (error) {
        console.error('❌ Database error sending message:', error);
        throw new Error(`Failed to send message: ${error.message}`);
      }
      
      console.log('✅ Message sent successfully:', data);
      
      // Clear caches after sending message
      this.clearMessageCache(conversationId);
      this.clearConversationCache(senderId);
      this.clearConversationCache(receiverId);
      
      return data;
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Send a student-educator message
   * Convenience method for student-educator messaging
   */
  static async sendStudentEducatorMessage(
    conversationId: string,
    studentId: string,
    messageText: string,
    classId?: string,
    subject?: string,
    attachments?: any[]
  ): Promise<Message> {
    try {
      console.log('📨 Sending student-educator message:', {
        conversationId,
        studentId,
        messageText: messageText.substring(0, 50) + '...',
        classId,
        subject
      });

      // Get conversation details to find the educator
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('educator_id, class_id, subject')
        .eq('id', conversationId)
        .maybeSingle();
      
      if (convError && convError.code !== 'PGRST116') {
        console.error('❌ Error fetching conversation:', convError);
        throw new Error(`Conversation not found: ${convError.message}`);
      }
      
      if (!conversation) {
        console.error('❌ Conversation not found:', conversationId);
        throw new Error('Conversation not found');
      }
      
      if (!conversation?.educator_id) {
        console.error('❌ No educator found in conversation:', conversation);
        throw new Error('Educator not found in conversation');
      }

      console.log('✅ Found conversation:', conversation);
      
      return this.sendMessage(
        conversationId,
        studentId,
        'student',
        conversation.educator_id,
        'educator',
        messageText,
        undefined, // applicationId
        undefined, // opportunityId
        classId || conversation.class_id,
        subject || conversation.subject,
        attachments
      );
    } catch (error) {
      console.error('❌ Error in sendStudentEducatorMessage:', error);
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
            if (oldestKey) {
              messageCache.delete(oldestKey);
            }
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
    userType: 'student' | 'recruiter' | 'educator',
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
    
    const request = this._getUserConversationsInternal(
      userId,
      userType,
      includeArchived,
      cacheKey,
      useCache,
      conversationType
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
    userType: 'student' | 'recruiter' | 'educator',
    includeArchived: boolean,
    cacheKey: string,
    useCache: boolean,
    conversationType?: string
  ): Promise<Conversation[]> {
    try {
      const column = userType === 'student' ? 'student_id' : userType === 'recruiter' ? 'recruiter_id' : 'educator_id';
      const deletedColumn = userType === 'student' ? 'deleted_by_student' : userType === 'recruiter' ? 'deleted_by_recruiter' : 'deleted_by_educator';
      
      // Optimized: Fetch only essential student data that exists in the database
      let query = supabase
        .from('conversations')
        .select(`
          id,
          student_id,
          recruiter_id,
          educator_id,
          application_id,
          opportunity_id,
          class_id,
          subject,
          status,
          conversation_type,
          last_message_at,
          last_message_preview,
          last_message_sender,
          student_unread_count,
          recruiter_unread_count,
          educator_unread_count,
          created_at,
          updated_at,
          deleted_by_student,
          deleted_by_recruiter,
          deleted_by_educator,
          student:students(
            id,
            user_id,
            email,
            name,
            contact_number,
            university,
            branch_field
          ),
          recruiter:recruiters(id, name, email, phone),
          educator:school_educators(id, first_name, last_name, email, phone_number, photo_url),
          opportunity:opportunities(id, title, company_name, location, employment_type),
          application:applied_jobs(id, application_status),
          school_class:school_classes(id, name, grade, section)
        `)
        .eq(column, userId);
      
      // Try to filter by deleted column if it exists
      try {
        query = query.eq(deletedColumn, false);
      } catch (e) {
        // Silently handle missing column
      }
      
      // Filter by conversation type if specified
      if (conversationType) {
        query = query.eq('conversation_type', conversationType);
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
              educator_id,
              application_id,
              opportunity_id,
              class_id,
              subject,
              status,
              conversation_type,
              last_message_at,
              last_message_preview,
              last_message_sender,
              student_unread_count,
              recruiter_unread_count,
              educator_unread_count,
              created_at,
              updated_at,
              student:students(id, name, email, contact_number, university, branch_field),
              recruiter:recruiters(id, name, email, phone),
              educator:school_educators(id, first_name, last_name, email, phone_number, photo_url),
              opportunity:opportunities(id, title, company_name, location, employment_type),
              application:applied_jobs(id, application_status),
              school_class:school_classes(id, name, grade, section)
            `)
            .eq(column, userId);
          
          // Filter by conversation type if specified
          if (conversationType) {
            retryQuery = retryQuery.eq('conversation_type', conversationType);
          }
          
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
          .select('id'),
        
        // Get conversation details
        supabase
          .from('conversations')
          .select('student_id, recruiter_id, educator_id, school_id, conversation_type')
          .eq('id', conversationId)
          .maybeSingle()
      ]);
      
      if (messageResult.status === 'rejected') {
        console.error('❌ Error marking messages as read:', messageResult.reason);
        throw messageResult.reason;
      }
      
      if (conversationResult.status === 'fulfilled' && conversationResult.value.data) {
        const conversation = conversationResult.value.data;
        const isStudent = conversation.student_id === userId;
        const isRecruiter = conversation.recruiter_id === userId;
        const isEducator = conversation.educator_id === userId;
        
        // Handle admin conversations
        if (conversation.conversation_type === 'student_admin') {
          // For admin conversations, we need to check if the user is a school admin
          const { data: schoolAdmin, error: adminError } = await supabase
            .from('school_educators')
            .select('user_id')
            .eq('user_id', userId)
            .eq('role', 'school_admin')
            .eq('school_id', conversation.school_id)
            .single();
          
          if (!adminError && schoolAdmin) {
            // User is a school admin, update admin_unread_count
            await supabase
              .from('conversations')
              .update({ admin_unread_count: 0 })
              .eq('id', conversationId);
          } else if (isStudent) {
            // User is the student, update student_unread_count
            await supabase
              .from('conversations')
              .update({ student_unread_count: 0 })
              .eq('id', conversationId);
          }
        } else if (conversation.conversation_type === 'student_college_admin') {
          // For college admin conversations, we need to check if the user is a college admin
          const { data: collegeAdmin, error: collegeAdminError } = await supabase
            .from('college_lecturers')
            .select('user_id, userId')
            .or(`user_id.eq.${userId},userId.eq.${userId}`)
            .eq('collegeId', conversation.college_id)
            .single();
          
          if (!collegeAdminError && collegeAdmin) {
            // User is a college admin, update college_admin_unread_count
            await supabase
              .from('conversations')
              .update({ college_admin_unread_count: 0 })
              .eq('id', conversationId);
          } else {
            // Check if user is college owner
            const { data: collegeOwner, error: ownerError } = await supabase
              .from('colleges')
              .select('created_by')
              .eq('id', conversation.college_id)
              .eq('created_by', userId)
              .single();
            
            if (!ownerError && collegeOwner) {
              // User is college owner, update college_admin_unread_count
              await supabase
                .from('conversations')
                .update({ college_admin_unread_count: 0 })
                .eq('id', conversationId);
            } else if (isStudent) {
              // User is the student, update student_unread_count
              await supabase
                .from('conversations')
                .update({ student_unread_count: 0 })
                .eq('id', conversationId);
            }
          }
        } else {
          // Handle regular conversations
          const updateField = isStudent ? 'student_unread_count' : 
                              isRecruiter ? 'recruiter_unread_count' : 
                              'educator_unread_count';
          
          // Update unread count without awaiting (fire and forget for speed)
          supabase
            .from('conversations')
            .update({ [updateField]: 0 })
            .eq('id', conversationId)
            .then(() => {
              // Clear conversation cache after update
              this.clearConversationCache(userId);
            });
        }
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
    userType: 'student' | 'recruiter' | 'educator'
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
    userType: 'student' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin',
    onUpdate: (conversation: Conversation) => void
  ) {
    let column: string;
    let filter: string;
    
    switch (userType) {
      case 'student':
        column = 'student_id';
        filter = `student_id=eq.${userId}`;
        break;
      case 'recruiter':
        column = 'recruiter_id';
        filter = `recruiter_id=eq.${userId}`;
        break;
      case 'educator':
        column = 'educator_id';
        filter = `educator_id=eq.${userId}`;
        break;
      case 'school_admin':
        // For school admin, we filter by school_id, not user_id
        column = 'school_id';
        filter = `school_id=eq.${userId}`;
        break;
      case 'college_admin':
        // For college admin, we filter by college_id, not user_id
        column = 'college_id';
        filter = `college_id=eq.${userId}`;
        break;
      default:
        throw new Error(`Invalid user type: ${userType}`);
    }

    return supabase
      .channel(`user-conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: filter
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
          filter: filter
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
          student:students(id, name, email, contact_number, university, branch_field),
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
   * Get or create conversation between student and school admin
   * For school-related discussions, issues, etc.
   */
  static async getOrCreateStudentAdminConversation(
    studentId: string,
    schoolId: string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `student_admin:${studentId}:${schoolId}:${subject || 'general'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const request = this._getOrCreateStudentAdminConversationInternal(
      studentId,
      schoolId,
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

  private static async _getOrCreateStudentAdminConversationInternal(
    studentId: string,
    schoolId: string,
    subject?: string
  ): Promise<Conversation> {
    try {
      // Use the database function for consistency
      const { data, error } = await supabase
        .rpc('get_or_create_student_admin_conversation', {
          p_student_id: studentId,
          p_school_id: schoolId,
          p_subject: subject || 'General Discussion'
        });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create student-admin conversation');
      }

      const conversationId = data[0].conversation_id;
      
      // Fetch the full conversation details
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          student:students(id, name, email),
          school:schools(id, name)
        `)
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;
      
      return conversation;
    } catch (error) {
      console.error('Error creating student-admin conversation:', error);
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
    userType: 'student' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin'
  ): Promise<void> {
    try {
      let deletedColumn: string;
      let deletedAtColumn: string;
      
      switch (userType) {
        case 'student':
          deletedColumn = 'deleted_by_student';
          deletedAtColumn = 'student_deleted_at';
          break;
        case 'recruiter':
          deletedColumn = 'deleted_by_recruiter';
          deletedAtColumn = 'recruiter_deleted_at';
          break;
        case 'educator':
          deletedColumn = 'deleted_by_educator';
          deletedAtColumn = 'educator_deleted_at';
          break;
        case 'school_admin':
          deletedColumn = 'deleted_by_admin';
          deletedAtColumn = 'admin_deleted_at';
          break;
        case 'college_admin':
          deletedColumn = 'deleted_by_college_admin';
          deletedAtColumn = 'college_admin_deleted_at';
          break;
        default:
          throw new Error(`Invalid user type: ${userType}`);
      }
      
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
    userType: 'student' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin'
  ): Promise<void> {
    try {
      let deletedColumn: string;
      let deletedAtColumn: string;
      
      switch (userType) {
        case 'student':
          deletedColumn = 'deleted_by_student';
          deletedAtColumn = 'student_deleted_at';
          break;
        case 'recruiter':
          deletedColumn = 'deleted_by_recruiter';
          deletedAtColumn = 'recruiter_deleted_at';
          break;
        case 'educator':
          deletedColumn = 'deleted_by_educator';
          deletedAtColumn = 'educator_deleted_at';
          break;
        case 'school_admin':
          deletedColumn = 'deleted_by_admin';
          deletedAtColumn = 'admin_deleted_at';
          break;
        case 'college_admin':
          deletedColumn = 'deleted_by_college_admin';
          deletedAtColumn = 'college_admin_deleted_at';
          break;
        default:
          throw new Error(`Invalid user type: ${userType}`);
      }
      
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

  /**
   * Get or create conversation between student and college admin
   * For college-related discussions, issues, etc.
   */
  static async getOrCreateStudentCollegeAdminConversation(
    studentId: string,
    collegeId: string,
    subject?: string
  ): Promise<Conversation> {
    const cacheKey = `student_college_admin:${studentId}:${collegeId}:${subject || 'general'}`;
    
    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const request = this._getOrCreateStudentCollegeAdminConversationInternal(
      studentId,
      collegeId,
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

  private static async _getOrCreateStudentCollegeAdminConversationInternal(
    studentId: string,
    collegeId: string,
    subject?: string
  ): Promise<Conversation> {
    try {
      // Use the database function for consistency
      const { data, error } = await supabase
        .rpc('get_or_create_student_college_admin_conversation', {
          p_student_id: studentId,
          p_college_id: collegeId,
          p_subject: subject || 'General Discussion'
        });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create student-college_admin conversation');
      }

      const conversationId = data[0].conversation_id;
      
      // Fetch the full conversation details
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          student:students(id, name, email),
          college:colleges(id, name)
        `)
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;
      
      return conversation;
    } catch (error) {
      console.error('Error creating student-college_admin conversation:', error);
      throw error;
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

    const request = this._getOrCreateEducatorAdminConversationInternal(
      educatorId,
      schoolId,
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

  private static async _getOrCreateEducatorAdminConversationInternal(
    educatorId: string,
    schoolId: string,
    subject?: string
  ): Promise<Conversation> {
    try {
      // Use the database function for consistency
      const { data, error } = await supabase
        .rpc('get_or_create_educator_admin_conversation', {
          p_educator_id: educatorId,
          p_school_id: schoolId,
          p_subject: subject || 'General Discussion'
        });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create educator-admin conversation');
      }

      const conversationId = data[0].conversation_id;
      
      // Fetch the full conversation details
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          educator:school_educators(id, first_name, last_name, email, phone_number, photo_url),
          school:schools(id, name)
        `)
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;
      
      return conversation;
    } catch (error) {
      console.error('Error creating educator-admin conversation:', error);
      throw error;
    }
  }
}

export default MessageService;
