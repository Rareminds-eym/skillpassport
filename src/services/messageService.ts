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
      console.log('🔍 Getting or creating conversation:', {
        studentId,
        recruiterId,
        applicationId,
        opportunityId,
        subject
      });

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
        console.log('✅ Found existing conversation:', existing.id);
        return existing;
      }
      
      // Create new conversation
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🆕 Creating new conversation:', conversationId);
      
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
      
      console.log('✅ Created conversation:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error in getOrCreateConversation:', error);
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
      console.log('📤 Sending message:', {
        conversationId,
        senderId,
        senderType,
        receiverId,
        receiverType
      });

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
      
      console.log('✅ Message sent:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error sending message:', error);
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
      console.error('❌ Error fetching messages:', error);
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
      console.error('❌ Error fetching conversations:', error);
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
      console.error('❌ Error marking message as read:', error);
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
      console.log('📖 Marking conversation as read:', conversationId);

      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      console.log('✅ Conversation marked as read');
    } catch (error) {
      console.error('❌ Error marking conversation as read:', error);
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
    console.log('🔔 Subscribing to conversation:', conversationId);

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
          console.log('📨 New message received:', payload.new);
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
    console.log('🔔 Subscribing to user messages:', userId);

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
          console.log('📨 New message for user:', payload.new);
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
      console.error('❌ Error fetching unread count:', error);
      return 0;
    }
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
      console.error('❌ Error fetching conversation with student:', error);
      return null;
    }
  }

  /**
   * Archive a conversation
   */
  static async archiveConversation(conversationId: string): Promise<void> {
    try {
      console.log('📦 Archiving conversation:', conversationId);

      const { error } = await supabase
        .from('conversations')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      if (error) throw error;
      
      console.log('✅ Conversation archived');
    } catch (error) {
      console.error('❌ Error archiving conversation:', error);
      throw error;
    }
  }

  /**
   * Unarchive a conversation
   */
  static async unarchiveConversation(conversationId: string): Promise<void> {
    try {
      console.log('📂 Unarchiving conversation:', conversationId);

      const { error } = await supabase
        .from('conversations')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      if (error) throw error;
      
      console.log('✅ Conversation unarchived');
    } catch (error) {
      console.error('❌ Error unarchiving conversation:', error);
      throw error;
    }
  }
}

export default MessageService;
