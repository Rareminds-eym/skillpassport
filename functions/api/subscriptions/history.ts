import { z } from 'zod';
import { readDraftRequest, DraftRequestError } from '../../lib/subscriptions/authoring';
import { applicationFeatureDefinition, catalogInventoryDatabase, readApplicationFeatureInventory } from '../../lib/subscriptions/catalog-inventory';
import { historicalCreditPoolsSchema, readSubscriptionCreditHistory, validateSubscriptionAudit } from '../../lib/subscriptions/history';
import { subscriptionConsumerEndpoint, subscriptionFailure, subscriptionResponseHeaders } from '../../lib/subscriptions/current-subscription';

const reference = z.string().uuid().transform(value => value.toLowerCase());
const request = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('credits'), subscriptionId: reference, recipientId: reference, poolKey: z.string().min(1),
    revisionId: reference.optional(), after: z.string().regex(/^sc1_[0-9a-f]{64}$/).nullable().optional() }).strict(),
  z.object({ kind: z.literal('pools'), subscriptionId: reference, revisionId: reference }).strict(),
  z.object({ kind: z.literal('audit'), subscriptionId: reference, after: reference.nullable().optional() }).strict(),
]);
const prepared = z.object({ kind: z.literal('usage'), actorId: reference, scope: z.object({
  subscriptionId: reference, productId: reference, poolKey: z.string().min(1), featureKey: z.string().min(1),
  recipient: z.object({ kind: z.enum(['subscriber', 'organization', 'managed_learner']), id: reference }).strict(),
}).strict() }).strict();

export const onRequestPost = subscriptionConsumerEndpoint('POST', async context => {
  if ([...new URL(context.request.url).searchParams].length) return subscriptionFailure(400);
  let input;
  try { input = request.safeParse(await readDraftRequest(context.request)); }
  catch (error) { if (error instanceof DraftRequestError) return subscriptionFailure(error.status); throw error; }
  if (!input.success) return subscriptionFailure(400);
  if (input.data.kind === 'pools') {
    const { subscriptionId, revisionId } = input.data;
    const raw = await context.env.SSO_SERVICE!.prepareSubscriptionCreditExecution(context.token, context.productId,
      { kind: 'history_pools', subscriptionId, revisionId }, []);
    if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
    const pools = historicalCreditPoolsSchema.parse(raw);
    if (pools.actorId !== context.actorId || pools.productId !== context.productId
      || pools.subscriptionId !== subscriptionId || pools.revisionId !== revisionId) throw new Error('Historical pool scope differs');
    return Response.json(pools, { headers: subscriptionResponseHeaders });
  }
  if (input.data.kind === 'audit') {
    const { subscriptionId, after = null } = input.data;
    const raw = await context.env.SSO_SERVICE!.getSubscriptionAudit(context.token, subscriptionId, context.productId, after);
    if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
    return Response.json(validateSubscriptionAudit(raw, context.actorId, context.productId, subscriptionId, after), { headers: subscriptionResponseHeaders });
  }
  const database = catalogInventoryDatabase(context.env);
  const features = (await readApplicationFeatureInventory(database)).map(item => {
    const { key, type, ...rest } = applicationFeatureDefinition(item);
    return { key, type, ...('options' in rest ? { options: rest.options } : {}) };
  });
  const { after, kind: _kind, ...identity } = input.data;
  const raw = await context.env.SSO_SERVICE!.prepareSubscriptionCreditExecution(context.token, context.productId,
    { ...identity, kind: identity.revisionId === undefined ? 'usage' : 'history' }, features);
  if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
  const owner = prepared.parse(raw);
  if (owner.actorId !== context.actorId || owner.scope.subscriptionId !== identity.subscriptionId
    || owner.scope.productId !== context.productId || owner.scope.poolKey !== identity.poolKey
    || owner.scope.recipient.id !== identity.recipientId) throw new Error('Subscription history scope differs');
  return Response.json(await readSubscriptionCreditHistory(database, owner.scope, after), { headers: subscriptionResponseHeaders });
});
