import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { OrchestratorVideoInputSchema, serializeCanonicalInput, type OrchestratorVideoInput } from '@rareminds-eym/ai-protocol';

export async function videoIdentityHash(value: unknown): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serializeCanonicalInput(value)));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

const JobClaimSchema = z.object({ created: z.boolean(), id: z.string().uuid(), summary: z.object({
  id: z.string().uuid(), processing_status: z.enum(['pending', 'processing', 'completed', 'failed']),
}).passthrough() }).strict();

export async function claimVideoJob(db: SupabaseClient, actorId: string, requestHash: string, summary: Record<string, unknown>) {
  const result = await db.rpc('claim_ai_video_job', { p_actor_id: actorId, p_request_hash: requestHash, p_summary: summary });
  const parsed = JobClaimSchema.safeParse(result.data);
  if (result.error || !parsed.success || parsed.data.id !== parsed.data.summary.id) throw new Error('DEPENDENCY_UNAVAILABLE: Video job claim could not be confirmed');
  return parsed.data;
}

/** The first canonical source wins; lost acknowledgements adopt the stored input. */
export async function freezeVideoInput(db: SupabaseClient, actorId: string, input: OrchestratorVideoInput): Promise<OrchestratorVideoInput> {
  const canonical = OrchestratorVideoInputSchema.parse(input);
  const hash = await videoIdentityHash(canonical);
  const result = await db.rpc('freeze_ai_video_job', { p_actor_id: actorId, p_job_id: canonical.jobId,
    p_source_input: canonical, p_source_hash: hash });
  const parsed = z.object({ input: OrchestratorVideoInputSchema, hash: z.string().regex(/^[a-f0-9]{64}$/) }).strict().safeParse(result.data);
  if (result.error || !parsed.success || parsed.data.input.jobId !== canonical.jobId || await videoIdentityHash(parsed.data.input) !== parsed.data.hash) {
    throw new Error('DEPENDENCY_UNAVAILABLE: Frozen video source could not be confirmed');
  }
  return parsed.data.input;
}
