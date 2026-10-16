/**
 * Export Analytics API Endpoint
 * Exports analytics data in various formats (PDF, Excel, CSV)
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../../lib/auth';
import { PERMISSIONS, verifyOrgAccess } from '../../../lib/permissions';
import { getServiceClient } from '../../../lib/supabase';

/**
 * GET /api/recruitment/analytics/export
 * Exports analytics data in the requested format
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const orgId = url.searchParams.get('org_id') || user.org_id;
  const format = url.searchParams.get('format') || 'csv';
  const tab = url.searchParams.get('tab') || 'overview';

  if (!orgId) {
    return Response.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.VIEW_ANALYTICS);
  if (!access.allowed) {
    return access.error!;
  }

  try {
    // For now, we'll implement CSV export
    // PDF and Excel can be added later with libraries like pdfkit or exceljs

    if (format === 'csv') {
      return await exportAsCSV(tab, orgId, supabase, url);
    } else if (format === 'excel') {
      // Placeholder - would use exceljs library
      return Response.json(
        { error: 'Excel export coming soon' },
        { status: 501 }
      );
    } else if (format === 'pdf') {
      // Placeholder - would use pdfkit or similar
      return Response.json(
        { error: 'PDF export coming soon' },
        { status: 501 }
      );
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error: any) {
    console.error('[analytics-export] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to export analytics',
        details: error.message,
      },
      { status: 500 }
    );
  }
});

/**
 * Export data as CSV
 */
async function exportAsCSV(
  tab: string,
  orgId: string,
  supabase: any,
  url: URL
): Promise<Response> {
  let csvContent = '';
  const timestamp = new Date().toISOString();

  // Add header
  csvContent += `# Analytics Export\n`;
  csvContent += `# Organization ID: ${orgId}\n`;
  csvContent += `# Tab: ${tab}\n`;
  csvContent += `# Generated: ${timestamp}\n`;
  csvContent += `\n`;

  if (tab === 'overview' || tab === 'pipeline') {
    // Export pipeline candidates
    const { data: candidates } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .eq('organization_id', orgId)
      .order('added_at', { ascending: false })
      .limit(1000);

    if (candidates && candidates.length > 0) {
      // Headers
      const headers = Object.keys(candidates[0]);
      csvContent += headers.join(',') + '\n';

      // Rows
      candidates.forEach((row: any) => {
        const values = headers.map((header) => {
          const value = row[header];
          // Escape commas and quotes
          if (value === null || value === undefined) return '';
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        });
        csvContent += values.join(',') + '\n';
      });
    }
  } else if (tab === 'jobs') {
    // Export jobs/opportunities
    const { data: jobs } = await supabase
      .from('opportunities')
      .select('id, title, department, location, employment_type, status, applications_count, views_count, posted_date, closing_date, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (jobs && jobs.length > 0) {
      const headers = Object.keys(jobs[0]);
      csvContent += headers.join(',') + '\n';

      jobs.forEach((row: any) => {
        const values = headers.map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        });
        csvContent += values.join(',') + '\n';
      });
    }
  } else if (tab === 'team') {
    // Export team members with stats
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id, role, status, joined_at')
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: false });

    if (members && members.length > 0) {
      csvContent += 'user_id,role,status,joined_at\n';
      members.forEach((row: any) => {
        csvContent += `${row.user_id},${row.role},${row.status},${row.joined_at}\n`;
      });
    }
  }

  // Return as downloadable file
  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-${tab}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
