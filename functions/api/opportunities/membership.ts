import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';

/** Only IDs for the current result page, sidebar and open detail are queried. */
export const onRequestGet = withAuth(async (context) => {
  const ids = [
    ...new Set(
      (new URL(context.request.url).searchParams.get('ids') || '')
        .split(',')
        .filter(Boolean),
    ),
  ];
  if (
    !ids.length ||
    ids.length > 100 ||
    ids.some(
      (id) =>
        !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
          id,
        ),
    )
  )
    return apiError(
      400,
      'VALIDATION_ERROR',
      'Provide between 1 and 100 valid opportunity IDs.',
      context.request,
    );
  const db = getServiceClient(context.env);
  const { data: learner, error } = await db
    .from('learners')
    .select('id')
    .eq('user_id', getContextUser(context).id)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error) return apiDbError(error, context.request);
  if (!learner)
    return apiError(
      404,
      'NOT_FOUND',
      'Learner profile not found.',
      context.request,
    );
  const [applied, saved] = await Promise.all([
    db
      .from('applied_jobs')
      .select('opportunity_id')
      .eq('learner_id', learner.id)
      .in('opportunity_id', ids),
    db
      .from('saved_jobs')
      .select('opportunity_id')
      .eq('learner_id', learner.id)
      .in('opportunity_id', ids),
  ]);
  if (applied.error || saved.error)
    return apiDbError(applied.error || saved.error, context.request);
  const response = apiSuccess(
    {
      appliedIds: (applied.data || []).map((row) => row.opportunity_id),
      savedIds: (saved.data || []).map((row) => row.opportunity_id),
    },
    context.request,
  );
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
