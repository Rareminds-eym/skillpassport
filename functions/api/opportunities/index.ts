import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';

export const onRequest = async (context: any) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (id) {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error) return apiDbError(error, context.request);
    return apiSuccess({ opportunity: data }, context.request);
  }

  const rawLimit = parseInt(url.searchParams.get('limit') || '6', 10);
  const rawOffset = parseInt(url.searchParams.get('offset') || '0', 10);
  const searchTerm = url.searchParams.get('search') || '';
  const sortBy = url.searchParams.get('sortBy') || 'newest';
  const activeOnly = url.searchParams.get('activeOnly') !== 'false';
  const employmentType = url.searchParams.get('employmentType');
  const experienceLevel = url.searchParams.get('experienceLevel');
  const mode = url.searchParams.get('mode');
  const department = url.searchParams.get('department');
  const salaryMin = url.searchParams.get('salaryMin');
  const salaryMax = url.searchParams.get('salaryMax');
  const postedWithin = url.searchParams.get('postedWithin');

  if (isNaN(rawLimit) || rawLimit < 1) return apiError(400, 'VALIDATION_ERROR', 'limit must be a positive integer', context.request);
  if (isNaN(rawOffset) || rawOffset < 0) return apiError(400, 'VALIDATION_ERROR', 'offset must be a non-negative integer', context.request);
  const limit = rawLimit;
  const offset = rawOffset;

  let query = supabase
    .from('opportunities')
    .select('*', { count: 'exact' })
    .neq('employment_type', 'factory_visit');

  if (activeOnly) query = query.eq('is_active', true);
  query = query.gt('applications_count', 0);

  if (employmentType) {
    const vals = employmentType.split(',');
    if (vals.length === 1) query = query.eq('employment_type', vals[0]);
    else query = query.in('employment_type', vals);
  }
  if (experienceLevel) {
    const vals = experienceLevel.split(',');
    if (vals.length === 1) query = query.eq('experience_level', vals[0]);
    else query = query.in('experience_level', vals);
  }
  if (mode) {
    const vals = mode.split(',');
    if (vals.length === 1) query = query.eq('mode', vals[0]);
    else query = query.in('mode', vals);
  }
  if (department) {
    const vals = department.split(',');
    if (vals.length === 1) query = query.eq('department', vals[0]);
    else query = query.in('department', vals);
  }
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`);
  }
  if (salaryMin) {
    const raw = parseInt(salaryMin);
    if (isNaN(raw) || raw < 0) return apiError(400, 'VALIDATION_ERROR', 'salaryMin must be a non-negative integer', context.request);
    query = query.gte('salary_range_min', raw);
  }
  if (salaryMax) {
    const raw = parseInt(salaryMax);
    if (isNaN(raw) || raw < 0) return apiError(400, 'VALIDATION_ERROR', 'salaryMax must be a non-negative integer', context.request);
    query = query.lte('salary_range_max', raw);
  }
  if (postedWithin) {
    const raw = parseInt(postedWithin);
    if (isNaN(raw) || raw < 1) return apiError(400, 'VALIDATION_ERROR', 'postedWithin must be a positive integer', context.request);
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - raw);
    query = query.gte('created_at', dateThreshold.toISOString());
  }

  const ascending = sortBy === 'oldest';
  query = query.order('created_at', { ascending }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return apiDbError(error, context.request);
  return apiSuccess({ opportunities: data, total: count }, context.request);
});

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const body: any = await context.request.json().catch(() => ({}));
  const { action } = body;

  if (!action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);

  switch (action) {

    // ── Existing actions ──
    case 'can-proceed-pipeline': {
      const { application_id } = body;
      if (!application_id) return apiError(400, 'VALIDATION_ERROR', 'application_id required', context.request);
      const { data, error } = await supabase.rpc('can_proceed_in_pipeline', { p_application_id: application_id });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ canProceed: data }, context.request);
    }

    case 'increment-search-usage': {
      const { search_id } = body;
      if (!search_id) return apiError(400, 'VALIDATION_ERROR', 'search_id required', context.request);
      const { error } = await supabase.rpc('increment_search_usage', { search_id });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ incremented: true }, context.request);
    }

    case 'recruiter-saved-searches': {
      const user = getContextUser(context);
      const subAction = body.sub_action;

      if (subAction === 'get') {
        const { id } = body;
        if (id) {
          const { data, error } = await supabase.from('recruiter_saved_searches').select('*').eq('id', id).eq('recruiter_id', user.id).maybeSingle();
          if (error) return apiDbError(error, context.request);
          return apiSuccess({ search: data }, context.request);
        }
        const { data, error } = await supabase.from('recruiter_saved_searches').select('*').eq('recruiter_id', user.id).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ searches: data || [] }, context.request);
      }
      if (subAction === 'create') {
        const { name, search_criteria } = body;
        if (!name) return apiError(400, 'VALIDATION_ERROR', 'name required', context.request);
        const { data, error } = await supabase.from('recruiter_saved_searches').insert({ recruiter_id: user.id, name, search_criteria: search_criteria || {}, use_count: 0 }).select().single();
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ search: data }, context.request);
      }
      if (subAction === 'update') {
        const { id, ...updates } = body;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
        const { data, error } = await supabase.from('recruiter_saved_searches').update(updates).eq('id', id).eq('recruiter_id', user.id).select().single();
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ search: data }, context.request);
      }
      if (subAction === 'delete') {
        const { id } = body;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
        const { error } = await supabase.from('recruiter_saved_searches').delete().eq('id', id).eq('recruiter_id', user.id);
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ deleted: true }, context.request);
      }
      return apiError(400, 'VALIDATION_ERROR', `Unknown sub_action: ${subAction}`, context.request);
    }

    // ── opportunity actions ──
    case 'create-opportunity': {
      const opportunity = body.opportunity;
      if (!opportunity) return apiError(400, 'VALIDATION_ERROR', 'opportunity data required', context.request);
      const { data, error } = await supabase.from('opportunities').insert([opportunity]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ opportunity: data }, context.request);
    }

    case 'update-opportunity': {
      const { id, ...updates } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { data, error } = await supabase.from('opportunities').update(updates).eq('id', id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ opportunity: data }, context.request);
    }

    case 'delete-opportunity': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }

    case 'increment-view-count': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { data: currentData, error: fetchError } = await supabase.from('opportunities').select('views_count').eq('id', id).single();
      if (fetchError) return apiDbError(fetchError, context.request);
      const currentCount = currentData?.views_count || 0;
      const { error } = await supabase.from('opportunities').update({ views_count: currentCount + 1 }).eq('id', id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ incremented: true }, context.request);
    }

    case 'get-opportunities-stats': {
      const { count: total, error: totalError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
      if (totalError) return apiDbError(totalError, context.request);
      const { count: active, error: activeError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).or('status.eq.open,is_active.eq.true');
      if (activeError) return apiDbError(activeError, context.request);
      const { count: draft, error: draftError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'draft');
      if (draftError) return apiDbError(draftError, context.request);
      const { count: closed, error: closedError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'closed');
      if (closedError) return apiDbError(closedError, context.request);
      const { count: cancelled, error: cancelledError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'cancelled');
      if (cancelledError) return apiDbError(cancelledError, context.request);
      return apiSuccess({ total: total || 0, active: active || 0, draft: draft || 0, closed: closed || 0, cancelled: cancelled || 0 }, context.request);
    }

    case 'get-placement-stats': {
      const { collegeId: explicitCollegeId } = body;
      const authUser = getContextUser(context);
      let collegeId = explicitCollegeId;
      if (!collegeId && authUser?.id) {
        const { data: cl } = await supabase.from('college_lecturers').select('collegeId').eq('user_id', authUser.id).maybeSingle();
        collegeId = cl?.collegeId;
      }
      let learnersQuery = supabase.from('learners').select('*', { count: 'exact', head: true });
      if (collegeId) learnersQuery = learnersQuery.eq('college_id', collegeId);
      const { count: totallearners, error: totalError } = await learnersQuery;
      if (totalError) return apiDbError(totalError, context.request);

      let placementQuery = supabase
        .from('applied_jobs')
        .select(`id, learner_id, opportunities!fk_applied_jobs_opportunity(salary_range_max, salary_range_min, employment_type)`)
        .eq('application_status', 'accepted');

      if (collegeId) {
        const { data: collegelearners } = await supabase.from('learners').select('id').eq('college_id', collegeId);
        const learnerIds = collegelearners?.map(s => s.id) || [];
        if (learnerIds.length === 0) {
          return apiSuccess({ learnersPlaced: 0, placementRate: 0, totallearners: totallearners || 0, avgCTC: 0, medianCTC: 0, highestCTC: 0 }, context.request);
        }
        placementQuery = placementQuery.in('learner_id', learnerIds);
      }

      const { data: placements, error: placementError } = await placementQuery;
      if (placementError) return apiDbError(placementError, context.request);

      const uniqueLearnerIds = new Set();
      const salaries: number[] = [];
      (placements || []).forEach(p => {
        uniqueLearnerIds.add(p.learner_id);
        const opp = p.opportunities as any;
        if (opp) {
          const salary = opp.salary_range_max || opp.salary_range_min || 0;
          if (salary > 0) salaries.push(Number(salary));
        }
      });
      const learnersPlaced = uniqueLearnerIds.size;
      salaries.sort((a, b) => a - b);
      const avgCTC = salaries.length > 0 ? salaries.reduce((s, v) => s + v, 0) / salaries.length : 0;
      const medianCTC = salaries.length > 0
        ? salaries.length % 2 === 0 ? (salaries[salaries.length / 2 - 1] + salaries[salaries.length / 2]) / 2 : salaries[Math.floor(salaries.length / 2)]
        : 0;
      const highestCTC = salaries.length > 0 ? Math.max(...salaries) : 0;
      const placementRate = totallearners && totallearners > 0 ? (learnersPlaced / totallearners) * 100 : 0;

      return apiSuccess({
        learnersPlaced, placementRate: Math.round(placementRate * 10) / 10,
        totallearners: totallearners || 0, avgCTC, medianCTC, highestCTC
      }, context.request);
    }

    // ── applied_jobs / application actions ──
    case 'apply-to-job': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);

      const { data: existing } = await supabase.from('applied_jobs').select('id').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      if (existing) return apiSuccess({ success: false, message: 'You have already applied to this job', data: existing }, context.request);

      const { data: learner } = await supabase.from('learners').select('name, email, contact_number').eq('id', learner_id).maybeSingle();
      if (!learner) return apiSuccess({ success: false, message: 'Learner profile not found' }, context.request);

      const { data, error } = await supabase.from('applied_jobs').insert([{ learner_id, opportunity_id, application_status: 'applied' }]).select().single();
      if (error) return apiDbError(error, context.request);

      try {
        await supabase.from('pipeline_candidates').insert([{
          opportunity_id, learner_id, candidate_name: learner.name || 'Unknown', candidate_email: learner.email || '',
          candidate_phone: learner.contact_number || '', stage: 'sourced', source: 'direct_application',
          status: 'active', added_at: new Date().toISOString(), stage_changed_at: new Date().toISOString()
        }]);
      } catch (_) {}

      return apiSuccess({ success: true, message: 'Application submitted successfully!', data }, context.request);
    }

    case 'has-applied': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data } = await supabase.from('applied_jobs').select('id').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      return apiSuccess({ hasApplied: !!data }, context.request);
    }

    case 'get-learner-applications': {
      const { learner_id, status, limit } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      let query = supabase.from('applied_jobs').select('*, opportunity:opportunities!fk_applied_jobs_opportunity(id, job_title, title, company_name, company_logo, location, employment_type, salary_range_min, salary_range_max, mode, department, recruiter_id, experience_level)').eq('learner_id', learner_id).order('applied_at', { ascending: false });
      if (status) query = query.eq('application_status', status);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ applications: data || [] }, context.request);
    }

    case 'get-learner-application-stats': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('applied_jobs').select('application_status').eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      const stats = (data || []).reduce((acc, app) => {
        acc.total++;
        if (acc.hasOwnProperty(app.application_status)) acc[app.application_status]++;
        return acc;
      }, { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 });
      return apiSuccess({ stats }, context.request);
    }

    case 'get-all-applications': {
      const { status, date_from, date_to, search, company_name, department, employment_type, college_id } = body;
      let query = supabase.from('applied_jobs').select('*').order('applied_at', { ascending: false });
      if (status) query = query.eq('application_status', status);
      if (date_from) query = query.gte('applied_at', date_from);
      if (date_to) query = query.lte('applied_at', date_to);
      const { data: appliedJobs, error: appliedJobsError } = await query;
      if (appliedJobsError) return apiDbError(appliedJobsError, context.request);
      if (!appliedJobs || appliedJobs.length === 0) return apiSuccess({ applications: [] }, context.request);

      const learnerIds = [...new Set(appliedJobs.map(job => job.learner_id))];
      const opportunityIds = [...new Set(appliedJobs.map(job => job.opportunity_id))];

      const [{ data: learners }, { data: opportunities }] = await Promise.all([
        supabase.from('learners').select('id, user_id, name, email, contact_number, university, universityId, branch_field, course_name, college_school_name, district_name, currentCgpa, expectedGraduationDate, approval_status, college_id').in('id', learnerIds),
        supabase.from('opportunities').select('*').in('id', opportunityIds),
      ]);

      const companyNames = [...new Set((opportunities || []).map(o => o.company_name).filter(Boolean))];
      let companies: any[] = [];
      if (companyNames.length > 0) {
        const { data: companiesData } = await supabase.from('companies').select('id, name, industry, companySize, hqCity, hqState, website, accountStatus').in('name', companyNames);
        companies = companiesData || [];
      }

      const learnerMap = (learners || []).reduce((acc, l) => { acc[l.id] = l; return acc; }, {});
      const oppMap = (opportunities || []).reduce((acc, o) => { acc[o.id] = o; return acc; }, {});
      const companyMap = companies.reduce((acc, c) => { acc[c.name] = c; return acc; }, {});

      let result = appliedJobs.map(job => {
        const learner = learnerMap[job.learner_id];
        const opp = oppMap[job.opportunity_id];
        const company = opp ? companyMap[opp.company_name] : null;
        return {
          ...job,
          learner: learner ? {
            id: learner.id, user_id: learner.user_id, name: learner.name || 'Unknown Learner',
            email: learner.email || 'No email', contact_number: learner.contact_number || '',
            university: learner.university || 'N/A', branch_field: learner.branch_field || '',
            course_name: learner.course_name || '', college_school_name: learner.college_school_name || '',
            district_name: learner.district_name || '', currentCgpa: learner.currentCgpa || null,
            expectedGraduationDate: learner.expectedGraduationDate || '', approval_status: learner.approval_status, college_id: learner.college_id
          } : { id: job.learner_id, user_id: '', name: 'Unknown Learner', email: 'No email', contact_number: '', university: 'N/A', branch_field: '', course_name: '', college_school_name: '', district_name: '', currentCgpa: null, expectedGraduationDate: '', approval_status: '', college_id: '' },
          opportunity: opp,
          company
        };
      });

      if (search) {
        const s = search.toLowerCase();
        result = result.filter(a => (a.learner?.name?.toLowerCase().includes(s) || a.learner?.email?.toLowerCase().includes(s) || a.opportunity?.title?.toLowerCase().includes(s) || a.opportunity?.job_title?.toLowerCase().includes(s) || a.opportunity?.company_name?.toLowerCase().includes(s) || a.company?.name?.toLowerCase().includes(s)));
      }
      if (company_name) result = result.filter(a => a.opportunity?.company_name === company_name);
      if (department) result = result.filter(a => a.learner?.branch_field === department || a.learner?.course_name === department || a.opportunity?.department === department);
      if (employment_type) result = result.filter(a => a.opportunity?.employment_type === employment_type);
      if (college_id) result = result.filter(a => a.learner?.college_id === college_id);

      return apiSuccess({ applications: result }, context.request);
    }

    case 'get-application-stats': {
      const { college_id, status, date_from, date_to } = body;
      if (college_id) {
        const { data: learners } = await supabase.from('learners').select('id').eq('college_id', college_id);
        const learnerIds = (learners || []).map(s => s.id);
        if (learnerIds.length === 0) return apiSuccess({ stats: { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 } }, context.request);
        let query = supabase.from('applied_jobs').select('application_status').in('learner_id', learnerIds);
        if (status) query = query.eq('application_status', status);
        if (date_from) query = query.gte('applied_at', date_from);
        if (date_to) query = query.lte('applied_at', date_to);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request);
        const stats = (data || []).reduce((acc, app) => { acc.total++; if (acc.hasOwnProperty(app.application_status)) acc[app.application_status]++; return acc; }, { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 });
        return apiSuccess({ stats }, context.request);
      }
      let query = supabase.from('applied_jobs').select('application_status');
      if (status) query = query.eq('application_status', status);
      if (date_from) query = query.gte('applied_at', date_from);
      if (date_to) query = query.lte('applied_at', date_to);
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request);
      const stats = (data || []).reduce((acc, app) => { acc.total++; if (acc.hasOwnProperty(app.application_status)) acc[app.application_status]++; return acc; }, { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 });
      return apiSuccess({ stats }, context.request);
    }

    case 'update-application-status': {
      const { id, status: newStatus, notes } = body;
      if (!id || !newStatus) return apiError(400, 'VALIDATION_ERROR', 'id and status required', context.request);
      const updateData: any = { application_status: newStatus, updated_at: new Date().toISOString() };
      if (notes) updateData.notes = notes;
      if (newStatus === 'viewed') updateData.viewed_at = new Date().toISOString();
      else if (newStatus === 'interview_scheduled') updateData.interview_scheduled_at = new Date().toISOString();
      const { data, error } = await supabase.from('applied_jobs').update(updateData).eq('id', id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ application: data }, context.request);
    }

    case 'bulk-update-applications': {
      const { ids, status: newStatus, notes } = body;
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !newStatus) return apiError(400, 'VALIDATION_ERROR', 'ids array and status required', context.request);
      const updateData: any = { application_status: newStatus, updated_at: new Date().toISOString() };
      if (notes) updateData.notes = notes;
      if (newStatus === 'viewed') updateData.viewed_at = new Date().toISOString();
      else if (newStatus === 'interview_scheduled') updateData.interview_scheduled_at = new Date().toISOString();
      const { data, error } = await supabase.from('applied_jobs').update(updateData).in('id', ids).select();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ applications: data || [] }, context.request);
    }

    case 'withdraw-application': {
      const { id, learner_id } = body;
      if (!id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'id and learner_id required', context.request);
      const { data, error } = await supabase.from('applied_jobs').update({ application_status: 'withdrawn', updated_at: new Date().toISOString() }).eq('id', id).eq('learner_id', learner_id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Application withdrawn successfully', data }, context.request);
    }

    case 'delete-application': {
      const { id, learner_id } = body;
      if (!id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'id and learner_id required', context.request);
      const { error } = await supabase.from('applied_jobs').delete().eq('id', id).eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Application deleted successfully' }, context.request);
    }

    case 'get-recent-applications': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase.from('applied_jobs').select('*, opportunity:opportunities!fk_applied_jobs_opportunity(job_title, company_name, company_logo)').eq('learner_id', learner_id).gte('applied_at', thirtyDaysAgo.toISOString()).order('applied_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ applications: data || [] }, context.request);
    }

    case 'get-all-applicants': {
      const { status, opportunity_id, limit } = body;
      let query = supabase.from('applied_jobs').select('*');
      if (status) query = query.eq('application_status', status);
      if (opportunity_id) query = query.eq('opportunity_id', opportunity_id);
      if (limit) query = query.limit(limit);
      query = query.order('applied_at', { ascending: false });
      const { data: appliedJobs, error } = await query;
      if (error) return apiDbError(error, context.request);
      if (!appliedJobs || appliedJobs.length === 0) return apiSuccess({ applicants: [] }, context.request);

      const learnerIds = [...new Set(appliedJobs.map(j => j.learner_id))];
      const opportunityIds = [...new Set(appliedJobs.map(j => j.opportunity_id))];

      const [{ data: learners }, { data: opportunities }] = await Promise.all([
        supabase.from('learners').select('id, user_id, name, email, contact_number, university, branch_field, course_name, college_school_name, district_name, currentCgpa, expectedGraduationDate, approval_status').in('id', learnerIds),
        supabase.from('opportunities').select('*').in('id', opportunityIds),
      ]);

      const learnerMap = (learners || []).reduce((acc, l) => {
        acc[l.id] = { id: l.id, name: l.name || 'Unknown', email: l.email || '', phone: l.contact_number ? String(l.contact_number) : '', department: l.branch_field || l.course_name || '', university: l.university || '', college: l.college_school_name || l.university || '', district: l.district_name || '', course: l.course_name || '', cgpa: l.currentCgpa || '', year_of_passing: l.expectedGraduationDate ? l.expectedGraduationDate.split('-')[0] : '', verified: l.approval_status === 'approved' || false, employability_score: 0, skill: '' };
        return acc;
      }, {});
      const oppMap = (opportunities || []).reduce((acc, o) => { acc[o.id] = o; return acc; }, {});

      const result = (appliedJobs || []).map(job => ({ ...job, learner: learnerMap[job.learner_id] || null, opportunity: oppMap[job.opportunity_id] || null }));
      return apiSuccess({ applicants: result }, context.request);
    }

    case 'get-applicant-stats': {
      const { data, error } = await supabase.from('applied_jobs').select('application_status');
      if (error) return apiDbError(error, context.request);
      const stats = (data || []).reduce((acc, app) => { acc.total++; if (acc.hasOwnProperty(app.application_status)) acc[app.application_status]++; return acc; }, { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 });
      return apiSuccess({ stats }, context.request);
    }

    case 'get-companies-with-applications': {
      const { data: appliedJobs, error } = await supabase.from('applied_jobs').select('opportunity_id');
      if (error) return apiDbError(error, context.request);
      if (!appliedJobs || appliedJobs.length === 0) return apiSuccess({ companies: [] }, context.request);
      const opportunityIds = [...new Set(appliedJobs.map(j => j.opportunity_id))];
      const { data: opportunities } = await supabase.from('opportunities').select('company_name').in('id', opportunityIds);
      const companyNames = [...new Set((opportunities || []).map(o => o.company_name).filter(Boolean))];
      if (companyNames.length === 0) return apiSuccess({ companies: [] }, context.request);
      const { data: companies } = await supabase.from('companies').select('id, name').in('name', companyNames);
      return apiSuccess({ companies: companies || [] }, context.request);
    }

    case 'get-pipeline-data-for-application': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data, error } = await supabase.from('pipeline_candidates').select('*').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ pipelineCandidate: data }, context.request);
    }

    // ── Offer actions ──
    case 'accept-offer': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { data, error } = await supabase.from('applied_jobs').update({ application_status: 'accepted', responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).select('*, opportunity:opportunities(id, job_title, company_name, applications_count)').single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, data }, context.request);
    }

    case 'reject-offer': {
      const { id, reason } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const updateData: any = { application_status: 'rejected', responded_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      if (reason) updateData.notes = reason;
      const { data, error } = await supabase.from('applied_jobs').update(updateData).eq('id', id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, data }, context.request);
    }

    case 'check-openings-available': {
      const { opportunity_id } = body;
      if (!opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'opportunity_id required', context.request);
      const { data, error } = await supabase.from('opportunities').select('applications_count, status, is_active').eq('id', opportunity_id).single();
      if (error) return apiDbError(error, context.request);
      const hasOpenings = (data?.applications_count || 0) > 0 && data?.is_active && data?.status !== 'filled';
      return apiSuccess({ success: true, hasOpenings }, context.request);
    }

    case 'get-opportunity-with-openings': {
      const { opportunity_id } = body;
      if (!opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'opportunity_id required', context.request);
      const { data, error } = await supabase.from('opportunities').select('*, accepted_count:applied_jobs(count)').eq('id', opportunity_id).eq('applied_jobs.application_status', 'accepted').single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, data }, context.request);
    }

    // ── Interview actions ──
    case 'get-interviews': {
      const { data, error } = await supabase.from('interviews').select('*').order('date', { ascending: true });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interviews: data }, context.request);
    }
    case 'get-interview-by-id': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { data, error } = await supabase.from('interviews').select('*').eq('id', id).single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'get-interviews-for-learner': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('interviews').select('*').eq('learner_id', learner_id).order('date', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interviews: data }, context.request);
    }
    case 'get-upcoming-interviews': {
      const { data, error } = await supabase.from('upcoming_interviews').select('*');
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interviews: data }, context.request);
    }
    case 'get-pending-scorecards': {
      const { data, error } = await supabase.from('pending_scorecards').select('*');
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ scorecards: data }, context.request);
    }
    case 'create-interview': {
      const { interview } = body;
      if (!interview) return apiError(400, 'VALIDATION_ERROR', 'interview data required', context.request);
      const { data, error } = await supabase.from('interviews').insert([interview]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'update-interview': {
      const { id, ...updates } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { data, error } = await supabase.from('interviews').update(updates).eq('id', id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'delete-interview': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { error } = await supabase.from('interviews').delete().eq('id', id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }
    case 'update-interview-status': {
      const { id, status: newStatus } = body;
      if (!id || !newStatus) return apiError(400, 'VALIDATION_ERROR', 'id and status required', context.request);
      const updates: any = { status: newStatus };
      if (newStatus === 'completed') updates.completed_date = new Date().toISOString();
      const { data, error } = await supabase.from('interviews').update(updates).eq('id', id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'update-scorecard': {
      const { id, scorecard } = body;
      if (!id || !scorecard) return apiError(400, 'VALIDATION_ERROR', 'id and scorecard required', context.request);
      const { data, error } = await supabase.from('interviews').update({ scorecard, status: 'completed', completed_date: new Date().toISOString() }).eq('id', id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'log-interview-reminder': {
      const { reminder } = body;
      if (!reminder) return apiError(400, 'VALIDATION_ERROR', 'reminder data required', context.request);
      const { data, error } = await supabase.from('interview_reminders').insert([reminder]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ reminder: data }, context.request);
    }
    case 'get-reminder-history': {
      const { interview_id } = body;
      if (!interview_id) return apiError(400, 'VALIDATION_ERROR', 'interview_id required', context.request);
      const { data, error } = await supabase.from('interview_reminders').select('*').eq('interview_id', interview_id).order('sent_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ reminders: data }, context.request);
    }
    case 'send-interview-reminder': {
      const { id, reminders_sent, sent_to } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { error: updateError } = await supabase.from('interviews').update({ reminders_sent: (reminders_sent || 0) + 1 }).eq('id', id);
      if (updateError) return apiDbError(updateError, context.request);
      const reminderData: any = { interview_id: id, sent_to: sent_to || '', reminder_type: 'interview_reminder' };
      const { data, error: logError } = await supabase.from('interview_reminders').insert([reminderData]).select().single();
      if (logError) return apiDbError(logError, context.request);
      return apiSuccess({ reminder: data }, context.request);
    }

    // ── Saved Jobs actions ──
    case 'save-job': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data: existing } = await supabase.from('saved_jobs').select('id').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      if (existing) return apiSuccess({ success: true, message: 'Job is already saved', data: existing, alreadySaved: true }, context.request);
      const { data, error } = await supabase.from('saved_jobs').insert([{ learner_id, opportunity_id }]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Job saved successfully!', data, alreadySaved: false }, context.request);
    }
    case 'unsave-job': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data, error } = await supabase.from('saved_jobs').delete().eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).select();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Job unsaved successfully!', data }, context.request);
    }
    case 'is-saved': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data } = await supabase.from('saved_jobs').select('id').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      return apiSuccess({ isSaved: !!data }, context.request);
    }
    case 'get-saved-job-ids': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('saved_jobs').select('opportunity_id').eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ ids: (data || []).map(item => item.opportunity_id) }, context.request);
    }
    case 'get-saved-jobs-with-details': {
      const { learner_id, activeOnly, limit } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      let query = supabase.from('saved_jobs').select('*, opportunity:opportunities(id, title, job_title, company_name, company_logo, employment_type, location, mode, stipend_or_salary, salary_range_min, salary_range_max, experience_required, experience_level, skills_required, description, application_link, deadline, posted_date, is_active, department, created_at)').eq('learner_id', learner_id).order('saved_at', { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request);
      let savedJobs = (data || []).map(item => ({ saved_job_id: item.id, saved_at: item.saved_at, ...item.opportunity }));
      if (activeOnly) savedJobs = savedJobs.filter(j => j.is_active);
      return apiSuccess({ savedJobs }, context.request);
    }
    case 'get-saved-jobs-with-applied-status': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      let query = supabase.from('saved_jobs').select('*, opportunity:opportunities(id, title, job_title, company_name, company_logo, employment_type, location, mode, stipend_or_salary, salary_range_min, salary_range_max, experience_required, experience_level, skills_required, description, application_link, deadline, posted_date, is_active, department, created_at)').eq('learner_id', learner_id).order('saved_at', { ascending: false });
      const { data } = await query;
      const savedJobs = (data || []).map(item => ({ saved_job_id: item.id, saved_at: item.saved_at, ...item.opportunity }));
      const { data: appliedJobs } = await supabase.from('applied_jobs').select('opportunity_id, application_status, applied_at').eq('learner_id', learner_id);
      const appliedMap = new Map((appliedJobs || []).map(app => [app.opportunity_id, app]));
      const result = savedJobs.map(job => ({ ...job, has_applied: appliedMap.has(job.id), application_status: appliedMap.get(job.id)?.application_status || null, applied_at: appliedMap.get(job.id)?.applied_at || null }));
      return apiSuccess({ savedJobs: result }, context.request);
    }
    case 'get-saved-jobs-count': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { count, error } = await supabase.from('saved_jobs').select('*', { count: 'exact', head: true }).eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ count: count || 0 }, context.request);
    }
    case 'remove-inactive-saved-jobs': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data: savedData } = await supabase.from('saved_jobs').select('*, opportunity:opportunities(id, is_active)').eq('learner_id', learner_id);
      if (!savedData || savedData.length === 0) return apiSuccess({ success: true, message: 'No inactive saved jobs to remove', count: 0 }, context.request);
      const inactiveIds = savedData.filter(s => !s.opportunity?.is_active).map(s => s.opportunity_id);
      if (inactiveIds.length === 0) return apiSuccess({ success: true, message: 'No inactive saved jobs to remove', count: 0 }, context.request);
      const { error } = await supabase.from('saved_jobs').delete().eq('learner_id', learner_id).in('opportunity_id', inactiveIds);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: `Removed ${inactiveIds.length} inactive saved jobs`, count: inactiveIds.length }, context.request);
    }

    // ── Search History actions ──
    case 'add-search-term': {
      const { learner_id, search_term } = body;
      if (!learner_id || !search_term) return apiError(400, 'VALIDATION_ERROR', 'learner_id and search_term required', context.request);
      const trimmed = search_term.trim();
      const { data: existing } = await supabase.from('search_history').select('id, search_count').eq('learner_id', learner_id).eq('search_term', trimmed).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from('search_history').update({ search_count: existing.search_count + 1, last_searched_at: new Date().toISOString() }).eq('id', existing.id).select().single();
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ success: true, message: 'Search term updated', data }, context.request);
      }
      const { count } = await supabase.from('search_history').select('*', { count: 'exact', head: true }).eq('learner_id', learner_id);
      if (count && count >= 5) {
        const { data: oldest } = await supabase.from('search_history').select('id').eq('learner_id', learner_id).order('last_searched_at', { ascending: true }).limit(1).maybeSingle();
        if (oldest) await supabase.from('search_history').delete().eq('id', oldest.id);
      }
      const { data, error } = await supabase.from('search_history').insert([{ learner_id, search_term: trimmed, search_count: 1, last_searched_at: new Date().toISOString() }]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Search term added', data }, context.request);
    }
    case 'get-search-history': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('search_history').select('*').eq('learner_id', learner_id).order('last_searched_at', { ascending: false }).limit(5);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ history: data || [] }, context.request);
    }
    case 'delete-search-term': {
      const { learner_id, id: searchId } = body;
      if (!learner_id || !searchId) return apiError(400, 'VALIDATION_ERROR', 'learner_id and id required', context.request);
      const { error } = await supabase.from('search_history').delete().eq('id', searchId).eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Search term deleted' }, context.request);
    }
    case 'clear-search-history': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { error } = await supabase.from('search_history').delete().eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Search history cleared' }, context.request);
    }
    case 'get-most-searched-terms': {
      const { learner_id, limit: qlimit } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('search_history').select('*').eq('learner_id', learner_id).order('search_count', { ascending: false }).limit(qlimit || 5);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ terms: data || [] }, context.request);
    }

    // ── Shortlist actions ──
    case 'get-shortlists': {
      const { data, error } = await supabase.from('shortlists').select('*, shortlist_candidates(count)').order('created_date', { ascending: false });
      if (error) return apiDbError(error, context.request);
      const formatted = (data || []).map(item => ({ ...item, candidate_count: item.shortlist_candidates?.[0]?.count || 0 }));
      return apiSuccess({ shortlists: formatted }, context.request);
    }
    case 'get-shortlist-by-id': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { data, error } = await supabase.from('shortlists').select('*').eq('id', id).single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ shortlist: data }, context.request);
    }
    case 'create-shortlist': {
      const { shortlist } = body;
      if (!shortlist) return apiError(400, 'VALIDATION_ERROR', 'shortlist data required', context.request);
      const { data, error } = await supabase.from('shortlists').insert([shortlist]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ shortlist: data }, context.request);
    }
    case 'update-shortlist': {
      const { id, ...updates } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { data, error } = await supabase.from('shortlists').update(updates).eq('id', id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ shortlist: data }, context.request);
    }
    case 'delete-shortlist': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { error } = await supabase.from('shortlists').delete().eq('id', id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }
    case 'get-shortlist-candidates': {
      const { shortlist_id } = body;
      if (!shortlist_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id required', context.request);
      await supabase.from('shortlists').select('id, name').eq('id', shortlist_id).single();
      const { data, error } = await supabase.from('shortlist_candidates').select('id, added_at, notes, learner_id, shortlist_id').eq('shortlist_id', shortlist_id);
      if (error) return apiDbError(error, context.request);
      if (!data || data.length === 0) return apiSuccess({ candidates: [] }, context.request);
      const learnerIds = data.map(d => d.learner_id);
      const { data: learners } = await supabase.from('learners').select('id, profile').in('id', learnerIds);
      const candidates = data.map(item => {
        const learner = (learners || []).find(l => l.id === item.learner_id);
        if (!learner) return null;
        let profile = typeof learner.profile === 'string' ? (() => { try { return JSON.parse(learner.profile); } catch { return {}; } })() : (learner.profile || {});
        const educationArray = profile.education || [];
        const education = educationArray.find((e: any) => e.status === 'ongoing') || educationArray[0] || {};
        let cgpa = education.cgpa || profile.cgpa || 'N/A';
        return {
          id: learner.id, name: profile.name || profile.nm_id || 'Unknown', email: profile.email || (profile.contact_number ? String(profile.contact_number) : 'N/A'),
          phone: profile.contact_number ? String(profile.contact_number) : (profile.alternate_number ? String(profile.alternate_number) : 'N/A'),
          university: education.university || profile.university || profile.college_school_name || 'N/A',
          department: education.department || profile.branch_field || 'N/A', cgpa, year_of_passing: education.yearOfPassing || education.year_of_passing || 'N/A',
          employability_score: profile._ || profile.score || null, photo: profile.photo || null, verified: profile.verified || false,
          added_at: item.added_at, notes: item.notes, junction_id: item.id
        };
      }).filter(Boolean);
      return apiSuccess({ candidates }, context.request);
    }
    case 'add-candidate-to-shortlist': {
      const { shortlist_id, learner_id, added_by, notes } = body;
      if (!shortlist_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id and learner_id required', context.request);
      const { data, error } = await supabase.from('shortlist_candidates').insert([{ shortlist_id, learner_id, added_by, notes }]).select().single();
      if (error) {
        if (error.code === '23505') return apiSuccess({ data: null, error: { ...error, message: 'Candidate is already in this shortlist' } }, context.request);
        return apiDbError(error, context.request);
      }
      return apiSuccess({ data }, context.request);
    }
    case 'remove-candidate-from-shortlist': {
      const { shortlist_id, learner_id } = body;
      if (!shortlist_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id and learner_id required', context.request);
      const { error } = await supabase.from('shortlist_candidates').delete().eq('shortlist_id', shortlist_id).eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }
    case 'is-learner-in-shortlist': {
      const { shortlist_id, learner_id } = body;
      if (!shortlist_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id and learner_id required', context.request);
      const { data, error } = await supabase.from('shortlist_candidates').select('id').eq('shortlist_id', shortlist_id).eq('learner_id', learner_id).maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ inShortlist: !!data }, context.request);
    }
    case 'get-shortlists-for-learner': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('shortlist_candidates').select('*, shortlists(id, name, description, created_date, status)').eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ shortlists: (data || []).map(item => item.shortlists) }, context.request);
    }
    case 'update-candidate-notes': {
      const { shortlist_id, learner_id, notes } = body;
      if (!shortlist_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id and learner_id required', context.request);
      const { data, error } = await supabase.from('shortlist_candidates').update({ notes }).eq('shortlist_id', shortlist_id).eq('learner_id', learner_id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ data }, context.request);
    }
    case 'log-export-activity': {
      const { export_data } = body;
      if (!export_data) return apiError(400, 'VALIDATION_ERROR', 'export_data required', context.request);
      const { data, error } = await supabase.from('export_activities').insert([export_data]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ data }, context.request);
    }
    case 'get-export-history': {
      const { shortlist_id } = body;
      if (!shortlist_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id required', context.request);
      const { data, error } = await supabase.from('export_activities').select('*').eq('shortlist_id', shortlist_id).order('exported_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ exports: data }, context.request);
    }

    // ── Pipeline helper actions (from usePipelineData) ──
    case 'get-opportunities-by-ids': {
      const { ids } = body;
      if (!ids || !Array.isArray(ids)) return apiError(400, 'VALIDATION_ERROR', 'ids array required', context.request);
      const { data, error } = await supabase.from('opportunities').select('id, skills_required').in('id', ids);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ opportunities: data || [] }, context.request);
    }
    case 'get-skills-by-learner-ids': {
      const { learner_ids } = body;
      if (!learner_ids || !Array.isArray(learner_ids)) return apiError(400, 'VALIDATION_ERROR', 'learner_ids array required', context.request);
      const { data, error } = await supabase.from('skills').select('learner_id, name, enabled').in('learner_id', learner_ids).eq('enabled', true);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ skills: data || [] }, context.request);
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
  }
});
