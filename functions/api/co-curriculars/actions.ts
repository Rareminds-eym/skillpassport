import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'fetch-co-curriculars': {
        const { userEmail } = params as { userEmail: string };
        if (!userEmail) return apiError(400, 'VALIDATION_ERROR', 'userEmail is required', context.request, { startTime });

        const [membershipsRes, resultsRes, certificatesRes, memberCountsRes] = await Promise.all([
          supabase
            .from('club_memberships')
            .select(`membership_id, club_id, learner_email, status, enrolled_at, total_sessions_attended, total_sessions_held, attendance_percentage, performance_score, clubs!inner(club_id, name, category, description, meeting_day, meeting_time, location, capacity, is_active)`)
            .eq('learner_email', userEmail)
            .eq('status', 'active'),
          supabase
            .from('competition_results')
            .select(`result_id, rank, score, award, performance_notes, competitions!inner(comp_id, name, level, category, competition_date, status)`)
            .eq('learner_email', userEmail)
            .order('rank', { ascending: true }),
          supabase
            .from('club_certificates')
            .select(`certificate_id, title, description, certificate_type, issued_date, credential_id, metadata, competitions(name, level, category)`)
            .eq('learner_email', userEmail)
            .order('issued_date', { ascending: false }),
          supabase
            .from('club_memberships')
            .select('club_id')
            .eq('status', 'active'),
        ]);

        if (membershipsRes.error) return apiDbError(membershipsRes.error, context.request, { startTime });
        if (resultsRes.error) return apiDbError(resultsRes.error, context.request, { startTime });
        if (certificatesRes.error) return apiDbError(certificatesRes.error, context.request, { startTime });
        if (memberCountsRes.error) return apiDbError(memberCountsRes.error, context.request, { startTime });

        return apiSuccess({
          memberships: membershipsRes.data,
          results: resultsRes.data,
          certificates: certificatesRes.data,
          memberCounts: memberCountsRes.data,
        }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[co-curriculars/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
