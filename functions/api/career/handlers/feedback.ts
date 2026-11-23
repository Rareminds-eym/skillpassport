import { z } from 'zod';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleUpsertFeedback(env: any, userId: string, request: Request): Promise<Response> {
  if (request.method !== 'POST') return apiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', request);
  let input: unknown;
  try { input = await request.json(); } catch { return apiError(400, 'BAD_REQUEST', 'Invalid JSON', request); }
  const parsed = z.object({ conversationId: z.string().uuid(), messageId: z.string().min(1),
    thumbsUp: z.boolean(), userRating: z.number().int().min(1).max(5).nullish(),
    userFeedback: z.string().nullish() }).safeParse(input);
  if (!parsed.success) return apiError(400, 'BAD_REQUEST', 'Invalid feedback', request);
  try {
    const body = parsed.data;
    const supabase = createSupabaseAdminClient(env);

    const { data: conversation, error: conversationError } = await supabase
      .from('career_ai_conversations').select('messages').eq('id', body.conversationId).eq('learner_id', userId).maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation) return apiError(404, 'NOT_FOUND', 'Conversation not found', request);
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const index = messages.findIndex((message: { id: string; role: string }) => message.id === body.messageId && message.role === 'assistant');
    const assistant = messages[index];
    const question = messages.slice(0, index).reverse().find((message: { role: string }) => message.role === 'user');
    if (!assistant || !question) return apiError(400, 'BAD_REQUEST', 'Saved response not found', request);
    const { data: existing, error: lookupError } = await supabase
      .from('ai_evaluations')
      .select('id')
      .eq('conversation_id', body.conversationId)
      .eq('message_id', body.messageId)
      .eq('learner_id', userId)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (existing) {
      const { error } = await supabase
        .from('ai_evaluations')
        .update({
          thumbs_up: body.thumbsUp,
          user_rating: body.userRating || null,
          user_feedback: body.userFeedback || null,
          feedback_at: new Date().toISOString(),
        })
        .eq('id', existing.id).eq('learner_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('ai_evaluations')
        .insert({
          conversation_id: body.conversationId,
          learner_id: userId,
          message_id: body.messageId,
          user_message: question.content,
          ai_response: assistant.content,
          detected_intent: assistant.intent,
          intent_confidence: assistant.intentConfidence,
          conversation_phase: assistant.phase,
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
