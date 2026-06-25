// ============================================================================
// MESSAGING FEATURE API - Internal Use Only
// ============================================================================
// WARNING: This file is internal to the messaging feature.
//
// EXTERNAL IMPORTS SHOULD ONLY USE:
//   import { useConversationMutations, useMessages } from '@/features/messaging';
//
// DO NOT import directly from this file:
//   ❌ import { MessageQueryService } from '@/features/messaging/api';
//   ❌ import { MessageMutationService } from '@/features/messaging/api';
//
// These low-level services are re-exported here for feature-internal use ONLY.
// ============================================================================

// Export query and mutation services from shared layer (single source of truth)
// INTERNAL USE ONLY - See warning above
export { MessageQueryService } from '../../../shared/api/messageQueryService';
export { MessageMutationService } from '../../../shared/api/messageMutationService';

// Export legacy MessageService (deprecated)
export { default as MessageService } from '../../../shared/api/messageService';

// Export types (these are safe to import)
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
