import { apiGet, apiPost } from '@/shared/api/apiClient';
import type { Module, Permission, Role, ModuleAccess, ScopeRule } from '../model/types';
import { formatRoleName } from '../lib/formatters';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('settings-service');

export const getAvailableModules = async (): Promise<Module[]> => {
  try {
    const response: any = await apiGet('/settings/modules');
    return response?.data?.modules ?? response?.modules ?? [];
  } catch (error) {
    logger.error('Fetch modules failed', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const getAvailablePermissions = async (): Promise<Permission[]> => {
  try {
    const response: any = await apiGet('/settings/permissions');
    return response?.data?.permissions ?? response?.permissions ?? [];
  } catch (error) {
    logger.error('Fetch permissions failed', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const getRolesWithPermissions = async (): Promise<Role[]> => {
  try {
    const response: any = await apiGet('/settings/roles');
    const roles: any[] = response?.data?.roles ?? response?.roles ?? [];

    return roles.map((r: any) => {
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
    logger.error('Fetch roles with permissions failed', error instanceof Error ? error : new Error(String(error)));
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
    logger.error('Save role permissions failed', error instanceof Error ? error : new Error(String(error)), { roleType });
    return false;
  }
};

export const getDepartments = async (): Promise<{ id: string; name: string; code: string }[]> => {
  try {
    const response: any = await apiGet('/settings/departments');
    return response?.data?.departments ?? response?.departments ?? [];
  } catch (error) {
    logger.error('Fetch departments failed', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const getPrograms = async (): Promise<{ id: string; name: string; code: string }[]> => {
  try {
    const response: any = await apiGet('/settings/programs');
    return response?.data?.programs ?? response?.programs ?? [];
  } catch (error) {
    logger.error('Fetch programs failed', error instanceof Error ? error : new Error(String(error)));
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
