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
// Hooks - New Unified API
// ============================================================================
export {
  useMessages,
  useStudentMessages,
  useEducatorMessages,
  useRecruiterMessages,
  useAdminMessages,
  useConversationActions,
  useConversation
} from './model';

export type {
  UseMessagesOptions,
  UseMessagesReturn,
  UseConversationActionsOptions,
  UseConversationActionsReturn
} from './model';

export { useMessageNotifications } from './model/useMessageNotifications';
export { default as useTypingIndicator } from './model/useTypingIndicator';

// Store
export { useMessageStore } from './model/useMessageStore';

// Deprecated - kept for backward compatibility during migration
export { useUnreadMessagesCount } from './model/useUnreadMessagesCount';

// ============================================================================
// Services
// ============================================================================
export { default as MessageService } from '../../shared/api/messageService';

// ============================================================================
// Types
// ============================================================================

// API & Data Access
export * from './api';
