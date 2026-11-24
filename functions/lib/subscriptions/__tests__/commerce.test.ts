import { SKILLPASSPORT_PRODUCT_ID } from '../../subscription-config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../../api/subscriptions/commerce';
import type { PagesFunction } from '../../types';
const io = vi.hoisted(() => ({ authenticated: true, execute: vi.fn(), completePlanSelection: vi.fn(), accepted: vi.fn(), projection: vi.fn() }));
vi.mock('../../../api/payments/lib/promoCode', () => ({
  getStoredReferralCodeAndRole: async () => ({ referralCode: 'TEST', role: 'learner' }),
  getAcceptedOfferSnapshot: io.accepted,
}));
vi.mock('../publication', () => ({ readApplicationPlanProjectionByRevision: io.projection }));
vi.mock('../../../shared/lib/org-subscription', () => ({ completePlanSelection: io.completePlanSelection }));
vi.mock('../../supabase', async original => ({ ...(await original<object>()), getServiceClient: () => ({ synthetic: 'service-client' }) }));
vi.mock('../../auth', () => ({ getAuthInstance: () => ({ authenticate: (handler: (request: Request, auth: unknown) => Promise<Response>) => (request: Request) => io.authenticated ? handler(request, { user: { sub: 'a0000000-0000-4000-8000-000000000001', is_email_verified: true, membership_status: 'active' } }) : Response.json({}, { status: 401 }) }) }));
const id = (n: number) => `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const actor = id(1), subscription = id(2), product = SKILLPASSPORT_PRODUCT_ID, revision = id(4), operationId = id(5);
const command = () => ({ operationId, request: { kind: 'quote', subscriptionId: subscription, subject: { kind: 'user', id: actor }, expectedVersion: 0, expectedRevisionId: revision, purpose: 'purchase', revisionId: revision, priceId: id(6) } });
const receipt = () => ({ kind: 'quote', operationId, quote: { id: operationId, actorId: actor, subscriptionId: subscription, productId: product, subject: { kind: 'user', id: actor }, audience: 'learner', stateVersion: 0, expectedRevisionId: revision, planId: id(7), revisionId: revision, purpose: 'purchase', referenceId: null, priceId: id(6), amountMinor: 100000, currency: 'INR', minorUnit: 2, periodStartsAt: 100, periodEndsAt: 10000, createdAt: 100, validUntil: 1000 } });
const run = (body: unknown, bearer = true) => onRequestPost({ request: new Request('https://owner.invalid/api/subscriptions/commerce', { method: 'POST', headers: { ...(bearer ? { authorization: 'Bearer synthetic-token' } : {}), 'content-type': 'application/json' }, body: JSON.stringify(body) }), env: { SKILLPASSPORT_PRODUCT_ID: product, SSO_SERVICE: { executeSubscriptionCommerce: io.execute } }, params: {}, data: {}, next: vi.fn(), waitUntil: vi.fn() } as unknown as Parameters<PagesFunction>[0]);
beforeEach(() => { vi.resetAllMocks(); io.authenticated = true; io.execute.mockResolvedValue(receipt()); io.completePlanSelection.mockResolvedValue(undefined); });
describe('commerce authenticated HTTP boundary', () => {
  it('checks only an authenticated retained order and rejects altered status references', async () => {
    const body = { operationId, request: { kind: 'checkout', subscriptionId: subscription, subject: { kind: 'user', id: actor }, expectedVersion: 0, expectedRevisionId: revision, quoteId: id(8) } };
    const issued = { kind: 'order', operationId, quoteId: id(8), order: { id: 'order_synthetic', receipt: id(8), amount: 100000, currency: 'INR', status: 'created', notes: {}, key_id: 'rzp_test_synthetic' } };
    io.execute.mockResolvedValue({ kind: 'checkout', status: 'unpaid', issued });
    expect((await run(body)).status).toBe(200);
    expect(io.execute).toHaveBeenLastCalledWith('synthetic-token', product, operationId, body.request);
    expect((await run(body, false)).status).toBe(401);
    expect((await run({ ...body, request: { ...body.request, subject: { kind: 'user', id: id(99) } } })).status).toBe(403);
    for (const changed of [{ operationId: id(99) }, { quoteId: id(99) }, { order: { ...issued.order, receipt: id(99) } }]) {
      io.execute.mockResolvedValue({ kind: 'checkout', status: 'unpaid', issued: { ...issued, ...changed } });
      expect((await run(body)).status).toBe(503);
    }
  });
  it('forwards references and validates owner quote scope', async () => {
    expect((await run(command())).status).toBe(200);
    expect(io.execute).toHaveBeenCalledExactlyOnceWith('synthetic-token', product, operationId, command().request);
  });
  it('rejects anonymous, foreign subject and client payment-policy authority', async () => {
    expect((await run(command(), false)).status).toBe(401);
    expect((await run({ ...command(), request: { ...command().request, subject: { kind: 'user', id: id(99) } } })).status).toBe(403);
    for (const field of ['amountMinor', 'currency', 'actorId', 'roles', 'policy', 'settlement']) expect((await run({ ...command(), request: { ...command().request, [field]: 1 } })).status).toBe(400);
    expect(io.execute).not.toHaveBeenCalled();
  });
  it.each(['actorId', 'subscriptionId', 'productId', 'expectedRevisionId', 'purpose', 'stateVersion', 'priceId', 'referenceId'])('rejects altered owner acknowledgement %s', async field => {
    const value = receipt(); Object.assign(value.quote, { [field]: field === 'stateVersion' ? 9 : id(99) }); io.execute.mockResolvedValue(value);
    expect((await run(command())).status).toBe(503);
  });
  it('preserves the exact paid retake attempt reference through the actual HTTP owner boundary', async () => {
    const base = command();
    const { priceId: unused, ...request } = base.request;
    const body = { ...base, request: { ...request, purpose: 'retake', referenceId: id(20), expectedVersion: 1 } };
    const result = receipt(); Object.assign(result.quote, { purpose: 'retake', referenceId: id(20), priceId: null, stateVersion: 1, amountMinor: 9900 });
    io.execute.mockResolvedValue(result); expect((await run(body)).status).toBe(200);
    io.execute.mockResolvedValue({ ...result, quote: { ...result.quote, referenceId: id(21) } }); expect((await run(body)).status).toBe(503);
  });
  it('accepts explicit callback-free reconciliation and validates the same settlement owner scope', async () => {
    const body = { operationId, request: { kind: 'settle', subscriptionId: subscription, subject: { kind: 'user', id: actor }, expectedVersion: 0, expectedRevisionId: revision, quoteId: id(8), reconcile: true } };
    const result = { kind: 'settlement', operationId, quoteId: id(8), settlement: { id: operationId, quoteId: id(8), subscriptionId: subscription, productId: product, subject: body.request.subject, purpose: 'purchase', referenceId: null, providerPaymentId: 'pay_canonical', amountMinor: 100000, currency: 'INR', settledAt: 100 } };
    io.execute.mockResolvedValue(result); expect((await run(body)).status).toBe(200);
    expect(io.execute).toHaveBeenLastCalledWith('synthetic-token', product, operationId, body.request);
    for (const request of [{ ...body.request, paymentId: 'pay_other' }, { ...body.request, reconcile: false }, { ...body.request, reconcile: undefined }]) expect((await run({ ...body, request })).status).toBe(400);
    io.execute.mockResolvedValue({ ...result, settlement: { ...result.settlement, productId: id(99) } }); expect((await run(body)).status).toBe(503);
  });
  it('returns recovery outcomes for a reserved order with no recorded provider order and rejects altered references', async () => {
    const body = { operationId, request: { kind: 'checkout', subscriptionId: subscription, subject: { kind: 'user', id: actor }, expectedVersion: 0, expectedRevisionId: revision, quoteId: id(8) } };
    for (const status of ['not_issued', 'order_pending']) {
      io.execute.mockResolvedValue({ kind: 'checkout', status, operationId, quoteId: id(8) });
      const response = await run(body);
      expect(response.status).toBe(200); expect(await response.json()).toEqual({ kind: 'checkout', status, operationId, quoteId: id(8) });
      for (const changed of [{ operationId: id(99) }, { quoteId: id(99) }]) {
        io.execute.mockResolvedValue({ kind: 'checkout', status, operationId, quoteId: id(8), ...changed });
        expect((await run(body)).status).toBe(503);
      }
    }
    io.execute.mockResolvedValue({ kind: 'checkout', status: 'not_issued', operationId, quoteId: id(8) });
    expect((await run(command())).status).toBe(503);
  });
  it.each(['order_unavailable', 'operation_pending', 'existing_subscription', 'quote_expired', 'state_changed', 'reconciliation_required', 'checkout_released'])
    ('maps the deterministic owner rejection %s to 409 with its reason code', async reason => {
      io.execute.mockResolvedValue({ kind: 'rejected', reason });
      const response = await run(command());
      expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: 'Subscription request rejected', reason });
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    });
  it('treats an unknown rejection reason as an invalid owner response', async () => {
    io.execute.mockResolvedValue({ kind: 'rejected', reason: 'internal detail' }); expect((await run(command())).status).toBe(503);
  });
  it('completes plan selection only after a confirmed personal settlement and reports its failure', async () => {
    expect((await run(command())).status).toBe(200); expect(io.completePlanSelection).not.toHaveBeenCalled();
    const body = { operationId, request: { kind: 'settle', subscriptionId: subscription, subject: { kind: 'user', id: actor }, expectedVersion: 0, expectedRevisionId: revision, quoteId: id(8), reconcile: true } };
    const result = { kind: 'settlement', operationId, quoteId: id(8), settlement: { id: operationId, quoteId: id(8), subscriptionId: subscription, productId: product, subject: body.request.subject, purpose: 'upgrade', referenceId: null, providerPaymentId: 'pay_canonical', amountMinor: 100000, currency: 'INR', settledAt: 100 } };
    io.execute.mockResolvedValue({ ...result, settlement: { ...result.settlement, purpose: 'retake', referenceId: id(20) } }); expect((await run(body)).status).toBe(200);
    expect(io.completePlanSelection).not.toHaveBeenCalled();
    io.execute.mockResolvedValue({ ...result, settlement: { ...result.settlement, productId: id(99) } }); expect((await run(body)).status).toBe(503);
    expect(io.completePlanSelection).not.toHaveBeenCalled();
    io.execute.mockResolvedValue(result); expect((await run(body)).status).toBe(200);
    expect(io.completePlanSelection).toHaveBeenCalledExactlyOnceWith({ synthetic: 'service-client' }, actor);
    io.completePlanSelection.mockRejectedValueOnce(new Error('Application profile is not ready')); expect((await run(body)).status).toBe(503);
  });
  it('keeps owner denial and uncertain mutation explicit without retry', async () => {
    io.execute.mockResolvedValue({ kind: 'forbidden' }); expect((await run(command())).status).toBe(403);
    io.execute.mockRejectedValue(new Error('uncertain')); expect((await run(command())).status).toBe(503);
    expect(io.execute).toHaveBeenCalledTimes(2);
  });
});

// HTTP contract tests isolate cache persistence; dedicated read-cache tests exercise the real owner.
vi.mock('../read-cache', async importOriginal => ({
  ...await importOriginal<typeof import('../read-cache')>(),
  readThroughSubscription: async (_database: unknown, _scope: unknown, _resource: unknown, _input: unknown,
    load: () => Promise<unknown>, validate: (value: unknown) => unknown) => validate(await load()),
  withSubscriptionReadInvalidation: async (_database: unknown, _product: unknown, execute: () => Promise<unknown>) => execute(),
}));

vi.mock('../catalog-inventory', () => ({ catalogInventoryDatabase: () => ({ synthetic: 'cache-database' }) }));


describe('accepted promo pricing through the HTTP boundary', () => {
  it.each(['purchase', 'upgrade'])('forwards the exact accepted fixed price for %s', async purpose => {
    const result = receipt(); result.quote.amountMinor = 39900;
    result.quote.purpose = purpose;
    const body = command(); body.request.purpose = purpose;
    io.execute.mockResolvedValue(result);
    io.accepted.mockResolvedValue({ offer: { planId: id(7), revisionId: revision, priceId: id(6), amountMinor: 39900 } });
    io.projection.mockResolvedValue({ projection: { bundle: { draft: { plan: { id: id(7) }, prices: [{ id: id(6), amountMinor: 100000 }] } } } });
    expect((await run(body)).status).toBe(200);
    expect(io.execute).toHaveBeenCalledWith('synthetic-token', product, operationId, { ...body.request, priceAdjustmentMinor: -60100 });
  });
  it('rejects a browser-supplied price adjustment before calling SSO', async () => {
    const body = command();
    expect((await run({ ...body, request: { ...body.request, priceAdjustmentMinor: -99999 } })).status).toBe(400);
    expect(io.execute).not.toHaveBeenCalled();
  });
  it('does not apply an accepted price to a different revision', async () => {
    io.accepted.mockResolvedValue({ offer: { revisionId: id(99), priceId: id(6), amountMinor: 39900 } });
    expect((await run(command())).status).toBe(200);
    expect(io.execute).toHaveBeenCalledWith('synthetic-token', product, operationId, command().request);
  });
});
