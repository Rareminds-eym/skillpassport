import { z } from 'zod';
import { completePlanSelection } from '../../shared/lib/org-subscription';
import { getServiceClient } from '../supabase';
import { DraftRequestError, readDraftRequest } from './authoring';
import { subscriptionConsumerEndpoint, subscriptionFailure, subscriptionResponseHeaders } from './current-subscription';

const reference = z.string().uuid().transform(v => v.toLowerCase());
const subject = z.object({ kind: z.enum(['user', 'organization']), id: reference }).strict();
const common = { subscriptionId: reference, subject, expectedVersion: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), expectedRevisionId: reference };
const requestSchema = z.union([
  z.object({ ...common, kind: z.literal('activate'), expectedVersion: z.literal(0), contractId: reference }).strict(),
  z.object({ ...common, kind: z.literal('quote'), purpose: z.enum(['purchase', 'renew', 'upgrade', 'retake']), revisionId: reference, priceId: reference.optional(), referenceId: reference.optional() }).strict(),
  z.object({ ...common, kind: z.literal('order'), quoteId: reference }).strict(),
  z.object({ ...common, kind: z.literal('checkout'), quoteId: reference }).strict(),
  z.object({ ...common, kind: z.literal('settle'), quoteId: reference, paymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/).optional(), reconcile: z.literal(true).optional() }).strict().refine(value => value.reconcile === true ? value.paymentId === undefined : value.paymentId !== undefined),
  z.object({ ...common, kind: z.literal('refund'), settlementId: reference }).strict(),
  z.object({ ...common, kind: z.literal('refund_confirm'), settlementId: reference, refundId: z.string().regex(/^rfnd_[A-Za-z0-9]+$/) }).strict(),
]);
export const commerceCommandSchema = z.object({ operationId: reference, request: requestSchema }).strict();
const amount = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const quoteSchema = z.object({
  id: reference, actorId: reference, subscriptionId: reference, productId: reference, subject, audience: z.string().min(1), stateVersion: z.number().int().nonnegative(), expectedRevisionId: reference,
  planId: reference, revisionId: reference, purpose: z.enum(['purchase', 'renew', 'upgrade', 'retake']), referenceId: reference.nullable(), priceId: reference.nullable(), amountMinor: amount, currency: z.string().regex(/^[A-Z]{3}$/), minorUnit: z.number().int().nonnegative(),
  periodStartsAt: z.number().int().nonnegative(), periodEndsAt: z.number().int().positive(), createdAt: z.number().int().nonnegative(), validUntil: z.number().int().positive()
}).strict();
const settlementSchema = z.object({ id: reference, quoteId: reference, subscriptionId: reference, productId: reference, subject, purpose: z.enum(['purchase', 'renew', 'upgrade', 'retake']), referenceId: reference.nullable(), providerPaymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/), amountMinor: amount, currency: z.string(), settledAt: z.number().int().nonnegative() }).strict();
const orderReceipt = z.object({ kind: z.literal('order'), operationId: reference, quoteId: reference, order: z.object({ id: z.string().regex(/^order_[A-Za-z0-9]+$/), amount, currency: z.string(), receipt: z.string(), status: z.string(), notes: z.record(z.string()), key_id: z.string().optional() }).passthrough() }).strict();
/** Mirrors the SSO owner's COMMERCE_REJECTION_REASONS (sso-worker/src/lib/subscriptions/commerce.ts). */
export const commerceRejectionReasons = ['order_unavailable', 'operation_pending', 'existing_subscription', 'quote_expired', 'state_changed', 'reconciliation_required', 'checkout_released'] as const;
const rejectionSchema = z.object({ kind: z.literal('rejected'), reason: z.enum(commerceRejectionReasons) }).strict();
const receiptSchema = z.union([
  z.object({ kind: z.literal('activation'), operationId: reference, contractId: reference, subscriptionId: reference, productId: reference, subject, revisionId: reference }).strict(),
  z.object({ kind: z.literal('quote'), operationId: reference, quote: quoteSchema }).strict(),
  orderReceipt,
  z.object({ kind: z.literal('checkout'), status: z.enum(['unpaid', 'paid', 'expired', 'blocked']), issued: orderReceipt }).strict(),
  // Recovery outcomes for a reserved order with no recorded provider order.
  z.object({ kind: z.literal('checkout'), status: z.enum(['not_issued', 'order_pending']), operationId: reference, quoteId: reference }).strict(),
  z.object({ kind: z.literal('settlement'), operationId: reference, quoteId: reference, settlement: settlementSchema }).strict(),
  z.object({ kind: z.literal('refund'), operationId: reference, settlementId: reference, refundId: z.string().regex(/^rfnd_[A-Za-z0-9]+$/), amountMinor: amount, status: z.enum(['pending', 'processed', 'failed']), accessRevoked: z.boolean() }).strict(),
]);

export const commerceEndpoint = subscriptionConsumerEndpoint('POST', async context => {
  if ([...new URL(context.request.url).searchParams].length) return subscriptionFailure(400);
  let parsed;
  try { parsed = commerceCommandSchema.safeParse(await readDraftRequest(context.request)); }
  catch (error) { if (error instanceof DraftRequestError) return subscriptionFailure(error.status); throw error; }
  if (!parsed.success) return subscriptionFailure(400);
  const { operationId, request } = parsed.data;
  if (request.subject.kind === 'user' ? request.subject.id !== context.actorId : request.subject.id !== context.organizationId) return subscriptionFailure(403);
  const raw = await context.env.SSO_SERVICE!.executeSubscriptionCommerce(context.token, context.productId, operationId, request);
  if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
  const rejected = rejectionSchema.safeParse(raw);
  if (rejected.success) return Response.json({ error: 'Subscription request rejected', reason: rejected.data.reason }, { status: 409, headers: subscriptionResponseHeaders });
  const receipt = receiptSchema.parse(raw);
  if (receipt.kind === 'checkout') {
    if (request.kind !== 'checkout') throw new Error('Checkout status acknowledgement differs');
    if ('issued' in receipt
      ? receipt.issued.operationId !== operationId || receipt.issued.quoteId !== request.quoteId || receipt.issued.order.receipt !== request.quoteId
      : receipt.operationId !== operationId || receipt.quoteId !== request.quoteId) throw new Error('Checkout status acknowledgement differs');
  } else if (receipt.kind === 'activation') {
    if (request.kind !== 'activate' || receipt.operationId !== operationId || receipt.contractId !== request.contractId || receipt.subscriptionId !== request.subscriptionId
      || receipt.productId !== context.productId || receipt.subject.kind !== request.subject.kind || receipt.subject.id !== request.subject.id || receipt.revisionId !== request.expectedRevisionId) throw new Error('Commerce activation acknowledgement differs');
  } else if (receipt.kind === 'quote') {
    const q = receipt.quote;
    if (receipt.operationId !== operationId || request.kind !== 'quote' || q.id !== operationId || q.actorId !== context.actorId || q.subscriptionId !== request.subscriptionId || q.productId !== context.productId
      || q.subject.kind !== request.subject.kind || q.subject.id !== request.subject.id || q.stateVersion !== request.expectedVersion || q.expectedRevisionId !== request.expectedRevisionId || q.purpose !== request.purpose || q.revisionId !== request.revisionId
      || q.referenceId !== (request.referenceId ?? null) || q.priceId !== (request.priceId ?? null)) throw new Error('Commerce quote acknowledgement differs');
  } else if (receipt.kind === 'order') {
    if (request.kind !== 'order' || receipt.operationId !== operationId || receipt.quoteId !== request.quoteId || receipt.order.receipt !== request.quoteId) throw new Error('Commerce order acknowledgement differs');
  } else if (receipt.kind === 'settlement') {
    const s = receipt.settlement;
    if (request.kind !== 'settle' || receipt.operationId !== operationId || receipt.quoteId !== request.quoteId || s.id !== operationId || s.quoteId !== request.quoteId || (request.reconcile !== true && s.providerPaymentId !== request.paymentId) || s.subscriptionId !== request.subscriptionId || s.productId !== context.productId || s.subject.kind !== request.subject.kind || s.subject.id !== request.subject.id) throw new Error('Commerce settlement acknowledgement differs');
    // A confirmed personal purchase completes the app's plan-selection onboarding, as the legacy
    // checkout does. Failure surfaces as 503; replaying the same settlement is idempotent.
    if (s.subject.kind === 'user' && s.purpose !== 'retake') await completePlanSelection(getServiceClient(context.env as Parameters<typeof getServiceClient>[0]), context.actorId);
  } else if ((request.kind !== 'refund' && request.kind !== 'refund_confirm') || receipt.settlementId !== request.settlementId || receipt.accessRevoked !== (receipt.status === 'processed')
    || (request.kind === 'refund' && receipt.operationId !== operationId) || (request.kind === 'refund_confirm' && receipt.refundId !== request.refundId)) throw new Error('Commerce refund acknowledgement differs');
  return Response.json(receipt, { headers: subscriptionResponseHeaders });
});
