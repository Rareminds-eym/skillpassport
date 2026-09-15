import { GetAdaptivePayloadSchema } from '@rareminds-eym/ai-protocol';
import type { AiDataPort } from '../db';

/**
 * adaptive:get — session + results for an attempt-linked adaptive session.
 * Ownership is bound server-side: the attempt is loaded through the owned
 * `attempt:get` path and its linked session id must equal the requested one.
 * Anything else (unknown attempt, unlinked session, missing rows) returns
 * nulls — fail-closed with no existence oracle, never another session.
 */
export async function handleGetAdaptive(
  db: AiDataPort,
  userId: string,
  payload: unknown,
): Promise<{ ok: true; data: object } | { ok: false; error: { code: string; message: string } }> {
  const parsed = GetAdaptivePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid adaptive payload' } };
  }
  const learnerId = await db.findLearnerIdByUser(userId);
  if (!learnerId) {
    return { ok: true, data: { session: null, results: null } };
  }
  const attempt = await db.getAttempt(parsed.data.attemptId, learnerId);
  if (!attempt || attempt.adaptive_aptitude_session_id !== parsed.data.sessionId) {
    return { ok: true, data: { session: null, results: null } };
  }
  const fetched = await db.getAdaptiveResults(parsed.data.sessionId);
  if (!fetched) {
    return { ok: true, data: { session: null, results: null } };
  }
  return { ok: true, data: { session: fetched.session, results: fetched.results } };
}
