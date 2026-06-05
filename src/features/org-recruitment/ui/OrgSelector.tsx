/**
 * Organization Selector Component
 * Dropdown for users who belong to multiple organizations
 */

import React, { useState } from 'react';
import { ChevronDownIcon, CheckIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useUserOrgContexts } from '@/entities/recruitment/model/useOrgContext';
import type { OrgContext } from '@/entities/recruitment/model/types';

interface OrgSelectorProps {
    onOrgChange?: (orgId: string) => void;
}

export const OrgSelector: React.FC<OrgSelectorProps> = ({ onOrgChange }) => {
    const { contexts, isLoading, hasMultipleOrgs } = useUserOrgContexts();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
        contexts[0]?.orgId || null
    );

    // If user only has one org, don't show selector
    if (!hasMultipleOrgs || isLoading) {
        return null;
    }

    const selectedOrg = contexts.find((ctx) => ctx.orgId === selectedOrgId);

    const handleSelect = (orgId: string) => {
        setSelectedOrgId(orgId);
        setIsOpen(false);
        onOrgChange?.(orgId);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                    {selectedOrg?.orgName || 'Select Organization'}
                </span>
                <ChevronDownIcon
                    className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                        <div className="py-1">
                            {contexts.map((org) => (
                                <button
                                    key={org.orgId}
                                    onClick={() => handleSelect(org.orgId)}
                                    className={`
                    w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors
                    ${selectedOrgId === org.orgId ? 'bg-primary-50' : ''}
                  `}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {selectedOrgId === org.orgId ? (
                                            <CheckIcon className="h-5 w-5 text-primary-600" />
                                        ) : (
                                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>

                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-medium text-gray-900">
                                            {org.orgName}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {org.orgSlug}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span
                                                className={`
                          inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${org.recruitmentRole === 'company_admin'
                                                        ? 'bg-purple-50 text-purple-700'
                                                        : org.recruitmentRole === 'recruiter'
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'bg-gray-50 text-gray-700'
                                                    }
                        `}
                                            >
                                                {org.recruitmentRole === 'company_admin'
                                                    ? 'Admin'
                                                    : org.recruitmentRole === 'recruiter'
                                                        ? 'Recruiter'
                                                        : 'Viewer'}
                                            </span>
                                            {!org.isActive && (
                                                <span className="text-xs text-red-600">Inactive</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
