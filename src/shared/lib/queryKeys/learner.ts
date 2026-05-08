import type { QueryKey, ConversationType } from './types';

export const learnerKeys = {
    // Base key for all learner queries
    all: ['learner'] as const,

    // Messages
    messages: {
        all: ['learner', 'messages'] as const,
        conversation: (conversationId: string): QueryKey =>
            ['learner', 'messages', conversationId] as const,
    },

    // Conversations
    conversations: {
        all: ['learner', 'conversations'] as const,
        byLearner: (learnerId: string, type?: ConversationType): QueryKey =>
            type
                ? ['learner', 'conversations', learnerId, type] as const
                : ['learner', 'conversations', learnerId] as const,
    },

    // Unread counts
    unread: {
        all: ['learner', 'unread'] as const,
        count: (learnerId: string): QueryKey =>
            ['learner', 'unread', learnerId] as const,
    },

    // Realtime activities
    activities: {
        all: ['learner', 'activities'] as const,
        realtime: (learnerId: string): QueryKey =>
            ['learner', 'activities', 'realtime', learnerId] as const,
    },
} as const;
