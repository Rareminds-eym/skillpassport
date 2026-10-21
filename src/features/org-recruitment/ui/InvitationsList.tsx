/**
 * Invitations List Component
 * Displays pending, accepted, and expired invitations
 * 
 * Details Displayed:
 * - Invitee name and email
 * - Role assignment (company_admin, recruiter, viewer)
 * - Status (pending, accepted, expired, cancelled)
 * - Sent date
 * - Expiry date (7 days from sent date)
 */

import React, { useState } from 'react';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EnvelopeIcon,
    ArrowPathIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useRecruitmentInvitations, useCancelInvitation, useResendInvitation } from '@/entities/recruitment/model/useRecruitmentInvitations';
import { RoleIndicator } from './RoleIndicator';
import type { RecruitmentRole } from '@/entities/recruitment/model/types';

export const InvitationsList: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'expired'>(
        'pending'
    );

    const { data: invitations, isLoading } = useRecruitmentInvitations();
    const cancelMutation = useCancelInvitation();
    const resendMutation = useResendInvitation();

    // Filter invitations
    const filteredInvitations = invitations?.filter((inv) => {
        if (statusFilter === 'all') return true;
        return inv.status === statusFilter;
    });

    const handleCancelInvitation = async (invitationId: string) => {
        if (!confirm('Are you sure you want to cancel this invitation? This action cannot be undone.')) return;

        try {
            await cancelMutation.mutateAsync(invitationId);
        } catch (error) {
            console.error('Failed to cancel invitation:', error);
            alert('Failed to cancel invitation. Please try again.');
        }
    };

    const handleResendInvitation = async (invitationId: string) => {
        try {
            await resendMutation.mutateAsync(invitationId);
            alert('Invitation email resent successfully!');
        } catch (error) {
            console.error('Failed to resend invitation:', error);
            alert('Failed to resend invitation. Please try again.');
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffMs = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { text: 'Expired', color: 'text-red-600' };
        if (diffDays === 0) return { text: 'Expires today', color: 'text-orange-600' };
        if (diffDays === 1) return { text: '1 day left', color: 'text-orange-600' };
        if (diffDays <= 3) return { text: `${diffDays} days left`, color: 'text-yellow-600' };
        return { text: `${diffDays} days left`, color: 'text-gray-600' };
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
                    filteredInvitations?.map((invitation) => {
                        const timeRemaining = invitation.expiresAt ? getTimeRemaining(invitation.expiresAt) : null;

                        return (
                            <div
                                key={invitation.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    {/* Left: Avatar + Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                            <UserCircleIcon className="h-6 w-6 text-white" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                                    {invitation.inviteeName || 'No name provided'}
                                                </h3>
                                                {invitation.inviteeRole && (
                                                    <RoleIndicator
                                                        role={invitation.inviteeRole as RecruitmentRole}
                                                        size="sm"
                                                    />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">{invitation.inviteeEmail}</p>
                                        </div>
                                    </div>

                                    {/* Middle: Dates */}
                                    <div className="hidden md:flex items-center gap-6 text-sm">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 mb-1">Sent</p>
                                            <p className="text-gray-900 font-medium">
                                                {invitation.createdAt ? new Date(invitation.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                }) : '-'}
                                            </p>
                                        </div>

                                        {invitation.expiresAt && invitation.status === 'pending' && (
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 mb-1">Expires</p>
                                                <p className="text-gray-900 font-medium">
                                                    {new Date(invitation.expiresAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                {timeRemaining && (
                                                    <p className={`text-xs font-medium ${timeRemaining.color}`}>
                                                        {timeRemaining.text}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Status + Actions */}
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(invitation.status)}
                                        
                                        {invitation.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleResendInvitation(invitation.id)}
                                                    disabled={resendMutation.isPending}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Resend invitation"
                                                >
                                                    <ArrowPathIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleCancelInvitation(invitation.id)}
                                                    disabled={cancelMutation.isPending}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Cancel invitation"
                                                >
                                                    <XCircleIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
