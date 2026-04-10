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
export { default as NewStudentConversationModal } from './ui/NewStudentConversationModal';
export { default as NewStudentConversationModalEducator } from './ui/NewStudentConversationModalEducator';
export { default as NewStudentConversationModalCollegeAdmin } from './ui/NewStudentConversationModalCollegeAdmin';
export { default as NewEducatorAdminConversationModal } from './ui/NewEducatorAdminConversationModal';
export { default as NewEducatorConversationModal } from './ui/NewEducatorConversationModal';
export { default as NewAdminConversationModal } from './ui/NewAdminConversationModal';
export { default as NewSchoolAdminEducatorConversationModal } from './ui/NewSchoolAdminEducatorConversationModal';

// ============================================================================
// Hooks
// ============================================================================
export { 
  useMessages, 
  useConversation 
} from './model/useMessages';

export { useMessageNotifications } from './model/useMessageNotifications';
export { default as useTypingIndicator } from './model/useTypingIndicator';

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
export { default as MessageService } from './api/messageService';

// ============================================================================
// Types
// ============================================================================

// API & Data Access
export * from './api';

export * from './model';
export { useCollegeAdminMessages } from './model/useCollegeAdminMessages';
export { useCollegeLecturerMessages } from './model/useCollegeLecturerMessages';
