/**
 * Recruitment Onboarding - Step 2: Team Settings
 * 
 * Configure team size, hiring stages, and approval settings
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOnboarding } from './OnboardingContext';
import { OnboardingWizard } from './OnboardingWizard';

export default function OnboardingStep2() {
    const navigate = useNavigate();
    const { data, updateTeamSettings } = useOnboarding();

    const [formData, setFormData] = useState(data.teamSettings);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Save to context
            updateTeamSettings(formData);

            toast.success('Team settings saved!');

            // Navigate to Step 3
            navigate('/recruitment/onboarding/step-3');
        } catch (error: any) {
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingWizard currentStep={2}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-slate-200">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Team Settings</h2>
                    <p className="text-slate-600">
                        Configure your recruitment team structure
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Max Recruiters */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Maximum Recruiters
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={formData.maxRecruiters}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxRecruiters: parseInt(e.target.value) }))}
                                className="flex-1"
                            />
                            <span className="text-2xl font-bold text-blue-600 min-w-[60px] text-center">
                                {formData.maxRecruiters}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                            Number of team members who can post jobs and manage candidates
                        </p>
                    </div>

                    {/* Require Approval */}
                    <div className="border-2 border-slate-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <Shield className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 mb-1">Require Approval for Job Posts</h3>
                                <p className="text-sm text-slate-600 mb-3">
                                    All job posts must be approved by an admin before going live
                                </p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.requireApproval}
                                        onChange={(e) => setFormData(prev => ({ ...prev, requireApproval: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium text-slate-700">
                                        {formData.requireApproval ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/recruitment/onboarding/step-1')}
                            className="px-6 py-4 rounded-xl font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Back</span>
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <span>Continue to Preferences</span>
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </OnboardingWizard>
    );
}
