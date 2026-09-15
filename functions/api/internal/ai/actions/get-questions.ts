import { GetQuestionsPayloadSchema } from '@rareminds-eym/ai-protocol';
import type { AiDataPort } from '../db';

/** questions:get — bounded question metadata batch. No ownership join needed (IDs are opaque). */
export async function handleGetQuestions(
  db: AiDataPort,
  _userId: string,
  payload: unknown,
): Promise<{ ok: true; data: object } | { ok: false; error: { code: string; message: string } }> {
  void _userId;
  const parsed = GetQuestionsPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid questions payload' } };
  }
  const questions = await db.getQuestions(parsed.data.ids);
  return { ok: true, data: { questions } };
}
