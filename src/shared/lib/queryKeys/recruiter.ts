import type { QueryKey, ArchiveStatus } from './types';

export const recruiterKeys = {
    // Base key for all recruiter queries
    all: ['recruiter'] as const,

    // Messages
    messages: {
        all: ['recruiter', 'messages'] as const,
        conversation: (conversationId: string): QueryKey =>
            ['recruiter', 'messages', conversationId] as const,
        unread: (recruiterId: string): QueryKey =>
            ['recruiter', 'messages', 'unread', recruiterId] as const,
    },

    // Conversations
    conversations: {
        all: ['recruiter', 'conversations'] as const,
        byRecruiter: (recruiterId: string, status?: ArchiveStatus): QueryKey =>
            status
                ? ['recruiter', 'conversations', recruiterId, status] as const
                : ['recruiter', 'conversations', recruiterId] as const,
    },
} as const;
