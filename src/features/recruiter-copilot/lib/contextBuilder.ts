import { apiPost } from '@/shared/api/apiClient';
import { RecruiterContext } from '@/features/learner-profile/model';

export async function buildRecruiterContext(recruiterId: string): Promise<RecruiterContext> {
  try {
    const recruiter = await apiPost<any | null>('/recruiter-copilot', {
      action: 'fetch-recruiter-by-id',
      id: recruiterId,
    });

    if (!recruiter) {
      return buildFallbackContext();
    }

    const activeJobsCount = await apiPost<number>('/recruiter-copilot', {
      action: 'count-active-opportunities',
      recruiter_id: recruiterId,
    });

    const opportunities = await apiPost<any[]>('/recruiter-copilot', {
      action: 'fetch-opportunities-basic',
      recruiter_id: recruiterId,
    });

    const opportunityIds = opportunities?.map((o: any) => o.id) || [];

    const totalCandidates = opportunityIds.length > 0
      ? await apiPost<number>('/recruiter-copilot', {
          action: 'fetch-pipeline-candidates',
          opportunity_ids: opportunityIds,
        }).then((data: any) => Array.isArray(data) ? data.length : 0)
      : 0;

    const recentOpportunities = await apiPost<any[]>('/recruiter-copilot', {
      action: 'fetch-opportunities-recent',
      recruiter_id: recruiterId,
      limit: 5,
    });

    const recentActivities = recentOpportunities?.map((opp: any) =>
      `Posted "${opp.job_title}" at ${opp.company_name} (${opp.status || 'active'})`
    ) || ['No recent activities'];

    const oppDepts = await apiPost<any[]>('/recruiter-copilot', {
      action: 'fetch-opportunities-departments',
      recruiter_id: recruiterId,
    });

    const specializations = [...new Set(oppDepts?.map((o: any) => o.department).filter(Boolean))] || [];

    const context: RecruiterContext = {
      name: recruiter.name || 'Recruiter',
      company: recentOpportunities?.[0]?.company_name || 'Multiple Companies',
      department: specializations[0],
      active_jobs: activeJobsCount || 0,
      total_candidates: totalCandidates || 0,
      specializations: specializations.slice(0, 3),
      recent_activities: recentActivities.slice(0, 5),
    };

    return context;
  } catch {
    return buildFallbackContext();
  }
}

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

export function formatRecruiterSummary(context: RecruiterContext): string {
  return `
Recruitment Overview:
• ${context.active_jobs} active job posting${context.active_jobs !== 1 ? 's' : ''}
• ${context.total_candidates} candidates in talent pool
• Department: ${context.department || 'Not specified'}
• Specializations: ${context.specializations.join(', ') || 'General'}
  `.trim();
}
