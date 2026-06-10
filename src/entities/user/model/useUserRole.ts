import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import type { SchoolInternalRole } from '@/shared/types/permissions';
import { useEffect, useState } from 'react';

const logger = getLogger('user-role-hook');

// School-internal role taxonomy (NOT the SSO `UserRole`). This module uses a
// subset of the shared `SchoolInternalRole` union declared in
// `@/shared/types/permissions`; the canonical SSO `UserRole` lives only in
// `@/shared/types/generated/roles`.

export type PermissionLevel = 'C' | 'A' | 'U' | 'V' | 'C/A' | 'N/A';

export interface RolePermissions {
  add_teacher: PermissionLevel;
  assign_classes: PermissionLevel;
  timetable_editing: PermissionLevel;
}

interface User {
  id: string;
  email?: string;
}

// Keyed by a subset of `SchoolInternalRole`; `Partial` because not every
// school-internal role has timetable/teacher permissions defined here.
const ROLE_PERMISSIONS: Partial<Record<SchoolInternalRole, RolePermissions>> = {
  school_admin: {
    add_teacher: 'C/A',
    assign_classes: 'A',
    timetable_editing: 'A',
  },
  principal: {
    add_teacher: 'C/A',
    assign_classes: 'A',
    timetable_editing: 'A',
  },
  it_admin: {
    add_teacher: 'C',
    assign_classes: 'C',
    timetable_editing: 'U',
  },
  class_teacher: {
    add_teacher: 'N/A',
    assign_classes: 'N/A',
    timetable_editing: 'V',
  },
  subject_teacher: {
    add_teacher: 'N/A',
    assign_classes: 'N/A',
    timetable_editing: 'V',
  },
};

/**
 * Least-privilege permission set used when no school-internal role can be
 * resolved for the current user. Grants NOTHING — an unknown/unauthenticated
 * user must render the most restrictive UI, never a guessed (`subject_teacher`)
 * or privileged (`school_admin`) default. Server-side guards remain the real
 * authorization boundary; this only governs advisory UI affordances.
 */
const LEAST_PRIVILEGE_PERMISSIONS: RolePermissions = {
  add_teacher: 'N/A',
  assign_classes: 'N/A',
  timetable_editing: 'N/A',
};

// Set of valid `SchoolInternalRole` literals this hook recognises, used to
// validate the role code returned by the JWT-backed endpoint before trusting it.
const SCHOOL_INTERNAL_ROLES: ReadonlySet<SchoolInternalRole> = new Set<SchoolInternalRole>([
  'principal',
  'vice_principal',
  'it_admin',
  'class_teacher',
  'subject_teacher',
  'accountant',
  'librarian',
  'parent',
  'career_counselor',
  'school_admin',
]);

function isSchoolInternalRole(value: unknown): value is SchoolInternalRole {
  return typeof value === 'string' && SCHOOL_INTERNAL_ROLES.has(value as SchoolInternalRole);
}

function permissionsForRole(role: SchoolInternalRole | null): RolePermissions {
  if (role && ROLE_PERMISSIONS[role]) {
    return ROLE_PERMISSIONS[role]!;
  }
  return LEAST_PRIVILEGE_PERMISSIONS;
}

/**
 * Hook to get the current user's SCHOOL-INTERNAL role and the advisory feature
 * permissions that drive school-admin UI affordances.
 *
 * ⚠️ UX / ADVISORY ONLY — NOT A TRUST BOUNDARY.
 * ------------------------------------------------------------------
 * The role and `can*` helpers returned here decide only what the UI *shows*.
 * Real authorization is enforced SERVER-SIDE by the Pages Functions guards
 * (`withAuth` / `requireRole` / `requireAdmin`) and `resolveSchoolRole`. This
 * hook MUST NOT be relied on to grant or deny access.
 *
 * HOW THE ROLE IS SOURCED (JWT-backed, current-user only):
 *   - SSO roles that ARE school permission codes (e.g. `school_admin`) are read
 *     directly from the auth store (the verified JWT `roles[]`) — no network call.
 *   - Otherwise the genuinely school-internal sub-role (principal / it_admin /
 *     class_teacher / …) is resolved by the JWT-backed `get-current-user-school-role`
 *     Function action, which calls `resolveSchoolRole` for the AUTHENTICATED user.
 *
 * This hook NEVER:
 *   - looks a role up by email (no `teachers` / `school_educators` email queries),
 *   - infers a role from the URL / `window.location.pathname`,
 *   - defaults to a guessed (`subject_teacher`) or privileged (`school_admin`) role.
 * When no role can be determined the role is `null` and permissions are
 * least-privilege (the security fix for bug §6.1 / §7.5).
 *
 * @param authUser - The authenticated user object (pass from store/context)
 * @param authRole - The user's primary SSO role from the auth store (JWT-derived)
 */
export const useUserRole = (authUser: User | null, authRole?: string) => {
  const [role, setRole] = useState<SchoolInternalRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions>(
    LEAST_PRIVILEGE_PERMISSIONS
  );

  useEffect(() => {
    let active = true;

    const applyRole = (resolved: SchoolInternalRole | null) => {
      if (!active) return;
      setRole(resolved);
      setPermissions(permissionsForRole(resolved));
      setLoading(false);
    };

    const resolveRole = async () => {
      // Not authenticated → least privilege, no role.
      if (!authUser) {
        applyRole(null);
        return;
      }

      // Fast path: the SSO role from the verified JWT is itself a school
      // permission code we recognise (e.g. `school_admin`). Map it directly
      // from the store — no network call needed.
      if (isSchoolInternalRole(authRole)) {
        applyRole(authRole);
        return;
      }

      // Otherwise resolve the genuinely school-internal sub-role from the
      // JWT-backed current-user endpoint (no email / userId / URL inference).
      try {
        const resp = await apiPost<{ data?: { role?: string | null } }>(
          '/user/actions',
          { action: 'get-current-user-school-role' }
        );
        const resolved = resp?.data?.role;
        applyRole(isSchoolInternalRole(resolved) ? resolved : null);
      } catch (error) {
        logger.error(
          'Failed to resolve current-user school role',
          error instanceof Error ? error : new Error(String(error))
        );
        // Fail to least privilege — never default to a privileged role on error.
        applyRole(null);
      }
    };

    resolveRole();

    return () => {
      active = false;
    };
  }, [authUser, authRole]);

  const canPerformAction = (
    feature: keyof RolePermissions,
    action: 'C' | 'A' | 'U' | 'V'
  ): boolean => {
    const permission = permissions[feature];

    if (permission === 'N/A') return false;

    switch (action) {
      case 'C': // Create
        return ['C', 'C/A', 'A'].includes(permission);
      case 'A': // Approve
        return ['A', 'C/A'].includes(permission);
      case 'U': // Update
        return ['U', 'C', 'C/A', 'A'].includes(permission);
      case 'V': // View
        return ['V', 'U', 'C', 'C/A', 'A'].includes(permission);
      default:
        return false;
    }
  };

  const canAddTeacher = () => canPerformAction('add_teacher', 'C');
  const canApproveTeacher = () => canPerformAction('add_teacher', 'A');
  const canAssignClasses = () => canPerformAction('assign_classes', 'C');
  const canApproveClasses = () => canPerformAction('assign_classes', 'A');
  const canEditTimetable = () => canPerformAction('timetable_editing', 'U');
  const canApproveTimetable = () => canPerformAction('timetable_editing', 'A');
  const canViewTimetable = () => canPerformAction('timetable_editing', 'V');

  const getRoleLabel = (roleValue: SchoolInternalRole | null): string => {
    if (!roleValue) return 'Unknown';
    const labels: Partial<Record<SchoolInternalRole, string>> = {
      school_admin: 'School Admin',
      principal: 'Principal',
      it_admin: 'IT Admin',
      class_teacher: 'Class Teacher',
      subject_teacher: 'Subject Teacher',
    };
    return labels[roleValue] ?? roleValue;
  };

  return {
    role,
    roleLabel: getRoleLabel(role),
    permissions,
    loading,
    canPerformAction,
    canAddTeacher,
    canApproveTeacher,
    canAssignClasses,
    canApproveClasses,
    canEditTimetable,
    canApproveTimetable,
    canViewTimetable,
    isSchoolAdmin: role === 'school_admin',
    isPrincipal: role === 'principal',
    isITAdmin: role === 'it_admin',
    isClassTeacher: role === 'class_teacher',
    isSubjectTeacher: role === 'subject_teacher',
  };
};
