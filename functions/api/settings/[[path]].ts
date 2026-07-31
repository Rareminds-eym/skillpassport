import type { AuthenticatedContext, ContextWithUser } from '@rareminds-eym/auth-core';
import { requireAdmin, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

function getSubPath(url: URL): string {
  return url.pathname.replace(/^\/api\/settings\/?/, '');
}

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env;
  const supabase = getServiceClient(env);
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
      // P4 task 20.3: read the role key from the app-owned `role_code` column
      // (FK → school_internal_roles.code) instead of the legacy `role_type`
      // (`user_role` enum). Correct once Expand (20.1) + backfill (20.2) are
      // applied — the backfill sets role_code = role_type for every row, so this
      // returns the SAME roles the old role_type read produced (behavior preserved).
      // The external response field stays `roleType` for API-contract stability;
      // it is now SOURCED from role_code (the two are equal post-backfill).
      const [permResult, scopeResult] = await Promise.all([
        supabase
          .from('college_role_module_permissions')
          .select('role_code, college_setting_modules!inner(id, module_name), college_setting_permissions!inner(id, permission_name)'),
        supabase
          .from('college_role_scope_rules')
          .select('role_code, scope_type, scope_value')
      ]);

      if (permResult.error) throw permResult.error;
      if (scopeResult.error) throw scopeResult.error;

      const rolePermissions = permResult.data || [];
      const roleScopeRules = scopeResult.data || [];

      const roleMap = new Map<string, { moduleAccess: Record<string, string[]>; scopeRules: Record<string, string[]> }>();

      for (const item of rolePermissions as any[]) {
        if (item.role_code == null) continue; // skip un-backfilled legacy rows (defensive)
        if (!roleMap.has(item.role_code)) {
          roleMap.set(item.role_code, { moduleAccess: {}, scopeRules: {} });
        }
        const role = roleMap.get(item.role_code)!;
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
        if (item.role_code == null) continue; // skip un-backfilled legacy rows (defensive)
        if (!roleMap.has(item.role_code)) {
          roleMap.set(item.role_code, { moduleAccess: {}, scopeRules: {} });
        }
        const role = roleMap.get(item.role_code)!;
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

export const onRequestPost = withAuth(requireAdmin(async (context: ContextWithUser) => {
  const env = context.env;
  const supabase = getServiceClient(env);
  const url = new URL(context.request.url);
  const subPath = getSubPath(url);

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

      // P4 task 22.2 — single-key WRITE path (role_code only).
      // ────────────────────────────────────────────────────────────────────
      // The legacy `role_type` (`user_role` enum) columns were DROPPED in
      // migration 20260603000007 (task 22.2), and `public.user_role` was dropped
      // with them. `role_code` (FK → school_internal_roles.code) is now the SOLE
      // role key on both college permission tables, matching the read paths
      // (get-permissions, settings GET 'roles'). The earlier transition dual-write
      // (role_type + role_code) is therefore removed: we write and delete by
      // `role_code` only.
      //
      // FK PREREQUISITE: `roleType` here is the College-Admin-Settings role key —
      // 'college_admin' or 'college_educator' (see Settings.tsx). Writing it into
      // `role_code` requires those codes to exist in `school_internal_roles`; the
      // 17.2/20.3 seed adds college_admin/college_educator/school_educator so this
      // insert satisfies the role_code FK.
      //
      // DELETE-before-insert matches on `role_code`, removing ALL prior rows for
      // the role so the re-insert cannot collide on the replacement
      // UNIQUE(role_code, …) constraints (added in migration 20260603000007).
      const [deletePermResult, deleteScopeResult] = await Promise.all([
        supabase.from('college_role_module_permissions').delete().eq('role_code', roleType),
        supabase.from('college_role_scope_rules').delete().eq('role_code', roleType),
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
              // role_code is the sole role key (role_type dropped in 20260603000007).
              newPermissions.push({ role_code: roleType, module_id: moduleId, permission_id: permId });
            }
          }
        }
      }

      const newScopeRules: any[] = [];
      if (Array.isArray(scopeRules)) {
        for (const sr of scopeRules) {
          for (const value of (sr.values || [])) {
            // role_code is the sole role key (role_type dropped in 20260603000007).
            newScopeRules.push({ role_code: roleType, scope_type: sr.type, scope_value: value });
          }
        }
      }

      const insertPromises: PromiseLike<any>[] = [];
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
}));
