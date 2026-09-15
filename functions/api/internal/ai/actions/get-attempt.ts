import { GetAttemptPayloadSchema } from '@rareminds-eym/ai-protocol';
import type { AiDataPort } from '../db';

/** attempt:get — owned attempt with responses for analysis input. */
export async function handleGetAttempt(
  db: AiDataPort,
  userId: string,
  payload: unknown,
): Promise<{ ok: true; data: object } | { ok: false; error: { code: string; message: string } }> {
  const parsed = GetAttemptPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid attempt payload' } };
  }
  const learnerId = await db.findLearnerIdByUser(userId);
  if (!learnerId) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Learner not found' } };
  }
  const attempt = await db.getAttempt(parsed.data.attemptId, learnerId);
  if (!attempt) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Attempt not found' } };
  }
  return { ok: true, data: { attempt } };
}
