/**
 * Jobs Analytics API Endpoint
 * Returns job posting performance, requisition status, and distribution data
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../../lib/auth';
import { PERMISSIONS, verifyOrgAccess } from '../../../lib/permissions';
import { getServiceClient } from '../../../lib/supabase';

interface JobsFilters {
  from: string | null;
  to: string | null;
  departments: string[];
  locations: string[];
  jobTypes: string[];
}

function parseFilters(url: URL): JobsFilters {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const departments = url.searchParams.get('departments')?.split(',').filter(Boolean) || [];
  const locations = url.searchParams.get('locations')?.split(',').filter(Boolean) || [];
  const jobTypes = url.searchParams.get('jobTypes')?.split(',').filter(Boolean) || [];

  return { from, to, departments, locations, jobTypes };
}

/**
 * GET /api/recruitment/analytics/jobs
 * Returns jobs analytics including:
 * - Job performance table (applications, views, conversion)
 * - Requisition status breakdown
 * - Department and location distribution
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

    // ============================================================================
    // 1. Job Performance Data
    // ============================================================================
    let jobsQuery = supabase
      .from('opportunities')
      .select('id, title, department, location, status, employment_type, applications_count, views_count, posted_date, closing_date, created_at, is_active')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters.departments.length > 0) {
      jobsQuery = jobsQuery.in('department', filters.departments);
    }
    if (filters.locations.length > 0) {
      jobsQuery = jobsQuery.in('location', filters.locations);
    }
    if (filters.jobTypes.length > 0) {
      jobsQuery = jobsQuery.in('employment_type', filters.jobTypes);
    }

    const { data: jobsData, error: jobsError } = await jobsQuery;

    if (jobsError) {
      console.error('[analytics-jobs] Error fetching jobs:', jobsError);
      throw new Error('Failed to fetch jobs data');
    }

    // Transform and calculate metrics for each job
    const jobPerformance = (jobsData || []).map((job) => {
      const postedDate = job.posted_date || job.created_at;
      const daysOpen = postedDate
        ? Math.floor((now.getTime() - new Date(postedDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const daysUntilClosing = job.closing_date
        ? Math.floor((new Date(job.closing_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const applicationRate = job.views_count
        ? Math.round((job.applications_count / job.views_count) * 100)
        : 0;

      return {
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        status: job.is_active ? (job.status || 'active') : 'closed',
        applicationsCount: job.applications_count || 0,
        viewsCount: job.views_count || 0,
        applicationRate,
        postedDate: postedDate || job.created_at,
        closingDate: job.closing_date,
        daysOpen,
        daysUntilClosing,
      };
    });

    // ============================================================================
    // 2. Requisition Status
    // ============================================================================
    const { data: requisitionsData } = await supabase
      .from('requisitions')
      .select('id, status, created_date, target_date, filled_date, organization_id')
      .eq('organization_id', orgId);

    const requisitionStatus = {
      active: 0,
      filled: 0,
      onHold: 0,
      cancelled: 0,
      pastTargetDate: 0,
      avgFillTimeDays: 0,
    };

    let totalFillTime = 0;
    let filledCount = 0;

    (requisitionsData || []).forEach((req) => {
      const status = req.status?.toLowerCase() || 'active';

      if (status === 'active') requisitionStatus.active++;
      else if (status === 'filled') {
        requisitionStatus.filled++;
        // Calculate fill time
        if (req.created_date && req.filled_date) {
          const fillTime = Math.floor(
            (new Date(req.filled_date).getTime() - new Date(req.created_date).getTime()) /
            (1000 * 60 * 60 * 24)
          );
          totalFillTime += fillTime;
          filledCount++;
        }
      } else if (status === 'on hold' || status === 'paused') {
        requisitionStatus.onHold++;
      } else if (status === 'cancelled') {
        requisitionStatus.cancelled++;
      }

      // Check if past target date
      if (req.target_date && new Date(req.target_date) < now && status === 'active') {
        requisitionStatus.pastTargetDate++;
      }
    });

    if (filledCount > 0) {
      requisitionStatus.avgFillTimeDays = Math.round(totalFillTime / filledCount);
    }

    // ============================================================================
    // 3. Department Distribution
    // ============================================================================
    const deptCounts: Record<string, number> = {};
    (jobsData || []).forEach((job) => {
      if (job.department) {
        deptCounts[job.department] = (deptCounts[job.department] || 0) + 1;
      }
    });

    const totalJobs = Object.values(deptCounts).reduce((sum, count) => sum + count, 0);
    const departmentDistribution = Object.entries(deptCounts)
      .map(([department, count]) => ({
        department,
        count,
        percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ============================================================================
    // 4. Location Distribution
    // ============================================================================
    const locCounts: Record<string, number> = {};
    (jobsData || []).forEach((job) => {
      if (job.location) {
        locCounts[job.location] = (locCounts[job.location] || 0) + 1;
      }
    });

    const locationDistribution = Object.entries(locCounts)
      .map(([location, count]) => {
        // Determine location type
        let type: 'remote' | 'hybrid' | 'onsite' = 'onsite';
        const locLower = location.toLowerCase();
        if (locLower.includes('remote')) type = 'remote';
        else if (locLower.includes('hybrid')) type = 'hybrid';

        return {
          location,
          count,
          percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0,
          type,
        };
      })
      .sort((a, b) => b.count - a.count);

    // ============================================================================
    // Build Response
    // ============================================================================
    const response = {
      success: true,
      data: {
        jobPerformance,
        requisitionStatus,
        departmentDistribution,
        locationDistribution,
        totalJobs: jobsData?.length || 0,
      },
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error: any) {
    console.error('[analytics-jobs] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch jobs analytics',
        details: error.message,
      },
      { status: 500 }
    );
  }
});
