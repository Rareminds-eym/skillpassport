/**
 * Recruitment Query Keys
 * Centralized query keys for recruitment-related queries
 */

import type { QueryKey } from './types';

export const recruitmentQueryKeys = {
    // Base key for all recruitment queries
    all: ['recruitment'] as const,

    // Organization context
    orgContext: (userId: string): QueryKey =>
        ['recruitment', 'org-context', userId] as const,

    // Members
    members: {
        all: ['recruitment', 'members'] as const,
        list: (orgId: string, filters?: Record<string, any>): QueryKey =>
            filters
                ? ['recruitment', 'members', orgId, filters] as const
                : ['recruitment', 'members', orgId] as const,
        detail: (userId: string): QueryKey =>
            ['recruitment', 'members', 'detail', userId] as const,
    },

    // Invitations
    invitations: {
        all: ['recruitment', 'invitations'] as const,
        list: (orgId: string): QueryKey =>
            ['recruitment', 'invitations', orgId] as const,
        detail: (invitationId: string): QueryKey =>
            ['recruitment', 'invitations', 'detail', invitationId] as const,
        verify: (token: string): QueryKey =>
            ['recruitment', 'invitations', 'verify', token] as const,
    },

    // Jobs (org-scoped)
    jobs: {
        all: ['recruitment', 'jobs'] as const,
        list: (orgId: string, filters?: Record<string, any>): QueryKey =>
            filters
                ? ['recruitment', 'jobs', orgId, filters] as const
                : ['recruitment', 'jobs', orgId] as const,
        detail: (jobId: string): QueryKey =>
            ['recruitment', 'jobs', 'detail', jobId] as const,
    },

    // Candidates (org-scoped)
    candidates: {
        all: ['recruitment', 'candidates'] as const,
        list: (orgId: string, filters?: Record<string, any>): QueryKey =>
            filters
                ? ['recruitment', 'candidates', orgId, filters] as const
                : ['recruitment', 'candidates', orgId] as const,
        detail: (candidateId: string): QueryKey =>
            ['recruitment', 'candidates', 'detail', candidateId] as const,
        pipeline: (orgId: string, jobId?: string): QueryKey =>
            jobId
                ? ['recruitment', 'candidates', 'pipeline', orgId, jobId] as const
                : ['recruitment', 'candidates', 'pipeline', orgId] as const,
    },

    // Analytics (org-scoped)
    analytics: {
        all: ['recruitment', 'analytics'] as const,
        overview: (orgId: string): QueryKey =>
            ['recruitment', 'analytics', 'overview', orgId] as const,
        funnel: (orgId: string, filters?: Record<string, any>): QueryKey =>
            filters
                ? ['recruitment', 'analytics', 'funnel', orgId, filters] as const
                : ['recruitment', 'analytics', 'funnel', orgId] as const,
        performance: (orgId: string, recruiterId?: string): QueryKey =>
            recruiterId
                ? ['recruitment', 'analytics', 'performance', orgId, recruiterId] as const
                : ['recruitment', 'analytics', 'performance', orgId] as const,
    },
} as const;
