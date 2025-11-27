import { useState, useEffect } from 'react';
import { permissionService, PermissionCheck } from '@/services/permissionService';
import { UserRole, Permission } from '@/types/Permissions';

// Hook to get current user role
export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      const userRole = await permissionService.getCurrentUserRole();
      setRole(userRole);
      setLoading(false);
    }
    fetchRole();
  }, []);

  return { role, loading };
}

// Hook to check a specific permission
export function usePermission(feature: string, permission: Permission) {
  const [check, setCheck] = useState<PermissionCheck>({ allowed: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPerm() {
      const result = await permissionService.checkPermission(feature, permission);
      setCheck(result);
      setLoading(false);
    }
    checkPerm();
  }, [feature, permission]);

  return { ...check, loading };
}

// Hook to get all feature access permissions
export function useFeatureAccess() {
  const [access, setAccess] = useState({
    canAddStudent: false,
    canEditProfile: false,
    canMarkAttendance: false,
    canEditAttendance: false,
    canTransferStudent: false,
    canGenerateReport: false,
    canChangeClassSection: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccess() {
      const featureAccess = await permissionService.getFeatureAccess();
      setAccess(featureAccess);
      setLoading(false);
    }
    fetchAccess();
  }, []);

  return { access, loading };
}

// Hook to check student access (for parents)
export function useStudentAccess(studentId: string | null) {
  const [check, setCheck] = useState<PermissionCheck>({ allowed: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!studentId) {
        setCheck({ allowed: false, reason: 'No student ID provided' });
        setLoading(false);
        return;
      }

      const result = await permissionService.canAccessStudent(studentId);
      setCheck(result);
      setLoading(false);
    }
    checkAccess();
  }, [studentId]);

  return { ...check, loading };
}

// Hook for attendance edit permission with date check
export function useAttendanceEditPermission(attendanceDate: string | null) {
  const [check, setCheck] = useState<PermissionCheck>({ allowed: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPerm() {
      if (!attendanceDate) {
        setCheck({ allowed: false, reason: 'No date provided' });
        setLoading(false);
        return;
      }

      const result = await permissionService.canEditAttendance(attendanceDate);
      setCheck(result);
      setLoading(false);
    }
    checkPerm();
  }, [attendanceDate]);

  return { ...check, loading };
}
