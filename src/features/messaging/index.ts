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
export { default as MessageModal } from './ui/modals/MessageModal';
export { default as ConversationModal } from './ui/ConversationModal';
export { default as DeleteConversationModal } from './ui/modals/DeleteConversationModal';
export { default as NewLearnerConversationModal } from './ui/modals/NewLearnerConversationModal';
export { default as NewLearnerConversationModalEducator } from './ui/modals/NewLearnerConversationModalEducator';
export { default as NewLearnerConversationModalCollegeAdmin } from './ui/modals/NewLearnerConversationModalCollegeAdmin';
export { default as NewEducatorAdminConversationModal } from './ui/modals/NewEducatorAdminConversationModal';
export { default as NewEducatorConversationModal } from './ui/modals/NewEducatorConversationModal';
export { default as NewAdminConversationModal } from './ui/modals/NewAdminConversationModal';
export { default as NewSchoolAdminEducatorConversationModal } from './ui/modals/NewSchoolAdminEducatorConversationModal';

// ============================================================================
// Hooks - New Unified API
// ============================================================================
export {
  useMessages,
  useLearnerMessages,
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
export { useConversationMutations } from './model/useConversationMutations';

// Store - Re-export from shared
export { useMessageStore } from '@/shared/model/useMessageStore';

// Deprecated - kept for backward compatibility during migration
export { useUnreadMessagesCount } from './model/useUnreadMessagesCount';

// ============================================================================
// Services - API Layer (re-exported from shared via ./api)
// ============================================================================
// ⚠️ RECOMMENDATION: Use hooks instead of services directly
// Prefer: import { useConversationMutations, useMessages } from '@/features/messaging';
// Avoid: import { MessageQueryService } from '@/features/messaging';

// Legacy - for backward compatibility only
export { default as MessageService } from '../../shared/api/messageService';

// For explicit service access (not recommended - use hooks instead)
export type { Message, Conversation } from './api';

// ============================================================================
// Types - from feature types.ts
// ============================================================================
export type {
  UserRole,
  AdminRole,
  CollegeLecturer,
  ConversationType,
  SendMessageParams,
  MessageMetadata,
  CreateConversationParams,
  ConversationMetadata,
} from './api/types';
