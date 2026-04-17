import type { QueryKey } from './types';

export const analyticsKeys = {
    // Base key for all analytics queries
    all: ['analytics'] as const,

    // Diversity metrics
    diversity: {
        all: ['analytics', 'diversity'] as const,
        data: (organizationId: string, filters?: Record<string, any>): QueryKey =>
            filters
                ? ['analytics', 'diversity', organizationId, filters] as const
                : ['analytics', 'diversity', organizationId] as const,
    },

    // Geographic distribution
    geographic: {
        all: ['analytics', 'geographic'] as const,
        distribution: (organizationId: string): QueryKey =>
            ['analytics', 'geographic', organizationId] as const,
    },

    // Hiring metrics
    hiring: {
        all: ['analytics', 'hiring'] as const,
        topColleges: (organizationId: string, limit?: number): QueryKey =>
            limit
                ? ['analytics', 'hiring', 'colleges', organizationId, limit] as const
                : ['analytics', 'hiring', 'colleges', organizationId] as const,
    },

    // Quality metrics
    quality: {
        all: ['analytics', 'quality'] as const,
        metrics: (organizationId: string): QueryKey =>
            ['analytics', 'quality', organizationId] as const,
    },

    // Recruitment funnel
    recruitment: {
        all: ['analytics', 'recruitment'] as const,
        funnel: (organizationId: string, dateRange?: { start: string; end: string }): QueryKey =>
            dateRange
                ? ['analytics', 'recruitment', 'funnel', organizationId, dateRange] as const
                : ['analytics', 'recruitment', 'funnel', organizationId] as const,
    },

    // KPIs
    kpis: {
        all: ['analytics', 'kpis'] as const,
        data: (organizationId: string): QueryKey =>
            ['analytics', 'kpis', organizationId] as const,
    },

    // Realtime activities
    realtime: {
        all: ['analytics', 'realtime'] as const,
        activities: (organizationId: string): QueryKey =>
            ['analytics', 'realtime', organizationId] as const,
    },

    // Speed analytics
    speed: {
        all: ['analytics', 'speed'] as const,
        metrics: (organizationId: string): QueryKey =>
            ['analytics', 'speed', organizationId] as const,
    },
} as const;
