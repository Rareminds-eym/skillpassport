/**
 * Message Entity - Utility Functions
 */

import type {
  Message,
  Conversation,
  UserType,
  ConversationType,
  ConversationStatus,
  MessageStats
} from './types';

// ============================================================================
// User Type Utilities
// ============================================================================

export function getUserTypeDisplayName(type: UserType): string {
  const displayNames: Record<UserType, string> = {
    student: 'Student',
    recruiter: 'Recruiter',
    educator: 'Educator',
    college_educator: 'College Educator',
    school_admin: 'School Admin',
    college_admin: 'College Admin',
    university_admin: 'University Admin'
  };
  return displayNames[type] || type;
}

// ============================================================================
// Conversation Type Utilities
// ============================================================================

export function getConversationTypeDisplayName(type: ConversationType): string {
  const displayNames: Record<ConversationType, string> = {
    student_recruiter: 'Student - Recruiter',
    student_educator: 'Student - Educator',
    educator_recruiter: 'Educator - Recruiter',
    student_admin: 'Student - Admin',
    student_college_admin: 'Student - College Admin',
    student_college_educator: 'Student - College Educator',
    educator_admin: 'Educator - Admin',
    college_educator_admin: 'College Educator - Admin'
  };
  return displayNames[type] || type;
}

// ============================================================================
// Conversation Status Utilities
// ============================================================================

export function getConversationStatusDisplayName(status: ConversationStatus): string {
  const displayNames: Record<ConversationStatus, string> = {
    active: 'Active',
    archived: 'Archived',
    closed: 'Closed'
  };
  return displayNames[status] || status;
}

export function getConversationStatusColor(status: ConversationStatus): string {
  const colors: Record<ConversationStatus, string> = {
    active: 'green',
    archived: 'gray',
    closed: 'red'
  };
  return colors[status] || 'gray';
}

// ============================================================================
// Message Utilities
// ============================================================================

export function isMessageRead(message: Message): boolean {
  return message.is_read;
}

export function getMessagePreview(message: Message, maxLength: number = 50): string {
  if (message.message_text.length <= maxLength) {
    return message.message_text;
  }
  return message.message_text.substring(0, maxLength) + '...';
}

export function hasAttachments(message: Message): boolean {
  return !!message.attachments && message.attachments.length > 0;
}

export function getAttachmentCount(message: Message): number {
  return message.attachments?.length || 0;
}

// ============================================================================
// Conversation Utilities
// ============================================================================

export function getUnreadCount(conversation: Conversation, userType: UserType): number {
  switch (userType) {
    case 'student':
      return conversation.student_unread_count;
    case 'recruiter':
      return conversation.recruiter_unread_count;
    case 'educator':
    case 'college_educator':
      return conversation.educator_unread_count;
    case 'school_admin':
    case 'college_admin':
    case 'university_admin':
      return conversation.admin_unread_count || 0;
    default:
      return 0;
  }
}

export function hasUnreadMessages(conversation: Conversation, userType: UserType): boolean {
  return getUnreadCount(conversation, userType) > 0;
}

export function isConversationDeleted(conversation: Conversation, userType: UserType): boolean {
  switch (userType) {
    case 'student':
      return !!conversation.deleted_by_student;
    case 'recruiter':
      return !!conversation.deleted_by_recruiter;
    case 'educator':
    case 'college_educator':
      return !!conversation.deleted_by_educator;
    case 'school_admin':
    case 'college_admin':
    case 'university_admin':
      return !!conversation.deleted_by_admin;
    default:
      return false;
  }
}

export function getConversationParticipants(conversation: Conversation): string[] {
  const participants: string[] = [];
  
  if (conversation.student_id) participants.push(conversation.student_id);
  if (conversation.recruiter_id) participants.push(conversation.recruiter_id);
  if (conversation.educator_id) participants.push(conversation.educator_id);
  
  return participants;
}

export function getOtherParticipantId(conversation: Conversation, currentUserId: string): string | null {
  const participants = getConversationParticipants(conversation);
  const otherParticipant = participants.find(id => id !== currentUserId);
  return otherParticipant || null;
}

// ============================================================================
// Time Formatting Utilities
// ============================================================================

export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export function formatConversationTime(timestamp?: string): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// Conversation Filtering Utilities
// ============================================================================

export function filterConversationsByStatus(
  conversations: Conversation[],
  statuses: ConversationStatus[]
): Conversation[] {
  if (statuses.length === 0) return conversations;
  return conversations.filter(c => statuses.includes(c.status));
}

export function filterConversationsByType(
  conversations: Conversation[],
  types: ConversationType[]
): Conversation[] {
  if (types.length === 0) return conversations;
  return conversations.filter(c => types.includes(c.conversation_type));
}

export function filterUnreadConversations(
  conversations: Conversation[],
  userType: UserType
): Conversation[] {
  return conversations.filter(c => hasUnreadMessages(c, userType));
}

export function searchConversations(conversations: Conversation[], query: string): Conversation[] {
  if (!query || query.trim().length === 0) return conversations;
  
  const lowerQuery = query.toLowerCase();
  return conversations.filter(c =>
    c.subject?.toLowerCase().includes(lowerQuery) ||
    c.last_message_preview?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// Conversation Sorting Utilities
// ============================================================================

export function sortConversationsByLastMessage(
  conversations: Conversation[],
  order: 'asc' | 'desc' = 'desc'
): Conversation[] {
  return [...conversations].sort((a, b) => {
    const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return order === 'desc' ? timeB - timeA : timeA - timeB;
  });
}

export function sortConversationsByUnread(
  conversations: Conversation[],
  userType: UserType
): Conversation[] {
  return [...conversations].sort((a, b) => {
    const unreadA = getUnreadCount(a, userType);
    const unreadB = getUnreadCount(b, userType);
    return unreadB - unreadA;
  });
}

// ============================================================================
// Message Statistics Utilities
// ============================================================================

export function calculateMessageStats(
  conversations: Conversation[],
  messages: Message[],
  userId: string,
  userType: UserType
): MessageStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeConversations = conversations.filter(c => c.status === 'active').length;
  const archivedConversations = conversations.filter(c => c.status === 'archived').length;
  
  const unreadCount = conversations.reduce((sum, c) => sum + getUnreadCount(c, userType), 0);
  
  const messagesSentToday = messages.filter(m => 
    m.sender_id === userId && new Date(m.created_at) >= today
  ).length;
  
  const messagesReceivedToday = messages.filter(m => 
    m.receiver_id === userId && new Date(m.created_at) >= today
  ).length;

  return {
    total_conversations: conversations.length,
    unread_count: unreadCount,
    active_conversations: activeConversations,
    archived_conversations: archivedConversations,
    messages_sent_today: messagesSentToday,
    messages_received_today: messagesReceivedToday
  };
}

// ============================================================================
// Conversation ID Generation
// ============================================================================

export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
