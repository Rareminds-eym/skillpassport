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
