import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleGetOpportunities(env: any, request: Request): Promise<Response> {
  try {
    const supabase = createSupabaseAdminClient(env);
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching opportunities:', error);
      return apiSuccess([], request);
    }

    const parsed = (data || []).map((opp: any) => ({
      ...opp,
      skills_required: Array.isArray(opp.skills_required)
        ? opp.skills_required
        : typeof opp.skills_required === 'string'
          ? (() => { try { return JSON.parse(opp.skills_required); } catch { return opp.skills_required.split(',').map((s: string) => s.trim()).filter(Boolean); } })()
          : [],
    }));

    return apiSuccess(parsed, request);
  } catch (error) {
    console.error('[ERROR] opportunities:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch opportunities', request);
  }
}
