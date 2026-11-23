import { z } from 'zod';
import { readDraftRequest, DraftRequestError } from '../../lib/subscriptions/authoring';
import { applicationFeatureDefinition, catalogInventoryDatabase, readApplicationFeatureInventory } from '../../lib/subscriptions/catalog-inventory';
import { allocateSubscriptionCredits, consumeSubscriptionCredits, readSubscriptionCreditUsage, readSubscriptionCreditConsumption, readSubscriptionCreditAllocation } from '../../lib/subscriptions/credits';
import { subscriptionConsumerEndpoint, subscriptionFailure, subscriptionResponseHeaders } from '../../lib/subscriptions/current-subscription';
import { refreshSubscriptionCredits } from '../../lib/subscriptions/credit-refresh';

const reference = z.string().uuid().transform(v => v.toLowerCase());
const base = { subscriptionId: reference, recipientId: reference };
const requestSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('refresh'), ruleId: reference,
    cursor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable() }).strict(),
  z.object({ ...base, kind: z.literal('allocate'), ruleId: reference,
    occurrenceIndex: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) }).strict(),
  z.object({ ...base, kind: z.literal('consume'), poolKey: z.string().min(1), actionKey: z.string().min(1), operationId: reference }).strict(),
  z.object({ ...base, kind: z.literal('usage'), poolKey: z.string().min(1) }).strict(),
]);
export const onRequestPost = subscriptionConsumerEndpoint('POST', async context => {
  if ([...new URL(context.request.url).searchParams].length) return subscriptionFailure(400);
  let value;
  try { value = requestSchema.safeParse(await readDraftRequest(context.request)); }
  catch (error) { if (error instanceof DraftRequestError) return subscriptionFailure(error.status); throw error; }
  if (!value.success) return subscriptionFailure(400);
  const database = catalogInventoryDatabase(context.env);
  const features = (await readApplicationFeatureInventory(database)).map(item => {
    const { key, type, ...rest } = applicationFeatureDefinition(item);
    return { key, type, ...('options' in rest ? { options: rest.options } : {}) };
  });
  if (value.data.kind === 'refresh') {
    const owner = await context.env.SSO_SERVICE!.prepareSubscriptionCreditExecution(context.token, context.productId, value.data, features);
    if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(owner).success) return subscriptionFailure(403);
    const result = await refreshSubscriptionCredits(database, owner, { actorId: context.actorId, productId: context.productId,
      subscriptionId: value.data.subscriptionId, recipientId: value.data.recipientId, ruleId: value.data.ruleId, cursor: value.data.cursor });
    return Response.json(result, { headers: subscriptionResponseHeaders });
  }
  if (value.data.kind === 'allocate') {
    const replayRaw = await context.env.SSO_SERVICE!.prepareSubscriptionCreditExecution(context.token, context.productId,
      { ...value.data, kind: 'allocation_replay' }, features);
    if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(replayRaw).success) return subscriptionFailure(403);
    const replay = z.object({ kind: z.literal('allocation_replay'), actorId: reference, occurrence: z.unknown() }).strict().parse(replayRaw);
    const occurrence = z.object({ subscriptionId: reference, productId: reference, ruleId: reference,
      recipient: z.object({ kind: z.enum(['subscriber', 'organization', 'managed_learner']), id: reference }).strict() }).passthrough().parse(replay.occurrence);
    if (replay.actorId !== context.actorId || occurrence.subscriptionId !== value.data.subscriptionId || occurrence.productId !== context.productId
      || occurrence.ruleId !== value.data.ruleId || occurrence.recipient.id !== value.data.recipientId) throw new Error('Allocation replay scope differs');
    const existing = await readSubscriptionCreditAllocation(database, replay.occurrence, context.actorId);
    if (existing) return Response.json(existing, { headers: subscriptionResponseHeaders });
  }
  if (value.data.kind === 'consume') {
    // Replays remain reads even after expiry. New spending is prepared separately below.
    const replayRaw = await context.env.SSO_SERVICE!.prepareSubscriptionCreditExecution(context.token, context.productId,
      { ...value.data, kind: 'replay' }, features);
    if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(replayRaw).success) return subscriptionFailure(403);
    const replay = z.object({ kind: z.literal('replay'), actorId: reference, actionKey: z.string().min(1), operationId: reference,
      scope: z.object({ subscriptionId: reference, productId: reference, recipient: z.object({
        kind: z.enum(['subscriber', 'organization', 'managed_learner']), id: reference }).strict(),
        featureKey: z.string().min(1), poolKey: z.string().min(1) }).strict() }).strict().parse(replayRaw);
    if (replay.actorId !== context.actorId || replay.actionKey !== value.data.actionKey || replay.operationId !== value.data.operationId
      || replay.scope.subscriptionId !== value.data.subscriptionId || replay.scope.productId !== context.productId
      || replay.scope.recipient.id !== value.data.recipientId || replay.scope.poolKey !== value.data.poolKey) throw new Error('Credit replay scope differs');
    const existing = await readSubscriptionCreditConsumption(database, replay.operationId, replay.scope, context.actorId, replay.actionKey);
    if (existing) return Response.json(existing, { headers: subscriptionResponseHeaders });
  }
  const raw = await context.env.SSO_SERVICE!.prepareSubscriptionCreditExecution(context.token, context.productId, value.data, features);
  if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
  const prepared = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('allocate'), actorId: reference, occurrence: z.unknown() }).strict(),
    z.object({ kind: z.literal('consume'), actorId: reference, command: z.unknown() }).strict(),
    z.object({ kind: z.literal('usage'), actorId: reference, scope: z.unknown() }).strict(),
  ]).parse(raw);
  if (prepared.kind !== value.data.kind || prepared.actorId !== context.actorId) throw new Error('Credit preparation identity differs');
  const scoped = z.object({ subscriptionId: reference, productId: reference,
    recipient: z.object({ kind: z.enum(['subscriber', 'organization', 'managed_learner']), id: reference }).strict(),
    poolKey: z.string().min(1), featureKey: z.string().min(1) }).passthrough()
    .parse(prepared.kind === 'allocate' ? prepared.occurrence : prepared.kind === 'consume' ? prepared.command : prepared.scope);
  if (scoped.subscriptionId !== value.data.subscriptionId || scoped.productId !== context.productId
    || scoped.recipient.id !== value.data.recipientId
    || (value.data.kind !== 'allocate' && scoped.poolKey !== value.data.poolKey)) throw new Error('Credit preparation scope differs');
  if (prepared.kind === 'allocate' && value.data.kind === 'allocate') {
    const occurrence = z.object({ ruleId: reference }).passthrough().parse(prepared.occurrence);
    if (occurrence.ruleId !== value.data.ruleId) throw new Error('Credit preparation rule differs');
  }
  if (prepared.kind === 'consume' && value.data.kind === 'consume') {
    if (z.object({ operationId: reference }).passthrough().parse(prepared.command).operationId !== value.data.operationId) throw new Error('Credit operation differs');
  }
  // The owner derives amount, recipient kind, pool and immutable occurrence terms.
  const result = prepared.kind === 'allocate'
    ? await allocateSubscriptionCredits(database, prepared.occurrence, context.actorId)
    : prepared.kind === 'consume' ? await consumeSubscriptionCredits(database, prepared.command, context.actorId)
    : await readSubscriptionCreditUsage(database, prepared.scope);
  return Response.json(result, { headers: subscriptionResponseHeaders });
});
