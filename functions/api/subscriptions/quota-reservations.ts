import { z } from 'zod';
import { subscriptionConsumerEndpoint, subscriptionFailure, subscriptionResponseHeaders } from '../../lib/subscriptions/current-subscription';
import { readDraftRequest, DraftRequestError } from '../../lib/subscriptions/authoring';
import { requireSubscriptionAccess } from '../../shared/lib/subscription-access';
import { catalogInventoryDatabase } from '../../lib/subscriptions/catalog-inventory';
import { prepareResourceDelivery, ResourceDeliveryError } from '../../lib/subscriptions/resource-delivery';

const requestSchema = z.object({ operationId: z.string().uuid(), trackId: z.string().uuid() }).strict();
export const onRequestPost = subscriptionConsumerEndpoint('POST', async context => {
  if ([...new URL(context.request.url).searchParams].length) return subscriptionFailure(400);
  let parsed;
  try { parsed = requestSchema.safeParse(await readDraftRequest(context.request)); }
  catch (error) { if (error instanceof DraftRequestError) return subscriptionFailure(error.status); throw error; }
  if (!parsed.success) return subscriptionFailure(400);
  const decision = await requireSubscriptionAccess({ env: context.env, request: context.request, actorId: context.actorId,
    subject: { kind: 'user', id: context.actorId }, actionKey: 'learning_path.activate', mode: 'write' });
  if (decision instanceof Response) return decision;
  if (!('binding' in decision) || decision.binding.paymentRequired === true || decision.grant.type !== 'numeric_limit'
    || decision.binding.quota?.period !== 'billing_period' || decision.binding.quota.countingEvent !== 'course_lte_assignment') return subscriptionFailure(503);
  try {
    const result = await prepareResourceDelivery(catalogInventoryDatabase(context.env), decision, parsed.data.operationId, parsed.data.trackId);
    return Response.json(result, { headers: subscriptionResponseHeaders });
  } catch (error) { return subscriptionFailure(error instanceof ResourceDeliveryError ? error.status : 503); }
});
