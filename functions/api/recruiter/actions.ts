import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';

export const onRequest = async (context: any) => {
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;

  try {

    // ── Org Context & Permissions ──
    if (action === 'get-user-org-context') {
      const { p_user_id } = body;
      // Fallback to currently authenticated user if not provided (or for security)
      const targetUserId = p_user_id || user.id;

      // Only allow querying own context unless admin (simplified for now to own context)
      if (targetUserId !== user.id) {
        return apiError(403, 'FORBIDDEN', 'Can only query own organization context', context.request);
      }

      const { data, error } = await supabase.rpc('get_user_org_context', {
        p_user_id: targetUserId,
      });

      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'has-recruitment-permission') {
      const { p_user_id, p_org_id, p_required_permission } = body;
      const targetUserId = p_user_id || user.id;

      const { data, error } = await supabase.rpc('has_recruitment_permission', {
        p_user_id: targetUserId,
        p_org_id,
        p_required_permission,
      });

      if (error) return apiDbError(error, context.request);
      return apiSuccess({ hasPermission: data }, context.request);
    }

    if (action === 'get-org-email-templates') {
      const { organization_id } = body;
      if (!organization_id) return apiError(400, 'VALIDATION_ERROR', 'Missing organization_id', context.request);

      const { data, error } = await supabase
        .from('organization_email_templates')
        .select('*')
        .eq('organization_id', organization_id);

      if (error && error.code !== 'PGRST116') return apiDbError(error, context.request);
      return apiSuccess(data || [], context.request);
    }

    if (action === 'upsert-org-email-template') {
      const { organization_id, template_type, name, subject, body: emailBody } = body;
      if (!organization_id || !template_type) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

      const { error } = await supabase
        .from('organization_email_templates')
        .upsert({
          organization_id,
          template_type,
          name,
          subject,
          body: emailBody,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id,template_type',
        });

      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true }, context.request);
    }

    // ── Opportunities ──
    if (action === 'list-opportunities-skills') {
      const { opportunityIds } = body;
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, skills_required')
        .in('id', opportunityIds);
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'get-recruiter-profile') {
      const { email } = body;
      const { data, error } = await supabase
        .from('recruiters')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'list-interviews') {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .order('date', { ascending: true });
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'update-interview') {
      const { id, ...updates } = body;
      const { data, error } = await supabase
        .from('interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'list-learners') {
      const { data, error } = await supabase.from('learners').select('*');
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'get-learner') {
      const { learnerId } = body;
      const { data, error } = await supabase
        .from('learners')
        .select('name, email, contact_number')
        .eq('id', learnerId)
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    // ── Requisitions (opportunities) ──
    if (action === 'list-recruiters') {
      const { data, error } = await supabase
        .from('recruiters')
        .select('id, name, email')
        .eq('isactive', true)
        .order('name');
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'get-current-recruiter') {
      const { email } = body;
      const { data, error } = await supabase
        .from('recruiters')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'list-opportunities') {
      const {
        searchQuery,
        statusFilter,
        advancedFilters = {},
        sortField = 'created_at',
        sortDirection = 'desc',
        currentPage = 1,
        itemsPerPage = 8,
      } = body;

      // 🔒 SECURITY: Use organization_id from middleware context
      const organizationId = (context.data as any).organizationId;

      let query = supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId); // 🔒 Filter by user's organization

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (advancedFilters.status?.length > 0) query = query.in('status', advancedFilters.status);
      if (advancedFilters.departments?.length > 0) query = query.in('department', advancedFilters.departments);
      if (advancedFilters.locations?.length > 0) query = query.in('location', advancedFilters.locations);
      if (advancedFilters.employmentTypes?.length > 0) query = query.in('employment_type', advancedFilters.employmentTypes);
      if (advancedFilters.experienceLevels?.length > 0) query = query.in('experience_level', advancedFilters.experienceLevels);

      if (advancedFilters.salaryRange?.min) query = query.gte('salary_range_min', advancedFilters.salaryRange.min);
      if (advancedFilters.salaryRange?.max) query = query.lte('salary_range_max', advancedFilters.salaryRange.max);

      if (advancedFilters.applicationCountRange && advancedFilters.applicationCountRange !== 'all') {
        const rangeMap: Record<string, { min: number; max: number | null }> = {
          '0': { min: 0, max: 0 },
          '1-5': { min: 1, max: 5 },
          '6-20': { min: 6, max: 20 },
          '21-50': { min: 21, max: 50 },
          '50+': { min: 51, max: null },
        };
        const range = rangeMap[advancedFilters.applicationCountRange];
        if (range) {
          query = query.gte('applications_count', range.min);
          if (range.max !== null) query = query.lte('applications_count', range.max);
        }
      }

      if (advancedFilters.dateRange?.startDate) query = query.gte('posted_date', advancedFilters.dateRange.startDate);
      if (advancedFilters.dateRange?.endDate) query = query.lte('posted_date', advancedFilters.dateRange.endDate);

      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) return apiDbError(error, context.request);

      const transformed = (data || []).map((opp: any) => ({
        ...opp,
        job_title: opp.title || opp.job_title || '',
        requirements: opp.requirements || [],
        responsibilities: opp.responsibilities || [],
        benefits: opp.benefits || [],
        applications_count: opp.applications_count || 0,
        messages_count: opp.messages_count || 0,
        views_count: opp.views_count || 0,
        employment_type: opp.employment_type || 'Full-time',
        experience_level: opp.experience_level || 'Mid',
        status: opp.status || 'draft',
      }));

      return apiSuccess({ data: transformed, total: count }, context.request);
    }

    if (action === 'create-opportunity') {
      const { data, error } = await supabase
        .from('opportunities')
        .insert({ ...body.data, created_by: user.id, posted_date: new Date().toISOString() })
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'update-opportunity') {
      const { id, ...updates } = body;
      const { data, error } = await supabase
        .from('opportunities')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'delete-opportunity') {
      const { id } = body;
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }

    if (action === 'list-applications') {
      const { opportunityId } = body;
      const { data, error } = await supabase
        .from('applied_jobs')
        .select(`
        id,
        application_status,
        applied_at,
        viewed_at,
        interview_scheduled_at,
        updated_at,
        learners (
          id,
          email,
          profile
        )
      `)
        .eq('opportunity_id', opportunityId)
        .order('applied_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'fetch-shortlist-tags') {
      const { data, error } = await supabase
        .from('shortlists')
        .select('tags')
        .not('tags', 'is', null);
      if (error) return apiDbError(error, context.request);
      const allTags = [...new Set((data || []).flatMap((r: any) => r.tags || []))].sort();
      return apiSuccess(allTags, context.request);
    }

    if (action === 'fetch-shortlist-creators') {
      const { data, error } = await supabase
        .from('shortlists')
        .select('created_by')
        .not('created_by', 'is', null);
      if (error) return apiDbError(error, context.request);
      const creators = [...new Set((data || []).map((r: any) => r.created_by))].sort();
      return apiSuccess(creators, context.request);
    }

    if (action === 'fetch-departments') {
      const { data, error } = await supabase
        .from('opportunities')
        .select('department')
        .not('department', 'is', null);
      if (error) return apiDbError(error, context.request);
      const departments = [...new Set((data || []).map((r: any) => r.department))].sort();
      return apiSuccess(departments, context.request);
    }

    if (action === 'fetch-locations') {
      const { data, error } = await supabase
        .from('opportunities')
        .select('location')
        .not('location', 'is', null);
      if (error) return apiDbError(error, context.request);
      const locations = [...new Set((data || []).map((r: any) => r.location))].sort();
      return apiSuccess(locations, context.request);
    }

    if (action === 'import-requisitions') {
      const { rows } = body;

      const recruiterEmails = [...new Set((rows || []).map((r: any) => r.recruiter_email).filter(Boolean))];
      let recruiterMap: Record<string, string> = {};
      if (recruiterEmails.length) {
        const { data: recruiters, error: recError } = await supabase
          .from('recruiters')
          .select('id, email')
          .in('email', recruiterEmails);
        if (recError) return apiDbError(recError, context.request);
        for (const r of (recruiters || [])) {
          recruiterMap[r.email] = r.id;
        }
      }

      let success = 0;
      let failed = 0;
      const errors: Array<{ row: number; error: string }> = [];
      for (let i = 0; i < (rows || []).length; i++) {
        const row = rows[i];
        try {
          const { error: insError } = await supabase.from('opportunities').insert({
            title: row.job_title || row.title,
            job_title: row.job_title,
            company_name: row.company_name || 'Not Specified',
            company_logo: null,
            department: row.department,
            location: row.location,
            mode: row.mode || null,
            work_mode: row.mode || null,
            employment_type: row.employment_type,
            experience_level: row.experience_level,
            experience_required: row.experience_required,
            salary_range_min: row.salary_range_min ? Number(row.salary_range_min) : null,
            salary_range_max: row.salary_range_max ? Number(row.salary_range_max) : null,
            description: row.description || '',
            requirements: row.requirements || null,
            responsibilities: row.responsibilities || null,
            skills_required: row.skills_required || null,
            benefits: row.benefits || null,
            deadline: row.deadline ? new Date(row.deadline).toISOString() : null,
            applications_count: row.applications_count ? Number(row.applications_count) : 0,
            messages_count: 0,
            views_count: 0,
            posted_date: row.posted_date || new Date().toISOString(),
            status: row.status,
            type: row.type || 'job',
            created_by: user.id,
            is_active: row.status === 'open',
            recruiter_id: row.recruiter_email ? recruiterMap[row.recruiter_email] : null,
          });
          if (insError) {
            failed++;
            errors.push({ row: i, error: insError.message });
          } else {
            success++;
          }
        } catch (e: any) {
          failed++;
          errors.push({ row: i, error: e.message });
        }
      }
      return apiSuccess({ success, failed, errors }, context.request);
    }

    if (action === 'get-opportunities-skills') {
      const { opportunityIds } = body;
      if (!opportunityIds || !Array.isArray(opportunityIds)) return apiError(400, 'VALIDATION_ERROR', 'Missing or invalid opportunityIds', context.request);

      const { data, error } = await supabase
        .from('opportunities')
        .select('id, skills_required')
        .in('id', opportunityIds);

      if (error) return apiDbError(error, context.request);
      return apiSuccess(data || [], context.request);
    }

    if (action === 'get-learner-info') {
      const { learnerId } = body;
      if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request);

      const { data, error } = await supabase
        .from('learners')
        .select('name, email, contact_number')
        .eq('id', learnerId)
        .single();

      if (error && error.code !== 'PGRST116') return apiDbError(error, context.request);
      return apiSuccess(data || null, context.request);
    }

    if (action === 'create-requisition') {
      const { requisitionData } = body;
      if (!requisitionData) return apiError(400, 'VALIDATION_ERROR', 'Missing requisitionData', context.request);

      // 🔒 SECURITY: Use organization_id from middleware context
      const organizationId = (context.data as any).organizationId;

      if (!organizationId) {
        console.error('[recruiter/actions] create-requisition: organizationId not found in context', {
          userId: user.id,
          contextData: context.data
        });
        return apiError(500, 'INTERNAL_ERROR', 'Organization context not found. Please contact support.', context.request);
      }

      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ...requisitionData,
          organization_id: organizationId, // 🔒 Set organization_id from context
          messages_count: 0,
          views_count: 0,
          posted_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return apiDbError(error, context.request);
      return apiSuccess(data || {}, context.request);
    }

    if (action === 'update-requisition') {
      const { id, updates } = body;
      if (!id || !updates) return apiError(400, 'VALIDATION_ERROR', 'Missing id or updates', context.request);

      // 🔒 SECURITY: Use organization_id from middleware context
      const organizationId = (context.data as any).organizationId;

      // 🔒 SECURITY: Only update if the requisition belongs to user's organization
      const { data, error } = await supabase
        .from('opportunities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('organization_id', organizationId) // 🔒 Verify ownership
        .select()
        .single();

      if (error) return apiDbError(error, context.request);
      if (!data) return apiError(404, 'NOT_FOUND', 'Requisition not found or access denied', context.request);
      return apiSuccess(data || {}, context.request);
    }

    if (action === 'delete-requisition') {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request);

      // 🔒 SECURITY: Use organization_id from middleware context
      const organizationId = (context.data as any).organizationId;

      // 🔒 SECURITY: Only delete if the requisition belongs to user's organization
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId); // 🔒 Verify ownership

      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true }, context.request);
    }

    if (action === 'get-applications-by-opportunity') {
      const { opportunityId } = body;
      if (!opportunityId) return apiError(400, 'VALIDATION_ERROR', 'Missing opportunityId', context.request);

      const { data, error } = await supabase
        .from('applied_jobs')
        .select(`
        id,
        application_status,
        applied_at,
        viewed_at,
        interview_scheduled_at,
        updated_at,
        learners (
          id,
          email,
          profile
        )
      `)
        .eq('opportunity_id', opportunityId)
        .order('applied_at', { ascending: false });

      if (error) return apiDbError(error, context.request);
      return apiSuccess(data || [], context.request);
    }

    return apiError(400, 'BAD_REQUEST', `Unknown action: ${action}`, context.request);
  } catch (error: any) {
    console.error(`[recruiter/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request);
  }
});
