/**
 * Type definitions for the messaging system
 * Supports all user roles and conversation types
 */

// ============================================================================
// User Role Types
// ============================================================================

/**
 * All supported user roles in the messaging system
 */
export type { UserRole } from '@/shared/types/messaging';

/**
 * Admin-specific roles (require special unread count handling)
 */
export type AdminRole = 'school_admin' | 'college_admin' | 'university_admin';

/**
 * Backward compatibility alias for college_educator
 * @deprecated Use 'college_educator' instead
 */
export type CollegeLecturer = 'college_educator';

// ============================================================================
// Conversation Type
// ============================================================================

/**
 * All supported conversation types between users
 */
export type { ConversationType } from '@/shared/types/messaging';

// ============================================================================
// Message Interface
// ============================================================================

/**
 * Message entity representing a single message in a conversation
 */
export interface Message {
    /** Message ID - number for real messages, string for optimistic (temp_${timestamp}) */
    id: number | string;

    /** Conversation this message belongs to */
    conversation_id: string;

    /** ID of the user who sent the message */
    sender_id: string;

    /** Role of the sender */
    sender_type: UserRole;

    /** ID of the user who receives the message */
    receiver_id: string;

    /** Role of the receiver */
    receiver_type: UserRole;

    /** The message text content */
    message_text: string;

    /** Optional file attachments */
    attachments?: any[];

    /** Optional application context */
    application_id?: number;

    /** Optional opportunity context */
    opportunity_id?: number;

    /** Optional class context */
    class_id?: number;

    /** Whether the message has been read */
    is_read: boolean;

    /** Timestamp when message was read */
    read_at?: string;

    /** Timestamp when message was created */
    created_at: string;

    /** Timestamp when message was last updated */
    updated_at: string;
}

// ============================================================================
// Conversation Interface
// ============================================================================

/**
 * Conversation entity representing a messaging thread between two users
 */
export interface Conversation {
    /** Unique conversation identifier */
    id: string;

    // Participant IDs (role-specific)
    student_id?: string;
    recruiter_id?: string;
    educator_id?: string;
    school_id?: string;
    college_id?: string;

    // Context IDs
    application_id?: number;
    opportunity_id?: number;
    class_id?: number;

    /** Optional conversation subject */
    subject?: string;

    /** Conversation status */
    status: 'active' | 'archived' | 'closed';

    /** Type of conversation */
    conversation_type: ConversationType;

    /** Timestamp of last message */
    last_message_at?: string;

    /** Preview of last message text */
    last_message_preview?: string;

    /** Sender of last message */
    last_message_sender?: string;

    // Unread counts per role
    student_unread_count: number;
    recruiter_unread_count: number;
    educator_unread_count: number;
    admin_unread_count?: number;
    college_admin_unread_count?: number;

    // Soft delete flags per role
    deleted_by_student?: boolean;
    deleted_by_recruiter?: boolean;
    deleted_by_educator?: boolean;
    deleted_by_admin?: boolean;
    deleted_by_college_admin?: boolean;

    // Archive flags per role
    archived_by_student?: boolean;
    archived_by_recruiter?: boolean;
    archived_by_educator?: boolean;
    archived_by_admin?: boolean;
    archived_by_college_admin?: boolean;

    /** Timestamp when conversation was created */
    created_at: string;

    /** Timestamp when conversation was last updated */
    updated_at: string;

    // Joined data (populated by queries)
    student?: any;
    recruiter?: any;
    educator?: any;
    application?: any;
    opportunity?: any;
    class?: any;
}

// ============================================================================
// Mutation Parameter Types
// ============================================================================

/**
 * Parameters for sending a message
 */
export interface SendMessageParams {
    conversationId: string;
    senderId: string;
    senderType: UserRole;
    receiverId: string;
    receiverType: UserRole;
    messageText: string;
    metadata?: MessageMetadata;
}

/**
 * Optional metadata for messages
 */
export interface MessageMetadata {
    applicationId?: number;
    opportunityId?: number;
    classId?: number;
    attachments?: any[];
}

/**
 * Parameters for creating a conversation
 */
export interface CreateConversationParams {
    userId1: string;
    userId2: string;
    conversationType: ConversationType;
    metadata?: ConversationMetadata;
}

/**
 * Optional metadata for conversations
 */
export interface ConversationMetadata {
    subject?: string;
    applicationId?: number;
    opportunityId?: number;
    classId?: number;
}
