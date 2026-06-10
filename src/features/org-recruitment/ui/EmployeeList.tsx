/**
 * Employee List Component
 * Displays all organization members with their roles and status
 */

import React, { useState } from 'react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    EllipsisVerticalIcon,
    UserCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    PencilIcon,
} from '@heroicons/react/24/outline';
import { useRecruitmentMembers, useUpdateMemberStatus, useUpdateMemberRole } from '@/entities/recruitment/model/useRecruitmentMembers';
import { RoleIndicator } from './RoleIndicator';
import { ChangeRoleModal } from './ChangeRoleModal';
import { getRoleDisplayName } from '@/entities/recruitment/lib/permissions';
import type { RecruitmentRole } from '@/entities/recruitment/model/types';

interface EmployeeListProps {
    onInviteClick?: () => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ onInviteClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<RecruitmentRole | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedMember, setSelectedMember] = useState<{
        id: string;
        name: string;
        email: string;
        recruitmentRole: RecruitmentRole;
    } | null>(null);

    const { data: membersResult, isLoading } = useRecruitmentMembers();
    const updateStatusMutation = useUpdateMemberStatus();
    const updateRoleMutation = useUpdateMemberRole();

    // Extract members array from result
    const members = membersResult?.members || [];

    // Filter members
    const filteredMembers = members?.filter((member) => {
        const matchesSearch =
            member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'all' || member.recruitmentRole === roleFilter;

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && member.isActive) ||
            (statusFilter === 'inactive' && !member.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await updateStatusMutation.mutateAsync({
                userId,
                isActive: !currentStatus,
            });
        } catch (error) {
            console.error('Failed to update member status:', error);
        }
    };

    const handleChangeRole = async (memberId: string, newRole: RecruitmentRole) => {
        try {
            console.log('[EmployeeList] Changing role:', { memberId, newRole });

            await updateRoleMutation.mutateAsync({
                userId: memberId,
                newRole: newRole,
            });

            console.log('[EmployeeList] Role changed successfully');
        } catch (error: any) {
            console.error('[EmployeeList] Failed to change role:', error);
            throw error;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {filteredMembers?.length || 0} member
                        {filteredMembers?.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {onInviteClick && (
                    <button
                        onClick={onInviteClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Invite Employee
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Role Filter */}
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as RecruitmentRole | 'all')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="all">All Roles</option>
                    <option value="company_admin">Admin</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="viewer">Viewer</option>
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* Member List */}
            <div className="space-y-3">
                {filteredMembers?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No members found</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Try adjusting your search or filters
                        </p>
                    </div>
                ) : (
                    filteredMembers?.map((member) => (
                        <div
                            key={member.userId}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                {/* Member Info */}
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {member.profilePicture ? (
                                            <img
                                                src={member.profilePicture}
                                                alt={member.name || 'User'}
                                                className="h-12 w-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                <span className="text-white font-semibold text-lg">
                                                    {member.name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                                {member.name || 'Unnamed User'}
                                            </h3>
                                            {member.recruitmentRole && (
                                                <RoleIndicator
                                                    role={member.recruitmentRole}
                                                    size="sm"
                                                />
                                            )}
                                            {!member.isActive && (
                                                <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            {member.email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="truncate">{member.email}</span>
                                                </div>
                                            )}
                                            {member.phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                                                    <span>{member.phone}</span>
                                                </div>
                                            )}
                                        </div>

                                        {member.lastActivityAt && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Last active:{' '}
                                                {new Date(member.lastActivityAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() =>
                                            setSelectedMember({
                                                id: member.userId,
                                                name: member.name || 'Unnamed User',
                                                email: member.email || '',
                                                recruitmentRole: member.recruitmentRole || 'viewer',
                                            })
                                        }
                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Change role"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleToggleStatus(member.userId, member.isActive)
                                        }
                                        disabled={updateStatusMutation.isPending}
                                        className={`
                      px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                      ${member.isActive
                                                ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                                                : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                                            }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                                    >
                                        {member.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Change Role Modal */}
            {selectedMember && (
                <ChangeRoleModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                    onConfirm={handleChangeRole}
                />
            )}
        </div>
    );
};
