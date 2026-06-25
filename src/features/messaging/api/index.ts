// Export MessageService (legacy, from shared API)
export { default as MessageService } from '../../../shared/api/messageService';

// Export query and mutation services (primary entry point)
export { MessageQueryService } from './services/messageQueryService';
export { MessageMutationService } from './services/messageMutationService';

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

// Re-export types from services
export type { Message, Conversation } from './services/messageQueryService';

// Re-export everything from messageService for backward compatibility
export * from '../../../shared/api/messageService';
