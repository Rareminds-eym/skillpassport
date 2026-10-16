/**
 * API: Entitlement Manifest Endpoint
 * GET /api/entitlement-manifest
 * 
 * Returns the resolved capability and credit manifest for the current authenticated tenant.
 * Frontend queries this manifest instead of inspecting hardcoded plan codes.
 */

import { withAuth, getContextUser } from '../lib/auth';
import { apiError, apiSuccess } from '../lib/response';
import { getServiceClient } from '../lib/supabase';
import type { PagesEnv } from '../lib/types';
import { getTenantEntitlements } from '../shared/lib/entitlement-service';

export const onRequestGet = withAuth(async (context: any) => {
  const user = getContextUser(context);
  if (!user?.id) {
    return apiError(401, 'UNAUTHORIZED', 'Authentication required', context.request);
  }

  const url = new URL(context.request.url);
  const requestedFamily = url.searchParams.get('family') as 'recruiter' | 'individual' | 'institution' | null;

  try {
    const supabase = getServiceClient(context.env as unknown as PagesEnv);

    // Determine tenant ID:
    // If the user belongs to an organization (e.g. recruiter or institution member), tenant is org_id.
    // Otherwise, tenant is personal user.id.
    let tenantId = user.org_id;
    if (!tenantId) {
      const { data: u } = await supabase
        .from('users')
        .select('"organizationId"')
        .eq('id', user.id)
        .maybeSingle();
      if (u?.organizationId) {
        tenantId = u.organizationId;
      } else {
        const { data: mem } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        tenantId = mem?.organization_id;
      }
    }
    if (!tenantId) {
      tenantId = user.id;
    }

    // Detect family: recruiters default to 'recruiter', learners to 'individual'
    const roles: string[] = Array.isArray(user.roles)
      ? user.roles
      : [user.role, (user as any)?.role_name].filter(Boolean);
    const isRecruiter = roles.some((r: string) => String(r).toLowerCase().includes('recruiter') || r === 'owner');
    const defaultFamily = isRecruiter ? 'recruiter' : 'individual';
    const family = requestedFamily || defaultFamily;

    const manifest = await getTenantEntitlements(supabase, tenantId, family);

    return apiSuccess(manifest, context.request);
  } catch (error: any) {
    return apiError(
      500,
      'MANIFEST_RESOLUTION_FAILED',
      error?.message || 'Failed to resolve entitlement manifest',
      context.request
    );
  }
});

export const onRequestOptions = async () => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
});
