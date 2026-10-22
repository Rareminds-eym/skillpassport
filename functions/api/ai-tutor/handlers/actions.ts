import { withAuth, getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError } from '../../../lib/response';
import { handleVideoAction } from './video-actions';

export const onRequestPost = withAuth(async (context) => {
  const startTime = Date.now();
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiDbError(new Error('Invalid JSON body'), context.request, { startTime });
  }

  const { action, ...params } = body;
  if (!action) {
    return apiDbError(new Error('action is required'), context.request, { startTime });
  }

  try {
    const videoResponse = await handleVideoAction(supabase, getContextUser(context).id, action, params, context.request, env.VIDEO_JOBS_ENABLED === 'true');
    if (videoResponse) return videoResponse;
    switch (action) {

      case 'increment-views': {
        const { opp_id } = params;
        if (!opp_id) return apiDbError(new Error('opp_id is required'), context.request, { startTime });
        const { error } = await supabase.rpc('increment_views', { opp_id });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ─── OPPORTUNITY INTERACTIONS ─────────────────────────────────

      case 'track-interaction': {
        const { learner_id, opportunity_id, action: interactionAction } = params;
        if (!learner_id || !opportunity_id || !interactionAction) return apiDbError(new Error('learner_id, opportunity_id, action required'), context.request, { startTime });
        const { error } = await supabase.from('opportunity_interactions').upsert({
          learner_id, opportunity_id, action: interactionAction,
        }, { onConflict: 'learner_id,opportunity_id,action' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-opportunity': {
        const { opportunity_id } = params;
        if (!opportunity_id) return apiDbError(new Error('opportunity_id required'), context.request, { startTime });
        const { data, error } = await supabase.from('opportunities').select('*').eq('id', opportunity_id).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-opportunities-without-embedding': {
        const { data } = await supabase.from('opportunities').select('id').is('embedding', null).eq('is_active', true);
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ─── LEARNER ─────────────────────────────────────────────────

      case 'get-learner': {
        const { learner_id } = params;
        if (!learner_id) return apiDbError(new Error('learner_id required'), context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('*').eq('id', learner_id).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-learner-profile': {
        const { learner_id, ...profileData } = params;
        if (!learner_id) return apiDbError(new Error('learner_id required'), context.request, { startTime });
        const { error } = await supabase.from('learners').upsert({
          id: learner_id, ...profileData, updated_at: new Date().toISOString(),
        });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ─── CONVERSATIONS ───────────────────────────────────────────

      case 'get-conversations': {
        const { course_id } = params;
        if (!course_id) return apiDbError(new Error('course_id required'), context.request, { startTime });
        const { data, error } = await supabase.from('tutor_conversations').select('id, title, course_id, lesson_id, created_at, updated_at, messages').eq('course_id', course_id).order('updated_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-conversation': {
        const { id } = params;
        if (!id) return apiDbError(new Error('id required'), context.request, { startTime });
        const { data, error } = await supabase.from('tutor_conversations').select('id, title, course_id, lesson_id, created_at, updated_at, messages').eq('id', id).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-conversation': {
        const { id } = params;
        if (!id) return apiDbError(new Error('id required'), context.request, { startTime });
        await supabase.from('tutor_feedback').delete().eq('conversation_id', id);
        const { error } = await supabase.from('tutor_conversations').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ─── VIDEO SUMMARIES ─────────────────────────────────────────

      default:
        return apiDbError(new Error(`Unknown action: ${action}`), context.request, { startTime });
    }
  } catch (error) {
    console.error('[AI Tutor Actions] Error:', error);
    return apiDbError(error, context.request, { startTime });
  }
});
