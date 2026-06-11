import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../../../lib/auth';
import { apiDbError, apiMethodNotAllowed, apiSuccess } from '../../../../lib/response';
import { getServiceClient } from '../../../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const body: any = await context.request.json();
  const { action } = body;
  const startTime = Date.now();

  try {
    switch (action) {
      case 'resolve-college-id': {
        const user = getContextUser(context);

        const { data: lecturerData } = await supabase
          .from('college_lecturers')
          .select('collegeId')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        let collegeId = lecturerData?.collegeId;

        if (!collegeId) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id')
            .eq('admin_id', user.id)
            .eq('organization_type', 'college')
            .maybeSingle();

          collegeId = orgData?.id;
        }

        return apiSuccess({ collegeId: collegeId || null }, context.request, { startTime });
      }

      default:
        return apiSuccess({ collegeId: null }, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[placement/handlers POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
