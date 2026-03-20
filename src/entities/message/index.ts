/**
 * Message Entity - Public API
 * Central export point for all message entity functionality
 */

// Model exports
export type {
  UserType,
  ConversationType,
  ConversationStatus,
  Message,
  Conversation,
  SendMessageRequest,
  CreateConversationRequest,
  MessageFilters,
  ConversationFilters,
  MessageStats,
  TypingIndicator,
  MessageAttachment
} from './model';

export {
  isValidUserType,
  isValidConversationType,
  isValidConversationStatus,
  validateMessage,
  validateSendMessageRequest,
  validateConversation,
  isValidMessageText,
  sanitizeMessageText,
  validateAttachment,
  getUserTypeDisplayName,
  getConversationTypeDisplayName,
  getConversationStatusDisplayName,
  getConversationStatusColor,
  isMessageRead,
  getMessagePreview,
  hasAttachments,
  getAttachmentCount,
  getUnreadCount,
  hasUnreadMessages,
  isConversationDeleted,
  getConversationParticipants,
  getOtherParticipantId,
  formatMessageTime,
  formatConversationTime,
  filterConversationsByStatus,
  filterConversationsByType,
  filterUnreadConversations,
  searchConversations,
  sortConversationsByLastMessage,
  sortConversationsByUnread,
  calculateMessageStats,
  generateConversationId
} from './model';
