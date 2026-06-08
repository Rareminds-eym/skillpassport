// RBAC Types and Permissions

/**
 * The canonical SHARED set of school-internal, feature-permission roles.
 *
 * This is a SEPARATE taxonomy from the SSO `UserRole` (the 16 canonical
 * authorization roles in `@/shared/types/generated/roles`). School-internal
 * roles drive school/college feature permissions only; they are NOT used for
 * authorization. This type is intentionally NOT named `UserRole` so the
 * canonical `UserRole` has a single declaration site (the generated module).
 *
 * It is the union (superset) of every school-internal role literal used across
 * the app's school-permission modules (`permissions.ts`, `useUserRole.ts`,
 * `pages/admin/schoolAdmin/Settings.tsx`). Note that `school_admin` also exists
 * as an SSO role — the same literal can legitimately appear in BOTH taxonomies
 * because they are different sets.
 */
export type SchoolInternalRole =
  | 'principal'
  | 'vice_principal'
  | 'it_admin'
  | 'class_teacher'
  | 'subject_teacher'
  | 'accountant'
  | 'librarian'
  | 'parent'
  | 'career_counselor'
  | 'school_admin';

export type Permission = 'view' | 'create' | 'update' | 'delete' | 'approve';

export interface RolePermissions {
  role: SchoolInternalRole;
  permissions: {
    [feature: string]: Permission[];
  };
}

// Learner Management Permissions Matrix.
// `Partial` because not every `SchoolInternalRole` is keyed here (e.g.
// `school_admin`); the helper functions below treat a missing role as "no
// permissions", preserving prior behavior.
export const LEARNER_MANAGEMENT_PERMISSIONS: Partial<Record<SchoolInternalRole, Record<string, Permission[]>>> = {
  principal: {
    add_learner: ['create', 'update', 'delete'],
    edit_learner_profile: ['update'],
    attendance_entry: ['approve'],
    attendance_edit: ['approve'],
    learner_transfer: ['approve'],
    generate_learner_report: ['view'],
    view_learner_details: ['view'],
    manage_class_section: ['create', 'update', 'delete'],
  },

  vice_principal: {
    add_learner: ['create'],
    edit_learner_profile: ['update'],
    attendance_entry: [],
    attendance_edit: [],
    learner_transfer: ['update'],
    generate_learner_report: ['view'],
    view_learner_details: ['view'],
  },

  it_admin: {
    add_learner: ['create'],
    edit_learner_profile: ['update'],
    attendance_entry: [],
    attendance_edit: [],
    learner_transfer: ['update'],
    generate_learner_report: ['view'],
    view_learner_details: ['view'],
    manage_system_settings: ['create', 'update', 'delete'],
  },

  class_teacher: {
    add_learner: [],
    edit_learner_profile: ['view'],
    attendance_entry: ['create', 'update'],
    attendance_edit: ['update'], // within 24 hours
    learner_transfer: [],
    generate_learner_report: ['view'],
    view_learner_details: ['view'],
  },

  subject_teacher: {
    add_learner: [],
    edit_learner_profile: ['view'],
    attendance_entry: [],
    attendance_edit: [],
    learner_transfer: [],
    generate_learner_report: ['view'],
    view_learner_details: ['view'],
  },

  accountant: {
    add_learner: [],
    edit_learner_profile: [],
    attendance_entry: [],
    attendance_edit: [],
    learner_transfer: [],
    generate_learner_report: [],
    view_learner_details: ['view'], // limited to fee info
    manage_fees: ['create', 'update', 'view'],
  },

  librarian: {
    add_learner: [],
    edit_learner_profile: [],
    attendance_entry: [],
    attendance_edit: [],
    learner_transfer: [],
    generate_learner_report: [],
    view_learner_details: ['view'], // limited
  },

  parent: {
    add_learner: [],
    edit_learner_profile: ['view'], // limited to own child
    attendance_entry: ['view'], // own child only
    attendance_edit: [],
    learner_transfer: [],
    generate_learner_report: ['view'], // own child only
    view_learner_details: ['view'], // own child only
  },

  career_counselor: {
    add_learner: [],
    edit_learner_profile: ['view'],
    attendance_entry: [],
    attendance_edit: [],
    learner_transfer: [],
    generate_learner_report: ['view'],
    view_learner_details: ['view'],
    manage_career_module: ['create', 'update', 'view'],
  },
};

// Helper function to check if user has permission
export function hasPermission(
  userRole: SchoolInternalRole,
  feature: string,
  permission: Permission
): boolean {
  const rolePermissions = LEARNER_MANAGEMENT_PERMISSIONS[userRole];

  if (!rolePermissions || !rolePermissions[feature]) {
    return false;
  }

  return rolePermissions[feature].includes(permission);
}

// Helper function to get all permissions for a role
export function getRolePermissions(userRole: SchoolInternalRole): Record<string, Permission[]> {
  return LEARNER_MANAGEMENT_PERMISSIONS[userRole] || {};
}

// Check multiple permissions at once
export function hasAnyPermission(
  userRole: SchoolInternalRole,
  feature: string,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, feature, permission));
}

// Check if user has all specified permissions
export function hasAllPermissions(
  userRole: SchoolInternalRole,
  feature: string,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(userRole, feature, permission));
}
