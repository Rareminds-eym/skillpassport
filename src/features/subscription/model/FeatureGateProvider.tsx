/**
 * FeatureGateProvider
 * 
 * Context provider that batches feature access checks at the page level
 * to prevent N+1 query patterns when multiple FeatureGate components
 * are used on the same page.
 * 
 * Usage:
 * ```tsx
 * <FeatureGateProvider>
 *   <FeatureGate feature="analytics">...</FeatureGate>
 *   <FeatureGate feature="ai_tutor">...</FeatureGate>
 *   <FeatureGate feature="video_portfolio">...</FeatureGate>
 * </FeatureGateProvider>
 * ```
 */

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { useSubscriptionQuery } from './useSubscriptionQuery';
import { checkFeatureAccess, type FeatureAccessResult } from '../lib/featureGating';
import { useUser } from '@/shared/model/authStore';

interface FeatureGateContextValue {
    checkFeature: (feature: string) => FeatureAccessResult;
    isLoading: boolean;
    invalidateCache: () => void;
}

const FeatureGateContext = createContext<FeatureGateContextValue | null>(null);

interface FeatureGateProviderProps {
    children: React.ReactNode;
}

export function FeatureGateProvider({ children }: FeatureGateProviderProps) {
    const user = useUser();
    const { subscriptionData, isLoading: subscriptionLoading } = useSubscriptionQuery();
    const [featureCache, setFeatureCache] = useState<Record<string, FeatureAccessResult>>({});

    const planCode = subscriptionData?.plan || 'freemium';
    const userId = user?.id;

    // Clear cache when subscription changes
    useEffect(() => {
        setFeatureCache({});
    }, [planCode, userId]);

    const checkFeature = useCallback((feature: string): FeatureAccessResult => {
        // Return cached result if available
        if (featureCache[feature]) {
            return featureCache[feature];
        }

        // Check feature access
        const result = checkFeatureAccess(
            planCode,
            feature,
            [], // userPurchases - can be extended
            {}, // currentUsage - can be extended
            userId
        );

        // Cache the result
        setFeatureCache(prev => ({ ...prev, [feature]: result }));

        return result;
    }, [planCode, userId, featureCache]);

    const invalidateCache = useCallback(() => {
        setFeatureCache({});
    }, []);

    const value = useMemo(() => ({
        checkFeature,
        isLoading: subscriptionLoading,
        invalidateCache,
    }), [checkFeature, subscriptionLoading, invalidateCache]);

    return (
        <FeatureGateContext.Provider value={value}>
            {children}
        </FeatureGateContext.Provider>
    );
}

/**
 * Hook to access feature gate context
 * Must be used within a FeatureGateProvider
 */
export function useFeatureGateContext(): FeatureGateContextValue {
    const context = useContext(FeatureGateContext);

    if (!context) {
        throw new Error('useFeatureGateContext must be used within a FeatureGateProvider');
    }

    return context;
}

/**
 * Optional hook that returns null if not within a provider
 * Useful for components that can work with or without the provider
 */
export function useOptionalFeatureGateContext(): FeatureGateContextValue | null {
    return useContext(FeatureGateContext);
}
