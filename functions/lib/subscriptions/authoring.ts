import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { loadCreditAuthoringContext, type CreditAuthoringContextBinding } from './credit-authoring-context';

export interface PlanStagingBinding extends CreditAuthoringContextBinding {
  stageSubscriptionPlanRevisionBundle(accessToken: string, bundle: unknown, productId: string,
    features: readonly { key: string; type: string; options?: readonly string[] }[]): Promise<unknown>;
}

export const draftRequest = z.object({ bundle: z.object({
  draft: z.object({ id: z.string().uuid(), plan: z.object({ id: z.string().uuid() }).passthrough() }).passthrough(),
}).passthrough() }).strict();

/** Only app-owner feature definitions cross the private binding; the full draft is validated by SSO. */
export async function stageOrdinaryDraft(sso: PlanStagingBinding, database: SupabaseClient,
  accessToken: string, request: unknown, productId: string) {
  const input = draftRequest.parse(request);
  const context = await loadCreditAuthoringContext(sso, database, input.bundle.draft.plan.id, productId);
  const result = await sso.stageSubscriptionPlanRevisionBundle(accessToken, input.bundle, context.plan.productId,
    context.features.map(feature => ({ key: feature.key, type: feature.type,
      ...(feature.type === 'enum' ? { options: feature.options } : {}) })));
  // The SSO adapter validates the complete staging receipt before returning success.
  // A malformed transport response is not a valid write acknowledgement.
  const outcome = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('staged'), receipt: z.object({ bundle: z.object({ schemaVersion: z.literal(1),
      draft: z.object({ id: z.string().uuid(), plan: z.object({ id: z.string().uuid(), productId: z.string().uuid(), code: z.string().regex(/^pln_[0-9a-f]{32}$/) }).strict() }).passthrough(),
      includedCredits: z.object({ revisionId: z.string().uuid() }).passthrough() }).strict(),
      stagedBy: z.string().uuid(), stagedAt: z.string().datetime({ offset: true }) }).strict() }).strict(),
    z.object({ kind: z.literal('invalid') }).strict(), z.object({ kind: z.literal('forbidden') }).strict(),
  ]).parse(result);
  if (outcome.kind === 'staged' && (outcome.receipt.bundle.draft.id.toLowerCase() !== input.bundle.draft.id.toLowerCase()
    || outcome.receipt.bundle.includedCredits.revisionId.toLowerCase() !== outcome.receipt.bundle.draft.id.toLowerCase()
    || outcome.receipt.bundle.draft.plan.id.toLowerCase() !== context.plan.id
    || outcome.receipt.bundle.draft.plan.productId.toLowerCase() !== context.plan.productId
    || outcome.receipt.bundle.draft.plan.code !== context.plan.code)) throw new Error('Staging acknowledgement scope differs');
  return outcome;
}

export class DraftRequestError extends Error {
  constructor(readonly status: number) { super('Invalid draft request'); }
}

/** Bound actual streamed bytes rather than trusting Content-Length. No partial JSON is accepted. */
export async function readDraftRequest(request: Request): Promise<unknown> {
  if (new URL(request.url).search || request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new DraftRequestError(400);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new DraftRequestError(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 262144) { await reader.cancel(); throw new DraftRequestError(413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new DraftRequestError(400); }
}
