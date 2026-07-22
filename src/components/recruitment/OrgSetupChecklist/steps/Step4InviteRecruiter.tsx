import { UserPlus, Mail, Loader2, CheckCircle, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';

interface Step4InviteRecruiterProps {
    onComplete: () => void;
    isCompleted: boolean;
}

export const Step4InviteRecruiter: React.FC<Step4InviteRecruiterProps> = ({
    onComplete,
    isCompleted,
}) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            // First, send the actual invitation
            const inviteResponse = await fetch('/api/recruitment/invitations/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ssoClient.getAccessToken()}`,
                },
                body: JSON.stringify({
                    email: email.trim(),
                    role: 'recruiter', // Default role for first invite
                }),
            });

            if (!inviteResponse.ok) {
                const errorData = await inviteResponse.json();
                throw new Error(errorData.error || 'Failed to send invitation');
            }

            // Then mark step 4 as complete
            const progressResponse = await fetch('/api/recruitment/setup/step4', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ssoClient.getAccessToken()}`,
                },
                body: JSON.stringify({
                    email: email.trim(),
                }),
            });

            if (!progressResponse.ok) {
                console.error('Failed to update progress, but invitation was sent');
            }

            // Success - setup complete!
            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (isCompleted) {
        return (
            <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4">
                    <PartyPopper className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    🎉 Setup Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                    Congratulations! Your organization is all set up and ready to go.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div className="text-left">
                            <div className="font-semibold text-gray-900">Your first recruiter has been invited!</div>
                            <div className="text-sm text-gray-600">
                                They'll receive an email with instructions to join your organization.
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600 text-left space-y-2">
                        <p className="font-medium text-gray-900">What's next?</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            <li>Invite more team members from Settings</li>
                            <li>Start posting job requisitions</li>
                            <li>Explore your recruitment dashboard</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Step 4: Invite Your First Recruiter
                </h3>
                <p className="text-gray-600">
                    Almost there! Invite a team member to join your recruitment workspace.
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Activation Milestone</p>
                        <p className="text-blue-700">
                            Completing this step activates your organization and unlocks all recruitment features.
                            You can invite more team members later from Settings.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Member Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            disabled={loading}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        They'll receive an invitation email with a link to join your organization.
                    </p>
                </div>

                {/* What they'll get */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        What they'll be able to do:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>View and manage job requisitions</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>Access candidate applications</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>Collaborate on hiring decisions</span>
                        </li>
                    </ul>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Sending Invitation...' : 'Send Invitation & Complete Setup'}
                    </button>
                </div>
            </form>
        </div>
    );
};
