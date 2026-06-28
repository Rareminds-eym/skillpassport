/**
 * Messaging Feature - Public API
 *
 * This is the public interface for the messaging feature.
 * All external imports should go through this file.
 *
 * @example
 * ```typescript
 * import { MessageModal, useMessages } from '@/features/messaging';
 * // For MessageService, import from shared layer:
 * import MessageService from '@/shared/api/messageService';
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
// Types - SINGLE SOURCE
// ============================================================================
// Export types from feature types.ts (canonical location)
export type {
  UserRole,
  AdminRole,
  CollegeLecturer,
  ConversationType,
  Message,
  Conversation,
  SendMessageParams,
  MessageMetadata,
  CreateConversationParams,
  ConversationMetadata,
} from './api/types';

// ============================================================================
// Services - Use Shared Layer Directly
// ============================================================================
// ⚠️ Services are in the shared layer, NOT in features
// Import directly from @/shared/api - DO NOT re-export from features
//
// ✅ CORRECT IMPORTS:
//   For hooks:
//     import { useConversationMutations, useMessages } from '@/features/messaging/model';
//   For services (if needed):
//     import { MessageQueryService } from '@/shared/api/messageQueryService';
//     import { MessageMutationService } from '@/shared/api/messageMutationService';
//
// ❌ INCORRECT (DO NOT USE):
//   import { MessageQueryService } from '@/features/messaging';
//
// Legacy MessageService (deprecated):
//   import MessageService from '@/shared/api/messageService';
