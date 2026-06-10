/**
 * Adaptive Cache API
 * POST: Action-based dispatch for adaptive_aptitude_questions_cache operations
 * and update_question_usage RPC call
 */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../lib/auth';
import { apiDbError, apiError, apiSuccess } from '../lib/response';
import { getServiceClient } from '../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const gradeLevel = url.searchParams.get('gradeLevel');
  const phase = url.searchParams.get('phase');
  const difficulty = url.searchParams.get('difficulty');
  const subtag = url.searchParams.get('subtag');
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const excludeIds = (url.searchParams.get('excludeIds') || '').split(',').filter(Boolean);

  if (!gradeLevel || !phase) {
    return apiError(400, 'VALIDATION_ERROR', 'gradeLevel and phase are required', context.request);
  }

  let query = supabase
    .from('adaptive_aptitude_questions_cache')
    .select('*')
    .eq('grade_level', gradeLevel)
    .eq('phase', phase)
    .eq('is_active', true);

  if (difficulty) {
    query = query.eq('difficulty', parseInt(difficulty, 10));
  }

  if (subtag) {
    query = query.eq('subtag', subtag);
  }

  if (excludeIds.length > 0) {
    query = query.not('question_id', 'in', `(${excludeIds.join(',')})`);
  }

  query = query.order('usage_count', { ascending: true }).limit(limit);

  const { data, error } = await query;

  if (error) return apiDbError(error, context.request);
  return apiSuccess(data || [], context.request);
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
      case 'cache-questions': {
        const { questions } = params;
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          return apiSuccess({ cached: false }, context.request, { startTime });
        }

        const records = questions.map((q: any) => ({
          question_id: q.id,
          text: q.text,
          options: q.options,
          correct_answer: q.correctAnswer,
          difficulty: q.difficulty,
          subtag: q.subtag,
          grade_level: q.gradeLevel,
          phase: q.phase,
          explanation: q.explanation || null,
        }));

        const { error } = await supabase
          .from('adaptive_aptitude_questions_cache')
          .upsert(records, { onConflict: 'question_id' });

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ cached: true }, context.request, { startTime });
      }

      case 'update-usage': {
        const { questionIds } = params;
        if (!questionIds || !Array.isArray(questionIds)) {
          return apiError(400, 'VALIDATION_ERROR', 'questionIds array is required', context.request, { startTime });
        }

        for (const questionId of questionIds) {
          const { error } = await supabase.rpc('update_question_usage', { p_question_id: questionId });
          if (error) {
            console.warn(`[adaptive-cache] Failed to update usage for ${questionId}:`, error?.message);
          }
        }

        return apiSuccess({ updated: true }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[adaptive-cache POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
