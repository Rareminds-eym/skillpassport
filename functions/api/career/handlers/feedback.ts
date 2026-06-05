import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleUpsertFeedback(env: any, userId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as any;
    const supabase = createSupabaseAdminClient(env);

    const { data: existing } = await supabase
      .from('ai_evaluations')
      .select('id')
      .eq('conversation_id', body.conversationId)
      .eq('message_id', body.messageId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('ai_evaluations')
        .update({
          thumbs_up: body.thumbsUp,
          user_rating: body.userRating || null,
          user_feedback: body.userFeedback || null,
          feedback_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('ai_evaluations')
        .insert({
          conversation_id: body.conversationId,
          learner_id: userId,
          message_id: body.messageId,
          user_message: body.userMessage,
          ai_response: body.aiResponse,
          detected_intent: body.detectedIntent,
          intent_confidence: body.intentConfidence,
          conversation_phase: body.conversationPhase,
          thumbs_up: body.thumbsUp,
          user_rating: body.userRating || null,
          user_feedback: body.userFeedback || null,
          feedback_at: new Date().toISOString(),
        });

      if (error) throw error;
    }

    return apiSuccess({ saved: true }, request);
  } catch (error) {
    console.error('[ERROR] feedback upsert:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to save feedback', request);
  }
}

export async function handleGetFeedback(env: any, userId: string, request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId') || '';
    if (!conversationId) return apiError(400, 'BAD_REQUEST', 'conversationId required', request);

    const supabase = createSupabaseAdminClient(env);
    const { data, error } = await supabase
      .from('ai_evaluations')
      .select('message_id, thumbs_up, user_rating, user_feedback')
      .eq('conversation_id', conversationId)
      .eq('learner_id', userId);

    if (error) throw error;
    return apiSuccess(data || [], request);
  } catch (error) {
    console.error('[ERROR] feedback get:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to load feedback', request);
  }
}
