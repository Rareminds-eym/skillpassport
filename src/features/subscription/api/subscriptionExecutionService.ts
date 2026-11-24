import { DEFAULT_TIMEOUT } from '@/shared/api/httpClient';
import { ssoClient } from '@/shared/api/ssoClient';
import { z } from 'zod';

const uuid = z.string().uuid();
const text = z.string().min(1);
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const positive = integer.min(1);
const subject = z.object({ kind: z.enum(['user', 'organization']), id: uuid }).strict();
export const lifecycleOperation = z.enum(['upgrade', 'renew', 'downgrade', 'cancel', 'expire', 'payment_failed', 'suspend', 'reactivate']);
const status = z.enum(['active', 'pending', 'paused', 'cancelled', 'expired', 'grace_period']);
const planIdentity = z.object({ id: uuid, code: text, productId: uuid }).strict();
const limit = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('finite'), value: integer }).strict(),
  z.object({ kind: z.literal('unlimited') }).strict(),
  z.object({ kind: z.literal('contract_required') }).strict(),
]);
export const featureGrant = z.discriminatedUnion('type', [
  z.object({ key: text, type: z.literal('boolean'), enabled: z.boolean() }).strict(),
  z.object({ key: text, type: z.literal('enum'), enabled: z.boolean(), value: text.nullable() }).strict(),
  z.object({ key: text, type: z.literal('numeric_limit'), enabled: z.boolean(), limit }).strict(),
  z.object({
    key: text, type: z.literal('metered'), enabled: z.boolean(), limit: z.union([
      limit, z.object({ kind: z.literal('allocation_policy') }).strict(),
    ])
  }).strict(),
]);
const price = z.object({
  id: uuid, currency: z.string().regex(/^[A-Z]{3}$/), minorUnit: integer.max(20),
  amountMinor: integer, intervalUnit: z.enum(['month', 'year']), intervalCount: positive,
  quantityBasis: z.enum(['subscription', 'seat']), audiences: z.array(text).min(1)
}).strict();
const revision = { planId: uuid, revisionId: uuid, productId: uuid };
export const executionState = z.object({
  ...revision, id: uuid, subject, version: positive, status,
  periodStartsAt: integer, periodEndsAt: integer.nullable(), validity: z.literal('perpetual').optional(), trialEndsAt: integer.nullable(), renewalEnabled: z.boolean(),
  cancelledAt: integer.nullable(), paymentFailedAt: integer.nullable(),
  downgradedAt: integer.nullable().optional(),
  scheduledChange: z.object({ ...revision, effectiveAt: integer }).strict().nullable(),
}).strict().refine(state => (state.periodEndsAt === null) === (state.validity === 'perpetual')
  && (state.periodEndsAt !== null || (!state.renewalEnabled && state.trialEndsAt === null && state.paymentFailedAt === null
    && state.scheduledChange === null && state.status !== 'expired' && state.status !== 'grace_period')), 'Invalid perpetual state');
const access = z.enum(['full', 'restricted', 'read_only', 'suspended']);
export const currentSchema = z.object({
  schemaVersion: z.literal(1), actorId: uuid, state: executionState, access,
  audience: text, activatedAt: integer, subscriptionEndsAt: integer.nullable(),
  pools: z.array(z.object({
    key: text, featureKey: text, recipient: z.enum(['subscriber', 'organization', 'managed_learner']),
    audiences: z.array(text).min(1)
  }).strict()),
  plan: planIdentity.extend({ name: text, revisionNumber: positive }).strict(), features: z.array(featureGrant),
}).strict().refine(value => value.state.planId === value.plan.id && value.state.productId === value.plan.productId
  && (value.state.periodEndsAt === null || value.state.periodStartsAt < value.state.periodEndsAt) && value.activatedAt <= value.state.periodStartsAt
  && (value.state.downgradedAt == null || value.state.downgradedAt >= value.activatedAt)
  && (value.state.periodEndsAt === null ? value.subscriptionEndsAt === null : value.subscriptionEndsAt !== null && value.subscriptionEndsAt >= value.state.periodEndsAt) && value.pools.every(p => p.audiences.includes(value.audience))
  && new Set(value.pools.map(p => p.key)).size === value.pools.length, 'Inconsistent current subscription');
export const discoverySchema = z.object({
  schemaVersion: z.literal(1), actorId: uuid, productId: uuid,
  items: z.array(z.object({
    id: uuid, planId: uuid, productId: uuid, subject, status,
    kind: z.enum(['initialized', 'uninitialized']), revisionId: uuid.nullable(), version: positive.nullable(),
    lifecycleOperations: z.array(lifecycleOperation)
  }).strict().refine(row => row.kind === 'initialized'
    ? row.revisionId !== null && row.version !== null
    : row.revisionId === null && row.version === null && row.lifecycleOperations.length === 0)), nextCursor: uuid.nullable(),
}).strict().refine(value => value.items.every(row => row.productId === value.productId)
  && new Set(value.items.map(row => row.id)).size === value.items.length, 'Inconsistent discovery scope');
// Display terms are read from the owner's published configuration and tax policy; the browser never infers them.
const presentation = z.object({
  priceLabel: z.enum(['exact', 'starting_at']), taxInclusive: z.boolean(), badge: text.nullable(),
  copy: z.object({
    tagline: text, positioning: text, description: text, priceText: text, termsNote: text,
    highlights: z.array(text).min(1).max(12)
  }).strict().nullable()
}).strict();
const catalogTax = z.object({ kind: z.literal('gst'), rateBasisPoints: z.number().int().min(1).max(10000), priceDisplay: z.enum(['exclusive', 'inclusive']) }).strict();
export const catalogSchema = z.object({
  schemaVersion: z.literal(1), actorId: uuid, productId: uuid, audience: text.nullable(), subjectKind: z.enum(['user', 'organization']).nullable(), tax: catalogTax,
  plans: z.array(z.object({
    plan: planIdentity, revisionId: uuid, revisionNumber: positive, name: text,
    audiences: z.array(text).min(1), purchaseMode: z.enum(['self_service', 'contact_sales', 'free']),
    prices: z.array(price), features: z.array(featureGrant), presentation
  }).strict()), nextCursor: uuid.nullable(),
  // Non-null only while a promo code maps this actor to exactly one plan (see
  // functions/lib/subscriptions/discovery.ts); the frontend disables every other plan card
  // while this is set, and shows the ordinary catalog whenever it's null.
  eligiblePlanId: uuid.nullable().default(null),
  // PRD R16/R17: true once the user has explicitly accepted this offer — the price shown is then
  // the exact, immutable accepted price, not a live/provisional one. The frontend only shows the
  // explicit "Accept this offer" confirmation step while this is false and eligiblePlanId is set.
  offerAccepted: z.boolean().default(false),
}).strict().refine(value => value.plans.every(row => row.plan.productId === value.productId
  && row.presentation.taxInclusive === (value.tax.priceDisplay === 'inclusive')
  && value.audience !== null && value.subjectKind !== null && row.audiences.includes(value.audience)
  && row.prices.every(p => p.audiences.every(a => row.audiences.includes(a))))
  && value.plans.every(plan => plan.purchaseMode !== 'free' || plan.prices.length === 0)
  && new Set(value.plans.map(p => p.plan.id)).size === value.plans.length, 'Inconsistent catalog scope');
// PRD R16/R17: the exact, immutable terms the user explicitly accepted.
export const promoOfferSchema = z.object({
  planId: uuid, revisionId: uuid, revisionNumber: positive, priceId: uuid,
  currency: z.string().regex(/^[A-Z]{3}$/), minorUnit: integer.max(20),
  intervalUnit: z.enum(['month', 'year']), intervalCount: positive,
  amountMinor: positive, acceptedAt: z.string().min(1),
}).strict();
const acceptPromoOfferSchema = z.object({ accepted: z.literal(true), offer: promoOfferSchema }).strict();
export type PromoOffer = z.infer<typeof promoOfferSchema>;
const creditScopeSchema = z.object({
  productId: uuid, subscriptionId: uuid,
  recipient: z.object({ kind: z.enum(['subscriber', 'organization', 'managed_learner']), id: uuid }).strict(),
  featureKey: text, poolKey: text
}).strict();
export const usageSchema = creditScopeSchema.extend({
  allocated: integer, consumed: integer, remaining: integer,
  asOf: z.string().datetime({ offset: true })
}).strict().refine(value => value.allocated >= value.consumed
  && value.allocated - value.consumed === value.remaining, 'Inconsistent credit totals');
const historyCursor = z.string().regex(/^sc1_[0-9a-f]{64}$/);
const historicalPoolsSchema = z.object({
  kind: z.literal('history_pools'), actorId: uuid, productId: uuid,
  subscriptionId: uuid, revisionId: uuid, audience: text,
  pools: z.array(z.object({
    key: text, featureKey: text, recipient: z.enum(['subscriber', 'organization', 'managed_learner']),
    audiences: z.array(text).min(1)
  }).strict()),
}).strict().refine(value => value.pools.every(pool => pool.audiences.includes(value.audience))
  && new Set(value.pools.map(pool => pool.key)).size === value.pools.length, 'Historical pool binding differs');
export type HistoricalCreditPools = z.infer<typeof historicalPoolsSchema>;
export const historySchema = z.object({
  schemaVersion: z.literal(1), scope: creditScopeSchema,
  allocated: integer, consumed: integer, remaining: integer, expiredRemaining: integer,
  asOf: z.string().datetime({ offset: true }), nextCursor: historyCursor.nullable(),
  allocations: z.array(z.object({
    referenceId: historyCursor, planId: uuid, revisionId: uuid, policyId: uuid, ruleId: uuid,
    quantity: integer, consumed: integer, remaining: integer, expiredRemaining: integer,
    startsAt: integer, endsAt: integer, expiresAt: integer, allocatedAt: z.string().datetime({ offset: true })
  }).strict()).max(50),
}).strict().refine(value => value.allocated - value.consumed === value.remaining + value.expiredRemaining
  && value.allocations.every((item, index, items) => item.referenceId > (index ? items[index - 1].referenceId : '')
    && item.quantity - item.consumed === item.remaining + item.expiredRemaining
    && item.startsAt < item.endsAt && item.startsAt < item.expiresAt
    && Date.parse(item.allocatedAt) >= item.startsAt && Date.parse(item.allocatedAt) < item.expiresAt
    && Date.parse(item.allocatedAt) <= Date.parse(value.asOf)
    && (item.expiresAt <= Date.parse(value.asOf) ? item.remaining === 0 : item.expiredRemaining === 0))
  && value.nextCursor === (value.allocations.length === 50 ? value.allocations[49].referenceId : null), 'Inconsistent credit history');
export function lifecycleReferenceFields(operation: z.infer<typeof lifecycleOperation>) {
  return operation === 'upgrade' || operation === 'renew' ? ['quoteId', 'settlementId'] as const
    : operation === 'downgrade' ? ['targetRevisionId'] as const
      : operation === 'suspend' || operation === 'reactivate' ? ['approvalId'] as const : [];
}
export const lifecycleRequestSchema = z.object({
  operationId: uuid, request: z.object({
    operation: lifecycleOperation,
    subscriptionId: uuid, subject, expectedVersion: positive, expectedRevisionId: uuid,
    reason: text.max(2000).refine(v => v === v.trim()), targetRevisionId: uuid.optional(),
    timing: z.enum(['next_renewal', 'immediate']).optional(), quoteId: uuid.optional(), settlementId: uuid.optional(), approvalId: uuid.optional(),
  }).strict().superRefine((request, context) => {
    const fields = lifecycleReferenceFields(request.operation);
    for (const field of ['targetRevisionId', 'quoteId', 'settlementId', 'approvalId'] as const) {
      const applicable = fields.some(value => value === field);
      if (request[field] !== undefined && !applicable) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: 'Field does not apply to operation' });
      // Approval is conditional on authoritative policy, never fabricated by the browser.
      if (applicable && field !== 'approvalId' && request[field] === undefined) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: 'Required operation reference' });
    }
    if (request.operation === 'downgrade' ? request.timing === undefined : request.timing !== undefined) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['timing'], message: 'Timing is required only for downgrade' });
    }
  })
}).strict();
const receiptSchema = z.object({
  operationId: uuid, committedAt: z.string().datetime({ offset: true }),
  decision: z.object({
    expectedVersion: positive, expectedRevisionId: uuid, next: executionState, access,
    retryAt: z.array(integer), audit: z.object({
      operation: lifecycleOperation, actorId: uuid, reason: text,
      at: integer, policyId: uuid, policyVersion: positive
    }).strict()
  }).strict()
}).strict();
export type Discovery = z.infer<typeof discoverySchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type Current = z.infer<typeof currentSchema>;
export type Usage = z.infer<typeof usageSchema>;
export type CreditHistory = z.infer<typeof historySchema>;
const auditSchema = z.object({
  schemaVersion: z.literal(1), actorId: uuid, productId: uuid, subscriptionId: uuid,
  items: z.array(z.object({
    operationId: uuid, actorId: uuid, operation: z.enum(['initialize', ...lifecycleOperation.options]),
    reason: text, at: integer, committedAt: z.string().datetime({ offset: true }), fromVersion: positive.nullable(),
    toVersion: positive, planId: uuid, revisionId: uuid, transactionId: uuid.nullable()
  }).strict()).max(50), nextCursor: uuid.nullable(),
}).strict().refine(value => value.items.every((item, index, items) => item.operationId > (index ? items[index - 1].operationId : '')
  && item.at <= Date.parse(item.committedAt) && (item.operation === 'initialize' ? item.fromVersion === null && item.toVersion === 1
    : item.fromVersion !== null && item.toVersion === item.fromVersion + 1))
  && value.nextCursor === (value.items.length === 50 ? value.items[49].operationId : null), 'Inconsistent activity history');
export type SubscriptionAudit = z.infer<typeof auditSchema>;
export type LifecycleRequest = z.infer<typeof lifecycleRequestSchema>;
export type FeatureGrant = z.infer<typeof featureGrant>;

const commerceScope = { subscriptionId: uuid, subject, expectedVersion: integer, expectedRevisionId: uuid };
export const commerceQuoteRequest = z.object({
  ...commerceScope, kind: z.literal('quote'),
  purpose: z.enum(['purchase', 'renew', 'upgrade']), revisionId: uuid, priceId: uuid
}).strict();
export type CommerceIntent = z.infer<typeof commerceQuoteRequest>;
export const contractActivationRequest = z.object({
  ...commerceScope, kind: z.literal('activate'),
  expectedVersion: z.literal(0), contractId: uuid
}).strict();
export type ContractActivationRequest = z.infer<typeof contractActivationRequest>;
const contractActivationReceipt = z.object({
  kind: z.literal('activation'), operationId: uuid, contractId: uuid,
  subscriptionId: uuid, productId: uuid, subject, revisionId: uuid
}).strict();
export const commerceQuoteSchema = z.object({
  id: uuid, actorId: uuid, subscriptionId: uuid, productId: uuid, subject,
  audience: text, stateVersion: integer, expectedRevisionId: uuid, planId: uuid, revisionId: uuid,
  purpose: z.enum(['purchase', 'renew', 'upgrade', 'retake']), referenceId: uuid.nullable(), priceId: uuid.nullable(),
  amountMinor: positive, currency: z.string().regex(/^[A-Z]{3}$/), minorUnit: integer.max(20),
  periodStartsAt: integer, periodEndsAt: positive, createdAt: integer, validUntil: positive
}).strict()
  .refine(q => q.periodStartsAt < q.periodEndsAt && q.createdAt < q.validUntil, 'Invalid quote period');
export type CommerceQuote = z.infer<typeof commerceQuoteSchema>;
export const issuedOrderSchema = z.object({
  kind: z.literal('order'), operationId: uuid, quoteId: uuid,
  order: z.object({
    id: z.string().regex(/^order_[A-Za-z0-9]+$/), amount: positive, currency: text,
    receipt: uuid, status: text, notes: z.record(z.string()), key_id: z.string().regex(/^rzp_(test|live)_[A-Za-z0-9]+$/)
  }).passthrough()
}).strict();
export type IssuedOrder = z.infer<typeof issuedOrderSchema>;
const checkoutStatusSchema = z.union([
  z.object({ kind: z.literal('checkout'), status: z.enum(['unpaid', 'paid', 'expired', 'blocked']), issued: issuedOrderSchema }).strict(),
  // The owner found no recorded provider order for this reservation.
  z.object({ kind: z.literal('checkout'), status: z.enum(['not_issued', 'order_pending']), operationId: uuid, quoteId: uuid }).strict(),
]);
export type CheckoutStatus = z.infer<typeof checkoutStatusSchema>;
/** Mirrors the owner's deterministic commerce rejection codes (functions/lib/subscriptions/commerce.ts). */
const rejectionReason = z.enum(['order_unavailable', 'operation_pending', 'existing_subscription', 'quote_expired',
  'state_changed', 'reconciliation_required', 'checkout_released']);
export type RejectionReason = z.infer<typeof rejectionReason>;
const rejectionMessages: Record<RejectionReason, string> = {
  order_unavailable: 'We could not find the payment order for this checkout. No new payment was started. Contact support with the references below.',
  operation_pending: 'This payment step is still being processed. Check its payment status before trying again.',
  existing_subscription: 'You already have a plan for this product. Use Upgrade to change it.',
  quote_expired: 'This price confirmation expired before payment started. Choose a plan again.',
  state_changed: 'Your subscription changed after this checkout started. Refresh the page and choose a plan again.',
  reconciliation_required: 'This checkout needs review by support before another payment. No new payment was started.',
  checkout_released: 'This checkout was closed without a payment. Choose a plan again.',
};
const rejectionSchema = z.object({ error: z.string(), reason: rejectionReason }).strict();
/** A deterministic owner rejection. Retrying the same request cannot change it. */
export class SubscriptionRejection extends Error {
  constructor(readonly reason: RejectionReason) { super(rejectionMessages[reason]); this.name = 'SubscriptionRejection'; }
}
export const commerceSettlementRequest = z.union([
  z.object({ ...commerceScope, kind: z.literal('settle'), quoteId: uuid, paymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/) }).strict(),
  z.object({ ...commerceScope, kind: z.literal('settle'), quoteId: uuid, reconcile: z.literal(true) }).strict(),
]);
export type CommerceSettlementRequest = z.infer<typeof commerceSettlementRequest>;
const commerceSettlementSchema = z.object({
  kind: z.literal('settlement'), operationId: uuid, quoteId: uuid,
  settlement: z.object({
    id: uuid, quoteId: uuid, subscriptionId: uuid, productId: uuid, subject,
    purpose: z.enum(['purchase', 'renew', 'upgrade', 'retake']), referenceId: uuid.nullable(),
    providerPaymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/), amountMinor: positive, currency: text, settledAt: integer
  }).strict()
}).strict();
function quoteScope(quote: CommerceQuote) {
  return { subscriptionId: quote.subscriptionId, subject: quote.subject, expectedVersion: quote.stateVersion, expectedRevisionId: quote.expectedRevisionId };
}

async function request<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, DEFAULT_TIMEOUT);
  try {
    // No replay metadata: the established auth client does not replay POST requests.
    const response = await ssoClient.fetch(`/api/subscriptions${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      cache: 'no-store', signal: controller.signal,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    if (response.status === 409) {
      const rejected = rejectionSchema.safeParse(await response.json().catch(() => null));
      if (rejected.success) throw new SubscriptionRejection(rejected.data.reason);
    }
    if (!response.ok) throw new Error(response.status === 503
      ? 'The subscription service is temporarily unavailable (503). Try again shortly.'
      : `Subscription request failed (${response.status}).`);
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) throw new Error('Subscription service returned an invalid response.');
    return parsed.data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
const cursorPath = (path: string, cursor?: string) => cursor ? `${path}?cursor=${encodeURIComponent(uuid.parse(cursor))}` : path;
export const subscriptionExecutionService = {
  activateContract: async (operationId: string, input: ContractActivationRequest,
    context: Pick<Catalog, 'actorId' | 'productId'>, signal?: AbortSignal) => {
    const parsed = contractActivationRequest.parse(input);
    const receipt = await request('/commerce', contractActivationReceipt, signal, { operationId: uuid.parse(operationId), request: parsed });
    if (receipt.operationId !== operationId || receipt.contractId !== parsed.contractId
      || receipt.subscriptionId !== parsed.subscriptionId || receipt.productId !== context.productId
      || receipt.subject.kind !== parsed.subject.kind || receipt.subject.id !== parsed.subject.id
      || receipt.revisionId !== parsed.expectedRevisionId) throw new Error('Activation acknowledgement differs.');
    return receipt;
  },
  quote: async (operationId: string, input: CommerceIntent, context: Pick<Catalog, 'actorId' | 'productId'>, signal?: AbortSignal) => {
    const intent = commerceQuoteRequest.parse(input);
    const receipt = await request('/commerce', z.object({ kind: z.literal('quote'), operationId: uuid, quote: commerceQuoteSchema }).strict(), signal,
      { operationId: uuid.parse(operationId), request: intent });
    const q = receipt.quote;
    if (receipt.operationId !== operationId || q.id !== operationId || q.actorId !== context.actorId || q.productId !== context.productId
      || q.subscriptionId !== intent.subscriptionId || q.subject.kind !== intent.subject.kind || q.subject.id !== intent.subject.id
      || q.stateVersion !== intent.expectedVersion || q.expectedRevisionId !== intent.expectedRevisionId || q.revisionId !== intent.revisionId
      || q.priceId !== intent.priceId || q.purpose !== intent.purpose || q.referenceId !== null) throw new Error('Commerce quote scope differs.');
    return q;
  },
  order: async (operationId: string, quote: CommerceQuote, signal?: AbortSignal) => {
    const receipt = await request('/commerce', issuedOrderSchema, signal,
      { operationId: uuid.parse(operationId), request: { ...quoteScope(quote), kind: 'order', quoteId: quote.id } });
    if (receipt.operationId !== operationId || receipt.quoteId !== quote.id || receipt.order.receipt !== quote.id
      || receipt.order.amount !== quote.amountMinor || receipt.order.currency !== quote.currency) throw new Error('Commerce order differs from the quote.');
    return receipt;
  },
  checkoutStatus: async (operationId: string, quote: CommerceQuote, signal?: AbortSignal) => {
    const receipt = await request('/commerce', checkoutStatusSchema, signal,
      { operationId: uuid.parse(operationId), request: { ...quoteScope(quote), kind: 'checkout', quoteId: quote.id } });
    if (!('issued' in receipt)) {
      if (receipt.operationId !== operationId || receipt.quoteId !== quote.id) throw new Error('Checkout status differs from the quote.');
      return receipt;
    }
    const issued = receipt.issued;
    if (issued.operationId !== operationId || issued.quoteId !== quote.id || issued.order.receipt !== quote.id
      || issued.order.amount !== quote.amountMinor || issued.order.currency !== quote.currency) throw new Error('Checkout status differs from the quote.');
    return receipt;
  },
  settle: async (operationId: string, quote: CommerceQuote, order: IssuedOrder, input: CommerceSettlementRequest, signal?: AbortSignal) => {
    const settlementRequest = commerceSettlementRequest.parse(input);
    if (order.quoteId !== quote.id || order.order.receipt !== quote.id || order.order.amount !== quote.amountMinor
      || order.order.currency !== quote.currency || settlementRequest.quoteId !== quote.id
      || settlementRequest.subscriptionId !== quote.subscriptionId || settlementRequest.subject.id !== quote.subject.id
      || settlementRequest.subject.kind !== quote.subject.kind || settlementRequest.expectedVersion !== quote.stateVersion
      || settlementRequest.expectedRevisionId !== quote.expectedRevisionId) throw new Error('Commerce order or settlement request differs from the quote.');
    const receipt = await request('/commerce', commerceSettlementSchema, signal,
      { operationId: uuid.parse(operationId), request: settlementRequest });
    const s = receipt.settlement;
    if (receipt.operationId !== operationId || receipt.quoteId !== quote.id || s.id !== operationId || s.quoteId !== quote.id
      || s.subscriptionId !== quote.subscriptionId || s.productId !== quote.productId || s.subject.id !== quote.subject.id
      || s.subject.kind !== quote.subject.kind || s.purpose !== quote.purpose || s.referenceId !== quote.referenceId
      || s.amountMinor !== quote.amountMinor || s.currency !== quote.currency
      || ('paymentId' in settlementRequest && s.providerPaymentId !== settlementRequest.paymentId)) throw new Error('Commerce settlement scope differs.');
    return receipt;
  },
  discover: (signal?: AbortSignal, cursor?: string) => request(cursorPath('', cursor), discoverySchema, signal),
  catalog: (signal?: AbortSignal, cursor?: string) => request(cursorPath('/catalog', cursor), catalogSchema, signal),
  // PRD R16/R17: the only call that ever commits promo quota. Re-derives the live offer fresh
  // on the server and atomically snapshots it; calling again once already accepted just returns
  // the same immutable snapshot.
  acceptPromoOffer: async (signal?: AbortSignal) => (await request('/promo-offer', acceptPromoOfferSchema, signal, {})).offer,
  current: async (row: Discovery['items'][number], context: Pick<Discovery, 'actorId' | 'productId'>, signal?: AbortSignal) => {
    const result = await request(`/current?subscriptionId=${encodeURIComponent(uuid.parse(row.id))}`, currentSchema, signal);
    if (result.actorId !== context.actorId || result.state.productId !== context.productId || result.state.id !== row.id
      || result.state.subject.id !== row.subject.id || result.state.subject.kind !== row.subject.kind
      || result.state.planId !== row.planId || result.state.revisionId !== row.revisionId || result.state.version !== row.version) throw new Error('Current subscription scope differs.');
    return result;
  },
  usage: async (current: Current, pool: Current['pools'][number], recipientId: string, signal?: AbortSignal) => {
    const result = await request('/credits', usageSchema, signal, {
      kind: 'usage', subscriptionId: current.state.id,
      poolKey: pool.key, recipientId: uuid.parse(recipientId)
    });
    if (result.subscriptionId !== current.state.id || result.productId !== current.state.productId || result.poolKey !== pool.key
      || result.featureKey !== pool.featureKey || result.recipient.id !== recipientId || result.recipient.kind !== pool.recipient) throw new Error('Credit usage scope differs.');
    return result;
  },
  historicalPools: async (current: Current, revisionId: string, signal?: AbortSignal) => {
    const revision = uuid.parse(revisionId);
    const result = await request('/history', historicalPoolsSchema, signal,
      { kind: 'pools', subscriptionId: current.state.id, revisionId: revision });
    if (result.actorId !== current.actorId || result.productId !== current.state.productId || result.subscriptionId !== current.state.id
      || result.revisionId !== revision || result.audience !== current.audience) throw new Error('Historical pool scope differs.');
    return result;
  },
  history: async (current: Current, pool: Current['pools'][number], recipientId: string, after: string | null, signal?: AbortSignal, revisionId?: string) => {
    const result = await request('/history', historySchema, signal, {
      kind: 'credits', subscriptionId: current.state.id,
      poolKey: pool.key, recipientId: uuid.parse(recipientId), after: historyCursor.nullable().parse(after),
      ...(revisionId === undefined ? {} : { revisionId: uuid.parse(revisionId) })
    });
    if (result.scope.subscriptionId !== current.state.id || result.scope.productId !== current.state.productId
      || result.scope.poolKey !== pool.key || result.scope.featureKey !== pool.featureKey
      || result.scope.recipient.id !== recipientId || result.scope.recipient.kind !== pool.recipient
      || result.allocations.some(item => after !== null && item.referenceId <= after)) throw new Error('Credit history scope differs.');
    return result;
  },
  audit: async (current: Current, after: string | null, signal?: AbortSignal) => {
    const result = await request('/history', auditSchema, signal, { kind: 'audit', subscriptionId: current.state.id, after: uuid.nullable().parse(after) });
    if (result.actorId !== current.actorId || result.productId !== current.state.productId || result.subscriptionId !== current.state.id
      || result.items.some(item => after !== null && item.operationId <= after)) throw new Error('Subscription activity scope differs.');
    return result;
  },
  lifecycle: async (input: LifecycleRequest, current: Current, signal?: AbortSignal) => {
    const parsed = lifecycleRequestSchema.parse(input);
    const receipt = await request('/lifecycle', receiptSchema, signal, parsed);
    const { decision } = receipt;
    if (receipt.operationId !== input.operationId || decision.expectedVersion !== input.request.expectedVersion
      || decision.expectedRevisionId !== input.request.expectedRevisionId || decision.next.id !== current.state.id
      || decision.next.productId !== current.state.productId || decision.next.subject.id !== current.state.subject.id
      || decision.next.subject.kind !== current.state.subject.kind || decision.next.version !== input.request.expectedVersion + 1
      || decision.audit.actorId !== current.actorId || decision.audit.operation !== input.request.operation
      || decision.audit.reason !== input.request.reason) throw new Error('Lifecycle acknowledgement differs.');
    return receipt;
  },
};
