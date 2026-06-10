/**
 * Organization Profile Hooks
 * React Query hooks for organization profile management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recruitmentQueryKeys } from '@/shared/lib/queryKeys/recruitment';
import {
    getOrganizationProfile,
    updateOrganizationProfile,
    getCompanyVerification,
    updateCompanyVerification,
    submitVerificationForReview,
    verifyDomain,
    getCompanyContacts,
    updateCompanyContacts,
    getRecruitmentConfiguration,
    updateRecruitmentConfiguration,
    getOfferTemplates,
    getOfferTemplate,
    createOfferTemplate,
    updateOfferTemplate,
    deleteOfferTemplate,
    getBillingInformation,
    updateBillingInformation,
    uploadDocument,
    deleteDocument,
} from '../api/organizationService';
import type {
    OrganizationProfile,
    CompanyVerification,
    CompanyContacts,
    RecruitmentConfiguration,
    BillingInformation,
} from '../api/organizationService';
import { useOrgContext } from './useOrgContext';

// ============================================================
// PROFILE HOOKS
// ============================================================

/**
 * Hook to fetch organization profile
 */
export const useOrganizationProfile = () => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: recruitmentQueryKeys.organization.profile(organizationId || ''),
        queryFn: () => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return getOrganizationProfile(organizationId);
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Mutation hook to update organization profile
 */
export const useUpdateOrganizationProfile = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (data: Partial<OrganizationProfile>) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return updateOrganizationProfile(organizationId, data);
        },
        onSuccess: () => {
            // Invalidate organization profile
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.profile(organizationId || ''),
            });
        },
    });
};

// ============================================================
// VERIFICATION HOOKS
// ============================================================

/**
 * Hook to fetch company verification
 */
export const useCompanyVerification = () => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: recruitmentQueryKeys.organization.verification(organizationId || ''),
        queryFn: () => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return getCompanyVerification(organizationId);
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Mutation hook to update company verification
 */
export const useUpdateCompanyVerification = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (data: Partial<CompanyVerification>) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return updateCompanyVerification(organizationId, data);
        },
        onSuccess: () => {
            // Invalidate verification data
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.verification(
                    organizationId || ''
                ),
            });
            // Also invalidate profile (verification status shown there)
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.profile(organizationId || ''),
            });
        },
    });
};

/**
 * Mutation hook to submit verification for review
 */
export const useSubmitVerification = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: () => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return submitVerificationForReview(organizationId);
        },
        onSuccess: () => {
            // Invalidate verification data
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.verification(
                    organizationId || ''
                ),
            });
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.profile(organizationId || ''),
            });
        },
    });
};

/**
 * Mutation hook to verify domain
 */
export const useVerifyDomain = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (domain: string) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return verifyDomain(organizationId, domain);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.verification(
                    organizationId || ''
                ),
            });
        },
    });
};

// ============================================================
// CONTACTS HOOKS
// ============================================================

/**
 * Hook to fetch company contacts
 */
export const useCompanyContacts = () => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: recruitmentQueryKeys.organization.contacts(organizationId || ''),
        queryFn: () => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return getCompanyContacts(organizationId);
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Mutation hook to update company contacts
 */
export const useUpdateCompanyContacts = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (data: Partial<CompanyContacts>) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return updateCompanyContacts(organizationId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.contacts(organizationId || ''),
            });
        },
    });
};

// ============================================================
// CONFIGURATION HOOKS
// ============================================================

/**
 * Hook to fetch recruitment configuration
 */
export const useRecruitmentConfiguration = () => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: recruitmentQueryKeys.organization.config(organizationId || ''),
        queryFn: () => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return getRecruitmentConfiguration(organizationId);
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Mutation hook to update recruitment configuration
 */
export const useUpdateRecruitmentConfiguration = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (data: Partial<RecruitmentConfiguration>) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return updateRecruitmentConfiguration(organizationId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.config(organizationId || ''),
            });
        },
    });
};

// ============================================================
// OFFER TEMPLATES HOOKS
// ============================================================

/**
 * Hook to fetch all offer templates
 */
export const useOfferTemplates = () => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: recruitmentQueryKeys.organization.offerTemplates.list(
            organizationId || ''
        ),
        queryFn: () => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return getOfferTemplates(organizationId);
        },
        enabled: !!organizationId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook to fetch single offer template
 */
export const useOfferTemplate = (templateId: string) => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: recruitmentQueryKeys.organization.offerTemplates.detail(templateId),
        queryFn: () => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return getOfferTemplate(organizationId, templateId);
        },
        enabled: !!organizationId && !!templateId,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Mutation hook to create offer template
 */
export const useCreateOfferTemplate = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (data: {
            template_name: string;
            template_content: string;
            is_default?: boolean;
        }) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return createOfferTemplate(organizationId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.offerTemplates.list(
                    organizationId || ''
                ),
            });
        },
    });
};

/**
 * Mutation hook to update offer template
 */
export const useUpdateOfferTemplate = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: ({
            templateId,
            data,
        }: {
            templateId: string;
            data: {
                template_name?: string;
                template_content?: string;
                is_default?: boolean;
            };
        }) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return updateOfferTemplate(organizationId, templateId, data);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.offerTemplates.list(
                    organizationId || ''
                ),
            });
            queryClient.invalidateQueries({
                queryKey:
                    recruitmentQueryKeys.organization.offerTemplates.detail(
                        variables.templateId
                    ),
            });
        },
    });
};

/**
 * Mutation hook to delete offer template
 */
export const useDeleteOfferTemplate = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (templateId: string) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return deleteOfferTemplate(organizationId, templateId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.offerTemplates.list(
                    organizationId || ''
                ),
            });
        },
    });
};

// ============================================================
// BILLING HOOKS (Admin-only)
// ============================================================

/**
 * Hook to fetch billing information (admin-only)
 */
export const useBillingInformation = () => {
    const { organizationId } = useOrgContext();

    return useQuery({
        queryKey: recruitmentQueryKeys.organization.billing(organizationId || ''),
        queryFn: () => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return getBillingInformation(organizationId);
        },
        enabled: !!organizationId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Mutation hook to update billing information (admin-only)
 */
export const useUpdateBillingInformation = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: (data: Partial<BillingInformation>) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return updateBillingInformation(organizationId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.billing(organizationId || ''),
            });
        },
    });
};

// ============================================================
// DOCUMENT UPLOAD HOOKS
// ============================================================

/**
 * Mutation hook to upload document
 */
export const useUploadDocument = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: ({
            file,
            documentType,
            bucket,
        }: {
            file: File;
            documentType: string;
            bucket?: string;
        }) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return uploadDocument(organizationId, file, documentType, bucket);
        },
        onSuccess: () => {
            // Invalidate verification data (since documents are uploaded there)
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.verification(
                    organizationId || ''
                ),
            });
        },
    });
};

/**
 * Mutation hook to delete document
 */
export const useDeleteDocument = () => {
    const queryClient = useQueryClient();
    const { organizationId } = useOrgContext();

    return useMutation({
        mutationFn: ({ filePath, bucket }: { filePath: string; bucket?: string }) => {
            if (!organizationId) {
                throw new Error('Organization ID is required');
            }
            return deleteDocument(organizationId, filePath, bucket);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: recruitmentQueryKeys.organization.verification(
                    organizationId || ''
                ),
            });
        },
    });
};
