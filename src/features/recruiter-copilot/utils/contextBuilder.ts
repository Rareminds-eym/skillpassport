import { supabase } from '../../../lib/supabaseClient';
import { RecruiterContext } from '../types';

/**
 * Build comprehensive recruiter context for AI
 * Fetches recruiter profile and recruitment activities from actual schema
 */
export async function buildRecruiterContext(recruiterId: string): Promise<RecruiterContext> {
  try {
    console.log('🔍 Building recruiter context for:', recruiterId);

    // Fetch recruiter profile
    const { data: recruiter, error: recruiterError } = await supabase
      .from('recruiters')
      .select('id, name, email, phone, state, website, isactive')
      .eq('id', recruiterId)
      .single();

    if (recruiterError || !recruiter) {
      console.warn('⚠️ Recruiter not found, using fallback:', recruiterError?.message);
      return buildFallbackContext();
    }

    // Fetch active opportunities count
    const { count: activeJobsCount } = await supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('recruiter_id', recruiterId)
      .eq('is_active', true);

    // Fetch opportunity IDs first
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id')
      .eq('recruiter_id', recruiterId);

    const opportunityIds = opportunities?.map((o) => o.id) || [];

    // Fetch total candidates in pipeline
    const { count: totalCandidates } =
      opportunityIds.length > 0
        ? await supabase
            .from('pipeline_candidates')
            .select('id', { count: 'exact', head: true })
            .in('opportunity_id', opportunityIds)
        : { count: 0 };

    // Fetch recent opportunities posted
    const { data: recentOpportunities } = await supabase
      .from('opportunities')
      .select('job_title, company_name, employment_type, posted_date, status')
      .eq('recruiter_id', recruiterId)
      .order('posted_date', { ascending: false })
      .limit(5);

    // Build recent activities
    const recentActivities = recentOpportunities?.map(
      (opp) => `Posted "${opp.job_title}" at ${opp.company_name} (${opp.status || 'active'})`
    ) || ['No recent activities'];

    // Identify specializations from posted opportunities
    const { data: oppDepts } = await supabase
      .from('opportunities')
      .select('department')
      .eq('recruiter_id', recruiterId)
      .not('department', 'is', null);

    // @ts-expect-error - Auto-suppressed for migration
    const specializations = [...new Set(oppDepts?.map((o) => o.department).filter(Boolean))] || [];

    // Build context object
    const context: RecruiterContext = {
      name: recruiter.name || 'Recruiter',
      company: recentOpportunities?.[0]?.company_name || 'Multiple Companies',
      department: specializations[0],
      active_jobs: activeJobsCount || 0,
      total_candidates: totalCandidates || 0,
      specializations: specializations.slice(0, 3),
      recent_activities: recentActivities.slice(0, 5),
    };

    console.log('✅ Built recruiter context:', context);
    return context;
  } catch (error) {
    console.error('❌ Error building recruiter context:', error);
    return buildFallbackContext();
  }
}

/**
 * Fallback context when data fetch fails
 */
function buildFallbackContext(): RecruiterContext {
  return {
    name: 'Recruiter',
    company: 'Your Company',
    active_jobs: 0,
    total_candidates: 0,
    specializations: [],
    recent_activities: ['Getting started with recruitment'],
  };
}

/**
 * Helper to format recruiter summary for display
 */
export function formatRecruiterSummary(context: RecruiterContext): string {
  return `
📊 Recruitment Overview:
• ${context.active_jobs} active job posting${context.active_jobs !== 1 ? 's' : ''}
• ${context.total_candidates} candidates in talent pool
• Department: ${context.department || 'Not specified'}
• Specializations: ${context.specializations.join(', ') || 'General'}
  `.trim();
}
