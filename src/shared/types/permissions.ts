// RBAC Types and Permissions

export type UserRole = 
  | 'principal'
  | 'vice_principal'
  | 'it_admin'
  | 'class_teacher'
  | 'subject_teacher'
  | 'accountant'
  | 'librarian'
  | 'parent'
  | 'career_counselor';

export type Permission = 'view' | 'create' | 'update' | 'delete' | 'approve';

export interface RolePermissions {
  role: UserRole;
  permissions: {
    [feature: string]: Permission[];
  };
}

// Learner Management Permissions Matrix
export const LEARNER_MANAGEMENT_PERMISSIONS: Record<UserRole, Record<string, Permission[]>> = {
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
  userRole: UserRole,
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
export function getRolePermissions(userRole: UserRole): Record<string, Permission[]> {
  return LEARNER_MANAGEMENT_PERMISSIONS[userRole] || {};
}

// Check multiple permissions at once
export function hasAnyPermission(
  userRole: UserRole,
  feature: string,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, feature, permission));
}

// Check if user has all specified permissions
export function hasAllPermissions(
  userRole: UserRole,
  feature: string,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(userRole, feature, permission));
}
