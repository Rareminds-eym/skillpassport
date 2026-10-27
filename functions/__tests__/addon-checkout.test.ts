// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fulfillCapturedAddon,
  type AddonEnvironment,
  type AddonOffer,
} from '../api/payments/lib/addon-checkout';
import { handleCreateAddonOrder } from '../api/payments/handlers/create-addon-order';
import {
  handleReconcileAddonPayment,
  handleVerifyAddonPayment,
} from '../api/payments/handlers/verify-addon-payment';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), user: vi.fn() }));
vi.mock('../lib/supabase', () => ({
  getServiceClient: () => ({ rpc: mocks.rpc }),
}));
vi.mock('../lib/auth', () => ({ getContextUser: mocks.user }));
const offer: AddonOffer = {
  id: 'offer-1',
  addon_id: 'catalog-1',
  billing_period: 'monthly',
  display_name: 'Monthly',
  amount_minor: 37100,
  currency: 'INR',
  minor_unit: 2,
  interval_months: 1,
  fulfilment_kind: 'access',
  target_feature_key: 'future_feature',
  quantity: 1,
  duration_days: null,
  requires_organization: false,
  is_active: true,
  allow_repeat_purchase: false,
};
const addon = {
  id: 'catalog-1',
  feature_key: 'future_feature',
  feature_name: 'Database Feature',
  target_roles: ['learner'],
  billing_options: [offer],
  is_active: true,
};
let worker: Record<string, ReturnType<typeof vi.fn>>,
  sso: Record<string, ReturnType<typeof vi.fn>>,
  env: AddonEnvironment;
const context = (body: unknown) =>
  ({
    env,
    request: new Request('https://test/api/payments/verify-addon-payment', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  }) as never;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockReturnValue({ id: 'buyer-1' });
  mocks.rpc.mockResolvedValue({
    data: { already_fulfilled: false, entitlement: { id: 'ent-1' } },
    error: null,
  });
  const order = {
    id: 'order_test',
    amount: 37100,
    currency: 'INR',
    notes: {
      type: 'addon',
      purchase_id: 'checkout-1',
      user_id: 'buyer-1',
      feature_key: 'future_feature',
      addon_id: 'catalog-1',
      billing_period: 'monthly',
    },
  };
  const payment = {
    id: 'pay_test',
    order_id: order.id,
    amount: 37100,
    currency: 'INR',
    status: 'captured',
    captured: true,
    method: 'card',
    notes: { feature_key: 'untrusted-client-key' },
  };
  worker = {
    createOrder: vi.fn().mockResolvedValue({
      id: order.id,
      amount: 37100,
      currency: 'INR',
      key_id: 'test-key',
    }),
    verifyPaymentSignature: vi.fn().mockResolvedValue({ verified: true }),
    getOrder: vi.fn().mockResolvedValue(order),
    getPayment: vi.fn().mockResolvedValue(payment),
    getOrdersByReceipt: vi.fn().mockResolvedValue({ items: [order] }),
    getOrderPayments: vi.fn().mockResolvedValue({ items: [payment] }),
  };
  sso = {
    getAddonByFeatureKey: vi.fn().mockResolvedValue(addon),
    getAddonCheckout: vi.fn().mockResolvedValue({
      id: 'checkout-1',
      user_id: 'buyer-1',
      addon_id: 'catalog-1',
      feature_key: 'future_feature',
      target_roles: ['learner'],
      offer,
    }),
    getUserMemberships: vi.fn().mockResolvedValue({
      memberships: [{ org_id: 'org-1', roles: ['learner'], status: 'active' }],
    }),
    prepareAddonCheckout: vi
      .fn()
      .mockResolvedValue({ id: 'checkout-1', checkout_created: true }),
    bindAddonOrder: vi.fn().mockResolvedValue(undefined),
    discardUnopenedAddonCheckout: vi.fn().mockResolvedValue(undefined),
    getRecordedAddonPurchase: vi.fn().mockResolvedValue(null),
    getActiveAddonPurchase: vi.fn().mockResolvedValue(null),
    getPendingAddonPurchase: vi.fn().mockResolvedValue(null),
    recordAddonPurchase: vi.fn().mockResolvedValue({
      id: 'purchase-1',
      user_id: 'buyer-1',
      feature_key: 'future_feature',
      offer,
    }),
    activateAddonPurchase: vi.fn().mockResolvedValue(undefined),
  };
  env = {
    PAYMENT_WORKER: worker,
    SSO_SERVICE: sso,
  } as unknown as AddonEnvironment;
});
const verifyBody = {
  razorpay_order_id: 'order_test',
  razorpay_payment_id: 'pay_test',
  razorpay_signature: 'signature',
  feature_key: 'future_feature',
  billing_period: 'monthly',
};
describe('database-owned add-on checkout', () => {
  it('creates an arbitrary catalog feature and billing period at the DB price, ignoring client prices', async () => {
    const response = await handleCreateAddonOrder(
      context({
        feature_key: 'future_feature',
        billing_period: 'monthly',
        amount: 1,
        currency: 'USD',
      }),
    );
    expect(response.status).toBe(200);
    expect(worker.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 37100,
        currency: 'INR',
        notes: expect.objectContaining({
          purchase_id: 'checkout-1',
          billing_period: 'monthly',
        }),
      }),
    );
  });
  it('rejects an unavailable billing option before creating an order', async () => {
    expect(
      (
        await handleCreateAddonOrder(
          context({ feature_key: 'future_feature', billing_period: 'weekly' }),
        )
      ).status,
    ).toBe(400);
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
  it('checks canonical role membership before checkout', async () => {
    sso.getUserMemberships.mockResolvedValue({
      memberships: [
        { org_id: 'org-1', roles: ['recruiter'], status: 'active' },
      ],
    });
    expect(
      (
        await handleCreateAddonOrder(
          context({
            feature_key: 'future_feature',
            billing_period: 'monthly',
          }),
        )
      ).status,
    ).toBe(403);
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
  it('returns the existing captured order instead of creating another checkout', async () => {
    sso.getPendingAddonPurchase.mockResolvedValue({
      razorpay_order_id: 'order_previous',
      razorpay_payment_id: 'pay_previous',
    });
    const response = await handleCreateAddonOrder(
      context({ feature_key: 'future_feature', billing_period: 'monthly' }),
    );
    expect(response.status).toBe(409);
    expect((await response.json()).data.recovery_order_id).toBe(
      'order_previous',
    );
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
  it('verifies the original order, not mutable payment notes', async () => {
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      200,
    );
    expect(sso.recordAddonPurchase).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'buyer-1',
        prepared_purchase_id: 'checkout-1',
        amount_minor: 37100,
      }),
    );
    expect(mocks.rpc).toHaveBeenCalledWith(
      'fulfil_addon_purchase',
      expect.anything(),
    );
  });
  it('rejects another buyer before any purchase/grant writes', async () => {
    worker.getOrder.mockResolvedValue({
      ...(await worker.getOrder()),
      notes: { ...(await worker.getOrder()).notes, user_id: 'other-user' },
    });
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      403,
    );
    expect(sso.recordAddonPurchase).not.toHaveBeenCalled();
  });
  it('rejects a tampered billing period', async () => {
    expect(
      (
        await handleVerifyAddonPayment(
          context({ ...verifyBody, billing_period: 'annual' }),
        )
      ).status,
    ).toBe(400);
    expect(sso.recordAddonPurchase).not.toHaveBeenCalled();
  });
  it('rejects a false signature result', async () => {
    worker.verifyPaymentSignature.mockResolvedValue({ verified: false });
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      400,
    );
    expect(worker.getPayment).not.toHaveBeenCalled();
  });
  it('rejects mismatched captured amounts before grants', async () => {
    worker.getPayment.mockResolvedValue({
      ...(await worker.getPayment()),
      amount: 100,
    });
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      400,
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects uncaptured payments', async () => {
    worker.getPayment.mockResolvedValue({
      ...(await worker.getPayment()),
      status: 'authorized',
      captured: false,
    });
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      409,
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('recovers a captured order without persisting the browser payment signature', async () => {
    expect(
      (
        await handleReconcileAddonPayment(
          context({ razorpay_order_id: 'order_test' }),
        )
      ).status,
    ).toBe(200);
    expect(worker.verifyPaymentSignature).not.toHaveBeenCalled();
    expect(worker.getOrderPayments).toHaveBeenCalledWith('order_test');
    expect(sso.activateAddonPurchase).toHaveBeenCalledOnce();
  });
  it('does not mark fulfilment complete on DB failure, and retry resumes the purchase', async () => {
    mocks.rpc.mockResolvedValueOnce({
      error: { message: 'temporary DB outage' },
    });
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      503,
    );
    expect(sso.activateAddonPurchase).not.toHaveBeenCalled();
    expect(
      (
        await handleReconcileAddonPayment(
          context({ razorpay_order_id: 'order_test' }),
        )
      ).status,
    ).toBe(200);
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
  it('accepts an immutable purchased offer after deactivation', async () => {
    sso.getAddonCheckout.mockResolvedValue({
      id: 'checkout-1',
      user_id: 'buyer-1',
      addon_id: 'catalog-1',
      feature_key: 'future_feature',
      target_roles: ['learner'],
      offer: { ...offer, is_active: false },
    });
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      200,
    );
  });
  it('uses the same provider-validated path for trusted webhook fulfilment', async () => {
    const result = await fulfillCapturedAddon(env, {
      orderId: 'order_test',
      paymentId: 'pay_test',
    });
    expect(result.verified).toBe(true);
    expect(worker.getOrder).toHaveBeenCalled();
    expect(sso.activateAddonPurchase).toHaveBeenCalledOnce();
  });
  it.each([null, [], {}, false])(
    'rejects malformed checkout bodies without side effects: %j',
    async (body) => {
      expect((await handleVerifyAddonPayment(context(body))).status).toBe(400);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it('resumes an unpaid checkout without creating another gateway order', async () => {
    sso.getPendingAddonPurchase.mockResolvedValue({
      id: 'checkout-1',
      billing_period: 'monthly',
      amount_minor: 37100,
      currency: 'INR',
      interval_months: 1,
      razorpay_order_id: 'order_test',
      razorpay_payment_id: null,
    });
    const response = await handleCreateAddonOrder(
      context({ feature_key: 'future_feature', billing_period: 'monthly' }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data.resumed).toBe(true);
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
  it('recovers a gateway order whose database bind was interrupted', async () => {
    sso.getPendingAddonPurchase.mockResolvedValue({
      id: 'checkout-1',
      billing_period: 'monthly',
      amount_minor: 37100,
      currency: 'INR',
      interval_months: 1,
      razorpay_order_id: null,
      razorpay_payment_id: null,
    });
    expect(
      (
        await handleCreateAddonOrder(
          context({
            feature_key: 'future_feature',
            billing_period: 'monthly',
          }),
        )
      ).status,
    ).toBe(200);
    expect(worker.getOrdersByReceipt).toHaveBeenCalledWith('checkout-1');
    expect(sso.bindAddonOrder).toHaveBeenCalledWith('checkout-1', 'order_test');
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
  it('does not create a second order when another checkout reservation wins', async () => {
    sso.prepareAddonCheckout.mockResolvedValue({
      id: 'checkout-other',
      checkout_created: false,
    });
    expect(
      (
        await handleCreateAddonOrder(
          context({
            feature_key: 'future_feature',
            billing_period: 'monthly',
          }),
        )
      ).status,
    ).toBe(409);
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
  it('honors the database repeat-purchase policy', async () => {
    sso.getActiveAddonPurchase.mockResolvedValue({ id: 'active-purchase' });
    expect(
      (
        await handleCreateAddonOrder(
          context({
            feature_key: 'future_feature',
            billing_period: 'monthly',
          }),
        )
      ).status,
    ).toBe(409);
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
  it('rejects partial refunds before grants', async () => {
    worker.getPayment.mockResolvedValue({
      ...(await worker.getPayment()),
      amount_refunded: 100,
    });
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      409,
    );
    expect(sso.recordAddonPurchase).not.toHaveBeenCalled();
  });
  it('requires a nonempty checkout signature', async () => {
    expect(
      (
        await handleVerifyAddonPayment(
          context({ ...verifyBody, razorpay_signature: '' }),
        )
      ).status,
    ).toBe(400);
    expect(sso.recordAddonPurchase).not.toHaveBeenCalled();
  });
  it('reconciles a captured legacy order only against matching database terms', async () => {
    const order = await worker.getOrder();
    delete order.notes.purchase_id;
    worker.getOrder.mockResolvedValue(order);
    expect(
      (
        await handleReconcileAddonPayment(
          context({ razorpay_order_id: 'order_test' }),
        )
      ).status,
    ).toBe(200);
    expect(sso.getAddonByFeatureKey).toHaveBeenCalledWith('future_feature');
  });
  it('uses the purchase snapshot when replaying a legacy order after catalog changes', async () => {
    const order = await worker.getOrder();
    delete order.notes.purchase_id;
    worker.getOrder.mockResolvedValue(order);
    sso.getRecordedAddonPurchase.mockResolvedValue({
      id: 'checkout-1',
      user_id: 'buyer-1',
      addon_id: 'catalog-1',
      feature_key: 'future_feature',
      target_roles: ['learner'],
      offer,
    });
    sso.getAddonByFeatureKey.mockRejectedValue(
      new Error('Catalog has changed'),
    );
    expect(
      (
        await handleReconcileAddonPayment(
          context({ razorpay_order_id: 'order_test' }),
        )
      ).status,
    ).toBe(200);
    expect(sso.getAddonByFeatureKey).not.toHaveBeenCalled();
  });
  it('classifies real worker signature rejections as permanent validation errors', async () => {
    worker.verifyPaymentSignature.mockRejectedValue(
      new Error('UNAUTHORIZED: Payment signature verification failed'),
    );
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      400,
    );
    expect(sso.recordAddonPurchase).not.toHaveBeenCalled();
  });
  it('rejects unavailable catalog products without a gateway order', async () => {
    sso.getAddonByFeatureKey.mockRejectedValue(new Error('Addon not found'));
    expect(
      (
        await handleCreateAddonOrder(
          context({ feature_key: 'unknown', billing_period: 'monthly' }),
        )
      ).status,
    ).toBe(404);
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
  it('does not blindly re-grant capacity whose legacy fulfilment marker is ambiguous', async () => {
    mocks.rpc.mockResolvedValueOnce({
      error: { message: 'LEGACY_NUMERIC_RECONCILIATION_REQUIRED' },
    });
    expect((await handleVerifyAddonPayment(context(verifyBody))).status).toBe(
      409,
    );
    expect(sso.activateAddonPurchase).not.toHaveBeenCalled();
    expect(worker.createOrder).not.toHaveBeenCalled();
  });
});
