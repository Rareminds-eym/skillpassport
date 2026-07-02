/**
 * Recruitment Onboarding - Step 3: Recruitment Preferences
 * 
 * Configure job board integrations, notifications, and auto-matching
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Loader2, ArrowRight, ArrowLeft, Bell, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOnboarding } from './OnboardingContext';
import { OnboardingWizard } from './OnboardingWizard';
import { JOB_BOARDS } from './types';

export default function OnboardingStep3() {
    const navigate = useNavigate();
    const { data, updateRecruitmentPreferences } = useOnboarding();

    const [formData, setFormData] = useState(data.recruitmentPreferences);
    const [loading, setLoading] = useState(false);

    const toggleJobBoard = (boardId: string) => {
        setFormData(prev => ({
            ...prev,
            jobBoards: prev.jobBoards.includes(boardId)
                ? prev.jobBoards.filter(id => id !== boardId)
                : [...prev.jobBoards, boardId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Save to context
            updateRecruitmentPreferences(formData);

            toast.success('Preferences saved!');

            // Navigate to Step 4
            navigate('/recruitment/onboarding/step-4');
        } catch (error: any) {
            toast.error('Failed to save preferences');
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingWizard currentStep={3}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-slate-200">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Recruitment Preferences</h2>
                    <p className="text-slate-600">
                        Customize your recruitment workflow
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Job Boards */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Job Board Integrations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {JOB_BOARDS.map((board) => (
                                <button
                                    key={board.id}
                                    type="button"
                                    onClick={() => toggleJobBoard(board.id)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${formData.jobBoards.includes(board.id)
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{board.icon}</span>
                                        <span className="font-medium text-slate-900">{board.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Email Notifications */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Email Notifications
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                <input
                                    type="checkbox"
                                    checked={formData.emailNotifications.newApplications}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        emailNotifications: {
                                            ...prev.emailNotifications,
                                            newApplications: e.target.checked
                                        }
                                    }))}
                                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div>
                                    <div className="font-medium text-slate-900">New Applications</div>
                                    <div className="text-sm text-slate-500">Get notified instantly when candidates apply</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                <input
                                    type="checkbox"
                                    checked={formData.emailNotifications.dailyDigest}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        emailNotifications: {
                                            ...prev.emailNotifications,
                                            dailyDigest: e.target.checked
                                        }
                                    }))}
                                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div>
                                    <div className="font-medium text-slate-900">Daily Digest</div>
                                    <div className="text-sm text-slate-500">Summary of all activities once per day</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                                <input
                                    type="checkbox"
                                    checked={formData.emailNotifications.weeklyReport}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        emailNotifications: {
                                            ...prev.emailNotifications,
                                            weeklyReport: e.target.checked
                                        }
                                    }))}
                                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div>
                                    <div className="font-medium text-slate-900">Weekly Report</div>
                                    <div className="text-sm text-slate-500">Analytics and insights every week</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Auto-Matching */}
                    <div className="border-2 border-slate-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <Sparkles className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 mb-1">AI-Powered Candidate Matching</h3>
                                <p className="text-sm text-slate-600 mb-3">
                                    Automatically match candidates to jobs based on skills and experience
                                </p>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.autoMatching}
                                        onChange={(e) => setFormData(prev => ({ ...prev, autoMatching: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    <span className="ml-3 text-sm font-medium text-slate-700">
                                        {formData.autoMatching ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/recruitment/onboarding/step-2')}
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
        </OnboardingWizard>
    );
}
