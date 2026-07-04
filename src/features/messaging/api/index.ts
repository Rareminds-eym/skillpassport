// ============================================================================
// MESSAGING FEATURE API TYPES ONLY
// ============================================================================
// This file exports only TYPE definitions from the feature layer.
// All business services remain in their original locations:
//   - @/shared/api/messageQueryService.ts (implements Message type)
//   - @/shared/api/messageMutationService.ts (implements Message type)
//   - @/shared/api/messageService.ts (legacy, deprecated)
//
// PROPER IMPORT PATHS:
// ============================================================================
//
// ✅ For types from feature:
//    import type { Message, Conversation } from '@/features/messaging';
//
// ✅ For hooks from feature:
//    import { useConversationMutations, useMessages } from '@/features/messaging/model';
//
// ✅ For services from shared (correct location):
//    import { MessageQueryService } from '@/shared/api/messageQueryService';
//    import { MessageMutationService } from '@/shared/api/messageMutationService';
//
// ❌ WRONG - Services are not in features layer:
//    import { MessageQueryService } from '@/features/messaging/api';
//    import { MessageMutationService } from '@/features/messaging';
//
// ============================================================================
// RATIONALE:
// - Types are re-exported from feature for convenience (single import point)
// - Services remain in shared layer to maintain FSD boundaries
// - Features should not expose shared layer implementations
// ============================================================================

// Export TYPES ONLY (these are safe to re-export from feature)
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
