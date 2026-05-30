/**
 * Organization Recruitment Admin Dashboard
 * Main admin portal for managing recruitment team and organization settings
 */

import { useState } from 'react';
import {
    UsersIcon,
    EnvelopeIcon,
    Cog6ToothIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import { OrgContextBadge } from '@/features/org-recruitment/ui/OrgContextBadge';
import { EmployeeList } from '@/features/org-recruitment/ui/EmployeeList';
import { InvitationsList } from '@/features/org-recruitment/ui/InvitationsList';
import { InviteEmployeeModal } from '@/features/org-recruitment/ui/InviteEmployeeModal';
import { OrgSettings } from '@/features/org-recruitment/ui/OrgSettings';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';
import { useRecruitmentMembers } from '@/entities/recruitment/model/useRecruitmentMembers';
import { useRecruitmentInvitations } from '@/entities/recruitment/model/useRecruitmentInvitations';

type TabType = 'employees' | 'invitations' | 'settings' | 'analytics';

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<TabType>('employees');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const { orgContext, isLoading: orgLoading } = useOrgContext();
    const { data: membersResult } = useRecruitmentMembers();
    const { data: invitations } = useRecruitmentInvitations();

    const members = membersResult?.members || [];

    const tabs = [
        {
            id: 'employees' as TabType,
            label: 'Team Members',
            icon: UsersIcon,
            count: members?.length || 0,
        },
        {
            id: 'invitations' as TabType,
            label: 'Invitations',
            icon: EnvelopeIcon,
            count: invitations?.filter((inv) => inv.status === 'pending').length || 0,
        },
        {
            id: 'settings' as TabType,
            label: 'Settings',
            icon: Cog6ToothIcon,
        },
        {
            id: 'analytics' as TabType,
            label: 'Analytics',
            icon: ChartBarIcon,
        },
    ];

    if (orgLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading organization...</p>
                </div>
            </div>
        );
    }

    if (!orgContext) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 font-medium">No Organization Context</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            You need to be part of an organization to access this page.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Recruitment Admin
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage your recruitment team and organization settings
                            </p>
                        </div>
                        <OrgContextBadge />
                    </div>

                    {/* Tabs */}
                    <div className="mt-6 flex gap-1 border-b border-gray-200">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                        }
                  `}
                                >
                                    <Icon className="h-5 w-5" />
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span
                                            className={`
                        px-2 py-0.5 text-xs rounded-full
                        ${activeTab === tab.id
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }
                      `}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'employees' && (
                    <EmployeeList onInviteClick={() => setIsInviteModalOpen(true)} />
                )}

                {activeTab === 'invitations' && <InvitationsList />}

                {activeTab === 'settings' && <OrgSettings />}

                {activeTab === 'analytics' && (
                    <div className="bg-white border border-gray-200 rounded-lg p-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Team Analytics
                        </h2>
                        <p className="text-gray-600">
                            Analytics dashboard coming soon. This will include:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                            <li>Recruiter performance metrics</li>
                            <li>Time-to-hire statistics</li>
                            <li>Pipeline conversion rates</li>
                            <li>Team activity overview</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            <InviteEmployeeModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />
        </div>
    );
};

export default AdminDashboard;
