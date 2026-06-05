/**
 * Company Contacts Tab
 * Contact information form
 */

import { useState, useEffect } from 'react';
import {
    PhoneIcon,
    EnvelopeIcon,
    UserCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
    useCompanyContacts,
    useUpdateCompanyContacts,
    type CompanyContacts,
} from '@/entities/recruitment';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('CompanyContactsTab');

export const CompanyContactsTab = () => {
    const { data: contactsData, isLoading } = useCompanyContacts();
    const updateContacts = useUpdateCompanyContacts();

    const [form, setForm] = useState<Partial<CompanyContacts>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (contactsData?.contacts) {
            setForm(contactsData.contacts);
        }
    }, [contactsData]);

    const handleChange = (field: keyof CompanyContacts, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
        setShowSuccess(false);
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone: string): boolean => {
        // Simple validation - at least 10 digits
        const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
        return phoneRegex.test(phone);
    };

    const handleSave = async () => {
        // Validate emails
        if (form.official_email && !validateEmail(form.official_email)) {
            alert('Please enter a valid official email address');
            return;
        }

        if (form.support_email && !validateEmail(form.support_email)) {
            alert('Please enter a valid support email address');
            return;
        }

        // Validate phones
        if (form.company_phone && !validatePhone(form.company_phone)) {
            alert('Please enter a valid company phone number (minimum 10 digits)');
            return;
        }

        if (form.hr_contact_phone && !validatePhone(form.hr_contact_phone)) {
            alert('Please enter a valid HR contact phone number (minimum 10 digits)');
            return;
        }

        try {
            await updateContacts.mutateAsync(form);
            setHasChanges(false);
            setShowSuccess(true);
            logger.info('Contacts updated successfully');

            // Hide success message after 3 seconds
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error: any) {
            logger.error('Contacts update failed', { error: error.message });
            alert('Failed to update contacts: ' + error.message);
        }
    };

    const handleCancel = () => {
        if (contactsData?.contacts) {
            setForm(contactsData.contacts);
            setHasChanges(false);
            setShowSuccess(false);
        }
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
                            Contact information updated successfully!
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                            Your contact details have been saved and will be visible to candidates.
                        </p>
                    </div>
                </div>
            )}

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> These contact details will be displayed to candidates
                    applying for jobs at your organization. Make sure all information is accurate
                    and up-to-date.
                </p>
            </div>

            {/* Official Company Contact */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <BuildingIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Official Company Contact
                    </h3>
                </div>

                {/* Official Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Official Company Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            value={form.official_email || ''}
                            onChange={(e) => handleChange('official_email', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="info@company.com"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Primary email for company correspondence
                    </p>
                </div>

                {/* Company Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <PhoneIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="tel"
                            value={form.company_phone || ''}
                            onChange={(e) => handleChange('company_phone', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+91 1234567890"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Main contact number for your organization
                    </p>
                </div>
            </div>

            {/* HR Department Contact */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <UserCircleIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">HR Department Contact</h3>
                </div>

                {/* HR Contact Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        HR Contact Phone Number
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <PhoneIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="tel"
                            value={form.hr_contact_phone || ''}
                            onChange={(e) => handleChange('hr_contact_phone', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+91 9876543210"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Direct line for HR-related inquiries
                    </p>
                </div>

                {/* Support Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        HR/Support Email
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            value={form.support_email || ''}
                            onChange={(e) => handleChange('support_email', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="hr@company.com or support@company.com"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Email for candidate support and HR queries
                    </p>
                </div>
            </div>

            {/* Contact Guidelines */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Contact Guidelines</h4>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                    <li>
                        <strong>Official Email:</strong> Used for formal communications, offer
                        letters, and candidate correspondence
                    </li>
                    <li>
                        <strong>Company Phone:</strong> Main contact number displayed on job
                        postings
                    </li>
                    <li>
                        <strong>HR Contact:</strong> Direct line for candidates to reach your
                        recruitment team
                    </li>
                    <li>
                        <strong>Support Email:</strong> For candidate inquiries about applications,
                        interviews, and general support
                    </li>
                </ul>
            </div>

            {/* Action Buttons */}
            {hasChanges && (
                <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 rounded-b-lg">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={updateContacts.isPending}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateContacts.isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {updateContacts.isPending ? (
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

// Helper icon component
const BuildingIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
        />
    </svg>
);
