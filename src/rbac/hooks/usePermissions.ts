import { useState, useEffect } from 'react';
import { permissionService, UserPermissions, PermissionCheck } from '../services/permissionService';
import { Permission } from '../types/Permissions';

export function usePermissions(userId?: string) {
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPermissions = async () => {
      try {
        setLoading(true);
        const perms = await permissionService.getUserPermissions(userId);
        if (mounted) {
          setPermissions(perms);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load permissions'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPermissions();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const hasPermission = (module: string, permission: Permission): boolean => {
    return permissions[module]?.includes(permission) || false;
  };

  const hasAnyPermission = (module: string, permissionList: Permission[]): boolean => {
    return permissionList.some(permission => hasPermission(module, permission));
  };

  const hasAllPermissions = (module: string, permissionList: Permission[]): boolean => {
    return permissionList.every(permission => hasPermission(module, permission));
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * Hook for checking a specific permission with detailed result
 * Returns { allowed, reason, loading }
 */
export function usePermission(module: string, permission: Permission) {
  const [result, setResult] = useState<PermissionCheck & { loading: boolean }>({
    allowed: false,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      try {
        const check = await permissionService.checkPermission(module, permission);
        if (mounted) {
          setResult({ ...check, loading: false });
        }
      } catch (err) {
        if (mounted) {
          setResult({
            allowed: false,
            reason: 'Error checking permission',
            loading: false,
          });
        }
      }
    };

    checkPermission();

    return () => {
      mounted = false;
    };
  }, [module, permission]);

  return result;
}
