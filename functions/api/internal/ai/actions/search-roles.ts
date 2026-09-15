import { SearchRolesPayloadSchema } from '@rareminds-eym/ai-protocol';
import type { AiDataPort } from '../db';

/** roles:search — allowlisted hybrid occupation retrieval (RAG primitive). */
export async function handleSearchRoles(
  db: AiDataPort,
  _userId: string,
  payload: unknown,
): Promise<{ ok: true; data: object } | { ok: false; error: { code: string; message: string } }> {
  void _userId;
  const parsed = SearchRolesPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid roles payload' } };
  }
  const roles = await db.hybridSearchRoles({
    queryText: parsed.data.queryText,
    queryEmbedding: parsed.data.queryEmbedding,
    riasecCode: parsed.data.riasecCode,
    matchCount: parsed.data.matchCount,
    alpha: parsed.data.alpha,
  });
  return { ok: true, data: { roles } };
}
