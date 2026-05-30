/**
 * Email Template Settings Component
 * Allows admins to customize recruitment email templates
 */

import { useState, useEffect } from 'react';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';
import { supabase } from '@/shared/api/supabaseClient';
import {
    EnvelopeIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    description: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
    {
        id: 'invitation',
        name: 'Team Invitation',
        subject: 'You\'re invited to join {{organization_name}}',
        body: `Hi {{recipient_name}},

You've been invited to join {{organization_name}} as a {{role}}.

Click the link below to accept the invitation:
{{invitation_link}}

This invitation will expire in 7 days.

Best regards,
{{sender_name}}
{{organization_name}}`,
        description: 'Sent when inviting new team members',
    },
    {
        id: 'role_change',
        name: 'Role Change Notification',
        subject: 'Your role has been updated at {{organization_name}}',
        body: `Hi {{recipient_name}},

Your role at {{organization_name}} has been updated to {{new_role}}.

Your new permissions are now active. If you have any questions, please contact your administrator.

Best regards,
{{organization_name}}`,
        description: 'Sent when a member\'s role is changed',
    },
    {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to {{organization_name}}!',
        body: `Hi {{recipient_name}},

Welcome to {{organization_name}}! We're excited to have you on the team.

Here are some quick links to get you started:
- Dashboard: {{dashboard_link}}
- Team Directory: {{team_link}}
- Help Center: {{help_link}}

If you need any assistance, don't hesitate to reach out.

Best regards,
{{organization_name}}`,
        description: 'Sent when a new member joins the organization',
    },
];

export const EmailTemplateSettings = () => {
    const { orgContext } = useOrgContext();
    const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (orgContext?.orgId) {
            loadTemplates();
        }
    }, [orgContext]);

    const loadTemplates = async () => {
        if (!orgContext?.orgId) return;

        try {
            const { data, error } = await supabase
                .from('organization_email_templates')
                .select('*')
                .eq('organization_id', orgContext.orgId);

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // Merge custom templates with defaults
            if (data && data.length > 0) {
                const customTemplates = data.map((t: any) => ({
                    id: t.template_type,
                    name: t.name,
                    subject: t.subject,
                    body: t.body,
                    description: DEFAULT_TEMPLATES.find((dt) => dt.id === t.template_type)?.description || '',
                }));

                // Update templates with custom versions
                const mergedTemplates = DEFAULT_TEMPLATES.map((defaultTemplate) => {
                    const customTemplate = customTemplates.find((ct) => ct.id === defaultTemplate.id);
                    return customTemplate || defaultTemplate;
                });

                setTemplates(mergedTemplates);
            }
        } catch (error) {
            console.error('[EmailTemplateSettings] Failed to load templates:', error);
        }
    };

    const handleSelectTemplate = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setEditedTemplate({ ...template });
        setShowPreview(false);
        setMessage(null);
    };

    const handleSave = async () => {
        if (!editedTemplate || !orgContext?.orgId) return;

        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('organization_email_templates')
                .upsert({
                    organization_id: orgContext.orgId,
                    template_type: editedTemplate.id,
                    name: editedTemplate.name,
                    subject: editedTemplate.subject,
                    body: editedTemplate.body,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'organization_id,template_type',
                });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Template saved successfully!' });

            // Update local state
            setTemplates((prev) =>
                prev.map((t) => (t.id === editedTemplate.id ? editedTemplate : t))
            );
            setSelectedTemplate(editedTemplate);
        } catch (error: any) {
            console.error('[EmailTemplateSettings] Save failed:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to save template' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (!selectedTemplate) return;
        const defaultTemplate = DEFAULT_TEMPLATES.find((t) => t.id === selectedTemplate.id);
        if (defaultTemplate) {
            setEditedTemplate({ ...defaultTemplate });
        }
    };

    const renderPreview = () => {
        if (!editedTemplate) return null;

        const previewData = {
            organization_name: orgContext?.orgName || 'Your Organization',
            recipient_name: 'John Doe',
            role: 'Recruiter',
            new_role: 'Admin',
            sender_name: 'Jane Smith',
            invitation_link: 'https://example.com/invite/abc123',
            dashboard_link: 'https://example.com/dashboard',
            team_link: 'https://example.com/team',
            help_link: 'https://example.com/help',
        };

        let previewSubject = editedTemplate.subject;
        let previewBody = editedTemplate.body;

        Object.entries(previewData).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            previewSubject = previewSubject.replace(regex, value);
            previewBody = previewBody.replace(regex, value);
        });

        return (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Subject</p>
                    <p className="text-sm font-medium text-gray-900">{previewSubject}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase font-medium mb-2">Body</p>
                    <div className="bg-white rounded border border-gray-200 p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                            {previewBody}
                        </pre>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Customize email templates for recruitment communications
                </p>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                        <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-sm">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow border border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900">Templates</h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleSelectTemplate(template)}
                                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedTemplate?.id === template.id ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <EnvelopeIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {template.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Available Variables */}
                    <div className="mt-4 bg-white rounded-lg shadow border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                            Available Variables
                        </h4>
                        <div className="space-y-2 text-xs">
                            <div>
                                <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                                    {'{{organization_name}}'}
                                </code>
                            </div>
                            <div>
                                <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                                    {'{{recipient_name}}'}
                                </code>
                            </div>
                            <div>
                                <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                                    {'{{role}}'}
                                </code>
                            </div>
                            <div>
                                <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                                    {'{{sender_name}}'}
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="lg:col-span-2">
                    {editedTemplate ? (
                        <div className="bg-white rounded-lg shadow border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {editedTemplate.name}
                                    </h3>
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {editedTemplate.description}
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                {showPreview ? (
                                    renderPreview()
                                ) : (
                                    <>
                                        {/* Subject */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Subject Line
                                            </label>
                                            <input
                                                type="text"
                                                value={editedTemplate.subject}
                                                onChange={(e) =>
                                                    setEditedTemplate({
                                                        ...editedTemplate,
                                                        subject: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter email subject"
                                            />
                                        </div>

                                        {/* Body */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Body
                                            </label>
                                            <textarea
                                                value={editedTemplate.body}
                                                onChange={(e) =>
                                                    setEditedTemplate({
                                                        ...editedTemplate,
                                                        body: e.target.value,
                                                    })
                                                }
                                                rows={12}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                                placeholder="Enter email body"
                                            />
                                            <p className="mt-2 text-xs text-gray-500">
                                                Use variables like {'{{organization_name}}'} to personalize emails
                                            </p>
                                        </div>
                                    </>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        Reset to Default
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTemplate(null);
                                                setEditedTemplate(null);
                                                setMessage(null);
                                            }}
                                            disabled={saving}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                'Save Template'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
                            <EnvelopeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Select a template to edit</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Choose a template from the list to customize it
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
