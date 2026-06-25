// Export MessageService (legacy, from shared API)
export { default as MessageService } from '../../../shared/api/messageService';

// Export query and mutation services from shared layer (single source of truth)
export { MessageQueryService } from '../../../shared/api/messageQueryService';
export { MessageMutationService } from '../../../shared/api/messageMutationService';

// Export all types from types.ts (single source of truth)
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
