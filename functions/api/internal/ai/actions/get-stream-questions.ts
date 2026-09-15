import { GetStreamQuestionsPayloadSchema } from '@rareminds-eym/ai-protocol';
import type { AiDataPort } from '../db';

/** stream-questions:get — canonical shared AI-question sets by (stream, grade). No learner PII. */
export async function handleGetStreamQuestions(
  db: AiDataPort,
  _userId: string,
  payload: unknown,
): Promise<{ ok: true; data: object } | { ok: false; error: { code: string; message: string } }> {
  void _userId;
  const parsed = GetStreamQuestionsPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid stream-questions payload' } };
  }
  const sets = await db.getStreamQuestionSets(parsed.data.streamId, parsed.data.gradeLevel);
  return { ok: true, data: { sets } };
}
