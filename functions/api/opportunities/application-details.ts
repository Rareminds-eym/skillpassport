import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';
import { JOB_FIELDS } from '../../lib/job-recommendations';

/** Historical detail access requires ownership of the application, not an open job. */
export const onRequestGet = withAuth(async (context) => {
  const id = new URL(context.request.url).searchParams.get('id') || '';
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)
  )
    return apiError(
      400,
      'VALIDATION_ERROR',
      'A valid application ID is required.',
      context.request,
    );
  const db = getServiceClient(context.env);
  const { data: learner, error: learnerError } = await db
    .from('learners')
    .select('id')
    .eq('user_id', getContextUser(context).id)
    .eq('is_deleted', false)
    .maybeSingle();
  if (learnerError) return apiDbError(learnerError, context.request);
  if (!learner)
    return apiError(
      404,
      'NOT_FOUND',
      'Application not found.',
      context.request,
    );
  const { data, error } = await db
    .from('applied_jobs')
    .select(
      `id,opportunity_id,application_status,applied_at,updated_at,opportunity:opportunities!fk_applied_jobs_opportunity(${JOB_FIELDS})`,
    )
    .eq('id', id)
    .eq('learner_id', learner.id)
    .maybeSingle();
  if (error) return apiDbError(error, context.request);
  if (!data)
    return apiError(
      404,
      'NOT_FOUND',
      'Application not found.',
      context.request,
    );
  const response = apiSuccess({ application: data }, context.request);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
