import { z } from 'zod';
import { quotaCommandSchema, subscriptionActionAuthorization, type authorizeSubscriptionAction } from './action';

const reference = z.string().uuid();
const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const resourceAuthorizationSchema = z.object({ schemaVersion: z.literal(1), actorId: reference,
  subject: z.object({ kind: z.literal('user'), id: reference }).strict(), subscriptionId: reference, productId: reference,
  revisionId: reference, version: time.min(1), actionKey: z.literal('learning_path.activate'), featureKey: z.string().min(1),
  mode: z.literal('write'), validUntil: time.min(1), quota: z.object({ period: z.literal('billing_period'),
    countingEvent: z.literal('course_lte_assignment'), periodStartsAt: time, periodEndsAt: time.min(1), limit: time.nullable() }).strict(),
}).strict();
export const resourceOutcomeSchema = z.object({ schemaVersion: z.literal(1), operationId: reference,
  reservationId: reference, actorId: reference, trackId: reference, subscriptionId: reference, productId: reference,
  revisionId: reference, version: time.min(1), created: z.boolean(), completedAt: time.min(1),
}).strict();
export const resourceReservationSchema = z.object({ schemaVersion: z.literal(1), operationId: reference,
  actorId: reference, trackId: reference, authorization: resourceAuthorizationSchema,
  quotaReceipt: z.object({ command: quotaCommandSchema, used: time.min(1) }).strict(),
  status: z.enum(['pending', 'confirmed']), outcome: resourceOutcomeSchema.nullable(),
}).strict();
export interface ResourceDeliveryDatabase { rpc(name: string, parameters: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string } | null }> }
export class ResourceDeliveryError extends Error {
  constructor(public readonly status: 403 | 409 | 402 | 503) { super('Subscription resource delivery unavailable'); }
}
function failure(error: { code?: string }) {
  throw new ResourceDeliveryError(error.code === '42501' ? 403 : error.code === '22023' ? 409 : error.code === '54000' ? 402 : 503);
}
export function validateResourceReservation(value: unknown) {
  const result = resourceReservationSchema.parse(value), auth = result.authorization, command = result.quotaReceipt.command;
  if (result.operationId !== command.operationId || command.resourceId !== result.operationId || result.actorId !== auth.actorId
    || auth.subject.id !== result.actorId || command.actorId !== result.actorId || command.subject.kind !== 'user'
    || command.subject.id !== result.actorId || command.subscriptionId !== auth.subscriptionId || command.productId !== auth.productId
    || command.revisionId !== auth.revisionId || command.version !== auth.version || command.actionKey !== auth.actionKey
    || command.countingEvent !== auth.quota.countingEvent || command.periodStartsAt !== auth.quota.periodStartsAt
    || command.periodEndsAt !== auth.quota.periodEndsAt || command.limit !== auth.quota.limit
    || auth.validUntil <= auth.quota.periodStartsAt || auth.validUntil > auth.quota.periodEndsAt || auth.quota.periodStartsAt >= auth.quota.periodEndsAt
    || (auth.quota.limit !== null && result.quotaReceipt.used > auth.quota.limit)
    || (result.status === 'pending') !== (result.outcome === null)) throw new ResourceDeliveryError(503);
  if (result.outcome) validateResourceOutcome(result.outcome, result);
  return result;
}
export function validateResourceOutcome(value: unknown, reservation: z.infer<typeof resourceReservationSchema>) {
  const result = resourceOutcomeSchema.parse(value), auth = reservation.authorization;
  if (result.operationId !== reservation.operationId || result.reservationId !== reservation.operationId
    || result.actorId !== reservation.actorId || result.trackId !== reservation.trackId
    || result.subscriptionId !== auth.subscriptionId || result.productId !== auth.productId
    || result.revisionId !== auth.revisionId || result.version !== auth.version
    || result.completedAt < auth.quota.periodStartsAt || result.completedAt >= auth.validUntil) throw new ResourceDeliveryError(409);
  return result;
}
export async function prepareResourceDelivery(database: ResourceDeliveryDatabase, decision: ReturnType<typeof authorizeSubscriptionAction>, operationId: string, trackId: string) {
  const auth = resourceAuthorizationSchema.parse(subscriptionActionAuthorization(decision));
  const operation = reference.parse(operationId), target = reference.parse(trackId);
  const result = await database.rpc('reserve_subscription_resource_delivery', { p_operation: operation, p_target: target, p_authorization: auth });
  if (result.error) failure(result.error);
  const receipt = validateResourceReservation(result.data);
  if (receipt.operationId !== operation || receipt.trackId !== target || receipt.actorId !== auth.actorId
    || (receipt.authorization.validUntil > auth.validUntil || JSON.stringify({...receipt.authorization, validUntil: auth.validUntil}) !== JSON.stringify(auth))) throw new ResourceDeliveryError(503);
  return receipt;
}
/** Only the authenticated LTE service may acknowledge its durable local outcome. */
export async function acknowledgeResourceDelivery(database: ResourceDeliveryDatabase, actorId: string, value: unknown) {
  const outcome = resourceOutcomeSchema.parse(value);
  if (outcome.actorId !== reference.parse(actorId)) throw new ResourceDeliveryError(403);
  const result = await database.rpc('acknowledge_subscription_resource_delivery', { p_actor: actorId, p_outcome: outcome });
  if (result.error) failure(result.error);
  const receipt = validateResourceReservation(result.data);
  validateResourceOutcome(outcome, receipt);
  if (receipt.status !== 'confirmed' || JSON.stringify(receipt.outcome) !== JSON.stringify(outcome)) throw new ResourceDeliveryError(503);
  return receipt;
}
