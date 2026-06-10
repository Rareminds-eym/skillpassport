/**
 * Recruitment Entity - Type Definitions
 * Organization-level recruitment types and interfaces
 */

// ============================================================================
// Role Types
// ============================================================================

/**
 * Recruitment role within an organization.
 * Canonical set of assignable recruitment roles used across invitations,
 * membership, and permission mapping.
 */
export type RecruitmentRole = 'company_admin' | 'recruiter' | 'viewer';

// ============================================================================
// Organization Context Types
// ============================================================================

/**
 * Organization context from database (get_user_org_context function)
 * Represents user's membership and role in an organization
 */
export interface OrgContext {
    // From database function
    orgId: string;
    orgName: string;
    orgSlug: string;
    membershipStatus: 'active' | 'inactive' | 'suspended' | 'expired';
    ssoRoleName: 'owner' | 'admin' | 'member';
    recruitmentRole: 'company_admin' | 'recruiter' | 'viewer' | null;
    recruitmentEnabled: boolean;

    // User info (from auth)
    userId: string;
    userEmail: string;
    userName?: string;

    // Computed convenience fields
    isActive: boolean;
    isAdmin: boolean; // true if company_admin
    isRecruiter: boolean; // true if recruiter
    hasRecruitmentAccess: boolean; // true if recruitment_enabled and has role
}

/**
 * Multiple organization contexts for users belonging to multiple orgs
 */
export interface UserOrgContexts {
    contexts: OrgContext[];
    selectedOrgId?: string;
}

// ============================================================================
// Invitation Types
// ============================================================================

export interface RecruitmentInvitation {
    id: string;
    organizationId: string;
    organizationName: string;
    invitedBy: string;
    invitedByEmail: string;
    invitedByName?: string;
    inviteeEmail: string;
    inviteeName?: string;
    inviteeRole: 'company_admin' | 'recruiter' | 'viewer';
    token: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    expiresAt: string;
    acceptedAt?: string;
    acceptedByUserId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvitationRequest {
    email: string;
    role: 'company_admin' | 'recruiter' | 'viewer';
    name?: string;
}

export interface CreateInvitationResponse {
    invitation: RecruitmentInvitation;
    invitationUrl: string;
}

export interface VerifyInvitationResponse {
    valid: boolean;
    invitation?: RecruitmentInvitation;
    error?: string;
}

export interface AcceptInvitationRequest {
    token: string;
    userId: string;
}

// ============================================================================
// Member Management Types
// ============================================================================

export interface RecruitmentMember {
    id: string;
    userId: string;
    organizationId: string;
    name: string;
    email: string;
    ssoRoleName: 'owner' | 'admin' | 'member';
    recruitmentRole: 'company_admin' | 'recruiter' | 'viewer' | null;
    membershipStatus: 'active' | 'inactive' | 'suspended' | 'expired';
    isActive: boolean;
    invitedBy?: string;
    invitedAt?: string;
    joinedAt?: string;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FetchMembersOptions {
    organizationId: string;
    role?: 'company_admin' | 'recruiter' | 'viewer' | 'all';
    isActive?: boolean;
    searchQuery?: string;
    limit?: number;
    offset?: number;
}

export interface FetchMembersResult {
    members: RecruitmentMember[];
    total: number;
    hasMore: boolean;
}

export interface UpdateMemberRoleRequest {
    userId: string;
    newRole: 'company_admin' | 'recruiter' | 'viewer';
}

export interface UpdateMemberStatusRequest {
    userId: string;
    isActive: boolean;
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Database permission columns from recruitment_role_mapping table
 */
export type DatabasePermission =
    | 'manage_team'
    | 'create_jobs'
    | 'edit_jobs'
    | 'delete_jobs'
    | 'view_candidates'
    | 'manage_candidates'
    | 'view_analytics';

/**
 * Frontend permission names (mapped from database permissions)
 */
export type RecruitmentPermission =
    | 'manage_members'
    | 'invite_members'
    | 'update_roles'
    | 'deactivate_members'
    | 'view_org_settings'
    | 'update_org_settings'
    | 'create_jobs'
    | 'edit_jobs'
    | 'delete_jobs'
    | 'view_candidates'
    | 'manage_candidates'
    | 'assign_candidates'
    | 'view_analytics'
    | 'export_data';

/**
 * Role permissions based on recruitment_role_mapping table
 * Maps recruitment roles to their permissions
 */
export interface RolePermissions {
    company_admin: RecruitmentPermission[];
    recruiter: RecruitmentPermission[];
    viewer: RecruitmentPermission[];
}

/**
 * Default role permissions matching database recruitment_role_mapping
 * These should match the default mappings in the migration:
 * - owner/admin → company_admin (all permissions)
 * - member → recruiter (limited permissions)
 */
export const ROLE_PERMISSIONS: RolePermissions = {
    company_admin: [
        'manage_members',
        'invite_members',
        'update_roles',
        'deactivate_members',
        'view_org_settings',
        'update_org_settings',
        'create_jobs',
        'edit_jobs',
        'delete_jobs',
        'view_candidates',
        'manage_candidates',
        'assign_candidates',
        'view_analytics',
        'export_data',
    ],
    recruiter: [
        'create_jobs',
        'edit_jobs',
        'view_candidates',
        'manage_candidates',
        'assign_candidates',
        'view_analytics',
    ],
    viewer: [
        'view_candidates',
        'view_analytics',
    ],
};

/**
 * Map database permission to frontend permissions
 */
export const DATABASE_TO_FRONTEND_PERMISSIONS: Record<DatabasePermission, RecruitmentPermission[]> = {
    manage_team: ['manage_members', 'invite_members', 'update_roles', 'deactivate_members'],
    create_jobs: ['create_jobs'],
    edit_jobs: ['edit_jobs'],
    delete_jobs: ['delete_jobs'],
    view_candidates: ['view_candidates'],
    manage_candidates: ['manage_candidates', 'assign_candidates'],
    view_analytics: ['view_analytics', 'export_data'],
};

// ============================================================================
// Email Template Types
// ============================================================================

export interface InvitationEmailData {
    recipientEmail: string;
    recipientName?: string;
    organizationName: string;
    inviterName: string;
    inviterEmail: string;
    role: 'company_admin' | 'recruiter' | 'viewer';
    invitationUrl: string;
    expiresAt: string;
}
