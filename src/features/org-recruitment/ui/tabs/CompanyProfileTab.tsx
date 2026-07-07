/**
 * Company Profile Tab
 * Basic company information form
 */

import { useState, useEffect } from 'react';
import {
    BuildingOfficeIcon,
    PhotoIcon,
    ArrowUpTrayIcon,
    GlobeAltIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';
import {
    useOrganizationProfile,
    useUpdateOrganizationProfile,
    useUploadDocument,
    type OrganizationProfile,
} from '@/entities/recruitment';
import { getLogger } from '@/shared/config/logging';
import { ssoClient } from '@/shared/api/ssoClient';

const logger = getLogger('CompanyProfileTab');

const INDUSTRIES = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Consulting',
    'Energy',
    'Telecommunications',
    'Transportation',
    'Hospitality',
    'Real Estate',
    'Legal Services',
    'Accounting',
    'Insurance',
    'Other',
];

const COMPANY_SIZES = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+',
];

export const CompanyProfileTab = () => {
    const { data: profileData, isLoading } = useOrganizationProfile();
    const updateProfile = useUpdateOrganizationProfile();
    const uploadDocument = useUploadDocument();

    const [form, setForm] = useState<Partial<OrganizationProfile>>({});
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load profile data into form
    useEffect(() => {
        if (profileData?.profile) {
            setForm(profileData.profile);
        }
    }, [profileData]);

    const handleChange = (field: keyof OrganizationProfile, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setUploadingLogo(true);

        try {
            // Use dedicated logo upload endpoint to R2
            const orgId = profileData?.profile?.id;
            if (!orgId) {
                throw new Error('Organization ID not found');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('org_id', orgId);

            // Use ssoClient.fetch() for authenticated requests with automatic token refresh
            const response = await ssoClient.fetch('/api/recruitment/organization/upload-logo', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();

            handleChange('logo_url', result.file_url);
            logger.info('Logo uploaded successfully to R2', { 
                path: result.file_path,
                storage: result.storage_type 
            });
        } catch (error: any) {
            logger.error('Logo upload failed', { error: error.message });
            alert('Failed to upload logo: ' + error.message);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSave = async () => {
        try {
            await updateProfile.mutateAsync(form);
            setHasChanges(false);
            logger.info('Profile updated successfully');
        } catch (error: any) {
            logger.error('Profile update failed', { error: error.message });
            alert('Failed to update profile: ' + error.message);
        }
    };

    const handleCancel = () => {
        if (profileData?.profile) {
            setForm(profileData.profile);
            setHasChanges(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const completionPercentage = profileData?.completion_percentage || 0;

    return (
        <div className="space-y-6">
            {/* Profile Completion */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                        Profile Completion
                    </span>
                    <span className="text-sm font-semibold text-blue-900">
                        {completionPercentage}%
                    </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>

                {/* Logo Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Logo
                    </label>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            {form.logo_url ? (
                                <img
                                    src={form.logo_url}
                                    alt="Company logo"
                                    className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                                </div>
                            )}
                        </div>
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
                                PNG, JPG or GIF (max 2MB). Recommended: 200x200px
                            </p>
                        </div>
                    </div>
                </div>

                {/* Legal Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Legal Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.legal_name || ''}
                        onChange={(e) => handleChange('legal_name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., TechCorp Private Limited"
                    />
                </div>

                {/* Display Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display/Brand Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.display_name || ''}
                        onChange={(e) => handleChange('display_name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., TechCorp"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={form.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description of your company..."
                    />
                </div>

                {/* Industry & Company Size */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Industry <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.industry || ''}
                            onChange={(e) => handleChange('industry', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select industry</option>
                            {INDUSTRIES.map((industry) => (
                                <option key={industry} value={industry}>
                                    {industry}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Size <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.company_size || ''}
                            onChange={(e) => handleChange('company_size', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select size</option>
                            {COMPANY_SIZES.map((size) => (
                                <option key={size} value={size}>
                                    {size} employees
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Founded Year & Website */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Founded Year
                        </label>
                        <input
                            type="number"
                            min="1800"
                            max={new Date().getFullYear()}
                            value={form.founded_year || ''}
                            onChange={(e) =>
                                handleChange('founded_year', parseInt(e.target.value) || undefined)
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 2015"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website URL <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                value={form.website_url || ''}
                                onChange={(e) => handleChange('website_url', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Headquarters Address */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <MapPinIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Headquarters Location</h3>
                </div>

                {/* Street Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.headquarters_address || ''}
                        onChange={(e) => handleChange('headquarters_address', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Business Street"
                    />
                </div>

                {/* City, State, Country */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            City <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.headquarters_city || ''}
                            onChange={(e) => handleChange('headquarters_city', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Bangalore"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.headquarters_state || ''}
                            onChange={(e) => handleChange('headquarters_state', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Karnataka"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.headquarters_country || ''}
                            onChange={(e) => handleChange('headquarters_country', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="India"
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {hasChanges && (
                <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 rounded-b-lg">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={updateProfile.isPending}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateProfile.isPending || uploadingLogo}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {updateProfile.isPending ? (
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
    );
};
