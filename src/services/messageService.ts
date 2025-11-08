import { supabase } from '../lib/supabaseClient';

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
  
  // Joined data
  student?: any;
  recruiter?: any;
  application?: any;
  opportunity?: any;
}

export class MessageService {
  /**
   * Get or create conversation between student and recruiter
   */
  static async getOrCreateConversation(
    studentId: string,
    recruiterId: string,
    applicationId?: number,
    opportunityId?: number,
    subject?: string
  ): Promise<Conversation> {
    try {
      // Try to find existing conversation
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('student_id', studentId)
        .eq('recruiter_id', recruiterId);
      
      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }
      
      const { data: existing, error: fetchError } = await query.maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (existing) {
        return existing;
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
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all conversations for a user (excluding archived)
   */
  static async getUserConversations(
    userId: string,
    userType: 'student' | 'recruiter',
    includeArchived: boolean = false
  ): Promise<Conversation[]> {
    try {
      const column = userType === 'student' ? 'student_id' : 'recruiter_id';
      
      let query = supabase
        .from('conversations')
        .select(`
          *,
          student:students(id, profile, email),
          recruiter:recruiters(id, name, email, phone),
          opportunity:opportunities(id, title, company_name, location, employment_type),
          application:applied_jobs(
            id,
            application_status
          )
        `)
        .eq(column, userId);
      
      // Exclude archived conversations by default
      if (!includeArchived) {
        query = query.neq('status', 'archived');
      }
      
      query = query.order('last_message_at', { ascending: false, nullsFirst: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
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
   */
  static async markConversationAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Mark messages as read
      const { data: updatedMessages, error: messageError } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .select();
      
      if (messageError) throw messageError;
      
      // Update the conversation's unread count to 0
      // Determine if this is a student or recruiter based on the receiver_id matching
      const { data: conversation } = await supabase
        .from('conversations')
        .select('student_id, recruiter_id')
        .eq('id', conversationId)
        .single();
      
      if (conversation) {
        const isStudent = conversation.student_id === userId;
        const updateField = isStudent ? 'student_unread_count' : 'recruiter_unread_count';
        
        const { error: convError } = await supabase
          .from('conversations')
          .update({ [updateField]: 0 })
          .eq('id', conversationId);
        
        if (convError) {
          // Failed to update conversation unread count
        }
      }
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
}

export default MessageService;
