import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleGetUsageStatistics(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const user = getContextUser(context);
  const userId = user.id;

  try {
    const supabase = getServiceClient(env);

    // Fetch in parallel
    const [assessmentsRes, profileViewsRes, reportsRes] = await Promise.all([
      supabase.from('personal_assessment_results').select('*', { count: 'exact', head: true }).eq('learner_id', userId),
      supabase.from('profile_views').select('*', { count: 'exact', head: true }).eq('learner_id', userId),
      supabase.from('learner_reports').select('*', { count: 'exact', head: true }).eq('learner_id', userId)
    ]);

    const data = {
      assessments: { used: assessmentsRes.count || 0, label: 'Skill Assessments' },
      profileViews: { used: profileViewsRes.count || 0, label: 'Profile Views' },
      reports: { used: reportsRes.count || 0, label: 'Reports Generated' }
    };

    return apiSuccess(data, context.request, 200);
  } catch (error) {
    console.error('[GetUsageStatistics] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
