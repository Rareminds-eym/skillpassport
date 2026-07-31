/**
 * Organization Service
 * Manages company profile, verification, contacts, configuration, templates, and billing
 */

import { apiGet, apiPut, apiPost, apiDelete } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organizationService');

// ============================================================
// TYPES
// ============================================================

export interface OrganizationProfile {
    id: string;
    name: string;
    legal_name?: string;
    display_name?: string;
    description?: string;
    industry?: string;
    company_size?: string;
    founded_year?: number;
    website_url?: string;
    logo_url?: string;
    headquarters_address?: string;
    headquarters_country?: string;
    headquarters_state?: string;
    headquarters_city?: string;
    created_at: string;
    updated_at: string;
}

export interface CompanyVerification {
    organization_id: string;
    cin_business_reg_no?: string;
    gst_number?: string;
    tax_identification_number?: string;
    incorporation_date?: string;
    registration_certificate_url?: string;
    gst_certificate_url?: string;
    business_license_url?: string;
    verification_status: 'pending' | 'in_review' | 'verified' | 'rejected';
    verification_notes?: string;
    verified_at?: string;
    verified_domain?: string;
    domain_verification_status: 'pending' | 'verified' | 'failed';
    domain_verification_token?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CompanyContacts {
    organization_id: string;
    official_email?: string;
    company_phone?: string;
    hr_contact_phone?: string;
    support_email?: string;
    created_at?: string;
    updated_at?: string;
}

export interface RecruitmentConfiguration {
    organization_id: string;
    default_hiring_workflow?: Array<{ stage: string; name: string; order: number }>;
    interview_stages?: Array<{ id: string; name: string; duration: number; order?: number }>;
    offer_letter_template_id?: string;
    default_email_template_id?: string;
    career_page_url?: string;
    career_page_enabled: boolean;
    job_posting_preferences?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export interface OfferLetterTemplate {
    id: string;
    organization_id: string;
    template_name: string;
    template_content: string;
    is_default: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface BillingInformation {
    organization_id: string;
    billing_contact_name?: string;
    billing_contact_email?: string;
    billing_contact_phone?: string;
    invoice_company_name?: string;
    invoice_address_line1?: string;
    invoice_address_line2?: string;
    invoice_city?: string;
    invoice_state?: string;
    invoice_country?: string;
    invoice_postal_code?: string;
    gst_number?: string;
    payment_method?: string;
    payment_terms?: 'net_15' | 'net_30' | 'net_60' | 'immediate';
    billing_notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface OrganizationProfileResponse {
    profile: OrganizationProfile;
    verification_status: string;
    domain_verification_status: string;
    completion_percentage: number;
}

// ============================================================
// PROFILE API
// ============================================================

/**
 * Get organization profile with completion percentage
 */
export const getOrganizationProfile = async (
    orgId: string
): Promise<OrganizationProfileResponse> => {
    try {
        logger.info('Fetching organization profile', { orgId });

        const response = await apiGet<OrganizationProfileResponse>(
            `/recruitment/organization/profile?org_id=${orgId}`
        );

        logger.info('Fetched organization profile', {
            orgId,
            completion: response.completion_percentage,
        });

        return response;
    } catch (error: any) {
        logger.error('Failed to fetch organization profile', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Update organization profile
 */
export const updateOrganizationProfile = async (
    orgId: string,
    data: Partial<OrganizationProfile>
): Promise<{ success: boolean; message: string; profile: OrganizationProfile }> => {
    try {
        logger.info('Updating organization profile', { orgId, fields: Object.keys(data) });

        const response = await apiPut<{
            success: boolean;
            message: string;
            profile: OrganizationProfile;
        }>(`/recruitment/organization/profile`, {
            org_id: orgId,
            ...data,
        });

        logger.info('Organization profile updated', { orgId });

        return response;
    } catch (error: any) {
        logger.error('Failed to update organization profile', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

// ============================================================
// VERIFICATION API
// ============================================================

/**
 * Get company verification details
 */
export const getCompanyVerification = async (
    orgId: string
): Promise<{ verification: CompanyVerification; exists: boolean }> => {
    try {
        logger.info('Fetching company verification', { orgId });

        const response = await apiGet<{
            verification: CompanyVerification;
            exists: boolean;
        }>(`/recruitment/organization/verification?org_id=${orgId}`);

        return response;
    } catch (error: any) {
        logger.error('Failed to fetch company verification', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Update company verification details
 */
export const updateCompanyVerification = async (
    orgId: string,
    data: Partial<CompanyVerification>
): Promise<{ success: boolean; message: string; verification: CompanyVerification }> => {
    try {
        logger.info('Updating company verification', { orgId, fields: Object.keys(data) });

        const response = await apiPut<{
            success: boolean;
            message: string;
            verification: CompanyVerification;
        }>(`/recruitment/organization/verification`, {
            org_id: orgId,
            ...data,
        });

        logger.info('Company verification updated', { orgId });

        return response;
    } catch (error: any) {
        logger.error('Failed to update company verification', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Submit verification for review
 */
export const submitVerificationForReview = async (
    orgId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        logger.info('Submitting verification for review', { orgId });

        const response = await apiPost<{ success: boolean; message: string }>(
            `/recruitment/organization/verification/submit`,
            { org_id: orgId }
        );

        logger.info('Verification submitted', { orgId });

        return response;
    } catch (error: any) {
        logger.error('Failed to submit verification', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Verify domain ownership
 */
export const verifyDomain = async (
    orgId: string,
    domain: string
): Promise<{
    success: boolean;
    message: string;
    verification_token?: string;
    instructions?: Record<string, any>;
}> => {
    try {
        logger.info('Verifying domain', { orgId, domain });

        const response = await apiPost<{
            success: boolean;
            message: string;
            verification_token?: string;
            instructions?: Record<string, any>;
        }>(`/recruitment/organization/verification/verify-domain`, {
            org_id: orgId,
            domain,
        });

        logger.info('Domain verification initiated', { orgId, domain });

        return response;
    } catch (error: any) {
        logger.error('Failed to verify domain', {
            error: error.message,
            orgId,
            domain,
        });
        throw error;
    }
};

// ============================================================
// CONTACTS API
// ============================================================

/**
 * Get company contacts
 */
export const getCompanyContacts = async (
    orgId: string
): Promise<{ contacts: CompanyContacts; exists: boolean }> => {
    try {
        logger.info('Fetching company contacts', { orgId });

        const response = await apiGet<{ contacts: CompanyContacts; exists: boolean }>(
            `/recruitment/organization/contacts?org_id=${orgId}`
        );

        return response;
    } catch (error: any) {
        logger.error('Failed to fetch company contacts', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Update company contacts
 */
export const updateCompanyContacts = async (
    orgId: string,
    data: Partial<CompanyContacts>
): Promise<{ success: boolean; message: string; contacts: CompanyContacts }> => {
    try {
        logger.info('Updating company contacts', { orgId, fields: Object.keys(data) });

        const response = await apiPut<{
            success: boolean;
            message: string;
            contacts: CompanyContacts;
        }>(`/recruitment/organization/contacts`, {
            org_id: orgId,
            ...data,
        });

        logger.info('Company contacts updated', { orgId });

        return response;
    } catch (error: any) {
        logger.error('Failed to update company contacts', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

// ============================================================
// CONFIGURATION API
// ============================================================

/**
 * Get recruitment configuration
 */
export const getRecruitmentConfiguration = async (
    orgId: string
): Promise<{ config: RecruitmentConfiguration; exists: boolean; is_default: boolean }> => {
    try {
        logger.info('Fetching recruitment configuration', { orgId });

        const response = await apiGet<{
            config: RecruitmentConfiguration;
            exists: boolean;
            is_default: boolean;
        }>(`/recruitment/organization/config?org_id=${orgId}`);

        return response;
    } catch (error: any) {
        logger.error('Failed to fetch recruitment configuration', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Update recruitment configuration
 */
export const updateRecruitmentConfiguration = async (
    orgId: string,
    data: Partial<RecruitmentConfiguration>
): Promise<{ success: boolean; message: string; config: RecruitmentConfiguration }> => {
    try {
        logger.info('Updating recruitment configuration', {
            orgId,
            fields: Object.keys(data),
        });

        const response = await apiPut<{
            success: boolean;
            message: string;
            config: RecruitmentConfiguration;
        }>(`/recruitment/organization/config`, {
            org_id: orgId,
            ...data,
        });

        logger.info('Recruitment configuration updated', { orgId });

        return response;
    } catch (error: any) {
        logger.error('Failed to update recruitment configuration', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

// ============================================================
// OFFER TEMPLATES API
// ============================================================

/**
 * Get all offer letter templates
 */
export const getOfferTemplates = async (
    orgId: string
): Promise<{ templates: OfferLetterTemplate[]; count: number }> => {
    try {
        logger.info('Fetching offer templates', { orgId });

        const response = await apiGet<{
            templates: OfferLetterTemplate[];
            count: number;
        }>(`/recruitment/organization/offer-templates?org_id=${orgId}`);

        logger.info('Fetched offer templates', { orgId, count: response.count });

        return response;
    } catch (error: any) {
        logger.error('Failed to fetch offer templates', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Get single offer letter template
 */
export const getOfferTemplate = async (
    orgId: string,
    templateId: string
): Promise<{ template: OfferLetterTemplate }> => {
    try {
        logger.info('Fetching offer template', { orgId, templateId });

        const response = await apiGet<{ template: OfferLetterTemplate }>(
            `/recruitment/organization/offer-templates?org_id=${orgId}&template_id=${templateId}`
        );

        return response;
    } catch (error: any) {
        logger.error('Failed to fetch offer template', {
            error: error.message,
            orgId,
            templateId,
        });
        throw error;
    }
};

/**
 * Create offer letter template
 */
export const createOfferTemplate = async (
    orgId: string,
    data: {
        template_name: string;
        template_content: string;
        is_default?: boolean;
    }
): Promise<{ success: boolean; message: string; template: OfferLetterTemplate }> => {
    try {
        logger.info('Creating offer template', { orgId, name: data.template_name });

        const response = await apiPost<{
            success: boolean;
            message: string;
            template: OfferLetterTemplate;
        }>(`/recruitment/organization/offer-templates`, {
            org_id: orgId,
            ...data,
        });

        logger.info('Offer template created', { orgId });

        return response;
    } catch (error: any) {
        logger.error('Failed to create offer template', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Update offer letter template
 */
export const updateOfferTemplate = async (
    orgId: string,
    templateId: string,
    data: {
        template_name?: string;
        template_content?: string;
        is_default?: boolean;
    }
): Promise<{ success: boolean; message: string; template: OfferLetterTemplate }> => {
    try {
        logger.info('Updating offer template', { orgId, templateId });

        const response = await apiPut<{
            success: boolean;
            message: string;
            template: OfferLetterTemplate;
        }>(`/recruitment/organization/offer-templates`, {
            org_id: orgId,
            template_id: templateId,
            ...data,
        });

        logger.info('Offer template updated', { orgId, templateId });

        return response;
    } catch (error: any) {
        logger.error('Failed to update offer template', {
            error: error.message,
            orgId,
            templateId,
        });
        throw error;
    }
};

/**
 * Delete offer letter template
 */
export const deleteOfferTemplate = async (
    orgId: string,
    templateId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        logger.info('Deleting offer template', { orgId, templateId });

        const response = await apiDelete<{ success: boolean; message: string }>(
            `/recruitment/organization/offer-templates?org_id=${orgId}&template_id=${templateId}`
        );

        logger.info('Offer template deleted', { orgId, templateId });

        return response;
    } catch (error: any) {
        logger.error('Failed to delete offer template', {
            error: error.message,
            orgId,
            templateId,
        });
        throw error;
    }
};

// ============================================================
// BILLING API (Admin-only)
// ============================================================

/**
 * Get billing information (admin-only)
 */
export const getBillingInformation = async (
    orgId: string
): Promise<{ billing: BillingInformation; exists: boolean }> => {
    try {
        logger.info('Fetching billing information', { orgId });

        const response = await apiGet<{ billing: BillingInformation; exists: boolean }>(
            `/recruitment/organization/billing?org_id=${orgId}`
        );

        return response;
    } catch (error: any) {
        logger.error('Failed to fetch billing information', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

/**
 * Update billing information (admin-only)
 */
export const updateBillingInformation = async (
    orgId: string,
    data: Partial<BillingInformation>
): Promise<{ success: boolean; message: string; billing: BillingInformation }> => {
    try {
        logger.info('Updating billing information', { orgId, fields: Object.keys(data) });

        const response = await apiPut<{
            success: boolean;
            message: string;
            billing: BillingInformation;
        }>(`/recruitment/organization/billing`, {
            org_id: orgId,
            ...data,
        });

        logger.info('Billing information updated', { orgId });

        return response;
    } catch (error: any) {
        logger.error('Failed to update billing information', {
            error: error.message,
            orgId,
        });
        throw error;
    }
};

// ============================================================
// DOCUMENT UPLOAD API
// ============================================================

/**
 * Upload verification document
 */
export const uploadDocument = async (
    orgId: string,
    file: File,
    documentType: string,
    bucket: string = 'company-documents'
): Promise<{
    success: boolean;
    message: string;
    file_path: string;
    file_url: string;
    document_type: string;
}> => {
    try {
        logger.info('Uploading document', {
            orgId,
            documentType,
            fileName: file.name,
            fileSize: file.size,
        });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('org_id', orgId);
        formData.append('document_type', documentType);
        formData.append('bucket', bucket);

        const response = await apiPost<{
            success: boolean;
            message: string;
            file_path: string;
            file_url: string;
            document_type: string;
        }>(`/recruitment/organization/upload-document`, formData);

        logger.info('Document uploaded', {
            orgId,
            documentType,
            filePath: response.file_path,
        });

        return response;
    } catch (error: any) {
        logger.error('Failed to upload document', {
            error: error.message,
            orgId,
            documentType,
        });
        throw error;
    }
};

/**
 * Delete verification document
 */
export const deleteDocument = async (
    orgId: string,
    filePath: string,
    bucket: string = 'company-documents'
): Promise<{ success: boolean; message: string }> => {
    try {
        logger.info('Deleting document', { orgId, filePath });

        const response = await apiDelete<{ success: boolean; message: string }>(
            `/recruitment/organization/upload-document?org_id=${orgId}&file_path=${encodeURIComponent(
                filePath
            )}&bucket=${bucket}`
        );

        logger.info('Document deleted', { orgId, filePath });

        return response;
    } catch (error: any) {
        logger.error('Failed to delete document', {
            error: error.message,
            orgId,
            filePath,
        });
        throw error;
    }
};
