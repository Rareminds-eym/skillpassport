/**
 * Organization Settings Component
 * Allows admins to manage organization profile and recruitment preferences
 */

import { useState, useEffect } from 'react';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';
import { supabase } from '@/shared/api/supabaseClient';
import { EmailTemplateSettings } from './EmailTemplateSettings';
import {
    BuildingOfficeIcon,
    PhotoIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowUpTrayIcon,
    EnvelopeIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';

type SettingsTab = 'profile' | 'preferences' | 'email-templates';

interface OrgSettingsForm {
    name: string;
    logo_url: string;
    recruitment_enabled: boolean;
    max_recruiters: number;
}

export const OrgSettings = () => {
    const { orgContext, isLoading: orgLoading } = useOrgContext();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [form, setForm] = useState<OrgSettingsForm>({
        name: '',
        logo_url: '',
        recruitment_enabled: true,
        max_recruiters: 10,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const tabs = [
        { id: 'profile' as SettingsTab, label: 'Organization Profile', icon: BuildingOfficeIcon },
        { id: 'preferences' as SettingsTab, label: 'Recruitment Preferences', icon: Cog6ToothIcon },
        { id: 'email-templates' as SettingsTab, label: 'Email Templates', icon: EnvelopeIcon },
    ];

    // Load organization data
    useEffect(() => {
        if (orgContext) {
            loadOrgSettings();
        }
    }, [orgContext]);

    const loadOrgSettings = async () => {
        if (!orgContext?.orgId) return;

        setLoading(true);
        try {
            // Get organization data from local table
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('name, logo_url')
                .eq('id', orgContext.orgId)
                .single();

            if (orgError) throw orgError;

            // Get recruitment settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('organization_recruitment_settings')
                .select('recruitment_enabled, max_recruiters')
                .eq('organization_id', orgContext.orgId)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') {
                // PGRST116 = no rows returned, which is okay
                throw settingsError;
            }

            setForm({
                name: orgData?.name || orgContext.orgName,
                logo_url: orgData?.logo_url || '',
                recruitment_enabled: settingsData?.recruitment_enabled ?? true,
                max_recruiters: settingsData?.max_recruiters ?? 10,
            });
        } catch (error) {
            console.error('[OrgSettings] Failed to load settings:', error);
            setMessage({ type: 'error', text: 'Failed to load organization settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !orgContext?.orgId) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please upload an image file' });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
            return;
        }

        setUploadingLogo(true);
        setMessage(null);

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${orgContext.orgId}-${Date.now()}.${fileExt}`;
            const filePath = `organization-logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            setForm((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
            setMessage({ type: 'success', text: 'Logo uploaded successfully' });
        } catch (error: any) {
            console.error('[OrgSettings] Logo upload failed:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to upload logo' });
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSave = async () => {
        if (!orgContext?.orgId) return;

        setSaving(true);
        setMessage(null);

        try {
            // Update organization name and logo
            const { error: orgError } = await supabase
                .from('organizations')
                .update({
                    name: form.name,
                    logo_url: form.logo_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orgContext.orgId);

            if (orgError) throw orgError;

            // Update recruitment settings
            const { error: settingsError } = await supabase
                .from('organization_recruitment_settings')
                .upsert({
                    organization_id: orgContext.orgId,
                    recruitment_enabled: form.recruitment_enabled,
                    max_recruiters: form.max_recruiters,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'organization_id',
                });

            if (settingsError) throw settingsError;

            setMessage({ type: 'success', text: 'Settings saved successfully!' });

            // Reload org context to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error: any) {
            console.error('[OrgSettings] Save failed:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        loadOrgSettings();
        setMessage(null);
    };

    if (orgLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Manage your organization profile and recruitment preferences
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Message */}
            {message && activeTab !== 'email-templates' && (
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

            {/* Tab Content */}
            {activeTab === 'email-templates' ? (
                <EmailTemplateSettings />
            ) : (
                <div className="max-w-4xl space-y-6">
                    {/* Organization Profile */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-lg shadow p-6 space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b">
                                <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-900">Organization Profile</h3>
                            </div>

                            {/* Organization Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter organization name"
                                />
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Organization Logo
                                </label>
                                <div className="flex items-start gap-4">
                                    {/* Logo Preview */}
                                    <div className="flex-shrink-0">
                                        {form.logo_url ? (
                                            <img
                                                src={form.logo_url}
                                                alt="Organization logo"
                                                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                                                <PhotoIcon className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Button */}
                                    <div className="flex-1">
                                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                            <ArrowUpTrayIcon className="w-5 h-5 text-gray-600" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                disabled={uploadingLogo}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="mt-2 text-xs text-gray-500">
                                            PNG, JPG or GIF (max 2MB). Recommended size: 200x200px
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recruitment Preferences */}
                    {activeTab === 'preferences' && (
                        <div className="bg-white rounded-lg shadow p-6 space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b">
                                <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-900">Recruitment Preferences</h3>
                            </div>

                            {/* Recruitment Enabled */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Enable Recruitment Features
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Allow your organization to post jobs and manage candidates
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, recruitment_enabled: !form.recruitment_enabled })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.recruitment_enabled ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.recruitment_enabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Max Recruiters */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Recruiters
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={form.max_recruiters}
                                    onChange={(e) => setForm({ ...form, max_recruiters: parseInt(e.target.value) || 10 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Maximum number of recruiters allowed in your organization
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {activeTab !== 'email-templates' && (
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={saving}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || uploadingLogo}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
