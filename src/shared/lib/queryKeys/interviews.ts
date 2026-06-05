import type { QueryKey } from './types';

export const interviewsKeys = {
    all: ['interviews'] as const,
    list: (params: { learnerId: string }): QueryKey =>
        ['interviews', 'list', params.learnerId] as const,
} as const;
