/**
 * Change Role Modal Component
 * Allows admins to change a member's recruitment role
 */

import { useState } from 'react';
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import type { RecruitmentRole } from '@/entities/recruitment/model/types';

interface Member {
    id: string;
    name: string;
    email: string;
    recruitmentRole: RecruitmentRole;
}

interface ChangeRoleModalProps {
    member: Member;
    onClose: () => void;
    onConfirm: (memberId: string, newRole: RecruitmentRole) => Promise<void>;
}

const ROLE_OPTIONS: { value: RecruitmentRole; label: string; description: string; color: string }[] = [
    {
        value: 'company_admin',
        label: 'Admin',
        description: 'Full access to manage team, jobs, and settings',
        color: 'purple',
    },
    {
        value: 'recruiter',
        label: 'Recruiter',
        description: 'Can post jobs and manage candidates',
        color: 'blue',
    },
    {
        value: 'viewer',
        label: 'Viewer',
        description: 'Read-only access to jobs and candidates',
        color: 'gray',
    },
];

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
    member,
    onClose,
    onConfirm,
}) => {
    const [selectedRole, setSelectedRole] = useState<RecruitmentRole>(member.recruitmentRole);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (selectedRole === member.recruitmentRole) {
            onClose();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onConfirm(member.id, selectedRole);
            onClose();
        } catch (err: any) {
            console.error('[ChangeRoleModal] Failed to change role:', err);
            setError(err.message || 'Failed to change role');
        } finally {
            setLoading(false);
        }
    };

    const getRoleColor = (role: RecruitmentRole) => {
        const option = ROLE_OPTIONS.find((opt) => opt.value === role);
        return option?.color || 'gray';
    };

    const currentRoleOption = ROLE_OPTIONS.find((opt) => opt.value === member.recruitmentRole);
    const selectedRoleOption = ROLE_OPTIONS.find((opt) => opt.value === selectedRole);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Change Member Role</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Member Info */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <UserCircleIcon className="w-10 h-10 text-gray-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                            </div>
                            <span
                                className={`px-2 py-1 text-xs font-medium rounded-full bg-${getRoleColor(
                                    member.recruitmentRole
                                )}-100 text-${getRoleColor(member.recruitmentRole)}-700`}
                            >
                                {currentRoleOption?.label}
                            </span>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select New Role
                            </label>
                            <div className="space-y-2">
                                {ROLE_OPTIONS.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === option.value
                                                ? `border-${option.color}-500 bg-${option.color}-50`
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={option.value}
                                            checked={selectedRole === option.value}
                                            onChange={(e) => setSelectedRole(e.target.value as RecruitmentRole)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                                {option.value === member.recruitmentRole && (
                                                    <span className="text-xs text-gray-500">(Current)</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Warning */}
                        {selectedRole !== member.recruitmentRole && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> Changing the role will immediately update the member's
                                    permissions. They will be notified via email.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading || selectedRole === member.recruitmentRole}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Changing...</span>
                                </>
                            ) : (
                                'Change Role'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
