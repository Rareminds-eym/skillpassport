import { supabase } from '../lib/supabaseClient';
import { UserRole, Permission } from '../types/Permissions';

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

export interface UserPermissions {
  [module: string]: string[]; // module -> permissions array
}

/**
 * Permission Service - handles all permission-related operations
 */
class PermissionService {
  /**
   * Get current user's role
   */
  async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return userData.role as UserRole;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Get user's permissions based on their role
   */
  async getUserPermissions(userId?: string): Promise<UserPermissions> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return {};
        targetUserId = user.id;
      }

      // Get user's role from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', targetUserId)
        .single();

      if (userError) throw userError;

      // Get permissions for this role
      const { data: permissionsData, error: permError } = await supabase
        .from('college_role_module_permissions')
        .select(`
          college_setting_modules(module_name),
          college_setting_permissions(permission_name)
        `)
        .eq('role_type', userData.role);

      if (permError) throw permError;

      // Format permissions into object
      const permissions: UserPermissions = {};
      
      permissionsData?.forEach((item: any) => {
        const module = item.college_setting_modules.module_name;
        const permission = item.college_setting_permissions.permission_name;
        
        if (!permissions[module]) {
          permissions[module] = [];
        }
        permissions[module].push(permission);
      });

      return permissions;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return {};
    }
  }

  /**
   * Check if user has specific permission for a module
   */
  async checkPermission(feature: string, permission: Permission): Promise<PermissionCheck> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      const userPermissions = await this.getUserPermissions(user.id);
      const hasPermission = userPermissions[feature]?.includes(permission) || false;
      
      return { 
        allowed: hasPermission,
        reason: hasPermission ? undefined : `No ${permission} permission for ${feature}`
      };
    } catch (error) {
      console.error('Error checking permission:', error);
      return { allowed: false, reason: 'Error checking permission' };
    }
  }

  /**
   * Get feature access permissions
   */
  async getFeatureAccess() {
    try {
      const permissions = await this.getUserPermissions();
      
      return {
        canAddStudent: permissions['Students']?.includes('create') || false,
        canEditProfile: permissions['Students']?.includes('edit') || false,
        canMarkAttendance: permissions['Classroom Management']?.includes('create') || false,
        canEditAttendance: permissions['Classroom Management']?.includes('edit') || false,
        canTransferStudent: permissions['Students']?.includes('edit') || false,
        canGenerateReport: permissions['Reports']?.includes('view') || false,
        canChangeClassSection: permissions['Classroom Management']?.includes('edit') || false
      };
    } catch (error) {
      console.error('Error getting feature access:', error);
      return {
        canAddStudent: false,
        canEditProfile: false,
        canMarkAttendance: false,
        canEditAttendance: false,
        canTransferStudent: false,
        canGenerateReport: false,
        canChangeClassSection: false
      };
    }
  }

  /**
   * Check if user can access a specific student
   */
  async canAccessStudent(studentId: string): Promise<PermissionCheck> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      // For now, allow access if user has view permission for Students
      // In the future, you could add logic to check if the user is specifically
      // assigned to this student (e.g., as their teacher or counselor)
      const permissionCheck = await this.checkPermission('Students', 'view');
      
      // You could add additional student-specific checks here:
      // - Check if educator is assigned to student's class
      // - Check if parent is linked to this student
      // - etc.
      
      return permissionCheck;
    } catch (error) {
      console.error('Error checking student access:', error);
      return { allowed: false, reason: 'Error checking student access' };
    }
  }

  /**
   * Check if user can edit attendance for a specific date
   */
  async canEditAttendance(attendanceDate: string): Promise<PermissionCheck> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      // Check if user has update permission for Classroom Management
      const permissionCheck = await this.checkPermission('Classroom Management', 'update');
      if (!permissionCheck.allowed) {
        return permissionCheck;
      }

      // Additional date-based logic can be added here
      // For example, prevent editing attendance older than X days
      const attendanceDateTime = new Date(attendanceDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - attendanceDateTime.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 7) {
        return { allowed: false, reason: 'Cannot edit attendance older than 7 days' };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking attendance edit permission:', error);
      return { allowed: false, reason: 'Error checking attendance edit permission' };
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService();

// Legacy exports for backward compatibility
export const getUserPermissions = (userId: string) => permissionService.getUserPermissions(userId);
export const checkPermission = (userId: string, module: string, permission: string) => {
  // Note: This legacy function signature doesn't match the new service
  // You may need to update callers to use the service directly
  return permissionService.getUserPermissions(userId).then(perms => 
    perms[module]?.includes(permission) || false
  );
};