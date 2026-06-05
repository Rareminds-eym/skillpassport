import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';

async function handleAction(action: string, params: Record<string, any>, context: AuthenticatedContext): Promise<Response> {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  switch (action) {

    case 'query-table': {
      const { table, select_columns, filters, order, limit, offset, range_start, range_end, count } = params;
      if (!table) return apiError(400, 'VALIDATION_ERROR', 'table required', context.request, { startTime });
      const selectOpts = count ? { count: 'exact' as const } : undefined;
      let query = supabase.from(table).select(select_columns || '*', selectOpts);
      if (filters?.eq) for (const [k, v] of Object.entries(filters.eq)) query = query.eq(k, v);
      if (filters?.in) for (const [k, v] of Object.entries(filters.in)) query = query.in(k, (v as string[]));
      if (filters?.neq) for (const [k, v] of Object.entries(filters.neq)) query = query.neq(k, v);
      if (filters?.not_is) for (const [k, v] of Object.entries(filters.not_is)) query = query.not(k, 'is', v);
      if (filters?.is) for (const [k, v] of Object.entries(filters.is)) query = query.is(k, v);
      if (filters?.gte) for (const [k, v] of Object.entries(filters.gte)) query = query.gte(k, v);
      if (filters?.lte) for (const [k, v] of Object.entries(filters.lte)) query = query.lte(k, v);
      if (order?.field) query = query.order(order.field, { ascending: order.ascending ?? true });
      if (limit) query = query.limit(Number(limit));
      if (range_start !== undefined && range_end !== undefined) query = query.range(Number(range_start), Number(range_end));
      else if (offset !== undefined) query = query.range(Number(offset), Number(offset) + (limit ? Number(limit) - 1 : 999));
      const { data, count: total, error } = await query;
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess(count ? { data, count: total } : { data }, context.request, { startTime });
    }

    case 'count-table': {
      const { table, filters } = params;
      if (!table) return apiError(400, 'VALIDATION_ERROR', 'table required', context.request, { startTime });
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      if (filters?.eq) for (const [k, v] of Object.entries(filters.eq)) query = query.eq(k, v);
      const { count, error } = await query;
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ count: count || 0 }, context.request, { startTime });
    }

    case 'insert-table': {
      const { table, data } = params;
      if (!table || !data) return apiError(400, 'VALIDATION_ERROR', 'table and data required', context.request, { startTime });
      const { data: result, error } = await supabase.from(table).insert(data).select();
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: result }, context.request, { startTime });
    }

    case 'update-table': {
      const { table, data, filters } = params;
      if (!table || !data) return apiError(400, 'VALIDATION_ERROR', 'table and data required', context.request, { startTime });
      let query = supabase.from(table).update(data);
      if (filters?.eq) for (const [k, v] of Object.entries(filters.eq)) query = query.eq(k, v);
      const { data: result, error } = await query.select();
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: result }, context.request, { startTime });
    }

    case 'delete-table': {
      const { table, filters } = params;
      if (!table || !filters?.eq) return apiError(400, 'VALIDATION_ERROR', 'table and filters.eq required', context.request, { startTime });
      let query = supabase.from(table).delete();
      for (const [k, v] of Object.entries(filters.eq)) query = query.eq(k, v);
      const { error } = await query;
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ deleted: true }, context.request, { startTime });
    }

    case 'upsert-table': {
      const { table, data, on_conflict } = params;
      if (!table || !data) return apiError(400, 'VALIDATION_ERROR', 'table and data required', context.request, { startTime });
      const upsertOptions: any = {};
      if (on_conflict) upsertOptions.onConflict = on_conflict;
      const { data: result, error } = await supabase.from(table).upsert(data, upsertOptions).select();
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: result }, context.request, { startTime });
    }

    case 'get-user-metadata': {
      const { email } = params;
      if (!email) return apiError(400, 'VALIDATION_ERROR', 'email required', context.request, { startTime });
      const { data, error } = await supabase.from('users').select('metadata').eq('email', email).single();
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ metadata: data?.metadata }, context.request, { startTime });
    }

    case 'get-org-by-email': {
      const { email } = params;
      if (!email) return apiError(400, 'VALIDATION_ERROR', 'email required', context.request, { startTime });
      const { data, error } = await supabase.from('organizations').select('id, name, email').eq('email', email).single();
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ organization: data }, context.request, { startTime });
    }

    case 'get-college-lecturer': {
      const { email } = params;
      if (!email) return apiError(400, 'VALIDATION_ERROR', 'email required', context.request, { startTime });
      const { data, error } = await supabase.from('college_lecturers').select('collegeId, id, first_name, last_name').eq('email', email).maybeSingle();
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ lecturer: data }, context.request, { startTime });
    }

    case 'get-enrolled-learners': {
      const { org_id, department, program, program_section, semester, search, limit, offset } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      let query = supabase.from('learners').select(`*,
        departments!learner_branch_field_fkey (id, name),
        programs!learner_course_name_fkey (id, name, code),
        program_sections!learner_section_id_fkey (id, name, semester)
      `)        .eq('college_id', org_id);
      if (department) query = query.eq('branch_field', department);
      if (program) query = query.eq('course_name', program);
      if (program_section) query = query.eq('section_id', program_section);
      if (semester) query = query.eq('current_semester', semester);
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,id.ilike.%${search}%`);
      query = query.order('created_at', { ascending: false });
      if (limit) query = query.limit(Number(limit));
      if (offset) query = query.range(Number(offset), Number(offset) + (Number(limit) || 50) - 1);
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-dashboard-kpis': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const [
        { count: totalLearners },
        { count: prevLearners },
        { count: totalFaculty },
        { count: prevFaculty },
        { count: totalDepts },
        { count: prevDepts },
      ] = await Promise.all([
        supabase.from('learners').select('*', { count: 'exact', head: true }).eq('college_id', org_id),
        supabase.from('learners').select('*', { count: 'exact', head: true }).eq('college_id', org_id).lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('college_lecturers').select('*', { count: 'exact', head: true }).eq('collegeId', org_id),
        supabase.from('college_lecturers').select('*', { count: 'exact', head: true }).eq('collegeId', org_id).lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('departments').select('*', { count: 'exact', head: true }).eq('college_id', org_id),
        supabase.from('departments').select('*', { count: 'exact', head: true }).eq('college_id', org_id).lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      const { data: learnerIds } = await supabase.from('learners').select('id').eq('college_id', org_id);
      let placementCount = 0;
      let prevPlacementCount = 0;
      if (learnerIds?.length) {
        const ids = learnerIds.map(l => l.id);
        const { count: placed } = await supabase.from('applied_jobs').select('*', { count: 'exact', head: true }).in('learner_id', ids).not('is_placed', 'is', null);
        placementCount = placed || 0;
        const prevDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { count: prevPlaced } = await supabase.from('applied_jobs').select('*', { count: 'exact', head: true }).in('learner_id', ids).gt('updated_at', prevDate);
        prevPlacementCount = prevPlaced || 0;
      }
      return apiSuccess({
        totalLearners: totalLearners || 0,
        prevLearners: prevLearners || 0,
        totalFaculty: totalFaculty || 0,
        prevFaculty: prevFaculty || 0,
        totalDepts: totalDepts || 0,
        prevDepts: prevDepts || 0,
        placementCount,
        prevPlacementCount,
      }, context.request, { startTime });
    }

    case 'get-placement-analytics': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data: recentPlacements, error: recentError } = await supabase
        .from('applied_jobs')
        .select(`*, learners!inner(*)`)
        .eq('learners.college_id', org_id)
        .not('is_placed', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(10);
      if (recentError) return apiDbError(recentError, context.request, { startTime });
      const { data: learnerFields } = await supabase
        .from('learners')
        .select('branch_field, course_name, id')
        .eq('college_id', org_id);
      const { data: allPlacements, error: allError } = await supabase
        .from('applied_jobs')
        .select(`*, learners!inner(*)`)
        .eq('learners.college_id', org_id)
        .not('is_placed', 'is', null)
        .order('updated_at', { ascending: false });
      if (allError) return apiDbError(allError, context.request, { startTime });
      return apiSuccess({
        recentPlacements: recentPlacements || [],
        learnerFields: learnerFields || [],
        allPlacements: allPlacements || [],
      }, context.request, { startTime });
    }

    case 'get-assessments': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase.from('assessments').select('*').eq('college_id', org_id);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-exam-timetable': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase.from('exam_timetable').select('*');
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-mark-entries': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase.from('mark_entries').select('*');
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-transcripts': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase.from('transcripts').select('*');
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-assessment-code': {
      const { code } = params;
      if (!code) return apiError(400, 'VALIDATION_ERROR', 'code required', context.request, { startTime });
      const { data, error } = await supabase.from('assessments').select('id, assessment_code').eq('assessment_code', code);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-learner-assessment-results': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data: org } = await supabase.from('organizations').select('id, name, email').eq('id', org_id).single();
      const { data: learners } = await supabase.from('learners').select(`*,
        departments!learner_branch_field_fkey(id, name),
        programs!learner_course_name_fkey(id, name)
      `).eq('college_id', org_id).order('created_at', { ascending: false });
      const { data: results } = await supabase.from('personal_assessment_results').select('*').order('created_at', { ascending: false });
      return apiSuccess({ organization: org, learners: learners || [], results: results || [] }, context.request, { startTime });
    }

    case 'get-mentor-allocations': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase
        .from('college_mentor_learner_allocations')
        .select(`*,
          learners!college_mentor_learner_allocations_learner_id_fkey(id, name, email, branch_field, course_name)
        `);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-mentors-list': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase
        .from('college_lecturers')
        .select('id, first_name, last_name, email')
        .eq('collegeId', org_id);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-conversations': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase
        .from('conversations')
        .select(`*,
          profiles!conversations_sender_id_fkey(id, name, avatar_url),
          messages!conversations_last_message_id_fkey(content, created_at, sender_id)
        `)
        .eq('college_id', org_id)
        .order('updated_at', { ascending: false });
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-user-role': {
      const { email } = params;
      if (!email) return apiError(400, 'VALIDATION_ERROR', 'email required', context.request, { startTime });
      const { data, error } = await supabase.from('users').select('role').eq('email', email).single();
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ role: data?.role }, context.request, { startTime });
    }

    case 'get-school-educator': {
      const { email } = params;
      if (!email) return apiError(400, 'VALIDATION_ERROR', 'email required', context.request, { startTime });
      const { data, error } = await supabase.from('school_educators').select('school_id').eq('email', email).maybeSingle();
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ educator: data }, context.request, { startTime });
    }

    case 'get-library-learners': {
      const { org_id, search, page, page_size } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      let query = supabase.from('learners').select('*').eq('college_id', org_id);
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      query = query.order('created_at', { ascending: false });
      if (page_size) {
        const p = Number(page || 1);
        const ps = Number(page_size);
        query = query.range((p - 1) * ps, p * ps - 1);
      }
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-digital-portfolio-learners': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase
        .from('learners')
        .select(`id, name, email, branch_field, course_name, current_semester, section,
          projects!projects_learner_id_fkey(id, title, description, technologies, project_url, approval_status, enabled),
          certificates!certificates_learner_id_fkey(id, title, issuer, issued_on, certificate_url, approval_status, enabled)
        `)
        .eq('college_id', org_id);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-conversation-by-participants': {
      const { participant1, participant2 } = params;
      if (!participant1 || !participant2) return apiError(400, 'VALIDATION_ERROR', 'participant1 and participant2 required', context.request, { startTime });
      const { data, error } = await supabase
        .from('conversations')
        .select(`*, messages!conversations_last_message_id_fkey(content, created_at)`)
        .or(`and(participant1_id.eq.${participant1},participant2_id.eq.${participant2}),and(participant1_id.eq.${participant2},participant2_id.eq.${participant1})`)
        .limit(1);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data?.[0] || null }, context.request, { startTime });
    }

    case 'get-curriculum-data': {
      const { section_id } = params;
      if (!section_id) return apiError(400, 'VALIDATION_ERROR', 'section_id required', context.request, { startTime });
      const { data, error } = await supabase
        .from('curriculum')
        .select(`*, curriculum_courses(*)`)
        .eq('section_id', section_id);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-orgs-list': {
      const { org_type, limit } = params;
      let query = supabase.from('organizations').select('*');
      if (org_type) query = query.eq('organization_type', org_type);
      if (limit) query = query.limit(Number(limit));
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-programs-with-joins': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase
        .from('programs')
        .select(`*,
          departments(id, name),
          courses(id, name, code)
        `);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-departments': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase.from('departments').select('*').eq('college_id', org_id);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-programs': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase.from('programs').select('*');
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-program-sections': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase.from('program_sections').select('*');
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'get-programs-with-department': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase
        .from('programs')
        .select(`*, departments(name)`);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    case 'delete-programs': {
      const { id } = params;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request, { startTime });
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ deleted: true }, context.request, { startTime });
    }

    case 'get-programs-by-org': {
      const { org_id } = params;
      if (!org_id) return apiError(400, 'VALIDATION_ERROR', 'org_id required', context.request, { startTime });
      const { data, error } = await supabase.from('programs').select('*');
      if (error) return apiDbError(error, context.request, { startTime });
      return apiSuccess({ data: data || [] }, context.request, { startTime });
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
  }
}

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action query parameter', context.request);

  const params: Record<string, any> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'action') continue;
    try { params[key] = JSON.parse(value); } catch { params[key] = value; }
  }

  return handleAction(action, params, context);
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  let body: Record<string, any>;
  try { body = await context.request.json(); } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action field', context.request);

  return handleAction(action, params, context);
});

export const onRequest = async (context: any) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};
