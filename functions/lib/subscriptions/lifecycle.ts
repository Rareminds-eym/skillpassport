import { z } from 'zod';
import { DraftRequestError, readDraftRequest } from './authoring';
import { subscriptionConsumerEndpoint, subscriptionFailure, subscriptionResponseHeaders, subscriptionStateSchema } from './current-subscription';

const reference = z.string().uuid().transform(v => v.toLowerCase());
const requestSchema = z.object({ operationId: reference, request: z.object({
  operation: z.enum(['upgrade', 'renew', 'downgrade', 'cancel', 'expire', 'payment_failed', 'suspend', 'reactivate']),
  subscriptionId: reference, subject: z.object({ kind: z.enum(['user', 'organization']), id: reference }).strict(),
  expectedVersion: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), expectedRevisionId: reference,
  reason: z.string().min(1).max(2000).refine(v => v === v.trim()),
  targetRevisionId: reference.optional(), timing: z.enum(['next_renewal', 'immediate']).optional(),
  quoteId: reference.optional(), settlementId: reference.optional(), approvalId: reference.optional(),
}).strict() }).strict();
export const lifecycleEndpoint = subscriptionConsumerEndpoint('POST', async context => {
  if ([...new URL(context.request.url).searchParams].length) return subscriptionFailure(400);
  let parsed;
  try { parsed = requestSchema.safeParse(await readDraftRequest(context.request)); }
  catch (error) { if (error instanceof DraftRequestError) return subscriptionFailure(error.status); throw error; }
  if (!parsed.success) return subscriptionFailure(400);
  const { operationId, request } = parsed.data;
  const raw = await context.env.SSO_SERVICE!.executeSubscriptionLifecycle(context.token, context.productId, operationId, request);
  if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
  const receipt = z.object({ operationId: reference, committedAt: z.string().datetime({ offset: true }),
    decision: z.object({ expectedVersion: z.number().int().positive(), expectedRevisionId: reference, next: subscriptionStateSchema,
      access: z.enum(['full', 'restricted', 'read_only', 'suspended']), retryAt: z.array(z.number().int().nonnegative()),
      audit: z.object({ operation: z.string(), actorId: reference, reason: z.string(), at: z.number().int().nonnegative(),
        policyId: reference, policyVersion: z.number().int().positive() }).strict() }).strict(),
  }).strict().parse(raw);
  const { decision } = receipt;
  if (receipt.operationId !== operationId || decision.expectedVersion !== request.expectedVersion
    || decision.expectedRevisionId !== request.expectedRevisionId || decision.next.id !== request.subscriptionId
    || decision.next.productId !== context.productId || decision.next.version !== request.expectedVersion + 1
    || decision.next.subject.kind !== request.subject.kind || decision.next.subject.id !== request.subject.id
    || decision.audit.actorId !== context.actorId || decision.audit.operation !== request.operation || decision.audit.reason !== request.reason) {
    throw new Error('Lifecycle acknowledgement differs');
  }
  return Response.json(receipt, { headers: subscriptionResponseHeaders });
});
