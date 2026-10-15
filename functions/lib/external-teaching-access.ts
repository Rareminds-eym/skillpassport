import type { VerifiedAuthUser } from '@rareminds-eym/auth-core';
import { getServiceClient } from './supabase';

/** A delegated employee grant allows ONLY the scoped teaching API, not general educator/billing APIs. */
export async function guardExternalTeachingRequest(user: VerifiedAuthUser, env: any, request: Request): Promise<Response | null> {
  if (!user.roles?.some(role => ['educator', 'rm_trainer', 'trainer'].includes(role)) && user.user_metadata?.portal_mode !== 'assigned_trainer') return null;
  const { data: staff, error } = await getServiceClient(env).from('organization_staff')
    .select('id, account_status, metadata').eq('user_id', user.sub)
    .eq('organization_id', '00000000-0000-0000-0000-000000000001').maybeSingle();
  if (error) return Response.json({ error: 'Educator access could not be verified', code: 'TEACHING_ACCESS_UNAVAILABLE' }, { status: 503 });
  if (!staff) {
    return user.user_metadata?.portal_mode === 'assigned_trainer'
      ? Response.json({ error: 'Educator profile needs administrator recovery', code: 'TEACHING_PROFILE_INCOMPLETE' }, { status: 403 }) : null;
  }
  const path = new URL(request.url).pathname;
  if (staff.account_status !== 'active') return Response.json({ error: 'Educator access is inactive', code: 'TEACHING_ACCESS_INACTIVE' }, { status: 403 });
  if (path.startsWith('/api/teaching/')) {
    const body = staff.metadata?.teaching_access_enabled !== true && path === '/api/teaching/actions'
      ? await request.clone().json().catch(() => null) as { action?: unknown } | null : null;
    // Context stays available with an empty mapping so onboarding can show its truthful state.
    if (staff.metadata?.teaching_access_enabled !== true && !(path === '/api/teaching/actions' &&
      body?.action === 'context')) {
      return Response.json({ error: 'Platform teaching access must be granted by an administrator', code: 'TEACHING_ACCESS_PENDING' }, { status: 403 });
    }
    return null;
  }
  if (path === '/api/auth/change-password' || path === '/api/college-admin/assignments' || path === '/api/college-admin/classes') return null;
  return Response.json({ error: 'This module is not included in assigned teaching access', code: 'TEACHING_MODULE_DENIED' }, { status: 403 });
}
