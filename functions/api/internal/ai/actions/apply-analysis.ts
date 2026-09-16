import { ApplyAnalysisPayloadSchema } from '@rareminds-eym/ai-protocol';
import type { AiDataPort } from '../db';

/**
 * analysis:apply — idempotent report application. Verifies attempt ownership,
 * merges the validated report plus an operation marker, and returns a receipt.
 * Replays of the same operationId return the prior receipt without rewriting.
 */
export async function handleApplyAnalysis(
  db: AiDataPort,
  userId: string,
  payload: unknown,
): Promise<{ ok: true; data: object } | { ok: false; error: { code: string; message: string } }> {
  const parsed = ApplyAnalysisPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid apply payload' } };
  }
  const learnerId = await db.findLearnerIdByUser(userId);
  if (!learnerId) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Learner not found' } };
  }
  const attempt = await db.getAttempt(parsed.data.attemptId, learnerId);
  if (!attempt) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Attempt not found' } };
  }
  // Optimistic-concurrency revision check: refuse to apply over a newer
  // attempt revision instead of silently clobbering it.
  if (
    parsed.data.expectedUpdatedAt !== undefined &&
    attempt.updated_at !== undefined &&
    attempt.updated_at !== null &&
    attempt.updated_at !== parsed.data.expectedUpdatedAt
  ) {
    return { ok: false, error: { code: 'STALE_REVISION', message: 'Attempt changed since analysis started' } };
  }
  const receipt = await db.mergeReport(
    parsed.data.attemptId,
    parsed.data.operationId,
    {
      analysis: parsed.data.report,
    },
    parsed.data.expectedUpdatedAt,
  );
  return {
    ok: true,
    data: {
      attemptId: parsed.data.attemptId,
      applied: !receipt.duplicate,
      duplicate: receipt.duplicate,
      at: receipt.at,
    },
  };
}
