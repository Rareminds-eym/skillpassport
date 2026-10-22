import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
const UsageSchema = z.object({ limit: z.literal(2), used: z.number().int().nonnegative(), remaining: z.number().int().min(0).max(2) }).strict();
async function invoke(db: SupabaseClient, method: 'claim_tutor_generation' | 'complete_tutor_generation', actorId: string, operationId: string, hash: string) {
  const result = await db.rpc(method, { p_actor_id: actorId, p_operation_id: operationId, p_request_hash: hash });
  if (result.error) {
    if (result.error.code === 'P0001') throw new Error('FORBIDDEN: You have reached your 2-generation limit or have pending generations.');
    if (result.error.code === '23505') throw new Error('IDEMPOTENCY_CONFLICT: Generation payload changed.');
    throw new Error('DEPENDENCY_UNAVAILABLE: Generation allowance could not be confirmed.');
  }
  if (method === 'complete_tutor_generation' && result.data === null) return undefined;
  const parsed = UsageSchema.safeParse(result.data);
  if (!parsed.success) throw new Error('DEPENDENCY_UNAVAILABLE: Generation allowance returned an invalid receipt.');
  return { limit: parsed.data.limit!, used: parsed.data.used!, remaining: parsed.data.remaining! };
}
export const claimTutorGeneration = (db: SupabaseClient, actorId: string, operationId: string, hash: string) => invoke(db, 'claim_tutor_generation', actorId, operationId, hash);
export const completeTutorGeneration = (db: SupabaseClient, actorId: string, operationId: string, hash: string) => invoke(db, 'complete_tutor_generation', actorId, operationId, hash);
export async function readTutorGenerationUsage(db: SupabaseClient, actorId: string) {
  const result = await db.rpc('get_tutor_generation_usage', { p_actor_id: actorId });
  const parsed = UsageSchema.safeParse(result.data);
  if (result.error || !parsed.success) throw new Error('DEPENDENCY_UNAVAILABLE: Generation usage could not be confirmed.');
  return { limit: parsed.data.limit!, used: parsed.data.used!, remaining: parsed.data.remaining! };
}
