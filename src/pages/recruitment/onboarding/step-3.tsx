/**
 * Recruitment Onboarding - Step 3: Review & Complete
 *
 * Review all settings and complete onboarding.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, ArrowLeft, Edit, Building2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOnboarding } from './OnboardingContext';

export default function OnboardingStep3() {
    const navigate = useNavigate();
    const { data, resetOnboarding } = useOnboarding();
    const [loading, setLoading] = useState(false);

    const handleComplete = async () => {
        setLoading(true);

        try {
            console.log('[OnboardingStep3] Completing onboarding with data:', data);

            sessionStorage.setItem('onboarding_completed', 'true');
            localStorage.removeItem('onboarding_draft');
            resetOnboarding();

            toast.success('Company details saved! Now choose your subscription plan.', {
                duration: 3000,
            });

            setTimeout(() => {
                navigate('/subscription/plans?type=recruiter', { replace: true });
            }, 1500);
        } catch (error: any) {
            console.error('[OnboardingStep3] Error completing onboarding:', error);
            toast.error('Failed to complete setup. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-slate-200">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Review & Complete</h2>
                <p className="text-slate-600">
                    Please review your settings before launching your workspace
                </p>
            </div>

            <div className="space-y-6">
                {/* Company Details */}
                <div className="border-2 border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Company Details</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/recruitment/onboarding/step-1')}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </button>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-slate-500 mb-1">Company Name</dt>
                            <dd className="font-medium text-slate-900">{data.companyDetails.companyName}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500 mb-1">Industry</dt>
                            <dd className="font-medium text-slate-900">{data.companyDetails.industry}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500 mb-1">Company Size</dt>
                            <dd className="font-medium text-slate-900">{data.companyDetails.companySize}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500 mb-1">Email</dt>
                            <dd className="font-medium text-slate-900">{data.companyDetails.email}</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-slate-500 mb-1">Address</dt>
                            <dd className="font-medium text-slate-900">{data.companyDetails.address}</dd>
                        </div>
                    </dl>
                </div>

                {/* Recruitment Settings */}
                <div className="border-2 border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Settings className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Recruitment Settings</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/recruitment/onboarding/step-2')}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </button>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <dt className="text-slate-500 mb-1">Max Recruiters</dt>
                            <dd className="font-medium text-slate-900">{data.teamSettings.maxRecruiters}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500 mb-1">Require Approval</dt>
                            <dd className="font-medium text-slate-900">
                                {data.teamSettings.requireApproval ? 'Yes' : 'No'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="flex gap-4 pt-8">
                <button
                    type="button"
                    onClick={() => navigate('/recruitment/onboarding/step-2')}
                    disabled={loading}
                    className="px-6 py-4 rounded-xl font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back</span>
                </button>
                <button
                    type="button"
                    onClick={handleComplete}
                    disabled={loading}
                    className="flex-1 py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Launching Workspace...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-5 w-5" />
                            <span>Complete Setup & Launch</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
