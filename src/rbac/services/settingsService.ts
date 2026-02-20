import { supabase } from '../../lib/supabaseClient';

export interface Module {
  id: string;
  module_name: string;
  description: string;
  is_active: boolean;
}

export interface Permission {
  id: string;
  permission_name: string;
  description: string;
}

export interface RolePermission {
  role_type: string;
  module_id: string;
  permission_id: string;
  module_name: string;
  permission_name: string;
}

export interface Role {
  id: string;
  roleName: string;
  moduleAccess: ModuleAccess[];
  scopeRules: ScopeRule[];
}

export interface ModuleAccess {
  module: string;
  permissions: string[];
}

export interface ScopeRule {
  type: "department" | "program";
  values: string[];
}

/**
 * Fetch all available modules
 */
export const getAvailableModules = async (): Promise<Module[]> => {
  try {
    const { data, error } = await supabase
      .from('college_setting_modules')
      .select('*')
      .eq('is_active', true)
      .order('module_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
};

/**
 * Fetch all available permissions
 */
export const getAvailablePermissions = async (): Promise<Permission[]> => {
  try {
    const { data, error } = await supabase
      .from('college_setting_permissions')
      .select('*')
      .order('permission_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
};

/**
 * Fetch roles with their permissions and scope rules (formatted for Settings UI)
 */
export const getRolesWithPermissions = async (): Promise<Role[]> => {
  try {
    // Get all role permissions with module and permission details
    const { data: rolePermissions, error: permError } = await supabase
      .from('college_role_module_permissions')
      .select(`
        role_type,
        college_setting_modules(id, module_name),
        college_setting_permissions(id, permission_name)
      `);

    if (permError) throw permError;

    // Get all role scope rules
    const { data: roleScopeRules, error: scopeError } = await supabase
      .from('college_role_scope_rules')
      .select('role_type, scope_type, scope_value');

    if (scopeError) throw scopeError;

    // Group by role type
    const roleMap = new Map<string, Role>();

    // Process permissions
    rolePermissions?.forEach((item: any) => {
      const roleType = item.role_type;
      const moduleName = item.college_setting_modules.module_name;
      const permissionName = item.college_setting_permissions.permission_name;

      if (!roleMap.has(roleType)) {
        roleMap.set(roleType, {
          id: roleType,
          roleName: formatRoleName(roleType),
          moduleAccess: [],
          scopeRules: []
        });
      }

      const role = roleMap.get(roleType)!;
      
      // Find or create module access
      let moduleAccess = role.moduleAccess.find(ma => ma.module === moduleName);
      if (!moduleAccess) {
        moduleAccess = { module: moduleName, permissions: [] };
        role.moduleAccess.push(moduleAccess);
      }

      // Add permission if not already present
      if (!moduleAccess.permissions.includes(permissionName)) {
        moduleAccess.permissions.push(permissionName);
      }
    });

    // Process scope rules
    roleScopeRules?.forEach((item: any) => {
      const roleType = item.role_type;
      
      if (!roleMap.has(roleType)) {
        roleMap.set(roleType, {
          id: roleType,
          roleName: formatRoleName(roleType),
          moduleAccess: [],
          scopeRules: []
        });
      }

      const role = roleMap.get(roleType)!;
      
      // Find or create scope rule
      let scopeRule = role.scopeRules.find(sr => sr.type === item.scope_type);
      if (!scopeRule) {
        scopeRule = { type: item.scope_type as "department" | "program", values: [] };
        role.scopeRules.push(scopeRule);
      }

      // Add scope value if not already present
      if (!scopeRule.values.includes(item.scope_value)) {
        scopeRule.values.push(item.scope_value);
      }
    });

    return Array.from(roleMap.values());
  } catch (error) {
    console.error('Error fetching roles with permissions:', error);
    return [];
  }
};

/**
 * Save role permissions and scope rules
 */
export const saveRolePermissions = async (
  roleType: string,
  modulePermissions: ModuleAccess[],
  scopeRules: ScopeRule[] = []
): Promise<boolean> => {
  try {
    // First, delete existing permissions and scope rules for this role
    const [deletePermError, deleteScopeError] = await Promise.all([
      supabase
        .from('college_role_module_permissions')
        .delete()
        .eq('role_type', roleType),
      supabase
        .from('college_role_scope_rules')
        .delete()
        .eq('role_type', roleType)
    ]);

    if (deletePermError.error) throw deletePermError.error;
    if (deleteScopeError.error) throw deleteScopeError.error;

    // Get module and permission IDs
    const modules = await getAvailableModules();
    const permissions = await getAvailablePermissions();

    // Prepare new permissions data
    const newPermissions: any[] = [];

    modulePermissions.forEach(moduleAccess => {
      const module = modules.find(m => m.module_name === moduleAccess.module);
      if (!module) return;

      moduleAccess.permissions.forEach(permissionName => {
        const permission = permissions.find(p => p.permission_name === permissionName);
        if (!permission) return;

        newPermissions.push({
          role_type: roleType,
          module_id: module.id,
          permission_id: permission.id
        });
      });
    });

    // Prepare new scope rules data
    const newScopeRules: any[] = [];

    scopeRules.forEach(scopeRule => {
      scopeRule.values.forEach(value => {
        newScopeRules.push({
          role_type: roleType,
          scope_type: scopeRule.type,
          scope_value: value
        });
      });
    });

    // Insert new permissions and scope rules
    const insertPromises = [];

    if (newPermissions.length > 0) {
      insertPromises.push(
        supabase
          .from('college_role_module_permissions')
          .insert(newPermissions)
      );
    }

    if (newScopeRules.length > 0) {
      insertPromises.push(
        supabase
          .from('college_role_scope_rules')
          .insert(newScopeRules)
      );
    }

    if (insertPromises.length > 0) {
      const results = await Promise.all(insertPromises);
      
      for (const result of results) {
        if (result.error) throw result.error;
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving role permissions:', error);
    return false;
  }
};

/**
 * Format role type for display
 */
const formatRoleName = (roleType: string): string => {
  switch (roleType) {
    case 'college_admin':
      return 'Dean (College Admin)';
    case 'college_educator':
      return 'Faculty (College Educator)';
    default:
      return roleType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

/**
 * Get departments for scope rules
 */
export const getDepartments = async (): Promise<{ id: string; name: string; code: string }[]> => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, code')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
};

/**
 * Get programs for scope rules
 */
export const getPrograms = async (): Promise<{ id: string; name: string; code: string }[]> => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('id, name, code')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
};
export const getModulesForRole = async (roleType: string): Promise<Module[]> => {
  const allModules = await getAvailableModules();
  
  // Filter modules based on role type
  if (roleType === 'college_admin') {
    return allModules.filter(m => 
      ['Dashboard', 'Students', 'Departments & Faculty', 'Academics', 
       'Examinations', 'Placements & Skills', 'Operations', 'Administration', 'Settings']
      .includes(m.module_name)
    );
  } else if (roleType === 'college_educator') {
    return allModules.filter(m => 
      ['Dashboard', 'Teaching Intelligence', 'Courses', 'Classroom Management', 
       'Learning & Evaluation', 'Skill & Co-Curriculm', 'Digital Portfolio', 
       'Analytics', 'Reports', 'Media Manager', 'Communication', 'Settings']
      .includes(m.module_name)
    );
  }
  
  return allModules;
};