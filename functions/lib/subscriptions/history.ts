import { z } from 'zod';
import type { CreditScope, SubscriptionCreditDatabase } from './credits';

const reference = z.string().uuid().transform(value => value.toLowerCase());
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const text = z.string().min(1).refine(value => value === value.trim());
const cursor = z.string().regex(/^sc1_[0-9a-f]{64}$/);
const scope = z.object({ productId: reference, subscriptionId: reference,
  recipient: z.object({ kind: z.enum(['subscriber', 'organization', 'managed_learner']), id: reference }).strict(),
  featureKey: text.refine(value => value.length <= 100), poolKey: text }).strict();
const allocation = z.object({ referenceId: cursor, planId: reference, revisionId: reference, policyId: reference, ruleId: reference,
  quantity: count, consumed: count, remaining: count, expiredRemaining: count,
  startsAt: count, endsAt: count, expiresAt: count, allocatedAt: z.string().datetime({ offset: true }) }).strict();
const response = z.object({ schemaVersion: z.literal(1), scope,
  allocated: count, consumed: count, remaining: count, expiredRemaining: count,
  asOf: z.string().datetime({ offset: true }), allocations: z.array(allocation).max(50), nextCursor: cursor.nullable() }).strict();
export type SubscriptionCreditHistory = z.infer<typeof response>;

export const historicalCreditPoolsSchema = z.object({ kind: z.literal('history_pools'), actorId: reference,
  productId: reference, subscriptionId: reference, revisionId: reference, audience: text,
  pools: z.array(z.object({ key: text, featureKey: text,
    recipient: z.enum(['subscriber', 'organization', 'managed_learner']), audiences: z.array(text).min(1) }).strict()),
}).strict().refine(value => value.pools.every(pool => pool.audiences.includes(value.audience))
  && new Set(value.pools.map(pool => pool.key)).size === value.pools.length, 'Historical pool binding differs');

export const subscriptionAuditSchema = z.object({ schemaVersion: z.literal(1), actorId: reference, productId: reference, subscriptionId: reference,
  items: z.array(z.object({ operationId: reference, actorId: reference,
    operation: z.enum(['initialize', 'upgrade', 'renew', 'downgrade', 'cancel', 'expire', 'payment_failed', 'suspend', 'reactivate']),
    reason: text, at: count, committedAt: z.string().datetime({ offset: true }), fromVersion: count.min(1).nullable(),
    toVersion: count.min(1), planId: reference, revisionId: reference, transactionId: reference.nullable() }).strict()).max(50), nextCursor: reference.nullable(),
}).strict();
export function validateSubscriptionAudit(value: unknown, actorId: string, productId: string, subscriptionId: string, after: string | null) {
  const result = subscriptionAuditSchema.parse(value);
  if (result.actorId !== actorId || result.productId !== productId || result.subscriptionId !== subscriptionId
    || result.items.some((item, index, items) => item.operationId <= (index ? items[index - 1].operationId : after ?? '')
      || item.at > Date.parse(item.committedAt)
      || (item.operation === 'initialize' ? item.fromVersion !== null || item.toVersion !== 1
        : item.fromVersion === null || item.toVersion !== item.fromVersion + 1))
    || result.nextCursor !== (result.items.length === 50 ? result.items[49].operationId : null)) throw new Error('Subscription audit acknowledgement differs');
  return result;
}

/** Immutable attribution history; this read never allocates, debits, or invents monetary value. */
export async function readSubscriptionCreditHistory(database: SubscriptionCreditDatabase, input: CreditScope,
  after: string | null = null): Promise<SubscriptionCreditHistory> {
  const requested = scope.parse(input), position = cursor.nullable().parse(after);
  const result = await database.rpc('get_subscription_credit_history', { p_scope: requested, p_after: position })
    .abortSignal(AbortSignal.timeout(15000));
  if (result.error) throw new Error('Subscription credit history is unavailable');
  const history = response.parse(result.data);
  const actual = history.scope;
  if (actual.productId !== requested.productId || actual.subscriptionId !== requested.subscriptionId
    || actual.recipient.id !== requested.recipient.id || actual.recipient.kind !== requested.recipient.kind
    || actual.featureKey !== requested.featureKey || actual.poolKey !== requested.poolKey
    || history.allocated - history.consumed !== history.remaining + history.expiredRemaining
    || history.allocations.reduce((sum, item) => sum + item.quantity, 0) > history.allocated
    || history.allocations.reduce((sum, item) => sum + item.consumed, 0) > history.consumed
    || history.allocations.reduce((sum, item) => sum + item.remaining, 0) > history.remaining
    || history.allocations.reduce((sum, item) => sum + item.expiredRemaining, 0) > history.expiredRemaining
    || history.allocations.some((item, index, items) => item.referenceId <= (index ? items[index - 1].referenceId : position ?? '')
      || item.quantity - item.consumed !== item.remaining + item.expiredRemaining
      || item.startsAt >= item.endsAt || item.startsAt >= item.expiresAt
      || Date.parse(item.allocatedAt) < item.startsAt || Date.parse(item.allocatedAt) >= item.expiresAt
      || Date.parse(item.allocatedAt) > Date.parse(history.asOf)
      || (item.expiresAt <= Date.parse(history.asOf) ? item.remaining !== 0 : item.expiredRemaining !== 0))
    || history.nextCursor !== (history.allocations.length === 50 ? history.allocations[49].referenceId : null)) {
    throw new Error('Subscription credit history acknowledgement differs');
  }
  return history;
}
