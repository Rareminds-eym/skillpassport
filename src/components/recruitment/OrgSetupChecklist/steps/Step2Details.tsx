import { Briefcase, Users, Loader2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';

interface Step2DetailsProps {
    onComplete: () => void;
    isCompleted: boolean;
    initialData?: {
        industry?: string;
        companySize?: string;
    };
}

const INDUSTRIES = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Consulting',
    'Real Estate',
    'Construction',
    'Transportation',
    'Hospitality',
    'Media & Entertainment',
    'Telecommunications',
    'Energy',
    'Agriculture',
    'Non-Profit',
    'Government',
    'Other',
];

const COMPANY_SIZES = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1001-5000 employees',
    '5000+ employees',
];

export const Step2Details: React.FC<Step2DetailsProps> = ({
    onComplete,
    isCompleted,
    initialData,
}) => {
    const [industry, setIndustry] = useState(initialData?.industry || '');
    const [companySize, setCompanySize] = useState(initialData?.companySize || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!industry) {
            setError('Please select an industry');
            return;
        }

        if (!companySize) {
            setError('Please select a company size');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/recruitment/setup/step2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${ssoClient.getAccessToken()}`,
                },
                body: JSON.stringify({
                    industry,
                    companySize,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update organization details');
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
                    Business Details Added!
                </h3>
                <p className="text-gray-600 mb-4">
                    Your organization's business details have been saved.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="w-5 h-5 text-gray-500" />
                        <div>
                            <div className="text-xs text-gray-500">Industry</div>
                            <div className="font-medium text-gray-900">{initialData?.industry}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-500" />
                        <div>
                            <div className="text-xs text-gray-500">Company Size</div>
                            <div className="font-medium text-gray-900">{initialData?.companySize}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Step 2: Business Details
                </h3>
                <p className="text-gray-600">
                    Help us understand your organization better with these details.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Industry */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                            disabled={loading}
                        >
                            <option value="">Select an industry</option>
                            {INDUSTRIES.map((ind) => (
                                <option key={ind} value={ind}>
                                    {ind}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Company Size */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Size <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <select
                            value={companySize}
                            onChange={(e) => setCompanySize(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                            disabled={loading}
                        >
                            <option value="">Select company size</option>
                            {COMPANY_SIZES.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
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
                        {loading ? 'Saving...' : 'Continue'}
                    </button>
                </div>
            </form>
        </div>
    );
};
