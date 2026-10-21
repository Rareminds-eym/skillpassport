/**
 * Trends Analytics API Endpoint
 * Returns historical trend data for hiring velocity, time-to-hire, and conversion rates
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../../lib/auth';
import { PERMISSIONS, verifyOrgAccess } from '../../../lib/permissions';
import { getServiceClient } from '../../../lib/supabase';

interface TrendsFilters {
  from: string | null;
  to: string | null;
  departments: string[];
  locations: string[];
  jobTypes: string[];
  recruiters: string[];
  granularity: 'monthly' | 'weekly';
}

function parseFilters(url: URL): TrendsFilters {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const departments = url.searchParams.get('departments')?.split(',').filter(Boolean) || [];
  const locations = url.searchParams.get('locations')?.split(',').filter(Boolean) || [];
  const jobTypes = url.searchParams.get('jobTypes')?.split(',').filter(Boolean) || [];
  const recruiters = url.searchParams.get('recruiters')?.split(',').filter(Boolean) || [];
  const granularity = (url.searchParams.get('granularity') || 'monthly') as 'monthly' | 'weekly';

  return { from, to, departments, locations, jobTypes, recruiters, granularity };
}

/**
 * GET /api/recruitment/analytics/trends
 * Returns trends data including:
 * - Hiring velocity (jobs posted, candidates added, hires)
 * - Time to hire trend
 * - Conversion rate trend
 * - Month-over-month and year-over-year comparisons
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

  const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.VIEW_ANALYTICS);
  if (!access.allowed) {
    return access.error!;
  }

  try {
    const filters = parseFilters(url);
    const now = new Date();
    
    // Default to last 6 months if no date range specified
    const dateFrom = filters.from ? new Date(filters.from) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const dateTo = filters.to ? new Date(filters.to) : now;

    // ============================================================================
    // 1. Generate time periods
    // ============================================================================
    const periods: Array<{ start: Date; end: Date; label: string }> = [];
    
    if (filters.granularity === 'monthly') {
      let current = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1);
      const endDate = new Date(dateTo.getFullYear(), dateTo.getMonth(), 1);

      while (current <= endDate) {
        const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        periods.push({
          start: new Date(current),
          end: periodEnd,
          label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
    } else {
      // Weekly granularity
      let current = new Date(dateFrom);
      while (current <= dateTo) {
        const periodEnd = new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000);
        periods.push({
          start: new Date(current),
          end: periodEnd > dateTo ? dateTo : periodEnd,
          label: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
        current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    // ============================================================================
    // 2. Calculate metrics for each period
    // ============================================================================
    const trendData = [];

    for (const period of periods) {
      // Jobs posted in this period
      let jobsQuery = supabase
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', period.start.toISOString())
        .lte('created_at', period.end.toISOString());

      if (filters.departments.length > 0) jobsQuery = jobsQuery.in('department', filters.departments);
      if (filters.locations.length > 0) jobsQuery = jobsQuery.in('location', filters.locations);
      if (filters.jobTypes.length > 0) jobsQuery = jobsQuery.in('employment_type', filters.jobTypes);

      const { count: jobsPosted } = await jobsQuery;

      // Candidates added in this period
      let candidatesQuery = supabase
        .from('pipeline_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('added_at', period.start.toISOString())
        .lte('added_at', period.end.toISOString());

      if (filters.recruiters.length > 0) candidatesQuery = candidatesQuery.in('added_by_uuid', filters.recruiters);

      const { count: candidatesAdded } = await candidatesQuery;

      // Hires in this period
      let hiresQuery = supabase
        .from('pipeline_candidates')
        .select('id, added_at, stage_changed_at', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('stage', 'hired')
        .gte('stage_changed_at', period.start.toISOString())
        .lte('stage_changed_at', period.end.toISOString());

      if (filters.recruiters.length > 0) hiresQuery = hiresQuery.in('added_by_uuid', filters.recruiters);

      const { count: hires, data: hiredCandidates } = await hiresQuery;

      // Calculate avg time to hire for this period
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

      // Calculate conversion rate (hired / candidates added)
      const conversionRate = candidatesAdded ? Math.round((hires || 0) / candidatesAdded * 100) : 0;

      // Calculate application rate (applications / views) for jobs in this period
      let appRateQuery = supabase
        .from('opportunities')
        .select('applications_count, views_count')
        .eq('organization_id', orgId)
        .gte('created_at', period.start.toISOString())
        .lte('created_at', period.end.toISOString());

      if (filters.departments.length > 0) appRateQuery = appRateQuery.in('department', filters.departments);
      if (filters.locations.length > 0) appRateQuery = appRateQuery.in('location', filters.locations);
      if (filters.jobTypes.length > 0) appRateQuery = appRateQuery.in('employment_type', filters.jobTypes);

      const { data: jobsWithMetrics } = await appRateQuery;

      let totalApps = 0;
      let totalViews = 0;
      (jobsWithMetrics || []).forEach((job) => {
        totalApps += job.applications_count || 0;
        totalViews += job.views_count || 0;
      });

      const applicationRate = totalViews ? Math.round((totalApps / totalViews) * 100) : 0;

      trendData.push({
        date: period.label,
        jobsPosted: jobsPosted || 0,
        candidatesAdded: candidatesAdded || 0,
        hires: hires || 0,
        avgTimeToHire,
        conversionRate,
        applicationRate,
      });
    }

    // ============================================================================
    // 3. Time to Hire Trend (with min/max)
    // ============================================================================
    const timeToHireTrend = [];

    for (const period of periods) {
      let timeQuery = supabase
        .from('pipeline_candidates')
        .select('added_at, stage_changed_at')
        .eq('organization_id', orgId)
        .eq('stage', 'hired')
        .gte('stage_changed_at', period.start.toISOString())
        .lte('stage_changed_at', period.end.toISOString());

      if (filters.recruiters.length > 0) timeQuery = timeQuery.in('added_by_uuid', filters.recruiters);

      const { data: hiredInPeriod } = await timeQuery;

      if (hiredInPeriod && hiredInPeriod.length > 0) {
        const times = hiredInPeriod.map((candidate) => {
          const added = new Date(candidate.added_at).getTime();
          const hired = new Date(candidate.stage_changed_at).getTime();
          return Math.floor((hired - added) / (1000 * 60 * 60 * 24));
        });

        const avg = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
        const min = Math.min(...times);
        const max = Math.max(...times);

        timeToHireTrend.push({
          date: period.label,
          avg,
          min,
          max,
        });
      } else {
        timeToHireTrend.push({
          date: period.label,
          avg: 0,
          min: 0,
          max: 0,
        });
      }
    }

    // ============================================================================
    // 4. Month-over-Month Comparison
    // ============================================================================
    const currentPeriod = trendData[trendData.length - 1];
    const previousPeriod = trendData[trendData.length - 2];

    const monthOverMonth = [];

    if (currentPeriod && previousPeriod) {
      const metrics = [
        { metric: 'Jobs Posted', current: currentPeriod.jobsPosted, previous: previousPeriod.jobsPosted },
        { metric: 'Candidates Added', current: currentPeriod.candidatesAdded, previous: previousPeriod.candidatesAdded },
        { metric: 'Hires', current: currentPeriod.hires, previous: previousPeriod.hires },
        { metric: 'Time to Hire', current: currentPeriod.avgTimeToHire, previous: previousPeriod.avgTimeToHire },
        { metric: 'Conversion Rate', current: currentPeriod.conversionRate, previous: previousPeriod.conversionRate },
      ];

      metrics.forEach(({ metric, current, previous }) => {
        const currentValue = current || 0;
        const previousValue = previous || 0;
        const change = previousValue === 0 
          ? (currentValue > 0 ? 100 : 0)
          : Math.round(((currentValue - previousValue) / previousValue) * 100);
        
        // For time to hire, lower is better
        const isPositive = metric === 'Time to Hire' 
          ? currentValue < previousValue
          : currentValue >= previousValue;

        monthOverMonth.push({
          metric,
          currentValue,
          previousValue,
          change,
          isPositive,
        });
      });
    }

    // ============================================================================
    // 5. Year-over-Year (if data available)
    // ============================================================================
    const yearOverYear: typeof monthOverMonth = [];

    // Only calculate if we have at least 12 months of data
    if (trendData.length >= 12) {
      const currentYearData = trendData.slice(-12);
      // Would need to fetch previous year data here
      // For now, return empty array
    }

    // ============================================================================
    // Build Response
    // ============================================================================
    const response = {
      success: true,
      data: {
        trendData,
        timeToHireTrend,
        monthOverMonth,
        yearOverYear,
      },
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error: any) {
    console.error('[analytics-trends] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch trends analytics',
        details: error.message,
      },
      { status: 500 }
    );
  }
});
