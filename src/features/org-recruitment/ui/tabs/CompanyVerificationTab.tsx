/**
 * Company Verification Tab
 * Verification documents and status
 */

import { useState, useEffect } from 'react';
import {
    ShieldCheckIcon,
    DocumentTextIcon,
    ArrowUpTrayIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';
import {
    useCompanyVerification,
    useUpdateCompanyVerification,
    useSubmitVerification,
    useVerifyDomain,
    useUploadDocument,
    useDeleteDocument,
    type CompanyVerification,
} from '@/entities/recruitment';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('CompanyVerificationTab');

const VerificationStatusBadge = ({ status }: { status: string }) => {
    const config = {
        pending: { icon: ClockIcon, color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
        in_review: { icon: ClockIcon, color: 'text-blue-700 bg-blue-50 border-blue-200' },
        verified: { icon: CheckCircleIcon, color: 'text-green-700 bg-green-50 border-green-200' },
        rejected: { icon: XCircleIcon, color: 'text-red-700 bg-red-50 border-red-200' },
    };

    const { icon: Icon, color } = config[status as keyof typeof config] || config.pending;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${color}`}>
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
        </div>
    );
};

export const CompanyVerificationTab = () => {
    const { data: verificationData, isLoading } = useCompanyVerification();
    const updateVerification = useUpdateCompanyVerification();
    const submitVerification = useSubmitVerification();
    const verifyDomain = useVerifyDomain();
    const uploadDocument = useUploadDocument();
    const deleteDocument = useDeleteDocument();

    const [form, setForm] = useState<Partial<CompanyVerification>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
    const [domainInput, setDomainInput] = useState('');

    useEffect(() => {
        if (verificationData?.verification) {
            setForm(verificationData.verification);
        }
    }, [verificationData]);

    const handleChange = (field: keyof CompanyVerification, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleDocumentUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        documentType: string,
        field: keyof CompanyVerification
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setUploadingDoc(documentType);

        try {
            const result = await uploadDocument.mutateAsync({
                file,
                documentType,
                bucket: 'company-documents',
            });

            handleChange(field, result.file_url);
            logger.info('Document uploaded', { documentType });
        } catch (error: any) {
            logger.error('Document upload failed', { error: error.message });
            alert('Failed to upload document: ' + error.message);
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleDocumentDelete = async (
        filePath: string,
        field: keyof CompanyVerification
    ) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await deleteDocument.mutateAsync({ filePath, bucket: 'company-documents' });
            handleChange(field, undefined);
            logger.info('Document deleted');
        } catch (error: any) {
            logger.error('Document delete failed', { error: error.message });
            alert('Failed to delete document: ' + error.message);
        }
    };

    const handleSave = async () => {
        try {
            await updateVerification.mutateAsync(form);
            setHasChanges(false);
            logger.info('Verification updated successfully');
        } catch (error: any) {
            logger.error('Verification update failed', { error: error.message });
            alert('Failed to update verification: ' + error.message);
        }
    };

    const handleSubmit = async () => {
        if (!confirm('Submit verification for review? You cannot modify details after submission.')) {
            return;
        }

        try {
            await submitVerification.mutateAsync();
            logger.info('Verification submitted');
            alert('Verification submitted successfully! Our team will review within 2-3 business days.');
        } catch (error: any) {
            logger.error('Verification submission failed', { error: error.message });
            alert('Failed to submit verification: ' + error.message);
        }
    };

    const handleVerifyDomain = async () => {
        if (!domainInput.trim()) {
            alert('Please enter a domain');
            return;
        }

        try {
            const result = await verifyDomain.mutateAsync(domainInput.trim());
            logger.info('Domain verification initiated', { domain: domainInput });

            if (result.instructions) {
                alert(
                    `Domain verification initiated!\n\n` +
                    `${result.instructions.step1}\n` +
                    `Record Name: ${result.instructions.record_name}\n` +
                    `Record Value: ${result.instructions.record_value}\n\n` +
                    `${result.instructions.step2}\n` +
                    `${result.instructions.step3}`
                );
            }
        } catch (error: any) {
            logger.error('Domain verification failed', { error: error.message });
            alert('Failed to verify domain: ' + error.message);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const verification = verificationData?.verification;
    const canEdit = verification?.verification_status !== 'in_review' &&
        verification?.verification_status !== 'verified';

    return (
        <div className="space-y-6">
            {/* Verification Status */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Verification Status</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {verification?.verified_at
                                ? `Verified on ${new Date(verification.verified_at).toLocaleDateString()}`
                                : 'Complete verification to build trust with candidates'}
                        </p>
                    </div>
                    <VerificationStatusBadge
                        status={verification?.verification_status || 'pending'}
                    />
                </div>

                {verification?.verification_notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">{verification.verification_notes}</p>
                    </div>
                )}
            </div>

            {/* Company Registration Details */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
                </div>

                {/* Registration Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Registration Number (CIN/Business Reg No.) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.registration_number || ''}
                        onChange={(e) => handleChange('registration_number', e.target.value)}
                        disabled={!canEdit}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="e.g., U12345KA2015PTC123456"
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
                        disabled={!canEdit}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="e.g., 29AAACT1234A1Z5"
                    />
                </div>

                {/* Tax ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Identification Number
                    </label>
                    <input
                        type="text"
                        value={form.tax_identification_number || ''}
                        onChange={(e) => handleChange('tax_identification_number', e.target.value)}
                        disabled={!canEdit}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="e.g., AAACT1234A"
                    />
                </div>

                {/* Incorporation Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Incorporation Date
                    </label>
                    <input
                        type="date"
                        value={form.incorporation_date || ''}
                        onChange={(e) => handleChange('incorporation_date', e.target.value)}
                        disabled={!canEdit}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                </div>
            </div>

            {/* Document Uploads */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <ShieldCheckIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Verification Documents</h3>
                </div>

                {/* Registration Certificate */}
                <DocumentUploadField
                    label="Registration Certificate"
                    required
                    documentUrl={form.registration_certificate_url}
                    onUpload={(e) => handleDocumentUpload(e, 'registration_certificate', 'registration_certificate_url')}
                    onDelete={() => handleDocumentDelete(form.registration_certificate_url!, 'registration_certificate_url')}
                    uploading={uploadingDoc === 'registration_certificate'}
                    canEdit={canEdit}
                />

                {/* GST Certificate */}
                <DocumentUploadField
                    label="GST Certificate"
                    documentUrl={form.gst_certificate_url}
                    onUpload={(e) => handleDocumentUpload(e, 'gst_certificate', 'gst_certificate_url')}
                    onDelete={() => handleDocumentDelete(form.gst_certificate_url!, 'gst_certificate_url')}
                    uploading={uploadingDoc === 'gst_certificate'}
                    canEdit={canEdit}
                />

                {/* Business License */}
                <DocumentUploadField
                    label="Business License"
                    documentUrl={form.business_license_url}
                    onUpload={(e) => handleDocumentUpload(e, 'business_license', 'business_license_url')}
                    onDelete={() => handleDocumentDelete(form.business_license_url!, 'business_license_url')}
                    uploading={uploadingDoc === 'business_license'}
                    canEdit={canEdit}
                />
            </div>

            {/* Domain Verification */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <GlobeAltIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Domain Verification</h3>
                </div>

                <div className="flex items-center gap-2">
                    <VerificationStatusBadge
                        status={verification?.domain_verification_status || 'pending'}
                    />
                    {verification?.verified_domain && (
                        <span className="text-sm text-gray-600">
                            Domain: {verification.verified_domain}
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="yourdomain.com"
                    />
                    <button
                        onClick={handleVerifyDomain}
                        disabled={verifyDomain.isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {verifyDomain.isPending ? 'Verifying...' : 'Verify Domain'}
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
                {hasChanges && canEdit && (
                    <button
                        onClick={handleSave}
                        disabled={updateVerification.isPending}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        {updateVerification.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                )}

                {canEdit && form.registration_number && form.registration_certificate_url && (
                    <button
                        onClick={handleSubmit}
                        disabled={submitVerification.isPending}
                        className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <ShieldCheckIcon className="w-5 h-5" />
                        {submitVerification.isPending ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                )}
            </div>
        </div>
    );
};

// Helper Component
const DocumentUploadField = ({
    label,
    required,
    documentUrl,
    onUpload,
    onDelete,
    uploading,
    canEdit,
}: {
    label: string;
    required?: boolean;
    documentUrl?: string;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
    uploading: boolean;
    canEdit: boolean;
}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>

        {documentUrl ? (
            <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-green-600" />
                    <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        View Document
                    </a>
                </div>
                {canEdit && (
                    <button
                        onClick={onDelete}
                        className="text-sm text-red-600 hover:text-red-700"
                    >
                        Remove
                    </button>
                )}
            </div>
        ) : (
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <ArrowUpTrayIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                    {uploading ? 'Uploading...' : 'Upload Document'}
                </span>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={onUpload}
                    disabled={uploading || !canEdit}
                    className="hidden"
                />
            </label>
        )}
        <p className="mt-1 text-xs text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
    </div>
);
