import { GetSectionsPayloadSchema } from '@rareminds-eym/ai-protocol';
import type { AiDataPort } from '../db';

/** sections:get — bounded section id→name lookup for grade analyzers. No ownership join needed (IDs are opaque). */
export async function handleGetSections(
  db: AiDataPort,
  _userId: string,
  payload: unknown,
): Promise<{ ok: true; data: object } | { ok: false; error: { code: string; message: string } }> {
  void _userId;
  const parsed = GetSectionsPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid sections payload' } };
  }
  const sections = await db.getSections(parsed.data.ids);
  return { ok: true, data: { sections } };
}
