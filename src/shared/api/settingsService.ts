import { apiGet, apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('settings-service');

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

export const getAvailableModules = async (): Promise<Module[]> => {
  try {
    const response: any = await apiGet('/settings/modules');
    return response?.data?.modules ?? response?.modules ?? [];
  } catch (error) {
    logger.error('Error fetching modules', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const getAvailablePermissions = async (): Promise<Permission[]> => {
  try {
    const response: any = await apiGet('/settings/permissions');
    return response?.data?.permissions ?? response?.permissions ?? [];
  } catch (error) {
    logger.error('Error fetching permissions', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const getRolesWithPermissions = async (): Promise<Role[]> => {
  try {
    const response: any = await apiGet('/settings/roles');
    const roles: any[] = response?.data?.roles ?? response?.roles ?? [];

    return roles.map(r => {
      const moduleAccess: ModuleAccess[] = Object.entries(r.moduleAccess || {}).map(([module, perms]) => ({
        module,
        permissions: perms as string[],
      }));

      const scopeRules: ScopeRule[] = Object.entries(r.scopeRules || {}).map(([type, values]) => ({
        type: type as "department" | "program",
        values: values as string[],
      }));

      return {
        id: r.roleType,
        roleName: formatRoleName(r.roleType),
        moduleAccess,
        scopeRules,
      };
    });
  } catch (error) {
    logger.error('Error fetching roles with permissions', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const saveRolePermissions = async (
  roleType: string,
  modulePermissions: ModuleAccess[],
  scopeRules: ScopeRule[] = []
): Promise<boolean> => {
  try {
    const response: any = await apiPost('/settings/roles', {
      action: 'save',
      roleType,
      modulePermissions,
      scopeRules,
    });
    return response?.data?.success ?? true;
  } catch (error) {
    logger.error('Error saving role permissions', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};

export const getDepartments = async (): Promise<{ id: string; name: string; code: string }[]> => {
  try {
    const response: any = await apiGet('/settings/departments');
    return response?.data?.departments ?? response?.departments ?? [];
  } catch (error) {
    logger.error('Error fetching departments', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const getPrograms = async (): Promise<{ id: string; name: string; code: string }[]> => {
  try {
    const response: any = await apiGet('/settings/programs');
    return response?.data?.programs ?? response?.programs ?? [];
  } catch (error) {
    logger.error('Error fetching programs', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const getModulesForRole = async (roleType: string): Promise<Module[]> => {
  const allModules = await getAvailableModules();

  if (roleType === 'college_admin') {
    return allModules.filter(m =>
      ['Dashboard', 'Learners', 'Departments & Faculty', 'Academics',
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
