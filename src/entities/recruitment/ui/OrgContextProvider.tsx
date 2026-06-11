/**
 * Organization Context Provider
 * Provides organization context to recruitment features via React Context
 * 
 * Note: This is an optional wrapper. The useOrgContext hook works standalone
 * via React Query. Use this provider if you need to share org context across
 * many components without prop drilling.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useOrgContext } from '../model/useOrgContext';
import type { OrgContext } from '../model/types';

interface OrgContextValue {
    orgContext: OrgContext | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
    isAdmin: boolean;
    isRecruiter: boolean;
    hasOrgAccess: boolean;
    organizationId?: string;
    organizationName?: string;
}

const OrgContextContext = createContext<OrgContextValue | undefined>(undefined);

interface OrgContextProviderProps {
    children: ReactNode;
}

/**
 * Provider component that wraps recruitment features
 * Automatically fetches and caches organization context
 */
export const OrgContextProvider: React.FC<OrgContextProviderProps> = ({ children }) => {
    const contextValue = useOrgContext();

    return (
        <OrgContextContext.Provider value={contextValue}>
            {children}
        </OrgContextContext.Provider>
    );
};

/**
 * Hook to access organization context from React Context
 * Must be used within OrgContextProvider
 * 
 * Alternative: Use useOrgContext() directly without provider
 */
export const useOrgContextFromProvider = (): OrgContextValue => {
    const context = useContext(OrgContextContext);

    if (context === undefined) {
        throw new Error(
            'useOrgContextFromProvider must be used within OrgContextProvider. ' +
            'Alternatively, use useOrgContext() directly without the provider.'
        );
    }

    return context;
};
