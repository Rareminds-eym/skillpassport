import type { QueryKey, ArchiveStatus } from './types';

export const educatorKeys = {
    // Base key for all educator queries
    all: ['educator'] as const,

    // Messages
    messages: {
        all: ['educator', 'messages'] as const,
        conversation: (conversationId: string): QueryKey =>
            ['educator', 'messages', conversationId] as const,
    },

    // Conversations
    conversations: {
        all: ['educator', 'conversations'] as const,
        byEducator: (educatorId: string, status?: ArchiveStatus): QueryKey =>
            status
                ? ['educator', 'conversations', educatorId, status] as const
                : ['educator', 'conversations', educatorId] as const,
        learners: (conversationId: string): QueryKey =>
            ['educator', 'conversations', 'learners', conversationId] as const,
    },

    // Admin conversations
    admin: {
        all: ['educator', 'admin'] as const,
        conversations: (educatorId: string, status?: ArchiveStatus): QueryKey =>
            status
                ? ['educator', 'admin', 'conversations', educatorId, status] as const
                : ['educator', 'admin', 'conversations', educatorId] as const,
        messages: (conversationId: string): QueryKey =>
            ['educator', 'admin', 'messages', conversationId] as const,
    },
} as const;
