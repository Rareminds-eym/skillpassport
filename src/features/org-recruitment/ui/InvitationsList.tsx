/**
 * Invitations List Component
 * Displays pending, accepted, and expired invitations
 */

import React, { useState } from 'react';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EnvelopeIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useRecruitmentInvitations, useCancelInvitation } from '@/entities/recruitment/model/useRecruitmentInvitations';
import { RoleIndicator } from './RoleIndicator';
import type { RecruitmentRole } from '@/entities/recruitment/model/types';

export const InvitationsList: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'expired'>(
        'pending'
    );

    const { data: invitations, isLoading } = useRecruitmentInvitations();
    const cancelMutation = useCancelInvitation();

    // Filter invitations
    const filteredInvitations = invitations?.filter((inv) => {
        if (statusFilter === 'all') return true;
        return inv.status === statusFilter;
    });

    const handleCancelInvitation = async (invitationId: string) => {
        if (!confirm('Are you sure you want to cancel this invitation?')) return;

        try {
            await cancelMutation.mutateAsync(invitationId);
        } catch (error) {
            console.error('Failed to cancel invitation:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full">
                        <ClockIcon className="h-3 w-3" />
                        Pending
                    </span>
                );
            case 'accepted':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full">
                        <CheckCircleIcon className="h-3 w-3" />
                        Accepted
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-full">
                        <XCircleIcon className="h-3 w-3" />
                        Expired
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full">
                        <XCircleIcon className="h-3 w-3" />
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/3" />
                                <div className="h-3 bg-gray-200 rounded w-1/4" />
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
                    <h2 className="text-xl font-semibold text-gray-900">Invitations</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {filteredInvitations?.length || 0} invitation
                        {filteredInvitations?.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 border-b border-gray-200">
                {(['all', 'pending', 'accepted', 'expired'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`
              px-4 py-2 text-sm font-medium border-b-2 transition-colors
              ${statusFilter === status
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }
            `}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status !== 'all' && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                                {invitations?.filter((inv) => inv.status === status).length || 0}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Invitations List */}
            <div className="space-y-3">
                {filteredInvitations?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No invitations found</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {statusFilter === 'pending'
                                ? 'All pending invitations will appear here'
                                : `No ${statusFilter} invitations`}
                        </p>
                    </div>
                ) : (
                    filteredInvitations?.map((invitation) => (
                        <div
                            key={invitation.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                {/* Invitation Info */}
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Icon */}
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <EnvelopeIcon className="h-5 w-5 text-white" />
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                                {invitation.inviteeName || invitation.inviteeEmail}
                                            </h3>
                                            {invitation.inviteeRole && (
                                                <RoleIndicator
                                                    role={invitation.inviteeRole as RecruitmentRole}
                                                    size="sm"
                                                />
                                            )}
                                            {getStatusBadge(invitation.status)}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                                <span className="truncate">
                                                    {invitation.inviteeEmail}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                                <span>
                                                    Sent:{' '}
                                                    {new Date(invitation.createdAt).toLocaleDateString()}
                                                </span>
                                                {invitation.expiresAt && (
                                                    <span>
                                                        Expires:{' '}
                                                        {new Date(
                                                            invitation.expiresAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {invitation.acceptedAt && (
                                                    <span className="text-green-600">
                                                        Accepted:{' '}
                                                        {new Date(
                                                            invitation.acceptedAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            {invitation.invitationMessage && (
                                                <p className="text-sm text-gray-600 mt-2 italic">
                                                    "{invitation.invitationMessage}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {invitation.status === 'pending' && (
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleCancelInvitation(invitation.id)}
                                            disabled={cancelMutation.isPending}
                                            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
