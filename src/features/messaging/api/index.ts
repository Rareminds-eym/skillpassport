// Export MessageService
export { default as MessageService } from '../../../shared/api/messageService';

// Export all types from types.ts
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
} from './types';

// Re-export everything from messageService for backward compatibility
export * from '../../../shared/api/messageService';
