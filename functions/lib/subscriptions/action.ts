import { z } from 'zod';
import { subscriptionStateSchema } from './current-subscription';
import type { ApplicationPlanProjection } from './publication';

const uuid = z.string().uuid().transform(value => value.toLowerCase());
const text = z.string().min(1).refine(value => value.trim() === value);
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const subscriptionActionBindingSchema = z.object({
  actionKey: text, featureKey: text, mode: z.enum(['read', 'write']),
  assessmentCategory: text.optional(), paymentRequired: z.boolean().optional(),
  acceptedValues: z.array(text).min(1).refine(values => new Set(values).size === values.length).optional(),
  quota: z.object({ period: z.enum(['subscription', 'billing_period', 'concurrent']), countingEvent: text }).strict().optional(),
}).strict();
export const subscriptionActionContextSchema = z.object({
  schemaVersion: z.literal(1), actorId: uuid, state: subscriptionStateSchema,
  access: z.enum(['full', 'restricted', 'read_only', 'suspended']), audience: text,
  activatedAt: integer, subscriptionEndsAt: integer.nullable(),
  actions: z.object({ schemaVersion: z.literal(1), bindings: z.array(subscriptionActionBindingSchema).min(1) }).strict(),
}).strict().superRefine((value, context) => {
  const keys = value.actions.bindings.map(binding => JSON.stringify([binding.actionKey, binding.mode, binding.assessmentCategory ?? null]));
  if (new Set(keys).size !== keys.length || (value.state.periodEndsAt !== null && value.state.periodStartsAt >= value.state.periodEndsAt)
    || value.activatedAt > value.state.periodStartsAt || (value.state.periodEndsAt === null ? value.subscriptionEndsAt !== null : value.subscriptionEndsAt === null || value.subscriptionEndsAt < value.state.periodEndsAt)
    || (value.state.downgradedAt != null && value.state.downgradedAt < value.activatedAt)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Inconsistent action context' });
  }
});
export type SubscriptionActionContext = z.infer<typeof subscriptionActionContextSchema>;
export type SubscriptionActionBinding = z.infer<typeof subscriptionActionBindingSchema>;
export class SubscriptionActionDenied extends Error {
  constructor(public readonly reason: 'scope' | 'access' | 'configuration' | 'feature' | 'payment' | 'quota') {
    super(`Subscription action denied: ${reason}`);
  }
}
export interface ActionScope {
  actorId: string; productId: string; subject: { kind: 'user' | 'organization'; id: string };
  actionKey: string; mode: 'read' | 'write'; assessmentCategory?: string;
}
/** All inputs except the requested operation originate in their signed/immutable owners. */
export function authorizeSubscriptionAction(raw: unknown, projection: ApplicationPlanProjection, request: ActionScope) {
  const context = subscriptionActionContextSchema.parse(raw);
  const { state } = context, draft = projection.bundle.draft;
  if (context.actorId !== request.actorId || state.productId !== request.productId
    || state.subject.kind !== request.subject.kind || state.subject.id !== request.subject.id
    || draft.plan.id !== state.planId || draft.id !== state.revisionId || draft.plan.productId !== state.productId
    || !draft.audiences.includes(context.audience)) throw new SubscriptionActionDenied('scope');
  if (context.access === 'suspended' || (request.mode === 'write' && context.access !== 'full')) {
    throw new SubscriptionActionDenied('access');
  }
  const matches = context.actions.bindings.filter(binding => binding.actionKey === request.actionKey
    && binding.mode === request.mode && binding.assessmentCategory === request.assessmentCategory);
  if (matches.length !== 1) throw new SubscriptionActionDenied('configuration');
  const binding = matches[0], grants = draft.features.filter(feature => feature.key === binding.featureKey);
  if (grants.length !== 1 || !grants[0].enabled) throw new SubscriptionActionDenied('feature');
  const grant = grants[0];
  if (grant.type === 'enum' && (!binding.acceptedValues || grant.value === null || !binding.acceptedValues.includes(grant.value))) {
    throw new SubscriptionActionDenied('feature');
  }
  if ((grant.type === 'numeric_limit') !== (binding.quota !== undefined)
    || (grant.type !== 'enum' && binding.acceptedValues !== undefined)
    || (binding.mode === 'read' && (binding.quota !== undefined || binding.paymentRequired === true))) {
    throw new SubscriptionActionDenied('configuration');
  }
  if (grant.type === 'numeric_limit' && grant.limit.kind === 'finite' && grant.limit.value === 0) throw new SubscriptionActionDenied('quota');
  // Negotiated ("Custom") limits are display-only until a signed contract resolves them; never treat them as unlimited.
  if (grant.type === 'numeric_limit' && grant.limit.kind === 'contract_required') throw new SubscriptionActionDenied('quota');
  return { context, binding, grant, projection };
}

/** Retain the exact owner grant for an application resource transaction. */
export function subscriptionActionAuthorization(decision: ReturnType<typeof authorizeSubscriptionAction>) {
  const { context, binding, grant } = decision, { state } = context;
  // Resource persistence currently requires a finite authorization window. Never
  // turn a missing window into an unlimited quota or a fabricated expiry.
  if (state.periodEndsAt === null || context.subscriptionEndsAt === null) throw new SubscriptionActionDenied('configuration');
  return {
    schemaVersion: 1 as const, actorId: context.actorId, subject: state.subject,
    subscriptionId: state.id, productId: state.productId, revisionId: state.revisionId, version: state.version,
    actionKey: binding.actionKey, featureKey: binding.featureKey, mode: binding.mode,
    validUntil: Math.min(state.periodEndsAt, context.subscriptionEndsAt),
    quota: binding.quota && grant.type === 'numeric_limit' ? {
      ...binding.quota,
      periodStartsAt: binding.quota.period === 'subscription' ? context.activatedAt : state.periodStartsAt,
      periodEndsAt: binding.quota.period === 'subscription' ? context.subscriptionEndsAt : state.periodEndsAt,
      limit: grant.limit.kind === 'finite' ? grant.limit.value : null
    } : null,
  };
}

export interface QuotaCommand {
  operationId: string; actorId: string; subject: ActionScope['subject']; subscriptionId: string;
  productId: string; revisionId: string; version: number; actionKey: string; countingEvent: string;
  resourceId: string; periodStartsAt: number; periodEndsAt: number; limit: number | null;
}
export const quotaCommandSchema = z.object({
  operationId: uuid, actorId: uuid, subject: z.object({ kind: z.enum(['user', 'organization']), id: uuid }).strict(),
  subscriptionId: uuid, productId: uuid, revisionId: uuid, version: integer.min(1), actionKey: text, countingEvent: text,
  resourceId: uuid, periodStartsAt: integer, periodEndsAt: integer.min(1), limit: integer.nullable(),
}).strict().refine(value => value.periodStartsAt < value.periodEndsAt, 'Invalid quota period');
export interface QuotaDatabase {
  rpc(name: string, parameters: Record<string, unknown>): {
    abortSignal(signal: AbortSignal): PromiseLike<{ data: unknown; error: unknown }>;
  };
}
const quotaReceipt = z.object({ command: quotaCommandSchema, used: integer.min(1) }).strict();
function structurallyEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((item, index) => structurallyEqual(item, right[index]));
  const a = left as Record<string, unknown>, b = right as Record<string, unknown>;
  return Object.keys(a).length === Object.keys(b).length
    && Object.keys(a).every(key => Object.hasOwn(b, key) && structurallyEqual(a[key], b[key]));
}
/** Persistence locks the complete subject/event/window, not a preflight COUNT followed by an insert. */
export async function reserveSubscriptionQuota(database: QuotaDatabase, command: QuotaCommand) {
  const input = quotaCommandSchema.parse(command);
  const result = await database.rpc('reserve_subscription_action_quota', { p_command: input })
    .abortSignal(AbortSignal.timeout(15000));
  if (result.error) throw new Error('Subscription quota persistence unavailable');
  const receipt = quotaReceipt.parse(result.data);
  if (!structurallyEqual(receipt.command, input)
    || (input.limit !== null && receipt.used > input.limit)) throw new Error('Subscription quota acknowledgement differs');
  return receipt;
}
