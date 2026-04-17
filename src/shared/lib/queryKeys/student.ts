import type { QueryKey, ConversationType } from './types';

export const studentKeys = {
    // Base key for all student queries
    all: ['student'] as const,

    // Messages
    messages: {
        all: ['student', 'messages'] as const,
        conversation: (conversationId: string): QueryKey =>
            ['student', 'messages', conversationId] as const,
    },

    // Conversations
    conversations: {
        all: ['student', 'conversations'] as const,
        byStudent: (studentId: string, type?: ConversationType): QueryKey =>
            type
                ? ['student', 'conversations', studentId, type] as const
                : ['student', 'conversations', studentId] as const,
    },

    // Unread counts
    unread: {
        all: ['student', 'unread'] as const,
        count: (studentId: string): QueryKey =>
            ['student', 'unread', studentId] as const,
    },

    // Realtime activities
    activities: {
        all: ['student', 'activities'] as const,
        realtime: (studentId: string): QueryKey =>
            ['student', 'activities', 'realtime', studentId] as const,
    },
} as const;
