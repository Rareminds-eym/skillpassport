import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

// PostgreSQL credit_ledger.amount is int4; aggregate readbacks may exceed one row.
const ledgerInteger = z.number().int().min(0).max(2147483647);
const total = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const uuid = z.string().uuid().transform(value => value.toLowerCase());
const text = z.string().min(1).refine(value => value.trim() === value);
const instant = total.refine(value => Number.isFinite(new Date(value).getTime()) && new Date(value).getUTCFullYear() <= 9998);
const timestamp = z.string().datetime({ offset: true });
const recipient = z.object({ kind: z.enum(['subscriber', 'organization', 'managed_learner']), id: uuid }).strict();
const scope = z.object({ productId: uuid, subscriptionId: uuid, recipient, featureKey: text.refine(value => value.length <= 100), poolKey: text }).strict();
const timePolicy = z.object({ id: uuid, timeZone: text.refine(value => {
  if (!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+.-]+)*$/.test(value)) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(0); return true; } catch { return false; }
}), monthlyAnchor: z.enum(['subscription_anniversary', 'calendar_month_start']), monthDayOverflow: z.enum(['clamp', 'reject']),
ambiguousTime: z.enum(['earlier', 'later', 'reject']), nonexistentTime: z.enum(['reject', 'shift_forward']) }).strict();
const occurrence = scope.extend({ schemaVersion: z.literal(1), referenceId: z.string().regex(/^sc1_[0-9a-f]{64}$/),
  planId: uuid, revisionId: uuid, policyId: uuid, ruleId: uuid, audience: text, quantity: ledgerInteger,
  startsAt: instant, endsAt: instant, expiresAt: instant,
  rollover: z.discriminatedUnion('kind', [z.object({ kind: z.literal('none') }).strict(),
    z.object({ kind: z.literal('approved'), approvalId: uuid }).strict()]),
  timePolicies: z.array(timePolicy).refine(values => new Set(values.map(value => value.id)).size === values.length),
}).strict().refine(value => value.startsAt < value.endsAt && value.startsAt < value.expiresAt, 'Invalid allocation interval');
export const subscriptionCreditOccurrenceSchema = occurrence;
const command = scope.extend({ operationId: uuid, actionKey: text, amount: ledgerInteger.min(1), spendingOrder: z.enum(['expires_first', 'oldest_first']) }).strict();
const allocationReceipt = z.object({ occurrence, actorId: uuid, ledgerId: uuid.nullable(), allocatedAt: timestamp }).strict();
const consumptionReceipt = z.object({ command, actorId: uuid, ledgerId: uuid, consumedAt: timestamp,
  allocations: z.array(z.object({ referenceId: z.string().regex(/^sc1_[0-9a-f]{64}$/), amount: ledgerInteger.min(1) }).strict()).min(1),
}).strict();
const usage = scope.extend({ allocated: total, consumed: total, remaining: total, asOf: timestamp }).strict();

export type IncludedCreditOccurrence = Readonly<Omit<z.infer<typeof occurrence>, 'timePolicies' | 'recipient' | 'rollover'>> & {
  readonly timePolicies: readonly Readonly<z.infer<typeof timePolicy>>[];
  readonly recipient: Readonly<z.infer<typeof recipient>>;
  readonly rollover: Readonly<z.infer<typeof occurrence>['rollover']>;
};
export type CreditScope = z.infer<typeof scope>;
export type CreditConsumptionCommand = z.infer<typeof command>;
export type CreditAllocationReceipt = z.infer<typeof allocationReceipt>;
export type CreditConsumptionReceipt = z.infer<typeof consumptionReceipt>;
/** Counters cover unexpired allocations and their attributed consumption at asOf, not lifetime totals. */
export type SubscriptionCreditUsage = z.infer<typeof usage>;
export interface SubscriptionCreditDatabase {
  rpc(name: string, parameters: Record<string, unknown>): {
    abortSignal(signal: AbortSignal): PromiseLike<{ data: unknown; error: unknown }>;
  };
}

function equal(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((value, index) => equal(value, right[index]));
  const a = left as Record<string, unknown>, b = right as Record<string, unknown>;
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
}
async function rpc(database: SubscriptionCreditDatabase, name: string, parameters: Record<string, unknown>) {
  // A transport error may follow a committed write. The caller must preserve operation identity;
  // this boundary never retries or substitutes a legacy balance.
  const result = await database.rpc(name, parameters).abortSignal(AbortSignal.timeout(15000));
  if (result.error) throw new Error('Subscription credit persistence is unavailable');
  return result.data;
}
export async function allocateSubscriptionCredits(database: SubscriptionCreditDatabase, value: unknown, actorId: string): Promise<CreditAllocationReceipt> {
  const input = occurrence.parse(value), actor = uuid.parse(actorId);
  if (input.rollover.kind !== 'none') throw new Error('Credit rollover execution is unavailable');
  const stored = allocationReceipt.parse(await rpc(database, 'allocate_subscription_credits', { p_occurrence: input, p_actor_id: actor }));
  if (!equal(input, stored.occurrence) || stored.actorId !== actor || (input.quantity === 0) !== (stored.ledgerId === null)
    || Date.parse(stored.allocatedAt) < input.startsAt || Date.parse(stored.allocatedAt) >= input.expiresAt) {
    throw new Error('Subscription allocation acknowledgement differs');
  }
  return stored;
}
export async function consumeSubscriptionCredits(database: SubscriptionCreditDatabase, value: unknown, actorId: string): Promise<CreditConsumptionReceipt> {
  const input = command.parse(value), actor = uuid.parse(actorId);
  const stored = consumptionReceipt.parse(await rpc(database, 'consume_subscription_credits', { p_command: input, p_actor_id: actor }));
  const sum = stored.allocations.reduce((amount, item) => amount + item.amount, 0);
  if (!equal(input, stored.command) || stored.actorId !== actor || sum !== input.amount
    || new Set(stored.allocations.map(item => item.referenceId)).size !== stored.allocations.length) {
    throw new Error('Subscription consumption acknowledgement differs');
  }
  return stored;
}
export async function readSubscriptionCreditUsage(database: SubscriptionCreditDatabase, value: unknown): Promise<SubscriptionCreditUsage> {
  const input = scope.parse(value);
  const stored = usage.parse(await rpc(database, 'get_subscription_credit_usage', { p_scope: input }));
  const { allocated, consumed, remaining, asOf: _asOf, ...storedScope } = stored;
  if (!equal(input, storedScope) || allocated < consumed || allocated - consumed !== remaining) {
    throw new Error('Subscription credit usage acknowledgement differs');
  }
  return stored;
}

export type SubscriptionCreditReceiptDatabase = Pick<SupabaseClient, 'from'>;
/** Explicit immutable-operation lookup, before expiry-sensitive new-spend preparation. */
export async function readSubscriptionCreditConsumption(database: SubscriptionCreditReceiptDatabase, operationId: string,
  scopeValue: unknown, actorId: string, actionKey: string): Promise<CreditConsumptionReceipt | null> {
  const input = scope.parse(scopeValue), operation = uuid.parse(operationId), actor = uuid.parse(actorId), action = text.parse(actionKey);
  const { data, error } = await database.from('subscription_credit_consumptions').select('receipt').eq('operation_id', operation)
    .limit(2).abortSignal(AbortSignal.timeout(15000));
  if (error) throw new Error('Subscription credit operation read is unavailable');
  const rows = z.array(z.object({ receipt: consumptionReceipt }).strict()).max(1).parse(data);
  if (!rows.length) return null;
  const stored = rows[0].receipt;
  const { operationId: savedOperation, actionKey: savedAction, amount, spendingOrder: _order, ...storedScope } = stored.command;
  if (!equal(input, storedScope) || savedOperation !== operation || savedAction !== action || stored.actorId !== actor
    || stored.allocations.reduce((sum, item) => sum + item.amount, 0) !== amount
    || new Set(stored.allocations.map(item => item.referenceId)).size !== stored.allocations.length) throw new Error('Subscription credit operation identity differs');
  return stored;
}

/** Allocation replay is an immutable read; a missing receipt never grants credits. */
export async function readSubscriptionCreditAllocation(database: SubscriptionCreditReceiptDatabase, value: unknown,
  actorId: string): Promise<CreditAllocationReceipt | null> {
  const input = occurrence.parse(value), actor = uuid.parse(actorId);
  const stored = await readAuthorizedSubscriptionCreditAllocation(database, input);
  if (stored && stored.actorId !== actor) throw new Error('Subscription allocation identity differs');
  return stored;
}

/**
 * Caller must first authorize this exact occurrence scope with SSO. A later
 * authorized organization administrator may read the original allocator's audit
 * receipt without rewriting its actor or minting another allocation.
 */
export async function readAuthorizedSubscriptionCreditAllocation(database: SubscriptionCreditReceiptDatabase,
  value: unknown): Promise<CreditAllocationReceipt | null> {
  const input = occurrence.parse(value);
  const { data, error } = await database.from('subscription_credit_allocations').select('receipt').eq('reference_id', input.referenceId)
    .limit(2).abortSignal(AbortSignal.timeout(15000));
  if (error) throw new Error('Subscription allocation read is unavailable');
  const rows = z.array(z.object({ receipt: allocationReceipt }).strict()).max(1).parse(data);
  if (!rows.length) return null;
  const stored = rows[0].receipt;
  if (!equal(input, stored.occurrence) || (input.quantity === 0) !== (stored.ledgerId === null)
    || Date.parse(stored.allocatedAt) < input.startsAt || Date.parse(stored.allocatedAt) >= input.expiresAt) throw new Error('Subscription allocation identity differs');
  return stored;
}
