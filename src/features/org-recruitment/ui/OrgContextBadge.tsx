/**
 * Organization Context Badge
 * Displays current organization name and user's role
 */

import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';
import { RoleIndicator } from './RoleIndicator';

export const OrgContextBadge: React.FC = () => {
    const { orgContext, isLoading, organizationName, recruitmentRole } = useOrgContext();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
                <div className="h-4 w-32 bg-gray-300 rounded"></div>
            </div>
        );
    }

    if (!orgContext) {
        return null;
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                    {organizationName || 'Organization'}
                </span>
            </div>

            {recruitmentRole && (
                <>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <RoleIndicator role={recruitmentRole} size="sm" />
                </>
            )}
        </div>
    );
};
