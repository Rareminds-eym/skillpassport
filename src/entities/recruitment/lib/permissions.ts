/**
 * Permission Utilities
 * Helper functions for checking permissions
 * Aligned with database recruitment_role_mapping table
 */

import { ROLE_PERMISSIONS, DATABASE_TO_FRONTEND_PERMISSIONS } from '../model/types';
import type { RecruitmentPermission, DatabasePermission, OrgContext } from '../model/types';

/**
 * Check if a recruitment role has a specific permission
 */
export const hasPermission = (
    role: 'company_admin' | 'recruiter' | 'viewer',
    permission: RecruitmentPermission
): boolean => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
};

/**
 * Check if org context has a specific permission
 */
export const hasOrgPermission = (
    orgContext: OrgContext | null,
    permission: RecruitmentPermission
): boolean => {
    if (!orgContext || !orgContext.recruitmentRole) return false;
    return hasPermission(orgContext.recruitmentRole, permission);
};

/**
 * Get all permissions for a recruitment role
 */
export const getRolePermissions = (
    role: 'company_admin' | 'recruiter' | 'viewer'
): RecruitmentPermission[] => {
    return ROLE_PERMISSIONS[role] || [];
};

/**
 * Map database permission to frontend permissions
 */
export const mapDatabasePermission = (
    dbPermission: DatabasePermission
): RecruitmentPermission[] => {
    return DATABASE_TO_FRONTEND_PERMISSIONS[dbPermission] || [];
};

/**
 * Check if user can manage members (company_admin only)
 */
export const canManageMembers = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'manage_members');
};

/**
 * Check if user can invite members (company_admin only)
 */
export const canInviteMembers = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'invite_members');
};

/**
 * Check if user can update roles (company_admin only)
 */
export const canUpdateRoles = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'update_roles');
};

/**
 * Check if user can deactivate members (company_admin only)
 */
export const canDeactivateMembers = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'deactivate_members');
};

/**
 * Check if user can manage organization settings (company_admin only)
 */
export const canManageOrgSettings = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'update_org_settings');
};

/**
 * Check if user can create jobs (company_admin and recruiter)
 */
export const canCreateJobs = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'create_jobs');
};

/**
 * Check if user can edit jobs (company_admin and recruiter)
 */
export const canEditJobs = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'edit_jobs');
};

/**
 * Check if user can delete jobs (company_admin only)
 */
export const canDeleteJobs = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'delete_jobs');
};

/**
 * Check if user can view candidates (all roles)
 */
export const canViewCandidates = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'view_candidates');
};

/**
 * Check if user can manage candidates (company_admin and recruiter)
 */
export const canManageCandidates = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'manage_candidates');
};

/**
 * Check if user can assign candidates (company_admin and recruiter)
 */
export const canAssignCandidates = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'assign_candidates');
};

/**
 * Check if user can view analytics (all roles)
 */
export const canViewAnalytics = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'view_analytics');
};

/**
 * Check if user can export data (company_admin only)
 */
export const canExportData = (orgContext: OrgContext | null): boolean => {
    return hasOrgPermission(orgContext, 'export_data');
};

/**
 * Check if user is company admin
 */
export const isCompanyAdmin = (orgContext: OrgContext | null): boolean => {
    return orgContext?.recruitmentRole === 'company_admin';
};

/**
 * Check if user is recruiter
 */
export const isRecruiter = (orgContext: OrgContext | null): boolean => {
    return orgContext?.recruitmentRole === 'recruiter';
};

/**
 * Check if user is viewer
 */
export const isViewer = (orgContext: OrgContext | null): boolean => {
    return orgContext?.recruitmentRole === 'viewer';
};

/**
 * Get user's recruitment role display name
 */
export const getRoleDisplayName = (role: 'company_admin' | 'recruiter' | 'viewer' | null): string => {
    switch (role) {
        case 'company_admin':
            return 'Company Admin';
        case 'recruiter':
            return 'Recruiter';
        case 'viewer':
            return 'Viewer';
        default:
            return 'No Role';
    }
};
