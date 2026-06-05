/**
 * Billing Tab (Admin-only)
 * Billing contact, invoice address, and payment information
 */

import { useState, useEffect } from 'react';
import {
    CreditCardIcon,
    BuildingOfficeIcon,
    UserCircleIcon,
    CheckCircleIcon,
    ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import {
    useBillingInformation,
    useUpdateBillingInformation,
    type BillingInformation,
} from '@/entities/recruitment';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('BillingTab');

const PAYMENT_TERMS = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'net_15', label: 'Net 15 days' },
    { value: 'net_30', label: 'Net 30 days' },
    { value: 'net_60', label: 'Net 60 days' },
];

export const BillingTab = () => {
    const { data: billingData, isLoading } = useBillingInformation();
    const updateBilling = useUpdateBillingInformation();

    const [form, setForm] = useState<Partial<BillingInformation>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (billingData?.billing) {
            setForm(billingData.billing);
        }
    }, [billingData]);

    const handleChange = (field: keyof BillingInformation, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
        setShowSuccess(false);
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSave = async () => {
        // Validate email
        if (form.billing_contact_email && !validateEmail(form.billing_contact_email)) {
            alert('Please enter a valid billing contact email address');
            return;
        }

        try {
            await updateBilling.mutateAsync(form);
            setHasChanges(false);
            setShowSuccess(true);
            logger.info('Billing information updated successfully');

            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error: any) {
            logger.error('Billing update failed', { error: error.message });
            alert('Failed to update billing information: ' + error.message);
        }
    };

    const handleCancel = () => {
        if (billingData?.billing) {
            setForm(billingData.billing);
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
                            Billing information updated successfully!
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                            Your billing details have been saved.
                        </p>
                    </div>
                </div>
            )}

            {/* Admin Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <ShieldExclamationIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-amber-900">Admin-Only Section</p>
                    <p className="text-xs text-amber-800 mt-1">
                        This information is only accessible to organization administrators and is
                        used for billing and invoicing purposes.
                    </p>
                </div>
            </div>

            {/* Billing Contact */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <UserCircleIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Billing Contact</h3>
                </div>

                {/* Contact Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Contact Name
                    </label>
                    <input
                        type="text"
                        value={form.billing_contact_name || ''}
                        onChange={(e) => handleChange('billing_contact_name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                    />
                </div>

                {/* Contact Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Contact Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={form.billing_contact_email || ''}
                        onChange={(e) => handleChange('billing_contact_email', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="billing@company.com"
                    />
                </div>

                {/* Contact Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Contact Phone
                    </label>
                    <input
                        type="tel"
                        value={form.billing_contact_phone || ''}
                        onChange={(e) => handleChange('billing_contact_phone', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+91 1234567890"
                    />
                </div>
            </div>

            {/* Invoice Address */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Invoice Address</h3>
                </div>

                {/* Company Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Company Name
                    </label>
                    <input
                        type="text"
                        value={form.invoice_company_name || ''}
                        onChange={(e) => handleChange('invoice_company_name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Company Legal Name"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Legal company name as it should appear on invoices
                    </p>
                </div>

                {/* Address Line 1 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 1
                    </label>
                    <input
                        type="text"
                        value={form.invoice_address_line1 || ''}
                        onChange={(e) => handleChange('invoice_address_line1', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Business Street"
                    />
                </div>

                {/* Address Line 2 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 2 (Optional)
                    </label>
                    <input
                        type="text"
                        value={form.invoice_address_line2 || ''}
                        onChange={(e) => handleChange('invoice_address_line2', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Suite 100"
                    />
                </div>

                {/* City, State, Postal Code */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                        </label>
                        <input
                            type="text"
                            value={form.invoice_city || ''}
                            onChange={(e) => handleChange('invoice_city', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Bangalore"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State/Province
                        </label>
                        <input
                            type="text"
                            value={form.invoice_state || ''}
                            onChange={(e) => handleChange('invoice_state', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Karnataka"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Postal Code
                        </label>
                        <input
                            type="text"
                            value={form.invoice_postal_code || ''}
                            onChange={(e) => handleChange('invoice_postal_code', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="560001"
                        />
                    </div>
                </div>

                {/* Country */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                    </label>
                    <input
                        type="text"
                        value={form.invoice_country || ''}
                        onChange={(e) => handleChange('invoice_country', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="India"
                    />
                </div>

                {/* GST Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST Number (if applicable)
                    </label>
                    <input
                        type="text"
                        value={form.gst_number || ''}
                        onChange={(e) => handleChange('gst_number', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="29AAACT1234A1Z5"
                    />
                </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <CreditCardIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                    </label>
                    <input
                        type="text"
                        value={form.payment_method || ''}
                        onChange={(e) => handleChange('payment_method', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Bank Transfer, Credit Card, etc."
                    />
                </div>

                {/* Payment Terms */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms
                    </label>
                    <select
                        value={form.payment_terms || 'net_30'}
                        onChange={(e) => handleChange('payment_terms', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {PAYMENT_TERMS.map((term) => (
                            <option key={term.value} value={term.value}>
                                {term.label}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        Default payment terms for invoices
                    </p>
                </div>

                {/* Billing Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Notes (Internal)
                    </label>
                    <textarea
                        value={form.billing_notes || ''}
                        onChange={(e) => handleChange('billing_notes', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Internal notes about billing preferences, special arrangements, etc."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        These notes are for internal use only and will not appear on invoices
                    </p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    About Billing Information
                </h4>
                <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                    <li>
                        This information is used to generate invoices for your subscription and
                        services
                    </li>
                    <li>
                        Only organization administrators can view and edit billing information
                    </li>
                    <li>
                        Payment terms determine when payment is due after invoice generation
                    </li>
                    <li>
                        Ensure your billing contact email is monitored for invoice notifications
                    </li>
                    <li>GST number is required if your organization is registered for GST</li>
                </ul>
            </div>

            {/* Action Buttons */}
            {hasChanges && (
                <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 rounded-b-lg">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={updateBilling.isPending}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateBilling.isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {updateBilling.isPending ? (
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
