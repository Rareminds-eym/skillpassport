import { z } from 'zod';
import { readDraftRequest, DraftRequestError } from '../../lib/subscriptions/authoring';
import { subscriptionConsumerEndpoint, subscriptionFailure, subscriptionResponseHeaders } from '../../lib/subscriptions/current-subscription';
import { requireSubscriptionAccess } from '../../shared/lib/subscription-access';

const reference = z.string().uuid().transform(value => value.toLowerCase());
const requestSchema = z.object({
  actionKey: z.string().min(1).max(200), mode: z.enum(['read', 'write']),
  subject: z.object({ kind: z.enum(['user', 'organization']), id: reference }).strict(),
}).strict();

/** Selectors are requests, never policy. The signed owner and immutable revision authorize them. */
export const onRequestPost = subscriptionConsumerEndpoint('POST', async context => {
  if ([...new URL(context.request.url).searchParams].length) return subscriptionFailure(400);
  let parsed;
  try { parsed = requestSchema.safeParse(await readDraftRequest(context.request)); }
  catch (error) { if (error instanceof DraftRequestError) return subscriptionFailure(error.status); throw error; }
  if (!parsed.success) return subscriptionFailure(400);
  const requested = parsed.data;
  if (requested.subject.kind === 'user' && requested.subject.id !== context.actorId) return subscriptionFailure(403);
  const decision = await requireSubscriptionAccess({ env: context.env, request: context.request,
    actorId: context.actorId, ...requested });
  if (decision instanceof Response) return decision;
  if (!('binding' in decision) || decision.binding.paymentRequired === true
    || !['boolean', 'numeric_limit', 'enum'].includes(decision.grant.type)) return subscriptionFailure(503);
  const { state } = decision.context;
  const validUntil = requested.mode === 'write' ? Math.min(state.periodEndsAt, decision.context.subscriptionEndsAt) : null;
  if (validUntil !== null && Date.now() >= validUntil) return subscriptionFailure(403);
  const quota = decision.binding.quota && decision.grant.type === 'numeric_limit' ? {
    ...decision.binding.quota,
    periodStartsAt: decision.binding.quota.period === 'subscription' ? decision.context.activatedAt : state.periodStartsAt,
    periodEndsAt: decision.binding.quota.period === 'subscription' ? decision.context.subscriptionEndsAt : state.periodEndsAt,
    limit: decision.grant.limit.kind === 'finite' ? decision.grant.limit.value : null,
  } : null;
  return Response.json({ schemaVersion: 1, actorId: context.actorId, subject: state.subject,
    subscriptionId: state.id, productId: state.productId, revisionId: state.revisionId, version: state.version,
    actionKey: decision.binding.actionKey, featureKey: decision.binding.featureKey, mode: requested.mode,
    validUntil, quota }, { headers: subscriptionResponseHeaders });
});
