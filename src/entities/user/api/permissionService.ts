import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';
import { UserRole, Permission } from '@/shared/types/Permissions';

const logger = getLogger('permission-service');

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
      const user = useAuthStore.getState().user;
      if (!user) return null;
      const response: any = await apiPost('/user/actions', { action: 'get-current-user-role', userId: user.id });
      return response?.data?.role as UserRole ?? null;
    } catch (error) {
      logger.error('Failed to get current user role', error instanceof Error ? error : new Error(String(error)));
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
        const user = useAuthStore.getState().user;
        if (!user) return {};
        targetUserId = user.id;
      }

      const response: any = await apiPost('/user/actions', { action: 'get-permissions', userId: targetUserId });
      return response?.data?.permissions ?? {};
    } catch (error) {
      logger.error('Failed to fetch user permissions', error instanceof Error ? error : new Error(String(error)));
      return {};
    }
  }

  /**
   * Check if user has specific permission for a module
   */
  async checkPermission(feature: string, permission: Permission): Promise<PermissionCheck> {
    try {
      const user = useAuthStore.getState().user;
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
      logger.error('Failed to check permission', error instanceof Error ? error : new Error(String(error)), { feature, permission });
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
        canAddLearner: permissions['Learners']?.includes('create') || false,
        canEditProfile: permissions['Learners']?.includes('edit') || false,
        canMarkAttendance: permissions['Classroom Management']?.includes('create') || false,
        canEditAttendance: permissions['Classroom Management']?.includes('edit') || false,
        canTransferLearner: permissions['Learners']?.includes('edit') || false,
        canGenerateReport: permissions['Reports']?.includes('view') || false,
        canChangeClassSection: permissions['Classroom Management']?.includes('edit') || false
      };
    } catch (error) {
      logger.error('Failed to get feature access', error instanceof Error ? error : new Error(String(error)));
      return {
        canAddLearner: false,
        canEditProfile: false,
        canMarkAttendance: false,
        canEditAttendance: false,
        canTransferLearner: false,
        canGenerateReport: false,
        canChangeClassSection: false
      };
    }
  }

  /**
   * Check if user can access a specific learner
   */
  async canAccessLearner(learnerId: string): Promise<PermissionCheck> {
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      // For now, allow access if user has view permission for Learners
      // In the future, you could add logic to check if the user is specifically
      // assigned to this learner (e.g., as their teacher or counselor)
      const permissionCheck = await this.checkPermission('Learners', 'view');
      
      // You could add additional learner-specific checks here:
      // - Check if educator is assigned to learner's class
      // - Check if parent is linked to this learner
      // - etc.
      
      return permissionCheck;
    } catch (error) {
      logger.error('Failed to check learner access', error instanceof Error ? error : new Error(String(error)), { learnerId });
      return { allowed: false, reason: 'Error checking learner access' };
    }
  }

  /**
   * Check if user can edit attendance for a specific date
   */
  async canEditAttendance(attendanceDate: string): Promise<PermissionCheck> {
    try {
      const user = useAuthStore.getState().user;
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
      logger.error('Failed to check attendance edit permission', error instanceof Error ? error : new Error(String(error)), { attendanceDate });
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