import { supabase } from '../lib/supabaseClient';
import { useState, useEffect } from 'react';

export interface UserPermissions {
  [module: string]: string[]; // module -> permissions array
}

/**
 * Get user's permissions based on their role
 */
export const getUserPermissions = async (userId: string): Promise<UserPermissions> => {
  try {
    // Get user's role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
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
};

/**
 * Check if user has specific permission for a module
 */
export const checkPermission = async (
  userId: string, 
  module: string, 
  permission: string
): Promise<boolean> => {
  try {
    const userPermissions = await getUserPermissions(userId);
    return userPermissions[module]?.includes(permission) || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Hook for using permissions in React components
 */
export const usePermissions = (userId: string) => {
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      getUserPermissions(userId).then((perms) => {
        setPermissions(perms);
        setLoading(false);
      });
    }
  }, [userId]);

  const hasPermission = (module: string, permission: string) => {
    return permissions[module]?.includes(permission) || false;
  };

  return { permissions, hasPermission, loading };
};