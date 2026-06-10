import type { QueryKey } from './types';

export const applicationsKeys = {
    all: ['applications'] as const,
    list: (params: { learnerId: string; userEmail?: string }): QueryKey =>
        ['applications', 'list', params.learnerId, params.userEmail].filter(Boolean) as unknown as QueryKey,
} as const;
