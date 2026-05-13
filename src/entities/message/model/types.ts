/**
 * Message Entity - Type Definitions
 * Core message and conversation interfaces and types for the application
 */

// ============================================================================
// Core Message Types
// ============================================================================

export type UserType = 
  | 'learner' 
  | 'recruiter' 
  | 'educator' 
  | 'college_educator' 
  | 'school_admin' 
  | 'college_admin' 
  | 'university_admin';

export type ConversationType = 
  | 'learner_recruiter' 
  | 'learner_educator' 
  | 'educator_recruiter' 
  | 'learner_admin' 
  | 'learner_college_admin' 
  | 'learner_college_educator' 
  | 'educator_admin' 
  | 'college_educator_admin';

export type ConversationStatus = 'active' | 'archived' | 'closed';

export interface Message {
  id: number;
  conversation_id: string;
  sender_id: string;
  sender_type: UserType;
  receiver_id: string;
  receiver_type: UserType;
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

// ============================================================================
// Conversation Types
// ============================================================================

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
  status: ConversationStatus;
  conversation_type: ConversationType;
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

// ============================================================================
// Message Sending Types
// ============================================================================

export interface SendMessageRequest {
  conversation_id: string;
  sender_id: string;
  sender_type: UserType;
  receiver_id: string;
  receiver_type: UserType;
  message_text: string;
  application_id?: number | string;
  opportunity_id?: number | string;
  class_id?: string;
  subject?: string;
  attachments?: any[];
}

export interface CreateConversationRequest {
  learner_id?: string;
  recruiter_id?: string;
  educator_id?: string;
  application_id?: number | string;
  opportunity_id?: number | string;
  class_id?: string;
  subject?: string;
  conversation_type: ConversationType;
}

// ============================================================================
// Message Filter Types
// ============================================================================

export interface MessageFilters {
  conversation_id?: string;
  sender_id?: string;
  receiver_id?: string;
  is_read?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface ConversationFilters {
  user_id: string;
  user_type: UserType;
  status?: ConversationStatus[];
  conversation_type?: ConversationType[];
  include_archived?: boolean;
  search?: string;
}

// ============================================================================
// Message Statistics Types
// ============================================================================

export interface MessageStats {
  total_conversations: number;
  unread_count: number;
  active_conversations: number;
  archived_conversations: number;
  messages_sent_today: number;
  messages_received_today: number;
}

// ============================================================================
// Typing Indicator Types
// ============================================================================

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  user_type: UserType;
  is_typing: boolean;
  timestamp: string;
}

// ============================================================================
// Message Attachment Types
// ============================================================================

export interface MessageAttachment {
  id: string;
  message_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}
