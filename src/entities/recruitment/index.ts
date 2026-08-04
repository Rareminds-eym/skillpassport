/**
 * Recruitment Entity - Public API
 * Central export point for all recruitment entity functionality
 */

// Model exports
export type {
    OrgContext,
    RecruitmentInvitation,
    CreateInvitationRequest,
    CreateInvitationResponse,
    VerifyInvitationResponse,
    AcceptInvitationRequest,
    RecruitmentMember,
    FetchMembersOptions,
    FetchMembersResult,
    UpdateMemberRoleRequest,
    UpdateMemberStatusRequest,
    RecruitmentPermission,
    RolePermissions,
    InvitationEmailData,
} from './model';

// Organization types
export type {
    OrganizationProfile,
    CompanyVerification,
    CompanyContacts,
    RecruitmentConfiguration,
    OfferLetterTemplate,
    BillingInformation,
    OrganizationProfileResponse,
} from './api/organizationService';

export { ROLE_PERMISSIONS } from './model';

// Hooks
export {
    useOrgContext,
    useHasPermission,
    useRecruitmentMembers,
    useRecruitmentMember,
    useMemberStats,
    useUpdateMemberRole,
    useUpdateMemberStatus,
    useRemoveMember,
    useRecruitmentInvitations,
    useRecruitmentInvitation,
    useVerifyInvitation,
    useCreateInvitation,
    useAcceptInvitation,
    useCancelInvitation,
    useResendInvitation,
} from './model';

// Organization hooks
export {
    useOrganizationProfile,
    useUpdateOrganizationProfile,
    useCompanyVerification,
    useUpdateCompanyVerification,
    useSubmitVerification,
    useVerifyDomain,
    useCompanyContacts,
    useUpdateCompanyContacts,
    useRecruitmentConfiguration,
    useUpdateRecruitmentConfiguration,
    useOfferTemplates,
    useOfferTemplate,
    useCreateOfferTemplate,
    useUpdateOfferTemplate,
    useDeleteOfferTemplate,
    useBillingInformation,
    useUpdateBillingInformation,
    useUploadDocument,
    useDeleteDocument,
} from './model/useOrganizationProfile';

// Logo upload hook
export { useUploadLogo } from './api/useUploadLogo';

// API exports
export {
    getOrgContext,
    getCurrentOrgId,
    isCurrentUserAdmin,
    checkPermission,
    createInvitation,
    getInvitations,
    getInvitationById,
    verifyInvitation,
    acceptInvitation,
    cancelInvitation,
    resendInvitation,
    getMembers,
    getMemberById,
    updateMemberRole,
    updateMemberStatus,
    removeMember,
    getMemberStats,
} from './api';

// Organization API exports
export {
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
} from './api/organizationService';

// UI exports
export { OrgContextProvider, useOrgContextFromProvider } from './ui/OrgContextProvider';

// Lib exports
export {
    hasPermission,
    hasOrgPermission,
    getRolePermissions,
    canManageMembers,
    canInviteMembers,
    canUpdateRoles,
    canDeactivateMembers,
    canManageOrgSettings,
    canCreateJobs,
    canDeleteJobs,
    canManageCandidates,
    canAssignCandidates,
    canViewAnalytics,
    canExportData,
} from './lib/permissions';

export {
    generateInvitationEmail,
    generateInvitationEmailText,
} from './lib/emailTemplates';
