/**
 * Invite Employee Modal
 * Form for admins to invite new recruiters/admins to the organization
 */

import React, { useState } from 'react';
import { XMarkIcon, EnvelopeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useCreateInvitation } from '@/entities/recruitment/model/useRecruitmentInvitations';
import { getRoleDisplayName } from '@/entities/recruitment/lib/permissions';
import type { RecruitmentRole } from '@/entities/recruitment/model/types';

interface InviteEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InviteEmployeeModal: React.FC<InviteEmployeeModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<RecruitmentRole>('recruiter');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');

    const inviteMutation = useCreateInvitation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await inviteMutation.mutateAsync({
                email,
                role,
                name: name || undefined,
                message: message || undefined,
            });

            // Reset form
            setEmail('');
            setRole('recruiter');
            setName('');
            setMessage('');

            // Close modal
            onClose();
        } catch (error) {
            // Error is handled by the mutation
            console.error('Failed to send invitation:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <UserPlusIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Invite Employee
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Send an invitation to join your organization
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="recruiter@company.com"
                                />
                            </div>
                        </div>

                        {/* Name (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name <span className="text-gray-400">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as RecruitmentRole)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="recruiter">Recruiter</option>
                                <option value="company_admin">Admin</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <p className="mt-1 text-sm text-gray-500">
                                {role === 'company_admin' && (
                                    <>
                                        <strong>Admin:</strong> Can manage employees, create jobs, and
                                        access all features
                                    </>
                                )}
                                {role === 'recruiter' && (
                                    <>
                                        <strong>Recruiter:</strong> Can create jobs, manage candidates,
                                        and view analytics
                                    </>
                                )}
                                {role === 'viewer' && (
                                    <>
                                        <strong>Viewer:</strong> Can view jobs and candidates (read-only
                                        access)
                                    </>
                                )}
                            </p>
                        </div>

                        {/* Custom Message (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Personal Message <span className="text-gray-400">(Optional)</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Add a personal message to the invitation..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={inviteMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {inviteMutation.isPending ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <EnvelopeIcon className="h-4 w-4" />
                                        Send Invitation
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
