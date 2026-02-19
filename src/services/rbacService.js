/**
 * RBAC Service
 * 
 * Database-driven Role-Based Access Control service
 * Manages permissions, roles, and user access control
 */

import { supabase } from '../lib/supabaseClient';

class RBACService {
  /**
   * Check if user has a specific permission
   * Uses the database function for efficient permission checking
   * 
   * @param {string} userId - User UUID
   * @param {string} permissionKey - Permission key (e.g., "read:profile")
   * @returns {Promise<boolean>}
   */
  async hasPermission(userId, permissionKey) {
    try {
      if (!userId || !permissionKey) {
        console.warn('[RBAC] Missing userId or permissionKey');
        return false;
      }

      const { data, error } = await supabase
        .rpc('rbac_user_has_permission', {
          p_user_id: userId,
          p_permission_key: permissionKey
        });

      if (error) {
        console.error('[RBAC] Error checking permission:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('[RBAC] Error in hasPermission:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   * Returns permissions from both roles and direct assignments
   * 
   * @param {string} userId - User UUID
   * @returns {Promise<Array>}
   */
  async getUserPermissions(userId) {
    try {
      if (!userId) {
        console.warn('[RBAC] Missing userId');
        return [];
      }

      const { data, error } = await supabase
        .rpc('rbac_get_user_permissions', {
          p_user_id: userId
        });

      if (error) {
        console.error('[RBAC] Error getting user permissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[RBAC] Error in getUserPermissions:', error);
      return [];
    }
  }

  /**
   * Get user's roles
   * 
   * @param {string} userId - User UUID
   * @returns {Promise<Array>}
   */
  async getUserRoles(userId) {
    try {
      if (!userId) {
        console.warn('[RBAC] Missing userId');
        return [];
      }

      const { data, error } = await supabase
        .from('rbac_user_roles')
        .select(`
          id,
          is_active,
          expires_at,
          created_at,
          role:rbac_roles(
            id,
            role_key,
            name,
            description,
            icon,
            color
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (error) {
        console.error('[RBAC] Error getting user roles:', error);
        return [];
      }

      return (data || []).map(ur => ur.role);
    } catch (error) {
      console.error('[RBAC] Error in getUserRoles:', error);
      return [];
    }
  }

  /**
   * Assign a role to a user
   * 
   * @param {string} userId - User UUID
   * @param {string} roleKey - Role key (e.g., "demo_premium_student")
   * @param {Object} options - Optional parameters
   * @param {Date} options.expiresAt - Expiration date
   * @param {string} options.assignedBy - UUID of user who assigned the role
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async assignRole(userId, roleKey, options = {}) {
    try {
      if (!userId || !roleKey) {
        return { success: false, error: 'User ID and role key are required' };
      }

      // Get role ID from role key
      const { data: role, error: roleError } = await supabase
        .from('rbac_roles')
        .select('id')
        .eq('role_key', roleKey)
        .eq('is_active', true)
        .single();

      if (roleError || !role) {
        return { success: false, error: 'Role not found' };
      }

      // Insert user role assignment
      const { data, error } = await supabase
        .from('rbac_user_roles')
        .insert({
          user_id: userId,
          role_id: role.id,
          expires_at: options.expiresAt?.toISOString(),
          assigned_by: options.assignedBy
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate assignment
        if (error.code === '23505') {
          return { success: false, error: 'Role already assigned to user' };
        }
        console.error('[RBAC] Error assigning role:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('[RBAC] Error in assignRole:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a role from a user
   * 
   * @param {string} userId - User UUID
   * @param {string} roleKey - Role key
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async removeRole(userId, roleKey) {
    try {
      if (!userId || !roleKey) {
        return { success: false, error: 'User ID and role key are required' };
      }

      // Get role ID
      const { data: role, error: roleError } = await supabase
        .from('rbac_roles')
        .select('id')
        .eq('role_key', roleKey)
        .single();

      if (roleError || !role) {
        return { success: false, error: 'Role not found' };
      }

      // Delete user role assignment
      const { error } = await supabase
        .from('rbac_user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', role.id);

      if (error) {
        console.error('[RBAC] Error removing role:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[RBAC] Error in removeRole:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all available roles
   * 
   * @param {Object} filters - Optional filters
   * @param {string} filters.roleType - Filter by role type (demo, production, custom)
   * @returns {Promise<Array>}
   */
  async getAllRoles(filters = {}) {
    try {
      let query = supabase
        .from('rbac_roles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (filters.roleType) {
        query = query.eq('role_type', filters.roleType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[RBAC] Error getting roles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[RBAC] Error in getAllRoles:', error);
      return [];
    }
  }

  /**
   * Get all available permissions
   * 
   * @param {Object} filters - Optional filters
   * @param {string} filters.category - Filter by category
   * @returns {Promise<Array>}
   */
  async getAllPermissions(filters = {}) {
    try {
      let query = supabase
        .from('rbac_permissions')
        .select('*')
        .order('sort_order', { ascending: true });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[RBAC] Error getting permissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[RBAC] Error in getAllPermissions:', error);
      return [];
    }
  }

  /**
   * Get permissions for a specific role
   * 
   * @param {string} roleKey - Role key
   * @returns {Promise<Array>}
   */
  async getRolePermissions(roleKey) {
    try {
      if (!roleKey) {
        console.warn('[RBAC] Missing roleKey');
        return [];
      }

      const { data, error } = await supabase
        .from('rbac_roles')
        .select(`
          role_key,
          name,
          rbac_role_permissions(
            is_granted,
            permission:rbac_permissions(
              permission_key,
              name,
              action,
              subject,
              category
            )
          )
        `)
        .eq('role_key', roleKey)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('[RBAC] Error getting role permissions:', error);
        return [];
      }

      return (data?.rbac_role_permissions || []).map(rp => ({
        ...rp.permission,
        is_granted: rp.is_granted
      }));
    } catch (error) {
      console.error('[RBAC] Error in getRolePermissions:', error);
      return [];
    }
  }

  /**
   * Grant a direct permission to a user (bypassing roles)
   * 
   * @param {string} userId - User UUID
   * @param {string} permissionKey - Permission key
   * @param {Object} options - Optional parameters
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async grantPermission(userId, permissionKey, options = {}) {
    try {
      if (!userId || !permissionKey) {
        return { success: false, error: 'User ID and permission key are required' };
      }

      // Get permission ID
      const { data: permission, error: permError } = await supabase
        .from('rbac_permissions')
        .select('id')
        .eq('permission_key', permissionKey)
        .single();

      if (permError || !permission) {
        return { success: false, error: 'Permission not found' };
      }

      // Insert user permission
      const { data, error } = await supabase
        .from('rbac_user_permissions')
        .insert({
          user_id: userId,
          permission_id: permission.id,
          is_granted: true,
          expires_at: options.expiresAt?.toISOString(),
          assigned_by: options.assignedBy
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Permission already assigned to user' };
        }
        console.error('[RBAC] Error granting permission:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('[RBAC] Error in grantPermission:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Revoke a direct permission from a user
   * 
   * @param {string} userId - User UUID
   * @param {string} permissionKey - Permission key
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async revokePermission(userId, permissionKey) {
    try {
      if (!userId || !permissionKey) {
        return { success: false, error: 'User ID and permission key are required' };
      }

      // Get permission ID
      const { data: permission, error: permError } = await supabase
        .from('rbac_permissions')
        .select('id')
        .eq('permission_key', permissionKey)
        .single();

      if (permError || !permission) {
        return { success: false, error: 'Permission not found' };
      }

      // Delete user permission
      const { error } = await supabase
        .from('rbac_user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('permission_id', permission.id);

      if (error) {
        console.error('[RBAC] Error revoking permission:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[RBAC] Error in revokePermission:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const rbacService = new RBACService();
export default rbacService;
