import type { QueryKey } from './types';

export const subscriptionKeys = {
    // Base key for all subscription queries
    all: ['subscription'] as const,

    // Subscription data
    data: {
        all: ['subscription', 'data'] as const,
        byOrganization: (organizationId: string): QueryKey =>
            ['subscription', 'data', organizationId] as const,
    },

    // Add-on catalog
    addons: {
        all: ['subscription', 'addons'] as const,
        catalog: (): QueryKey =>
            ['subscription', 'addons', 'catalog'] as const,
    },

    // Promotional events
    promotions: {
        all: ['subscription', 'promotions'] as const,
        active: (): QueryKey =>
            ['subscription', 'promotions', 'active'] as const,
    },
} as const;
