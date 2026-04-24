// Hooks
export { useMessages } from './useMessages';
export type { UseMessagesOptions, UseMessagesReturn } from './useMessages';
export { useStudentMessages } from './useStudentMessages';
export { useEducatorMessages } from './useEducatorMessages';
export { useRecruiterMessages } from './useRecruiterMessages';
export { useAdminMessages } from './useAdminMessages';
export { useConversationActions } from './useConversationActions';
export type { UseConversationActionsOptions, UseConversationActionsReturn } from './useConversationActions';
export { useConversation } from './useConversation';
export { useMessageNotifications } from './useMessageNotifications';
export { default as useTypingIndicator } from './useTypingIndicator';

// Store - Re-export from shared
export { useMessageStore } from '@/shared/model/useMessageStore';

// Deprecated - kept for backward compatibility during migration
export { useUnreadMessagesCount } from './useUnreadMessagesCount';
