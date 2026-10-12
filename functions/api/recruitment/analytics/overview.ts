/**
 * Overview Analytics API Endpoint
 * Returns key metrics and overview data for the analytics dashboard
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../../lib/auth';
import { PERMISSIONS, verifyOrgAccess } from '../../../lib/permissions';
import { getServiceClient } from '../../../lib/supabase';

interface OverviewFilters {
  from: string | null;
  to: string | null;
  departments: string[];
  locations: string[];
  jobTypes: string[];
  recruiters: string[];
}

/**
 * Parse filters from URL query parameters
 */
function parseFilters(url: URL): OverviewFilters {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const departments = url.searchParams.get('departments')?.split(',').filter(Boolean) || [];
  const locations = url.searchParams.get('locations')?.split(',').filter(Boolean) || [];
  const jobTypes = url.searchParams.get('jobTypes')?.split(',').filter(Boolean) || [];
  const recruiters = url.searchParams.get('recruiters')?.split(',').filter(Boolean) || [];

  return { from, to, departments, locations, jobTypes, recruiters };
}

/**
 * Calculate trend percentage
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * GET /api/recruitment/analytics/overview
 * Returns overview metrics including:
 * - Active jobs count
 * - Total pipeline candidates
 * - Hires this period
 * - Average time to hire
 * - Pipeline funnel data
 * - Hiring trend
 * - Action items
 * - Quick stats
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('org_id') || user.org_id;

  if (!orgId) {
    return Response.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  // Verify user has access
  const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.VIEW_ANALYTICS);
  if (!access.allowed) {
    return access.error!;
  }

  try {
    const filters = parseFilters(url);
    const now = new Date();
    const dateFrom = filters.from ? new Date(filters.from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.to ? new Date(filters.to) : now;

    // Calculate previous period for trends
    const periodDays = Math.floor((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    const previousFrom = new Date(dateFrom.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousTo = dateFrom;

    // ============================================================================
    // 1. Active Jobs Count
    // ============================================================================
    let jobsQuery = supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (filters.departments.length > 0) {
      jobsQuery = jobsQuery.in('department', filters.departments);
    }
    if (filters.locations.length > 0) {
      jobsQuery = jobsQuery.in('location', filters.locations);
    }
    if (filters.jobTypes.length > 0) {
      jobsQuery = jobsQuery.in('employment_type', filters.jobTypes);
    }

    const { count: activeJobsCount } = await jobsQuery;

    // Previous period active jobs
    let prevJobsQuery = supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .gte('created_at', previousFrom.toISOString())
      .lte('created_at', previousTo.toISOString());

    if (filters.departments.length > 0) prevJobsQuery = prevJobsQuery.in('department', filters.departments);
    if (filters.locations.length > 0) prevJobsQuery = prevJobsQuery.in('location', filters.locations);
    if (filters.jobTypes.length > 0) prevJobsQuery = prevJobsQuery.in('employment_type', filters.jobTypes);

    const { count: previousActiveJobs } = await prevJobsQuery;

    // ============================================================================
    // 2. Total Pipeline Candidates
    // ============================================================================
    let pipelineQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active');

    if (filters.recruiters.length > 0) {
      pipelineQuery = pipelineQuery.in('added_by_uuid', filters.recruiters);
    }

    const { count: pipelineCount } = await pipelineQuery;

    // Previous period pipeline
    let prevPipelineQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .gte('added_at', previousFrom.toISOString())
      .lte('added_at', previousTo.toISOString());

    if (filters.recruiters.length > 0) prevPipelineQuery = prevPipelineQuery.in('added_by_uuid', filters.recruiters);

    const { count: previousPipeline } = await prevPipelineQuery;

    // ============================================================================
    // 3. Hires This Period
    // ============================================================================
    let hiresQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('stage', 'hired')
      .gte('stage_changed_at', dateFrom.toISOString())
      .lte('stage_changed_at', dateTo.toISOString());

    if (filters.recruiters.length > 0) hiresQuery = hiresQuery.in('added_by_uuid', filters.recruiters);

    const { count: hiresCount } = await hiresQuery;

    // Previous period hires
    let prevHiresQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('stage', 'hired')
      .gte('stage_changed_at', previousFrom.toISOString())
      .lte('stage_changed_at', previousTo.toISOString());

    if (filters.recruiters.length > 0) prevHiresQuery = prevHiresQuery.in('added_by_uuid', filters.recruiters);

    const { count: previousHires } = await prevHiresQuery;

    // ============================================================================
    // 4. Average Time to Hire
    // ============================================================================
    let timeToHireQuery = supabase
      .from('pipeline_candidates')
      .select('added_at, stage_changed_at')
      .eq('organization_id', orgId)
      .eq('stage', 'hired')
      .gte('stage_changed_at', dateFrom.toISOString())
      .lte('stage_changed_at', dateTo.toISOString());

    if (filters.recruiters.length > 0) timeToHireQuery = timeToHireQuery.in('added_by_uuid', filters.recruiters);

    const { data: hiredCandidates } = await timeToHireQuery;

    let avgTimeToHire = 0;
    if (hiredCandidates && hiredCandidates.length > 0) {
      const totalDays = hiredCandidates.reduce((sum, candidate) => {
        const added = new Date(candidate.added_at).getTime();
        const hired = new Date(candidate.stage_changed_at).getTime();
        const days = Math.floor((hired - added) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgTimeToHire = Math.round(totalDays / hiredCandidates.length);
    }

    // Previous period avg time to hire
    let prevTimeToHireQuery = supabase
      .from('pipeline_candidates')
      .select('added_at, stage_changed_at')
      .eq('organization_id', orgId)
      .eq('stage', 'hired')
      .gte('stage_changed_at', previousFrom.toISOString())
      .lte('stage_changed_at', previousTo.toISOString());

    if (filters.recruiters.length > 0) prevTimeToHireQuery = prevTimeToHireQuery.in('added_by_uuid', filters.recruiters);

    const { data: prevHiredCandidates } = await prevTimeToHireQuery;

    let previousAvgTimeToHire = 0;
    if (prevHiredCandidates && prevHiredCandidates.length > 0) {
      const totalDays = prevHiredCandidates.reduce((sum, candidate) => {
        const added = new Date(candidate.added_at).getTime();
        const hired = new Date(candidate.stage_changed_at).getTime();
        const days = Math.floor((hired - added) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      previousAvgTimeToHire = Math.round(totalDays / prevHiredCandidates.length);
    }

    // ============================================================================
    // 5. Pipeline Funnel Data
    // ============================================================================
    const stages = ['sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired'];
    const pipelineFunnel = [];

    for (const stage of stages) {
      let stageQuery = supabase
        .from('pipeline_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('stage', stage);

      if (filters.recruiters.length > 0) stageQuery = stageQuery.in('added_by_uuid', filters.recruiters);

      const { count } = await stageQuery;

      pipelineFunnel.push({
        stage: stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        count: count || 0,
      });
    }

    // Calculate conversion percentages
    if (pipelineFunnel.length > 0 && pipelineFunnel[0].count > 0) {
      const totalSourced = pipelineFunnel[0].count;
      pipelineFunnel.forEach((item) => {
        item.conversion = totalSourced > 0 ? Math.round((item.count / totalSourced) * 100) : 0;
      });
    }

    // ============================================================================
    // 6. Hiring Trend (Last 6 months by month)
    // ============================================================================
    const hiringTrend = [];
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      let monthHiresQuery = supabase
        .from('pipeline_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('stage', 'hired')
        .gte('stage_changed_at', monthStart.toISOString())
        .lte('stage_changed_at', monthEnd.toISOString());

      if (filters.recruiters.length > 0) monthHiresQuery = monthHiresQuery.in('added_by_uuid', filters.recruiters);

      const { count: monthHires } = await monthHiresQuery;

      hiringTrend.push({
        date: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        hires: monthHires || 0,
      });
    }

    // ============================================================================
    // 7. Action Items (Things needing attention)
    // ============================================================================
    const actionItems = [];

    // Overdue candidates (next_action_date in past)
    const { count: overdueCount } = await supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .lt('next_action_date', now.toISOString())
      .not('next_action_date', 'is', null);

    if (overdueCount && overdueCount > 0) {
      actionItems.push({
        id: 'overdue_candidates',
        type: 'overdue_candidates',
        title: 'Candidates with overdue actions',
        count: overdueCount,
        severity: 'high',
      });
    }

    // Expiring invitations (expires in next 3 days)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const { count: expiringCount } = await supabase
      .from('organization_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', threeDaysFromNow.toISOString());

    if (expiringCount && expiringCount > 0) {
      actionItems.push({
        id: 'expiring_invitations',
        type: 'expiring_invitations',
        title: 'Invitations expiring soon',
        count: expiringCount,
        severity: 'medium',
      });
    }

    // Jobs past closing date
    const { count: pastDeadlineCount } = await supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .lt('closing_date', now.toISOString())
      .not('closing_date', 'is', null);

    if (pastDeadlineCount && pastDeadlineCount > 0) {
      actionItems.push({
        id: 'past_deadline_jobs',
        type: 'past_deadline_jobs',
        title: 'Jobs past closing date',
        count: pastDeadlineCount,
        severity: 'medium',
      });
    }

    // ============================================================================
    // 8. Quick Stats
    // ============================================================================
    const { data: jobsByStatus } = await supabase
      .from('opportunities')
      .select('status')
      .eq('organization_id', orgId);

    const statusCounts = {
      active: 0,
      draft: 0,
      closed: 0,
      paused: 0,
    };

    jobsByStatus?.forEach((job) => {
      if (job.status in statusCounts) {
        statusCounts[job.status as keyof typeof statusCounts]++;
      }
    });

    // Top department
    const { data: deptData } = await supabase
      .from('opportunities')
      .select('department')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    const deptCounts: Record<string, number> = {};
    deptData?.forEach((job) => {
      if (job.department) {
        deptCounts[job.department] = (deptCounts[job.department] || 0) + 1;
      }
    });

    const topDepartment = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];

    // ============================================================================
    // Build Response
    // ============================================================================
    const response = {
      success: true,
      data: {
        metrics: {
          activeJobs: {
            count: activeJobsCount || 0,
            trend: {
              value: calculateTrend(activeJobsCount || 0, previousActiveJobs || 0),
              label: 'vs previous period',
              isPositive: (activeJobsCount || 0) >= (previousActiveJobs || 0),
            },
          },
          totalPipeline: {
            count: pipelineCount || 0,
            trend: {
              value: calculateTrend(pipelineCount || 0, previousPipeline || 0),
              label: 'vs previous period',
              isPositive: (pipelineCount || 0) >= (previousPipeline || 0),
            },
          },
          hiresThisMonth: {
            count: hiresCount || 0,
            trend: {
              value: calculateTrend(hiresCount || 0, previousHires || 0),
              label: 'vs previous period',
              isPositive: (hiresCount || 0) >= (previousHires || 0),
            },
          },
          avgTimeToHire: {
            days: avgTimeToHire,
            trend: {
              value: previousAvgTimeToHire > 0 
                ? Math.abs(calculateTrend(avgTimeToHire, previousAvgTimeToHire))
                : 0,
              label: 'vs previous period',
              isPositive: avgTimeToHire < previousAvgTimeToHire,
            },
          },
        },
        pipelineFunnel,
        hiringTrend,
        actionItems,
        quickStats: {
          jobsByStatus: statusCounts,
          topDepartment: topDepartment
            ? { name: topDepartment[0], count: topDepartment[1] }
            : { name: 'N/A', count: 0 },
        },
      },
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error: any) {
    console.error('[analytics-overview] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch overview analytics',
        details: error.message,
      },
      { status: 500 }
    );
  }
});
