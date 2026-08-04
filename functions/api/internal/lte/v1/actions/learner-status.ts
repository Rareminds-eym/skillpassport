import { z } from 'zod';
import type { GatewayAction } from '../types';

const PayloadSchema = z.object({ userId: z.string().uuid('userId must be a valid UUID') });

/**
 * Lightweight learner assessment status (read-only):
 *   - hasAssessment:            learner has at least one COMPLETED result
 *   - hasInProgressAssessment:  learner has an in-progress attempt
 *
 * Lets LTE decide between "Take Assessment" vs "Continue/Resume" in the UI
 * without exposing any assessment content.
 */
export const handleLearnerStatus: GatewayAction = async (ctx, rawPayload) => {
  const parsed = PayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message ?? 'Invalid payload',
      },
    };
  }

  const { userId } = parsed.data;
  if (userId !== ctx.userId) {
    return {
      ok: false,
      error: { code: 'FORBIDDEN', message: 'Requested user does not match the authenticated claim' },
    };
  }

  const learner = await ctx.db.queryOne<{ id: string }>(
    `learners?user_id=eq.${encodeURIComponent(userId)}&select=id`,
  );
  if (!learner) {
    return { ok: true, data: { hasAssessment: false, hasInProgressAssessment: false } };
  }

  const [completed, inProgress] = await Promise.all([
    ctx.db.queryOne<{ id: string }>(
      `personal_assessment_results?learner_id=eq.${encodeURIComponent(learner.id)}` +
        '&status=eq.completed&select=id&limit=1',
    ),
    ctx.db.queryOne<{ id: string }>(
      `personal_assessment_attempts?learner_id=eq.${encodeURIComponent(learner.id)}` +
        '&status=eq.in_progress&select=id&limit=1',
    ),
  ]);

  return {
    ok: true,
    data: { hasAssessment: !!completed, hasInProgressAssessment: !!inProgress },
  };
};
