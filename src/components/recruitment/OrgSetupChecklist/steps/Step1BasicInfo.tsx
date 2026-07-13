import { Building2, Mail, Loader2, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';

interface Step1BasicInfoProps {
    onComplete: () => void;
    isCompleted: boolean;
    initialData?: {
        name?: string;
        workEmail?: string;
    };
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
    onComplete,
    isCompleted,
    initialData,
}) => {
    const [name, setName] = useState(initialData?.name || '');
    const [workEmail, setWorkEmail] = useState(initialData?.workEmail || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orgAlreadyExists, setOrgAlreadyExists] = useState(false);
    const [checkingOrg, setCheckingOrg] = useState(true);

    // Check if org already exists on mount
    useEffect(() => {
        const checkExistingOrg = async () => {
            try {
                const response = await fetch('/api/recruitment/setup/progress', {
                    headers: {
                        Authorization: `Bearer ${ssoClient.getAccessToken()}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    // If org name exists, the admin created it during signup
                    if (data.orgData?.name) {
                        setOrgAlreadyExists(true);
                        setName(data.orgData.name);
                        setWorkEmail(data.orgData.workEmail || '');
                    }
                }
            } catch (err) {
                console.error('[Step1] Error checking org:', err);
            } finally {
                setCheckingOrg(false);
            }
        };

        checkExistingOrg();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // For admin recruiters, org already exists during signup
        // Step 1 just marks completion in metadata
        // So we can skip name/email validation - just call the API
        setLoading(true);

        try {
            const response = await fetch('/api/recruitment/setup/step1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ssoClient.getAccessToken()}`,
                },
                body: JSON.stringify({
                    name: name.trim() || 'N/A',
                    workEmail: workEmail.trim() || 'N/A',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to mark step as complete');
            }

            const data = await response.json();

            // If org already exists (admin recruiter case), just complete the step
            if (data.alreadyExists) {
                console.log('[Step1] Organization already exists, marked as complete');
            }

            // Success - move to next step
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Organization Created!
                </h3>
                <p className="text-gray-600 mb-4">
                    Your organization "{initialData?.name}" has been successfully created.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-gray-500" />
                        <div>
                            <div className="text-xs text-gray-500">Organization Name</div>
                            <div className="font-medium text-gray-900">{initialData?.name}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <div>
                            <div className="text-xs text-gray-500">Work Email</div>
                            <div className="font-medium text-gray-900">{initialData?.workEmail}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading while checking org status
    if (checkingOrg) {
        return (
            <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Checking organization status...</p>
            </div>
        );
    }

    // If org already exists, show simplified continue button
    if (orgAlreadyExists && !isCompleted) {
        return (
            <div>
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Step 1: Organization Information
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Your organization has already been created during signup.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <div>
                            <div className="text-xs text-blue-600 font-medium">Organization Name</div>
                            <div className="font-semibold text-gray-900">{name}</div>
                        </div>
                    </div>
                    {workEmail && (
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <div>
                                <div className="text-xs text-blue-600 font-medium">Work Email</div>
                                <div className="font-semibold text-gray-900">{workEmail}</div>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
                        {error}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Continuing...' : 'Continue to Next Step'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Step 1: Organization Information
                </h3>
                <p className="text-gray-600">
                    Let's start by creating your organization with basic details.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Organization Name */}
                <div>
                    <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="org-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Acme Corporation"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Work Email */}
                <div>
                    <label htmlFor="work-email" className="block text-sm font-medium text-gray-700 mb-2">
                        Work Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="work-email"
                            type="email"
                            value={workEmail}
                            onChange={(e) => setWorkEmail(e.target.value)}
                            placeholder="contact@company.com"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            disabled={loading}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        This email will be used for official communications.
                    </p>
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
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Creating Organization...' : 'Create Organization'}
                    </button>
                </div>
            </form>
        </div>
    );
};
