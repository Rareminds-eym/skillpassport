import { withAuth, getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
type AuthenticatedContext = Parameters<PagesFunction>[0];
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';
import { isValidUUID } from '../../../lib/validation';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as unknown as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) return apiError(400, 'VALIDATION_ERROR', 'Request body must be an object', context.request);
  const { action, ...params } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);
  }

  try {
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
        const { learner_id, opportunity_id, interaction_type: interactionAction } = params;
        if (!isValidUUID(learner_id) || !isValidUUID(opportunity_id) || !['view','save','apply','dismiss'].includes(interactionAction)) {
          return apiError(400, 'VALIDATION_ERROR', 'Valid learner, opportunity and interaction_type required', context.request);
        }
        const actor = getContextUser(context);
        const {data: own, error: identityError} = await supabase.from('learners').select('id, user_id').eq('user_id', actor.id).maybeSingle();
        if (identityError) return apiError(503, 'PROFILE_UNAVAILABLE', 'Learner profile unavailable', context.request);
        if (!own || ![own.id, own.user_id].includes(learner_id)) return apiError(403, 'FORBIDDEN', 'Only your own feedback may be recorded', context.request);
        const { error } = await supabase.from('opportunity_interactions').upsert({
          learner_id: own.user_id, opportunity_id, action: interactionAction,
        }, { onConflict: 'learner_id,opportunity_id,action' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, learnerId: own.id }, context.request, { startTime });
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

      case 'get-video-summary': {
        const { id } = params;
        if (!id) return apiDbError(new Error('id required'), context.request, { startTime });
        const { data, error } = await supabase.from('video_summaries').select('*').eq('id', id).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-video-summary-by-lesson': {
        const { lesson_id } = params;
        if (!lesson_id) return apiDbError(new Error('lesson_id required'), context.request, { startTime });
        const { data, error } = await supabase.from('video_summaries').select('*').eq('lesson_id', lesson_id).eq('processing_status', 'completed').order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-video-summary-robust': {
        const { lesson_id, video_url } = params;
        const { data: s1 } = await supabase.from('video_summaries').select('*').eq('lesson_id', lesson_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (s1?.processing_status === 'completed' || s1?.processing_status === 'failed' || s1?.processing_status === 'processing') return apiSuccess(s1, context.request, { startTime });
        if (video_url) {
          const baseUrl = video_url.split('?')[0];
          const { data: s2 } = await supabase.from('video_summaries').select('*').or(`video_url.eq.${video_url},video_url.like.${baseUrl}%`).eq('processing_status', 'completed').order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (s2) return apiSuccess(s2, context.request, { startTime });
        }
        return apiSuccess(null, context.request, { startTime });
      }

      case 'get-video-summary-by-url': {
        const { video_url } = params;
        if (!video_url) return apiDbError(new Error('video_url required'), context.request, { startTime });
        const { data, error } = await supabase.from('video_summaries').select('*').eq('video_url', video_url).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-video-summary': {
        const { id } = params;
        if (!id) return apiDbError(new Error('id required'), context.request, { startTime });
        const { error } = await supabase.from('video_summaries').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'check-processing-status': {
        const { id } = params;
        if (!id) return apiDbError(new Error('id required'), context.request, { startTime });
        const { data, error } = await supabase.from('video_summaries').select('*').eq('id', id).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) return apiSuccess({ status: 'not_found' }, context.request, { startTime });
        const result: any = { status: data.processing_status };
        if (data.processing_status === 'completed') result.summary = data;
        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-failed-record': {
        const { id } = params;
        if (!id) return apiDbError(new Error('id required'), context.request, { startTime });
        const { data, error } = await supabase.from('video_summaries').select('error_message, processing_status').eq('id', id).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      default:
        return apiDbError(new Error(`Unknown action: ${action}`), context.request, { startTime });
    }
  } catch (error) {
    console.error('[AI Tutor Actions] Error:', error);
    return apiDbError(error, context.request, { startTime });
  }
});
