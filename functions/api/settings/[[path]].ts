import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

function getSubPath(url: URL): string {
  return url.pathname.replace(/^\/api\/settings\/?/, '');
}

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const url = new URL(context.request.url);
  const subPath = getSubPath(url);

  try {
    if (subPath === 'modules' || subPath === '') {
      const { data, error } = await supabase
        .from('college_setting_modules')
        .select('*')
        .eq('is_active', true)
        .order('module_name');

      if (error) throw error;
      return apiSuccess({ modules: data || [] }, context.request);
    }

    if (subPath === 'permissions') {
      const { data, error } = await supabase
        .from('college_setting_permissions')
        .select('*')
        .order('permission_name');

      if (error) throw error;
      return apiSuccess({ permissions: data || [] }, context.request);
    }

    if (subPath === 'roles') {
      const [permResult, scopeResult] = await Promise.all([
        supabase
          .from('college_role_module_permissions')
          .select('role_type, college_setting_modules!inner(id, module_name), college_setting_permissions!inner(id, permission_name)'),
        supabase
          .from('college_role_scope_rules')
          .select('role_type, scope_type, scope_value')
      ]);

      if (permResult.error) throw permResult.error;
      if (scopeResult.error) throw scopeResult.error;

      const rolePermissions = permResult.data || [];
      const roleScopeRules = scopeResult.data || [];

      const roleMap = new Map<string, { moduleAccess: Record<string, string[]>; scopeRules: Record<string, string[]> }>();

      for (const item of rolePermissions as any[]) {
        if (!roleMap.has(item.role_type)) {
          roleMap.set(item.role_type, { moduleAccess: {}, scopeRules: {} });
        }
        const role = roleMap.get(item.role_type)!;
        const modName = item.college_setting_modules?.module_name;
        const permName = item.college_setting_permissions?.permission_name;
        if (modName && permName) {
          if (!role.moduleAccess[modName]) role.moduleAccess[modName] = [];
          if (!role.moduleAccess[modName].includes(permName)) {
            role.moduleAccess[modName].push(permName);
          }
        }
      }

      for (const item of roleScopeRules as any[]) {
        if (!roleMap.has(item.role_type)) {
          roleMap.set(item.role_type, { moduleAccess: {}, scopeRules: {} });
        }
        const role = roleMap.get(item.role_type)!;
        if (!role.scopeRules[item.scope_type]) role.scopeRules[item.scope_type] = [];
        if (!role.scopeRules[item.scope_type].includes(item.scope_value)) {
          role.scopeRules[item.scope_type].push(item.scope_value);
        }
      }

      const roles = Array.from(roleMap.entries()).map(([roleType, data]) => ({
        roleType,
        moduleAccess: data.moduleAccess,
        scopeRules: data.scopeRules,
      }));

      return apiSuccess({ roles }, context.request);
    }

    if (subPath === 'departments') {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return apiSuccess({ departments: data || [] }, context.request);
    }

    if (subPath === 'programs') {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, code')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return apiSuccess({ programs: data || [] }, context.request);
    }

    return apiError(404, 'NOT_FOUND', `Unknown settings path: ${subPath}`, context.request);
  } catch (error) {
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const url = new URL(context.request.url);
  const subPath = getSubPath(url);
  const user = getContextUser(context);

  const isAdmin = user.roles?.some((r: string) =>
    ['admin', 'super_admin', 'org_admin', 'college_admin', 'university_admin', 'school_admin'].includes(r)
  );
  if (!isAdmin) {
    return apiError(403, 'FORBIDDEN', 'Only admins can modify settings', context.request);
  }

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  try {
    if (subPath === 'roles' && body.action === 'save') {
      const { roleType, modulePermissions, scopeRules } = body;

      if (!roleType) {
        return apiError(400, 'VALIDATION_ERROR', 'roleType is required', context.request);
      }

      const [deletePermResult, deleteScopeResult] = await Promise.all([
        supabase.from('college_role_module_permissions').delete().eq('role_type', roleType),
        supabase.from('college_role_scope_rules').delete().eq('role_type', roleType),
      ]);

      if (deletePermResult.error) throw deletePermResult.error;
      if (deleteScopeResult.error) throw deleteScopeResult.error;

      const { data: modules } = await supabase.from('college_setting_modules').select('id, module_name').eq('is_active', true);
      const { data: permissions } = await supabase.from('college_setting_permissions').select('id, permission_name');

      const moduleMap = new Map((modules || []).map(m => [m.module_name, m.id]));
      const permMap = new Map((permissions || []).map(p => [p.permission_name, p.id]));

      const newPermissions: any[] = [];
      if (Array.isArray(modulePermissions)) {
        for (const ma of modulePermissions) {
          const moduleId = moduleMap.get(ma.module);
          if (!moduleId) continue;
          for (const permName of (ma.permissions || [])) {
            const permId = permMap.get(permName);
            if (permId) {
              newPermissions.push({ role_type: roleType, module_id: moduleId, permission_id: permId });
            }
          }
        }
      }

      const newScopeRules: any[] = [];
      if (Array.isArray(scopeRules)) {
        for (const sr of scopeRules) {
          for (const value of (sr.values || [])) {
            newScopeRules.push({ role_type: roleType, scope_type: sr.type, scope_value: value });
          }
        }
      }

      const insertPromises: Promise<any>[] = [];
      if (newPermissions.length > 0) {
        insertPromises.push(supabase.from('college_role_module_permissions').insert(newPermissions));
      }
      if (newScopeRules.length > 0) {
        insertPromises.push(supabase.from('college_role_scope_rules').insert(newScopeRules));
      }

      const results = await Promise.all(insertPromises);
      for (const r of results) {
        if (r.error) throw r.error;
      }

      return apiSuccess({ success: true }, context.request);
    }

    return apiError(404, 'NOT_FOUND', `Unknown settings path: ${subPath}`, context.request);
  } catch (error) {
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
});
