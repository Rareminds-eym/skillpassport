/**
 * Recruitment Entity - Model Layer
 * Public API for recruitment model exports
 */

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
} from './types';

export { ROLE_PERMISSIONS } from './types';

export { useOrgContext, useHasPermission } from './useOrgContext';
export {
    useRecruitmentMembers,
    useRecruitmentMember,
    useMemberStats,
    useUpdateMemberRole,
    useUpdateMemberStatus,
    useRemoveMember,
} from './useRecruitmentMembers';
export {
    useRecruitmentInvitations,
    useRecruitmentInvitation,
    useVerifyInvitation,
    useCreateInvitation,
    useAcceptInvitation,
    useCancelInvitation,
    useResendInvitation,
} from './useRecruitmentInvitations';
