import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export async function handleGetUsageStatistics(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const userId = context.data.user.sub;

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

    return new Response(
      JSON.stringify({ success: true, data, error: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GetUsageStatistics] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
