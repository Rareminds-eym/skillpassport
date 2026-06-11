/**
 * Assessment Questions API
 * GET: Fetch saved questions for a learner
 * POST: Action-based dispatch for save/clear operations on career_assessment_ai_questions
 */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../lib/auth';
import { apiDbError, apiError, apiSuccess } from '../lib/response';
import { getServiceClient } from '../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const learnerId = url.searchParams.get('learnerId');
  const streamId = url.searchParams.get('streamId');
  const questionType = url.searchParams.get('questionType');

  if (!learnerId || !streamId || !questionType) {
    return apiError(400, 'VALIDATION_ERROR', 'learnerId, streamId, and questionType are required', context.request);
  }

  const { data, error } = await supabase
    .from('career_assessment_ai_questions')
    .select('questions, generated_at')
    .eq('learner_id', learnerId)
    .eq('stream_id', streamId)
    .eq('question_type', questionType)
    .eq('is_active', true)
    .maybeSingle();

  if (error) return apiDbError(error, context.request);
  return apiSuccess({ questions: data?.questions ?? null, generatedAt: data?.generated_at ?? null }, context.request);
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  const startTime = Date.now();

  try {
    switch (action) {
      case 'save-aptitude':
      case 'save-knowledge': {
        const { learner_id, stream_id, question_type, attempt_id, questions, grade_level } = params;
        if (!learner_id || !stream_id || !questions) {
          return apiError(400, 'VALIDATION_ERROR', 'learner_id, stream_id, and questions are required', context.request, { startTime });
        }
        const { error } = await supabase
          .from('career_assessment_ai_questions')
          .upsert({
            learner_id,
            stream_id,
            question_type: question_type || action.replace('save-', ''),
            attempt_id: attempt_id || null,
            questions,
            generated_at: new Date().toISOString(),
            grade_level: grade_level || null,
            is_active: true,
          }, { onConflict: 'learner_id,stream_id,question_type' })
          .select('id');

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ saved: true }, context.request, { startTime });
      }

      case 'clear-saved': {
        const { learner_id, stream_id } = params;
        if (!learner_id || !stream_id) {
          return apiError(400, 'VALIDATION_ERROR', 'learner_id and stream_id are required', context.request, { startTime });
        }
        const { error } = await supabase
          .from('career_assessment_ai_questions')
          .update({ is_active: false })
          .eq('learner_id', learner_id)
          .eq('stream_id', stream_id);

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ cleared: true }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[assessment-questions POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
