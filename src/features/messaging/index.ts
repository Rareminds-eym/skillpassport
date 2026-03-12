/**
 * Messaging Feature - Public API
 * 
 * This is the public interface for the messaging feature.
 * All external imports should go through this file.
 * 
 * @example
 * ```typescript
 * import { MessageModal, useMessages, MessageService } from '@/features/messaging';
 * ```
 */

// ============================================================================
// UI Components
// ============================================================================
export { default as MessageModal } from './ui/MessageModal';
export { default as ConversationModal } from './ui/ConversationModal';
export { default as DeleteConversationModal } from './ui/DeleteConversationModal';

// ============================================================================
// Hooks
// ============================================================================
export { 
  useMessages, 
  useConversation 
} from './model/useMessages';

export { useMessageNotifications } from './model/useMessageNotifications';
export { useTypingIndicator } from './model/useTypingIndicator';

// Store hooks
export {
  useMessageStore,
  useMessages as useMessagesFromStore,
  useConversations,
  useCurrentConversationId,
  useUnreadCount,
  useMessageLoadingStates,
  useCurrentConversation,
  useUnreadMessagesCount
} from './model/useMessageStore';

// ============================================================================
// Services
// ============================================================================
export { MessageService } from './api/messageService';

// ============================================================================
// Types
// ============================================================================
export type { Message, Conversation } from './api/messageService';
export type { ConversationType } from './lib/conversationConfig';
