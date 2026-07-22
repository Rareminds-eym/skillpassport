/**
 * Recruiter API Middleware
 * 
 * Automatically injects organization context into all recruiter endpoints.
 * This ensures all recruiter actions are scoped to the user's organization.
 */

import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiError } from '../../lib/response';

export interface RecruiterContext extends AuthenticatedContext {
  data: AuthenticatedContext['data'] & {
    organizationId: string;
  };
}

/**
 * Middleware that runs before all /api/recruiter/* endpoints.
 * 
 * Adds organizationId to context.data so all handlers automatically have it.
 * Handlers can access via: context.data.organizationId
 */
export const onRequest = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    // Fetch user's organization from organization_members table
    const { data: memberData, error } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !memberData?.organization_id) {
      console.error('[recruiter-middleware] Failed to get organization:', {
        userId: user.id,
        error: error?.message,
        errorDetails: error
      });

      return apiError(
        403,
        'ORGANIZATION_NOT_FOUND',
        'User is not associated with any organization. Please contact support.',
        context.request
      );
    }

    // Inject organizationId into context for all downstream handlers
    (context.data as any).organizationId = memberData.organization_id;

    console.log('[recruiter-middleware] Organization context injected:', {
      userId: user.id,
      email: user.email,
      organizationId: memberData.organization_id
    });

    // Continue to the actual handler
    return context.next();
  } catch (error) {
    console.error('[recruiter-middleware] Unexpected error:', error);
    return apiError(
      500,
      'INTERNAL_ERROR',
      'Failed to load organization context',
      context.request
    );
  }
});
