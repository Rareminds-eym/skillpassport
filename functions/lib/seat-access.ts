import type { AuthenticatedContext, VerifiedAuthUser } from '@rareminds-eym/auth-core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { apiDbError, apiError } from './response';

export type SeatRequestContext = AuthenticatedContext & { request: Request; env: Record<string, unknown>; data: { user: VerifiedAuthUser } };

const SEAT_ADMIN_ROLES = new Set(['owner', 'admin', 'school_admin', 'college_admin', 'university_admin', 'company_admin']);

/** Service-client seat operations must authorize the tenant before reading or writing it. */
export async function authorizeSeatOrganization(
  supabase: SupabaseClient, userId: string, organizationId: string, request: Request, admin = false,
): Promise<Response | null> {
  if (!organizationId) return apiError(400, 'VALIDATION_ERROR', 'Organization is required', request);
  const { data, error } = await supabase.from('organization_members').select('role')
    .eq('user_id', userId).eq('organization_id', organizationId).eq('status', 'active').maybeSingle();
  if (error) return apiDbError(error, request);
  if (!data || (admin && !SEAT_ADMIN_ROLES.has(data.role))) {
    return apiError(403, 'FORBIDDEN', admin ? 'Organization administrator access required' : 'Not a member of this organization', request);
  }
  return null;
}

export function seatRpcError(error: { code?: string; message: string }, request: Request): Response {
  if (error.code === '42501') return apiError(403, 'FORBIDDEN', error.message, request);
  if (['22023', '23514', '23505', 'P0002'].includes(error.code ?? '')) {
    return apiError(error.code === 'P0002' ? 404 : 409, 'SEAT_CONFLICT', error.message, request);
  }
  return apiDbError(error, request);
}
