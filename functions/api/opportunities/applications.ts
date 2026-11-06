import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';
import {
  paginationParams,
  literalContains,
  readPage,
} from '../../lib/opportunity-pagination';

interface ApplicationRow {
  id: string;
  opportunity_id: string;
  [key: string]: unknown;
}
interface PipelineRow {
  opportunity_id: string;
  stage?: string;
  previous_stage?: string;
  stage_changed_at?: string;
  assigned_to?: string;
  assigned_to_uuid?: string;
  rejection_reason?: string;
  next_action?: string;
  next_action_date?: string;
}
interface InterviewRow {
  opportunity_id: string | null;
  [key: string]: unknown;
}
const statuses = [
  'applied',
  'viewed',
  'under_review',
  'interview_scheduled',
  'interviewed',
  'offer_received',
  'accepted',
  'rejected',
  'withdrawn',
];
export const onRequestGet = withAuth(async (context) => {
  const params = new URL(context.request.url).searchParams;
  let page;
  const status = params.get('status') || 'all';
  const kind = params.get('kind') || 'all';
  try {
    page = paginationParams(params);
    if (!['all', 'jobs', 'visits'].includes(kind))
      throw new Error('Invalid submission type.');
    if (status !== 'all' && !statuses.includes(status))
      throw new Error('Invalid application status.');
  } catch (error) {
    return apiError(
      400,
      'VALIDATION_ERROR',
      (error as Error).message,
      context.request,
    );
  }
  const user = getContextUser(context);
  const db = getServiceClient(context.env);
  const { data: learner, error: learnerError } = await db
    .from('learners')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .maybeSingle();
  if (learnerError) return apiDbError(learnerError, context.request);
  if (!learner)
    return apiError(
      404,
      'NOT_FOUND',
      'Learner profile not found.',
      context.request,
    );
  let query = db
    .from('applied_jobs')
    .select(
      `*, opportunity:opportunities!fk_applied_jobs_opportunity!inner(id,job_title,title,company_name,company_logo,location,employment_type,salary_range_min,salary_range_max,mode,department,recruiter_id,experience_level,sector,status,is_active)`,
      { count: 'exact' },
    )
    .eq('learner_id', learner.id);
  if (kind === 'jobs')
    query = query.neq('opportunity.employment_type', 'factory_visit');
  if (kind === 'visits')
    query = query.eq('opportunity.employment_type', 'factory_visit');
  if (status !== 'all') query = query.eq('application_status', status);
  if (page.search)
    query = query.or(
      ['job_title', 'title', 'company_name']
        .map(
          (column) =>
            `${column}.ilike.${JSON.stringify(literalContains(page.search))}`,
        )
        .join(','),
      { referencedTable: 'opportunity' },
    );
  query = query
    .order('applied_at', { ascending: page.sort === 'oldest' })
    .order('id', { ascending: page.sort === 'oldest' });
  const {
    data: applications,
    error,
    count,
  } = await readPage<ApplicationRow>(query, page.limit, page.offset);
  if (error) return apiDbError(error, context.request);
  const ids = (applications || []).map((app) => app.opportunity_id);
  let pipeline: PipelineRow[] = [],
    interviews: InterviewRow[] = [];
  if (ids.length) {
    const [p, i] = await Promise.all([
      db
        .from('pipeline_candidates')
        .select(
          'id,opportunity_id,stage,previous_stage,stage_changed_at,assigned_to,assigned_to_uuid,rejection_reason,next_action,next_action_date',
        )
        .eq('learner_id', learner.id)
        .eq('status', 'active')
        .in('opportunity_id', ids)
        .order('stage_changed_at', { ascending: false })
        .order('id'),
      // Verified local FK: interviews.learner_id references learners.user_id.
      db
        .from('interviews')
        .select(
          'id,opportunity_id,job_title,date,status,type,meeting_type,meeting_link,duration,interviewer',
        )
        .eq('learner_id', user.id)
        .in('opportunity_id', ids)
        .in('status', ['scheduled', 'confirmed', 'pending'])
        .order('date')
        .order('id'),
    ]);
    if (p.error || i.error)
      return apiDbError(p.error || i.error, context.request);
    pipeline = p.data || [];
    interviews = i.data || [];
  }
  const jobs = (applications || []).map((app) => {
    const candidate = pipeline.find(
      (p) => p.opportunity_id === app.opportunity_id,
    );
    return {
      ...app,
      pipeline_status: candidate || null,
      has_pipeline_status: !!candidate,
      pipeline_stage: candidate?.stage || null,
      pipeline_stage_changed_at: candidate?.stage_changed_at || null,
      rejection_reason: candidate?.rejection_reason || null,
      next_action: candidate?.next_action || null,
      next_action_date: candidate?.next_action_date || null,
      pipeline_recruiter_id:
        candidate?.assigned_to_uuid || candidate?.assigned_to || null,
      interviews: interviews.filter(
        (i) => i.opportunity_id === app.opportunity_id,
      ),
    };
  });
  const response = apiSuccess(
    {
      applications: jobs,
      total: count ?? 0,
      limit: page.limit,
      offset: page.offset,
    },
    context.request,
  );
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
