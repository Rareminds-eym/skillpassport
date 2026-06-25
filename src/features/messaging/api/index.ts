// ============================================================================
// MESSAGING FEATURE API TYPES ONLY
// ============================================================================
// This file exports only TYPE definitions from the feature layer.
// All business services remain in their original locations:
//   - @/shared/api/messageQueryService.ts
//   - @/shared/api/messageMutationService.ts
//   - @/shared/api/messageService.ts (legacy)
//
// PROPER IMPORT PATHS:
// ✅ For types:
//    import type { Message, Conversation } from '@/features/messaging';
//
// ✅ For hooks:
//    import { useConversationMutations } from '@/features/messaging/model';
//
// ✅ For services (if absolutely necessary):
//    import { MessageQueryService } from '@/shared/api/messageQueryService';
//
// ❌ DO NOT:
//    import { MessageQueryService } from '@/features/messaging/api';
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
