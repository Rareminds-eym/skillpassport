/**
 * Recruitment Configuration Tab
 * Hiring workflow, interview stages, and job posting preferences
 */

import { useState, useEffect } from 'react';
import {
    Cog6ToothIcon,
    PlusIcon,
    TrashIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    CheckCircleIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';
import {
    useRecruitmentConfiguration,
    useUpdateRecruitmentConfiguration,
    type RecruitmentConfiguration,
} from '@/entities/recruitment';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('RecruitmentConfigurationTab');

interface WorkflowStage {
    stage: string;
    name: string;
    order: number;
}

interface InterviewStage {
    id: string;
    name: string;
    duration: number;
    order?: number;
}

export const RecruitmentConfigurationTab = () => {
    const { data: configData, isLoading } = useRecruitmentConfiguration();
    const updateConfiguration = useUpdateRecruitmentConfiguration();

    const [workflow, setWorkflow] = useState<WorkflowStage[]>([]);
    const [interviewStages, setInterviewStages] = useState<InterviewStage[]>([]);
    const [careerPageUrl, setCareerPageUrl] = useState('');
    const [careerPageEnabled, setCareerPageEnabled] = useState(false);
    const [jobPreferences, setJobPreferences] = useState<Record<string, any>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (configData?.config) {
            const config = configData.config;
            setWorkflow(config.default_hiring_workflow || []);
            setInterviewStages(config.interview_stages || []);
            setCareerPageUrl(config.career_page_url || '');
            setCareerPageEnabled(config.career_page_enabled || false);
            setJobPreferences(config.job_posting_preferences || {});
        }
    }, [configData]);

    const handleSave = async () => {
        try {
            await updateConfiguration.mutateAsync({
                default_hiring_workflow: workflow,
                interview_stages: interviewStages,
                career_page_url: careerPageUrl,
                career_page_enabled: careerPageEnabled,
                job_posting_preferences: jobPreferences,
            });

            setHasChanges(false);
            setShowSuccess(true);
            logger.info('Configuration updated successfully');

            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error: any) {
            logger.error('Configuration update failed', { error: error.message });
            alert('Failed to update configuration: ' + error.message);
        }
    };

    const handleCancel = () => {
        if (configData?.config) {
            const config = configData.config;
            setWorkflow(config.default_hiring_workflow || []);
            setInterviewStages(config.interview_stages || []);
            setCareerPageUrl(config.career_page_url || '');
            setCareerPageEnabled(config.career_page_enabled || false);
            setJobPreferences(config.job_posting_preferences || {});
            setHasChanges(false);
            setShowSuccess(false);
        }
    };

    // Workflow Management
    const addWorkflowStage = () => {
        const newStage: WorkflowStage = {
            stage: `custom_${Date.now()}`,
            name: 'New Stage',
            order: workflow.length + 1,
        };
        setWorkflow([...workflow, newStage]);
        setHasChanges(true);
    };

    const updateWorkflowStage = (index: number, field: keyof WorkflowStage, value: any) => {
        const updated = [...workflow];
        updated[index] = { ...updated[index], [field]: value };
        setWorkflow(updated);
        setHasChanges(true);
    };

    const deleteWorkflowStage = (index: number) => {
        const updated = workflow.filter((_, i) => i !== index);
        // Reorder
        updated.forEach((stage, i) => {
            stage.order = i + 1;
        });
        setWorkflow(updated);
        setHasChanges(true);
    };

    const moveWorkflowStage = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === workflow.length - 1)
        ) {
            return;
        }

        const updated = [...workflow];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

        // Update order
        updated.forEach((stage, i) => {
            stage.order = i + 1;
        });

        setWorkflow(updated);
        setHasChanges(true);
    };

    // Interview Stages Management
    const addInterviewStage = () => {
        const newStage: InterviewStage = {
            id: `stage_${Date.now()}`,
            name: 'New Interview Stage',
            duration: 30,
            order: interviewStages.length + 1,
        };
        setInterviewStages([...interviewStages, newStage]);
        setHasChanges(true);
    };

    const updateInterviewStage = (index: number, field: keyof InterviewStage, value: any) => {
        const updated = [...interviewStages];
        updated[index] = { ...updated[index], [field]: value };
        setInterviewStages(updated);
        setHasChanges(true);
    };

    const deleteInterviewStage = (index: number) => {
        const updated = interviewStages.filter((_, i) => i !== index);
        // Reorder
        updated.forEach((stage, i) => {
            stage.order = i + 1;
        });
        setInterviewStages(updated);
        setHasChanges(true);
    };

    const moveInterviewStage = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === interviewStages.length - 1)
        ) {
            return;
        }

        const updated = [...interviewStages];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

        // Update order
        updated.forEach((stage, i) => {
            stage.order = i + 1;
        });

        setInterviewStages(updated);
        setHasChanges(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success Message */}
            {showSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-green-800">
                            Configuration updated successfully!
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                            Your recruitment settings have been saved.
                        </p>
                    </div>
                </div>
            )}

            {/* Default Hiring Workflow */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <Cog6ToothIcon className="w-6 h-6 text-gray-400" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Default Hiring Workflow
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Define the stages candidates go through in your hiring process
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={addWorkflowStage}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Stage
                    </button>
                </div>

                <div className="space-y-3">
                    {workflow.map((stage, index) => (
                        <div
                            key={stage.stage}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                        >
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => moveWorkflowStage(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ArrowUpIcon className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => moveWorkflowStage(index, 'down')}
                                    disabled={index === workflow.length - 1}
                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={stage.name}
                                    onChange={(e) =>
                                        updateWorkflowStage(index, 'name', e.target.value)
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Stage Name"
                                />
                                <input
                                    type="text"
                                    value={stage.stage}
                                    onChange={(e) =>
                                        updateWorkflowStage(index, 'stage', e.target.value)
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                                    placeholder="stage_id"
                                />
                            </div>

                            <button
                                onClick={() => deleteWorkflowStage(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    {workflow.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No workflow stages defined. Click "Add Stage" to create one.
                        </div>
                    )}
                </div>
            </div>

            {/* Interview Stages */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <Cog6ToothIcon className="w-6 h-6 text-gray-400" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Interview Stages
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Configure interview rounds and their durations
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={addInterviewStage}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Interview
                    </button>
                </div>

                <div className="space-y-3">
                    {interviewStages.map((stage, index) => (
                        <div
                            key={stage.id}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                        >
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => moveInterviewStage(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ArrowUpIcon className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => moveInterviewStage(index, 'down')}
                                    disabled={index === interviewStages.length - 1}
                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>

                            <div className="flex-1 grid grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={stage.name}
                                    onChange={(e) =>
                                        updateInterviewStage(index, 'name', e.target.value)
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Interview Name"
                                />
                                <input
                                    type="text"
                                    value={stage.id}
                                    onChange={(e) =>
                                        updateInterviewStage(index, 'id', e.target.value)
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                                    placeholder="interview_id"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="15"
                                        max="240"
                                        step="15"
                                        value={stage.duration}
                                        onChange={(e) =>
                                            updateInterviewStage(
                                                index,
                                                'duration',
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <span className="text-sm text-gray-600">min</span>
                                </div>
                            </div>

                            <button
                                onClick={() => deleteInterviewStage(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    {interviewStages.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No interview stages defined. Click "Add Interview" to create one.
                        </div>
                    )}
                </div>
            </div>

            {/* Career Page Settings */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <GlobeAltIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Career Page Settings</h3>
                </div>

                {/* Career Page URL */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Career Page URL
                    </label>
                    <input
                        type="url"
                        value={careerPageUrl}
                        onChange={(e) => {
                            setCareerPageUrl(e.target.value);
                            setHasChanges(true);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourcompany.com/careers"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Link to your company's career page
                    </p>
                </div>

                {/* Enable Career Page */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Enable Public Career Page
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            Allow candidates to view and apply to jobs on your career page
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setCareerPageEnabled(!careerPageEnabled);
                            setHasChanges(true);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${careerPageEnabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${careerPageEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Job Posting Preferences */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <Cog6ToothIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Job Posting Preferences
                    </h3>
                </div>

                <div className="space-y-4">
                    {/* Auto Post to Career Page */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Auto-post to Career Page
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                                Automatically publish new jobs to your career page
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setJobPreferences({
                                    ...jobPreferences,
                                    auto_post_to_career_page: !jobPreferences.auto_post_to_career_page,
                                });
                                setHasChanges(true);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${jobPreferences.auto_post_to_career_page
                                    ? 'bg-blue-600'
                                    : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${jobPreferences.auto_post_to_career_page
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Require Cover Letter */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Require Cover Letter
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                                Make cover letter mandatory for all applications
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setJobPreferences({
                                    ...jobPreferences,
                                    require_cover_letter: !jobPreferences.require_cover_letter,
                                });
                                setHasChanges(true);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${jobPreferences.require_cover_letter ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${jobPreferences.require_cover_letter
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Enable Application Questions */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Enable Custom Application Questions
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                                Allow adding custom questions to job applications
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setJobPreferences({
                                    ...jobPreferences,
                                    application_questions_enabled:
                                        !jobPreferences.application_questions_enabled,
                                });
                                setHasChanges(true);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${jobPreferences.application_questions_enabled
                                    ? 'bg-blue-600'
                                    : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${jobPreferences.application_questions_enabled
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Allow External Applications */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Allow External Applications
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                                Accept applications from candidates outside your ATS
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setJobPreferences({
                                    ...jobPreferences,
                                    allow_external_applications:
                                        !jobPreferences.allow_external_applications,
                                });
                                setHasChanges(true);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${jobPreferences.allow_external_applications
                                    ? 'bg-blue-600'
                                    : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${jobPreferences.allow_external_applications
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {hasChanges && (
                <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 rounded-b-lg">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={updateConfiguration.isPending}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateConfiguration.isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {updateConfiguration.isPending ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            'Save Configuration'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
