/**
 * Recruitment Onboarding - Step 2: Recruitment Settings
 *
 * Combines team settings and recruitment preferences into one step.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOnboarding } from './OnboardingContext';

export default function OnboardingStep2() {
    const navigate = useNavigate();
    const { data, updateTeamSettings } = useOnboarding();

    const [teamSettings, setTeamSettings] = useState(data.teamSettings);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            updateTeamSettings(teamSettings);

            toast.success('Recruitment settings saved!');
            navigate('/recruitment/onboarding/step-3');
        } catch (error: any) {
            toast.error('Failed to save recruitment settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-slate-200">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Recruitment Settings</h2>
                <p className="text-slate-600">
                    Configure your team structure and recruitment workflow
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Team Settings */}
                <section className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900">Team Settings</h3>

                    <div className="space-y-2 rounded-xl  px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800">
                                    Maximum Recruiters
                                </label>
                                <p className="text-xs text-slate-500">
                                    Number of team members who can post jobs and manage candidates
                                </p>
                            </div>
                            <span className="text-xl font-bold text-blue-600 min-w-[48px] text-right">
                                {teamSettings.maxRecruiters}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={teamSettings.maxRecruiters}
                                onChange={(e) => setTeamSettings(prev => ({ ...prev, maxRecruiters: parseInt(e.target.value) }))}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-slate-200 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Require Approval for Job Posts</h3>
                            <p className="text-xs text-slate-500">
                                All job posts must be approved by an admin before going live
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={teamSettings.requireApproval}
                                onChange={(e) => setTeamSettings(prev => ({ ...prev, requireApproval: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </section>

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
                                <span>Review & Complete</span>
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
