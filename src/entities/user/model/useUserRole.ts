import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('user-role-hook');

export type UserRole = 'school_admin' | 'principal' | 'it_admin' | 'class_teacher' | 'subject_teacher';

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

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
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
 * Hook to get user role and permissions
 * 
 * @param authUser - The authenticated user object (pass from store/context)
 * @param authRole - The user's role from auth context (pass from store/context)
 */
export const useUserRole = (authUser: User | null, authRole?: string) => {
  const [role, setRole] = useState<UserRole>('subject_teacher');
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions>(
    ROLE_PERMISSIONS.subject_teacher
  );

  useEffect(() => {
    fetchUserRole();
  }, [authUser, authRole]);


  const fetchUserRole = async () => {
    try {
      // First check if user has role from AuthContext (localStorage)
      if (authRole) {
        // Map the auth role to our UserRole type
        if (authRole === 'school_admin') {
          setRole('school_admin');
          setPermissions(ROLE_PERMISSIONS.school_admin);
          setLoading(false);
          return;
        }
      }

      // If user is logged in via AuthContext
      if (authUser) {
        const userEmail = authUser.email;

        // Try to get role from teachers table
        if (userEmail) {
          const teacherResp: any = await apiPost('/user/actions', { action: 'get-teacher-role-by-email', email: userEmail });
          const teacherRole = teacherResp?.data?.role;
          if (teacherRole) {
            setRole(teacherRole as UserRole);
            setPermissions(ROLE_PERMISSIONS[teacherRole as UserRole]);
            setLoading(false);
            return;
          }
        }

        // Try to get role from school_educators table using email
        if (userEmail) {
          const educatorResp: any = await apiPost('/user/actions', { action: 'get-educator-role-by-email', email: userEmail });
          const educatorRole = educatorResp?.data?.role;
          if (educatorRole) {
            setRole(educatorRole as UserRole);
            setPermissions(ROLE_PERMISSIONS[educatorRole as UserRole]);
            setLoading(false);
            return;
          }
        }
      }

      // Default to school_admin if user is accessing school admin routes
      // This ensures backward compatibility with existing school admin users
      const currentPath = window.location.pathname;
      if (currentPath.includes('/school-admin') || currentPath.includes('/admin/schoolAdmin')) {
        setRole('school_admin');
        setPermissions(ROLE_PERMISSIONS.school_admin);
        setLoading(false);
        return;
      }

      // If no role found anywhere, default to subject_teacher
      setRole('subject_teacher');
      setPermissions(ROLE_PERMISSIONS.subject_teacher);
      setLoading(false);
    } catch (error) {
      logger.error('Failed to fetch user role', error instanceof Error ? error : new Error(String(error)));
      // On error, default to school_admin if on school admin routes
      if (window.location.pathname.includes('/school-admin') || window.location.pathname.includes('/admin/schoolAdmin')) {
        setRole('school_admin');
        setPermissions(ROLE_PERMISSIONS.school_admin);
      }
      setLoading(false);
    }
  };

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

  const getRoleLabel = (roleValue: UserRole): string => {
    const labels: Record<UserRole, string> = {
      school_admin: 'School Admin',
      principal: 'Principal',
      it_admin: 'IT Admin',
      class_teacher: 'Class Teacher',
      subject_teacher: 'Subject Teacher',
    };
    return labels[roleValue];
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
