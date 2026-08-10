import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { createLogger } from '../../lib/logger';
import { apiDbError, apiError, apiSuccess } from '../../lib/response';
import { ADMIN_ROLES } from '../../lib/roleCategories';
import { getServiceClient } from '../../lib/supabase';

const logger = createLogger('external-assessment-actions');

/**
 * Confirms the requesting user owns `learnerId` (or is an admin).
 * Mirrors the ownership check used in learners/trainings.ts.
 */
async function assertLearnerOwnership(
  supabase: ReturnType<typeof getServiceClient>,
  user: { id: string; roles?: string[] },
  learnerId: string
): Promise<boolean> {
  const isAdmin = user.roles?.some((r: string) => ADMIN_ROLES.includes(r));
  if (isAdmin) return true;

  const { data: ownLearner } = await supabase
    .from('learners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  return ownLearner?.id === learnerId;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = getContextUser(context);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request, { startTime });
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request, { startTime });

  try {
    switch (action) {
      // ──────────────────────────────────────────────
      // CHECK STATUS — has the learner started/completed this course's assessment?
      // ──────────────────────────────────────────────
      case 'check-status': {
        const { learnerId, courseName } = params;
        if (!learnerId || !courseName) {
          return apiError(400, 'VALIDATION_ERROR', 'learnerId and courseName are required', context.request, { startTime });
        }
        if (!(await assertLearnerOwnership(supabase, user, learnerId))) {
          return apiError(403, 'FORBIDDEN', 'You can only view your own assessment status', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('external_assessment_attempts')
          .select('*')
          .eq('learner_id', learnerId)
          .eq('course_name', courseName)
          .maybeSingle();

        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) return apiSuccess({ status: 'not_started', attempt: null }, context.request, { startTime });

        return apiSuccess({ status: data.status, attempt: data }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // CREATE ATTEMPT — first load, save generated questions
      // ──────────────────────────────────────────────
      case 'create-attempt': {
        const { learnerId, courseName, courseId, assessmentLevel, questions } = params;
        if (!learnerId || !courseName || !Array.isArray(questions)) {
          return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseName and questions are required', context.request, { startTime });
        }
        if (!(await assertLearnerOwnership(supabase, user, learnerId))) {
          return apiError(403, 'FORBIDDEN', 'You can only create your own assessment attempt', context.request, { startTime });
        }

        const emptyAnswers = questions.map((q: any) => ({
          question_id: q.id,
          selected_answer: null,
          is_correct: null,
          time_taken: 0,
        }));

        const { data, error } = await supabase
          .from('external_assessment_attempts')
          .insert({
            learner_id: learnerId,
            course_name: courseName,
            course_id: courseId || null,
            assessment_level: assessmentLevel,
            total_questions: questions.length,
            questions,
            learner_answers: emptyAnswers,
            current_question_index: 0,
            status: 'in_progress',
            time_remaining: 900,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return apiError(409, 'CONFLICT', 'Assessment already exists for this course', context.request, { startTime });
          }
          return apiDbError(error, context.request, { startTime });
        }

        return apiSuccess(data, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // UPDATE PROGRESS — save an answer and the resume position
      // ──────────────────────────────────────────────
      case 'update-progress': {
        const { attemptId, questionIndex, answer, timeRemaining, resumeFromIndex } = params;
        if (!attemptId || typeof questionIndex !== 'number') {
          return apiError(400, 'VALIDATION_ERROR', 'attemptId and questionIndex are required', context.request, { startTime });
        }

        const { data: currentAttempt, error: fetchError } = await supabase
          .from('external_assessment_attempts')
          .select('learner_id, learner_answers, questions')
          .eq('id', attemptId)
          .single();

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (!(await assertLearnerOwnership(supabase, user, currentAttempt.learner_id))) {
          return apiError(403, 'FORBIDDEN', 'You can only update your own assessment attempt', context.request, { startTime });
        }

        if (
          !Number.isInteger(questionIndex) ||
          questionIndex < 0 ||
          questionIndex >= currentAttempt.questions.length
        ) {
          return apiError(400, 'VALIDATION_ERROR', 'Invalid questionIndex for this assessment', context.request, { startTime });
        }

        const resumeIndex = typeof resumeFromIndex === 'number' ? resumeFromIndex : questionIndex + 1;
        const question = currentAttempt.questions[questionIndex];
        const correctAnswer = question?.correct_answer || question?.correctAnswer;

        const updatedAnswers = [...currentAttempt.learner_answers];
        updatedAnswers[questionIndex] = {
          question_id: question?.id,
          selected_answer: answer,
          is_correct: answer === correctAnswer,
          time_taken: updatedAnswers[questionIndex]?.time_taken || 0,
        };

        const { error: updateError } = await supabase
          .from('external_assessment_attempts')
          .update({
            learner_answers: updatedAnswers,
            current_question_index: resumeIndex,
            time_remaining: timeRemaining,
            last_activity_at: new Date().toISOString(),
          })
          .eq('id', attemptId);

        if (updateError) return apiDbError(updateError, context.request, { startTime });

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // COMPLETE — finalize score and mark attempt completed
      // ──────────────────────────────────────────────
      case 'complete': {
        const { attemptId, timeTaken } = params;
        if (!attemptId) {
          return apiError(400, 'VALIDATION_ERROR', 'attemptId is required', context.request, { startTime });
        }

        const { data: attempt, error: fetchError } = await supabase
          .from('external_assessment_attempts')
          .select('*')
          .eq('id', attemptId)
          .single();

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (!(await assertLearnerOwnership(supabase, user, attempt.learner_id))) {
          return apiError(403, 'FORBIDDEN', 'You can only complete your own assessment attempt', context.request, { startTime });
        }

        const correctCount = attempt.learner_answers.filter((a: any) => a.is_correct).length;
        const score = Math.round((correctCount / attempt.total_questions) * 100);

        const breakdown: Record<string, { total: number; correct: number; percentage: number }> = {
          easy: { total: 0, correct: 0, percentage: 0 },
          medium: { total: 0, correct: 0, percentage: 0 },
          hard: { total: 0, correct: 0, percentage: 0 },
        };

        attempt.questions.forEach((q: any, idx: number) => {
          const difficulty = q.difficulty;
          if (breakdown[difficulty]) {
            breakdown[difficulty].total++;
            if (attempt.learner_answers[idx]?.is_correct) {
              breakdown[difficulty].correct++;
            }
          }
        });

        Object.keys(breakdown).forEach((key) => {
          if (breakdown[key].total > 0) {
            breakdown[key].percentage = Math.round((breakdown[key].correct / breakdown[key].total) * 100);
          }
        });

        const { error: updateError } = await supabase
          .from('external_assessment_attempts')
          .update({
            status: 'completed',
            score,
            correct_answers: correctCount,
            time_taken: timeTaken,
            difficulty_breakdown: breakdown,
            completed_at: new Date().toISOString(),
          })
          .eq('id', attemptId);

        if (updateError) return apiDbError(updateError, context.request, { startTime });

        return apiSuccess({ score }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // ASSESSMENT HISTORY
      // ──────────────────────────────────────────────
      case 'history': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId is required', context.request, { startTime });
        if (!(await assertLearnerOwnership(supabase, user, learnerId))) {
          return apiError(403, 'FORBIDDEN', 'You can only view your own assessment history', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('external_assessment_attempts')
          .select('*')
          .eq('learner_id', learnerId)
          .order('completed_at', { ascending: false });

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data || [], context.request, { startTime });
      }

      // ─────────────────── ───────────────────────────
      // GET BY COURSE 
      // ─────────────────── ───────────────────────────
      case 'get-by-course':  {
        const { learnerId, courseName } = params;
        if (!learnerId || !courseName) {
          return apiError(400, 'VALIDATION_ERROR', 'learnerId and courseName are required', context.request, { startTime });
        }
        if (!(await assertLearnerOwnership(supabase, user, learnerId))) {
          return apiError(403, 'FORBIDDEN', 'You can only view your own assessment', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('external_assessment_attempts')
          .select('*')
          .eq('learner_id', learnerId)
          .eq('course_name', courseName)
          .maybeSingle();

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data || null, context.request, { startTime });
      }

      default:
        return apiError(404, 'NOT_FOUND', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (err) {
    logger.error('Unexpected error in external-assessment actions', { error: err, action });
    return apiError(500, 'INTERNAL_ERROR', err instanceof Error ? err.message : 'Unknown error', context.request, { startTime });
  }
});
