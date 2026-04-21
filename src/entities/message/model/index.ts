/**
 * Message Entity - Model Exports
 */

// Type exports
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
} from '@/shared/types';

// Validation exports
export {
  isValidUserType,
  isValidConversationType,
  isValidConversationStatus,
  validateMessage,
  validateSendMessageRequest,
  validateConversation,
  isValidMessageText,
  sanitizeMessageText,
  validateAttachment
} from './validation';

// Utility exports
export {
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
} from './utils';
