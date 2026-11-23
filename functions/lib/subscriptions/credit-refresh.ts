import { z } from 'zod';
import { allocateSubscriptionCredits, readAuthorizedSubscriptionCreditAllocation, subscriptionCreditOccurrenceSchema,
  type CreditAllocationReceipt, type SubscriptionCreditDatabase, type SubscriptionCreditReceiptDatabase } from './credits';

const reference = z.string().uuid().transform(value => value.toLowerCase());
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const recipient = z.object({ kind: z.enum(['subscriber', 'organization', 'managed_learner']), id: reference }).strict();
const page = z.object({ kind: z.literal('refresh'), schemaVersion: z.literal(1), actorId: reference,
  subscriptionId: reference, productId: reference, planId: reference, revisionId: reference, ruleId: reference,
  audience: z.string().min(1), recipient, asOf: integer,
  occurrences: z.array(subscriptionCreditOccurrenceSchema).max(50), nextCursor: integer.nullable(),
}).strict();
const expected = z.object({ actorId: reference, subscriptionId: reference, productId: reference,
  recipientId: reference, ruleId: reference, cursor: integer.nullable() }).strict();

/** Execute one freshly owner-authorized page; no implicit retry after uncertain writes. */
export async function refreshSubscriptionCredits(database: SubscriptionCreditDatabase & SubscriptionCreditReceiptDatabase,
  ownerValue: unknown, expectedValue: unknown) {
  const owner = page.parse(ownerValue), scope = expected.parse(expectedValue);
  if (owner.actorId !== scope.actorId || owner.subscriptionId !== scope.subscriptionId || owner.productId !== scope.productId
    || owner.ruleId !== scope.ruleId || owner.recipient.id !== scope.recipientId
    || owner.nextCursor !== null && owner.nextCursor <= (scope.cursor ?? 0)
    || new Set(owner.occurrences.map(item => item.referenceId)).size !== owner.occurrences.length
    || owner.occurrences.some(item => item.subscriptionId !== owner.subscriptionId || item.productId !== owner.productId
      || item.planId !== owner.planId || item.revisionId !== owner.revisionId || item.ruleId !== owner.ruleId
      || item.audience !== owner.audience || item.recipient.id !== owner.recipient.id || item.recipient.kind !== owner.recipient.kind
      || item.startsAt > owner.asOf || item.expiresAt <= owner.asOf)) throw new Error('Credit refresh owner scope differs');
  // Validate the complete page before its first write. A partial delivery can be
  // resumed explicitly with the same cursor: retained reference IDs deduplicate it.
  const receipts: CreditAllocationReceipt[] = [];
  for (const occurrence of owner.occurrences) {
    const saved = await readAuthorizedSubscriptionCreditAllocation(database, occurrence);
    receipts.push(saved ?? await allocateSubscriptionCredits(database, occurrence, owner.actorId));
  }
  return { schemaVersion: 1 as const, subscriptionId: owner.subscriptionId, productId: owner.productId,
    recipient: owner.recipient, ruleId: owner.ruleId, asOf: owner.asOf, receipts, nextCursor: owner.nextCursor };
}
