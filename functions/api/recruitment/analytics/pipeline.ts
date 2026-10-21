/**
 * Pipeline Analytics API Endpoint
 * Returns detailed pipeline metrics, stage distribution, conversions, and bottlenecks
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../../lib/auth';
import { PERMISSIONS, verifyOrgAccess } from '../../../lib/permissions';
import { getServiceClient } from '../../../lib/supabase';

interface PipelineFilters {
  from: string | null;
  to: string | null;
  departments: string[];
  locations: string[];
  jobTypes: string[];
  recruiters: string[];
}

function parseFilters(url: URL): PipelineFilters {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const departments = url.searchParams.get('departments')?.split(',').filter(Boolean) || [];
  const locations = url.searchParams.get('locations')?.split(',').filter(Boolean) || [];
  const jobTypes = url.searchParams.get('jobTypes')?.split(',').filter(Boolean) || [];
  const recruiters = url.searchParams.get('recruiters')?.split(',').filter(Boolean) || [];

  return { from, to, departments, locations, jobTypes, recruiters };
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * GET /api/recruitment/analytics/pipeline
 * Returns pipeline analytics including:
 * - Total and active candidate counts
 * - Stage distribution
 * - Conversion rates between stages
 * - Bottleneck identification
 * - Average time per stage
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
    const dateFrom = filters.from ? new Date(filters.from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filters.to ? new Date(filters.to) : now;

    // Previous period for trends
    const periodDays = Math.floor((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    const previousFrom = new Date(dateFrom.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousTo = dateFrom;

    // ============================================================================
    // 1. Total Candidates
    // ============================================================================
    let totalQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    if (filters.recruiters.length > 0) totalQuery = totalQuery.in('added_by_uuid', filters.recruiters);

    const { count: totalCandidates } = await totalQuery;

    // Previous period total
    let prevTotalQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('added_at', previousFrom.toISOString())
      .lte('added_at', previousTo.toISOString());

    if (filters.recruiters.length > 0) prevTotalQuery = prevTotalQuery.in('added_by_uuid', filters.recruiters);

    const { count: previousTotal } = await prevTotalQuery;

    // ============================================================================
    // 2. Active Candidates
    // ============================================================================
    let activeQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active');

    if (filters.recruiters.length > 0) activeQuery = activeQuery.in('added_by_uuid', filters.recruiters);

    const { count: activeCandidates } = await activeQuery;

    const activePercentage = totalCandidates ? Math.round((activeCandidates || 0) / totalCandidates * 100) : 0;

    // ============================================================================
    // 3. Overall Conversion Rate (sourced to hired)
    // ============================================================================
    let sourcedQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('stage', 'sourced')
      .gte('added_at', dateFrom.toISOString())
      .lte('added_at', dateTo.toISOString());

    if (filters.recruiters.length > 0) sourcedQuery = sourcedQuery.in('added_by_uuid', filters.recruiters);

    const { count: sourcedCount } = await sourcedQuery;

    let hiredQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('stage', 'hired')
      .gte('stage_changed_at', dateFrom.toISOString())
      .lte('stage_changed_at', dateTo.toISOString());

    if (filters.recruiters.length > 0) hiredQuery = hiredQuery.in('added_by_uuid', filters.recruiters);

    const { count: hiredCount } = await hiredQuery;

    const overallConversion = sourcedCount ? Math.round((hiredCount || 0) / sourcedCount * 100) : 0;

    // Previous period conversion
    let prevSourcedQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('stage', 'sourced')
      .gte('added_at', previousFrom.toISOString())
      .lte('added_at', previousTo.toISOString());

    if (filters.recruiters.length > 0) prevSourcedQuery = prevSourcedQuery.in('added_by_uuid', filters.recruiters);

    const { count: prevSourcedCount } = await prevSourcedQuery;

    let prevHiredQuery = supabase
      .from('pipeline_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('stage', 'hired')
      .gte('stage_changed_at', previousFrom.toISOString())
      .lte('stage_changed_at', previousTo.toISOString());

    if (filters.recruiters.length > 0) prevHiredQuery = prevHiredQuery.in('added_by_uuid', filters.recruiters);

    const { count: prevHiredCount } = await prevHiredQuery;

    const previousConversion = prevSourcedCount ? Math.round((prevHiredCount || 0) / prevSourcedCount * 100) : 0;

    // ============================================================================
    // 4. Average Stage Time
    // ============================================================================
    let stageTimeQuery = supabase
      .from('pipeline_candidates')
      .select('added_at, stage_changed_at, stage')
      .eq('organization_id', orgId)
      .neq('stage', 'sourced')
      .gte('stage_changed_at', dateFrom.toISOString())
      .lte('stage_changed_at', dateTo.toISOString());

    if (filters.recruiters.length > 0) stageTimeQuery = stageTimeQuery.in('added_by_uuid', filters.recruiters);

    const { data: stageTimeData } = await stageTimeQuery;

    let avgStageTime = 0;
    if (stageTimeData && stageTimeData.length > 0) {
      const totalDays = stageTimeData.reduce((sum, candidate) => {
        const added = new Date(candidate.added_at).getTime();
        const changed = new Date(candidate.stage_changed_at).getTime();
        const days = Math.floor((changed - added) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgStageTime = Math.round(totalDays / stageTimeData.length);
    }

    // ============================================================================
    // 5. Stage Distribution
    // ============================================================================
    const stages = ['sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired'];
    const stageDistribution = [];

    for (const stage of stages) {
      let stageQuery = supabase
        .from('pipeline_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('stage', stage);

      if (filters.recruiters.length > 0) stageQuery = stageQuery.in('added_by_uuid', filters.recruiters);

      const { count } = await stageQuery;

      stageDistribution.push({
        stage: stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        count: count || 0,
      });
    }

    // Calculate conversion percentages
    if (stageDistribution.length > 0 && stageDistribution[0].count > 0) {
      const totalSourced = stageDistribution[0].count;
      stageDistribution.forEach((item) => {
        item.conversion = totalSourced > 0 ? Math.round((item.count / totalSourced) * 100) : 0;
      });
    }

    // ============================================================================
    // 6. Stage Conversions
    // ============================================================================
    const conversions = [];

    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i + 1];

      let fromQuery = supabase
        .from('pipeline_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('stage', fromStage);

      if (filters.recruiters.length > 0) fromQuery = fromQuery.in('added_by_uuid', filters.recruiters);

      const { count: fromCount } = await fromQuery;

      let toQuery = supabase
        .from('pipeline_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('stage', toStage);

      if (filters.recruiters.length > 0) toQuery = toQuery.in('added_by_uuid', filters.recruiters);

      const { count: toCount } = await toQuery;

      const rate = fromCount ? Math.round((toCount || 0) / fromCount * 100) : 0;

      conversions.push({
        fromStage: fromStage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        toStage: toStage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        rate,
        count: toCount || 0,
        totalAttempts: fromCount || 0,
      });
    }

    // ============================================================================
    // 7. Bottleneck Identification
    // ============================================================================
    const bottlenecks = [];

    // Find stages with high dropout (low conversion to next stage)
    conversions.forEach((conversion) => {
      if (conversion.rate < 50 && conversion.totalAttempts >= 10) {
        bottlenecks.push({
          stage: conversion.fromStage,
          issue: 'high_dropout' as const,
          metric: 100 - conversion.rate,
          count: conversion.totalAttempts - conversion.count,
          severity: conversion.rate < 30 ? ('high' as const) : ('medium' as const),
        });
      }
    });

    // Find stages where candidates get stuck (>30 days)
    for (const stage of stages) {
      let stuckQuery = supabase
        .from('pipeline_candidates')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('stage', stage)
        .lt('stage_changed_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (filters.recruiters.length > 0) stuckQuery = stuckQuery.in('added_by_uuid', filters.recruiters);

      const { count: stuckCount } = await stuckQuery;

      if (stuckCount && stuckCount > 5) {
        bottlenecks.push({
          stage: stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          issue: 'stuck_candidates' as const,
          metric: 30,
          count: stuckCount,
          severity: stuckCount > 10 ? ('high' as const) : ('medium' as const),
        });
      }
    }

    // ============================================================================
    // Build Response
    // ============================================================================
    const response = {
      success: true,
      data: {
        metrics: {
          totalCandidates: {
            count: totalCandidates || 0,
            trend: {
              value: calculateTrend(totalCandidates || 0, previousTotal || 0),
              label: 'vs previous period',
              isPositive: (totalCandidates || 0) >= (previousTotal || 0),
            },
          },
          activeCandidates: {
            count: activeCandidates || 0,
            percentage: activePercentage,
          },
          overallConversion: {
            rate: overallConversion,
            trend: {
              value: Math.abs(overallConversion - previousConversion),
              label: 'vs previous period',
              isPositive: overallConversion >= previousConversion,
            },
          },
          avgStageTime: {
            days: avgStageTime,
            trend: {
              value: 0,
              label: 'vs previous period',
              isPositive: true,
            },
          },
        },
        stageDistribution,
        conversions,
        bottlenecks,
      },
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error: any) {
    console.error('[analytics-pipeline] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch pipeline analytics',
        details: error.message,
      },
      { status: 500 }
    );
  }
});
