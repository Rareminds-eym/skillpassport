/**
 * Learner Activity API
 *
 * Handles education, training, experience, and skills data for learners.
 * All endpoints require SSO authentication.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

/**
 * GET /api/learners/activity — Get learner activity data
 * Query params: type (education|training|experience|skills), learner_id
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const type = url.searchParams.get('type');
  const learnerId = url.searchParams.get('learner_id') || user.id;

  if (!type) {
    return apiError(400, 'VALIDATION_ERROR', 'type query param is required (education|training|experience|skills)', context.request);
  }

  const tableMap: Record<string, string> = {
    education: 'learner_education',
    training: 'learner_training',
    experience: 'learner_experience',
    skills: 'learner_skills',
  };

  const table = tableMap[type];
  if (!table) {
    return apiError(400, 'VALIDATION_ERROR', `Invalid type: ${type}`, context.request);
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('learner_id', learnerId)
    .order('created_at', { ascending: false });

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ data }, context.request);
});

/**
 * POST /api/learners/activity — Create/update activity record
 * Body: { type, ...record }
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { type, ...record } = body;

  const tableMap: Record<string, string> = {
    education: 'learner_education',
    training: 'learner_training',
    experience: 'learner_experience',
    skills: 'learner_skills',
  };

  const table = tableMap[type];
  if (!table) {
    return apiError(400, 'VALIDATION_ERROR', `Invalid type: ${type}`, context.request);
  }

  // Set learner_id from JWT if not provided
  if (!record.learner_id) {
    record.learner_id = user.id;
  }

  if (record.id) {
    // Update
    const { data, error } = await supabase
      .from(table)
      .update(record)
      .eq('id', record.id)
      .select()
      .single();

    if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
    return apiSuccess({ data }, context.request);
  }

  // Create
  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single();

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ data }, context.request, 201);
});
