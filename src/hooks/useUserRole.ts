import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from '../context/AuthContext';

export type UserRole = 'school_admin' | 'principal' | 'it_admin' | 'class_teacher' | 'subject_teacher';

export type PermissionLevel = 'C' | 'A' | 'U' | 'V' | 'C/A' | 'N/A';

export interface RolePermissions {
  add_teacher: PermissionLevel;
  assign_classes: PermissionLevel;
  timetable_editing: PermissionLevel;
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

export const useUserRole = () => {
  const { user: authUser, role: authRole } = useAuth();
  const [role, setRole] = useState<UserRole>('subject_teacher');
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions>(
    ROLE_PERMISSIONS.subject_teacher
  );

  useEffect(() => {
    fetchUserRole();
  }, [authUser, authRole]);

  // Debug: Log role changes
  useEffect(() => {
    console.log('Current role:', role);
    console.log('Current permissions:', permissions);
    console.log('Auth user:', authUser);
    console.log('Auth role:', authRole);
  }, [role, permissions, authUser, authRole]);

  const fetchUserRole = async () => {
    try {
      // First check if user has role from AuthContext (localStorage)
      if (authRole) {
        console.log('Using role from AuthContext:', authRole);
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
        console.log('User email from AuthContext:', userEmail);

        // Try to get role from teachers table
        if (userEmail) {
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('role')
            .eq('email', userEmail)
            .maybeSingle();

          if (teacherData?.role) {
            console.log('Found role in teachers table:', teacherData.role);
            setRole(teacherData.role as UserRole);
            setPermissions(ROLE_PERMISSIONS[teacherData.role as UserRole]);
            setLoading(false);
            return;
          }
        }

        // Try to get role from school_educators table using email
        if (userEmail) {
          const { data: educatorData } = await supabase
            .from('school_educators')
            .select('role')
            .eq('email', userEmail)
            .maybeSingle();

          if (educatorData?.role) {
            console.log('Found role in school_educators table:', educatorData.role);
            setRole(educatorData.role as UserRole);
            setPermissions(ROLE_PERMISSIONS[educatorData.role as UserRole]);
            setLoading(false);
            return;
          }
        }
      }

      // Default to school_admin if user is accessing school admin routes
      // This ensures backward compatibility with existing school admin users
      const currentPath = window.location.pathname;
      if (currentPath.includes('/school-admin') || currentPath.includes('/admin/schoolAdmin')) {
        console.log('Defaulting to school_admin role for school admin route');
        setRole('school_admin');
        setPermissions(ROLE_PERMISSIONS.school_admin);
        setLoading(false);
        return;
      }

      // If no role found anywhere, default to subject_teacher
      console.log('No role found, defaulting to subject_teacher');
      setRole('subject_teacher');
      setPermissions(ROLE_PERMISSIONS.subject_teacher);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user role:', error);
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
