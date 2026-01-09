import { supabase } from '@/lib/supabaseClient';
import {
    Permission,
    UserRole,
    getRolePermissions,
    hasAnyPermission,
    hasPermission
} from '@/types/Permissions';

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

export const permissionService = {
  // Get current user's role
  async getCurrentUserRole(): Promise<UserRole | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Check in school_educators table
    const { data: educator } = await supabase
      .from('school_educators')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (educator) {
      return educator.role as UserRole;
    }

    // Check if parent
    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (parent) {
      return 'parent';
    }

    return null;
  },

  // Check if current user has permission
  async checkPermission(feature: string, permission: Permission): Promise<PermissionCheck> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return { allowed: false, reason: 'User role not found' };
    }

    const allowed = hasPermission(role, feature, permission);
    
    return {
      allowed,
      reason: allowed ? undefined : `${role} does not have ${permission} permission for ${feature}`
    };
  },

  // Check multiple permissions
  async checkAnyPermission(feature: string, permissions: Permission[]): Promise<PermissionCheck> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return { allowed: false, reason: 'User role not found' };
    }

    const allowed = hasAnyPermission(role, feature, permissions);
    
    return {
      allowed,
      reason: allowed ? undefined : `${role} does not have any of [${permissions.join(', ')}] permissions for ${feature}`
    };
  },

  // Student Management specific permission checks
  async canAddStudent(): Promise<PermissionCheck> {
    return this.checkAnyPermission('add_student', ['create', 'update', 'delete']);
  },

  async canEditStudentProfile(): Promise<PermissionCheck> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return { allowed: false, reason: 'User role not found' };
    }

    // Principal and IT Admin can update
    if (role === 'principal' || role === 'it_admin' || role === 'vice_principal') {
      return { allowed: true };
    }

    // Teachers can only view
    if (role === 'class_teacher' || role === 'subject_teacher') {
      return { allowed: true, reason: 'View only access' };
    }

    // Parents can view their own child (limited)
    if (role === 'parent') {
      return { allowed: true, reason: 'Limited view access to own child' };
    }

    return { allowed: false, reason: 'No access to student profiles' };
  },

  async canMarkAttendance(): Promise<PermissionCheck> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return { allowed: false, reason: 'User role not found' };
    }

    // Only Class Teacher can mark attendance
    if (role === 'class_teacher') {
      return { allowed: true };
    }

    // Principal can approve
    if (role === 'principal') {
      return { allowed: true, reason: 'Approval access' };
    }

    // Parents can only view
    if (role === 'parent') {
      return { allowed: true, reason: 'View only access' };
    }

    return { allowed: false, reason: 'No access to attendance' };
  },

  async canEditAttendance(attendanceDate: string): Promise<PermissionCheck> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return { allowed: false, reason: 'User role not found' };
    }

    // Principal can always approve edits
    if (role === 'principal') {
      return { allowed: true, reason: 'Principal approval' };
    }

    // Class Teacher can edit within 24 hours
    if (role === 'class_teacher') {
      const attendance = new Date(attendanceDate);
      const now = new Date();
      const hoursDiff = (now.getTime() - attendance.getTime()) / (1000 * 60 * 60);

      if (hoursDiff <= 24) {
        return { allowed: true };
      } else {
        return { allowed: false, reason: 'Attendance can only be edited within 24 hours. Please request Principal approval.' };
      }
    }

    return { allowed: false, reason: 'No permission to edit attendance' };
  },

  async canTransferStudent(): Promise<PermissionCheck> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return { allowed: false, reason: 'User role not found' };
    }

    // Principal can approve transfers
    if (role === 'principal') {
      return { allowed: true, reason: 'Approval access' };
    }

    // Vice Principal and IT Admin can initiate
    if (role === 'vice_principal' || role === 'it_admin') {
      return { allowed: true, reason: 'Can initiate transfer (requires Principal approval)' };
    }

    return { allowed: false, reason: 'No permission to transfer students' };
  },

  async canGenerateReport(): Promise<PermissionCheck> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return { allowed: false, reason: 'User role not found' };
    }

    // Most roles can view reports
    const allowedRoles: UserRole[] = [
      'principal',
      'vice_principal',
      'it_admin',
      'class_teacher',
      'subject_teacher',
      'parent',
      'career_counselor'
    ];

    if (allowedRoles.includes(role)) {
      if (role === 'parent') {
        return { allowed: true, reason: 'Can view own child reports only' };
      }
      return { allowed: true };
    }

    return { allowed: false, reason: 'No permission to view reports' };
  },

  async canChangeClassSection(): Promise<PermissionCheck> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return { allowed: false, reason: 'User role not found' };
    }

    // Only Principal can change class/section
    if (role === 'principal') {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Only Principal can change class or section' };
  },

  // Check if user can access specific student (for parents)
  async canAccessStudent(studentId: string): Promise<PermissionCheck> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return { allowed: false, reason: 'User role not found' };
    }

    // Non-parents can access all students in their school
    if (role !== 'parent') {
      return { allowed: true };
    }

    // Parents can only access their own children
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    const { data: parent } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!parent) {
      return { allowed: false, reason: 'Parent record not found' };
    }

    // Check if student belongs to this parent
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('parent_id', parent.id)
      .maybeSingle();

    if (student) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'You can only access your own child\'s information' };
  },

  // Get all permissions for current user
  async getCurrentUserPermissions(): Promise<Record<string, Permission[]>> {
    const role = await this.getCurrentUserRole();
    
    if (!role) {
      return {};
    }

    return getRolePermissions(role);
  },

  // Bulk permission check for UI rendering
  async getFeatureAccess(): Promise<{
    canAddStudent: boolean;
    canEditProfile: boolean;
    canMarkAttendance: boolean;
    canEditAttendance: boolean;
    canTransferStudent: boolean;
    canGenerateReport: boolean;
    canChangeClassSection: boolean;
  }> {
    const [
      addStudent,
      editProfile,
      markAttendance,
      editAttendance,
      transferStudent,
      generateReport,
      changeClassSection
    ] = await Promise.all([
      this.canAddStudent(),
      this.canEditStudentProfile(),
      this.canMarkAttendance(),
      this.canEditAttendance(new Date().toISOString()),
      this.canTransferStudent(),
      this.canGenerateReport(),
      this.canChangeClassSection()
    ]);

    return {
      canAddStudent: addStudent.allowed,
      canEditProfile: editProfile.allowed,
      canMarkAttendance: markAttendance.allowed,
      canEditAttendance: editAttendance.allowed,
      canTransferStudent: transferStudent.allowed,
      canGenerateReport: generateReport.allowed,
      canChangeClassSection: changeClassSection.allowed
    };
  }
};
