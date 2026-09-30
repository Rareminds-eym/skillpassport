// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ client: vi.fn(), worker: vi.fn(), freemium: vi.fn(), createSubscription: vi.fn(), updateSubscription: vi.fn() }));
vi.mock('../lib/supabase', () => ({ getServiceClient: mocks.client }));
vi.mock('../lib/auth', () => ({
  getAuthInstance: vi.fn(), withAuth: vi.fn(), getContextUser: () => ({ id: 'admin-1', email: 'admin@example.edu' }),
}));
vi.mock('../api/payments/lib/paymentBinding', () => ({
  getPaymentWorker: mocks.worker, rpcErrorResponse: () => new Response(null, { status: 500 }),
}));
vi.mock('../lib/sso-client', () => ({
  ssoCreateFreemiumSubscription: mocks.freemium, ssoSyncSubscription: vi.fn(),
  ssoCreateSubscription: mocks.createSubscription, ssoUpdateSubscriptionField: mocks.updateSubscription,
  ssoRecordTransaction: vi.fn(), ssoUpdateTransaction: vi.fn(), ssoRecordAddonPurchase: vi.fn(), ssoRecordBundlePurchase: vi.fn(),
}));
vi.mock('../lib/sync-shadow', () => ({ syncSubscriptionCache: vi.fn(), syncUserShadow: vi.fn() }));

import { handleSubscriptionPlans, transformPlan } from '../api/payments/handlers/subscription-plans';
import { handleCreateOrder } from '../api/payments/handlers/create-order';
import { handleCreateOrgOrder } from '../api/payments/handlers/create-org-order';
import { handleOrgSubscriptionsPurchase } from '../api/payments/handlers/org-subscriptions-purchase';
import { handleVerifyOrgPayment } from '../api/payments/handlers/verify-org-payment';
import { handleVerifyPayment } from '../api/payments/handlers/verify-payment';
import { fulfillOrgSubscription, fulfillLearnerSubscription } from '../api/payments/lib/fulfillment-core';
import { requireSelfServePlan } from '../api/payments/lib/salesPlan';

const rawPlan = {
  id: 'a0000000-0000-4000-8000-000000000040', plan_code: 'hybrid', name: 'Hybrid',
  business_type: 'b2b', base_features: [], pricing_matrix: {},
  entity_config: { all: {
    purchase_mode: 'contact_sales', sales_email: 'sales@example.edu',
    sales_highlights: ['Custom assessments', 'Agreed capacity'], price_label: 'By proposal',
    description: 'Configured for your institution',
  } },
};

function query(data: unknown) {
  const result = { data, error: null };
  const chain: any = { ...result, then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) };
  for (const key of ['select', 'eq', 'in', 'overlaps', 'order', 'limit']) chain[key] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => result);
  return chain;
}

beforeEach(() => { vi.clearAllMocks(); });

describe('Database-backed sales catalog', () => {
  it('preserves negotiated pricing as null and separates marketing highlights from entitlements', () => {
    const plan = transformPlan(rawPlan, 'school');
    expect(plan).toMatchObject({
      contactSales: true, price: null, yearlyPrice: null, max_users: null,
      salesEmail: 'sales@example.edu', priceLabel: 'By proposal',
      salesHighlights: ['Custom assessments', 'Agreed capacity'], features: [], base_features: [],
    });
  });

  it('preserves standard plan pricing', () => {
    expect(transformPlan({ ...rawPlan, entity_config: {}, pricing_matrix: { all: { yearly: 4999 } } }, 'school'))
      .toMatchObject({ contactSales: false, price: 4999, yearlyPrice: 4999 });
  });

  it('returns no synthetic Hybrid when the active catalog is empty', async () => {
    const plansQuery = query([]);
    mocks.client.mockReturnValue({ from: () => plansQuery });
    const response = await handleSubscriptionPlans({ request: new Request('https://example.test/api/payments/subscription-plans?businessType=b2b&entityType=college'), env: {} });
    expect((await response.json()).data.plans).toEqual([]);
    expect(plansQuery.eq).toHaveBeenCalledWith('is_active', true);
    expect(plansQuery.overlaps).toHaveBeenCalledWith('applicable_entities', ['college', 'all']);
  });

  it('returns the database content through the catalog API', async () => {
    mocks.client.mockReturnValue({ from: (table: string) => query(table === 'plans_cache' ? [rawPlan] : []) });
    const response = await handleSubscriptionPlans({ request: new Request('https://example.test/api/payments/subscription-plans?businessType=b2b&entityType=university'), env: {} });
    expect((await response.json()).data.plans).toEqual([expect.objectContaining({ id: rawPlan.id, price: null, contactSales: true, salesEmail: 'sales@example.edu' })]);
  });
});

describe('Sales-only checkout enforcement', () => {
  it.each([
    ['alternate organization purchase', handleOrgSubscriptionsPurchase],
    ['organization payment verification', handleVerifyOrgPayment],
  ])('rejects Hybrid in %s before side effects', async (_name, handler) => {
    mocks.client.mockReturnValue({ from: (table: string) => query(table === 'license_assignments' ? { role: 'admin' } : rawPlan) });
    const response = await handler({ request: new Request('https://example.test/api/payments/test', {
      method: 'POST', body: JSON.stringify({ amount: 99900, org_id: 'org-1', plan_id: rawPlan.id, plan_name: 'Starter', seat_count: 10,
        razorpay_order_id: 'order-1', razorpay_payment_id: 'payment-1', razorpay_signature: 'signature-1' }),
    }), env: {} } as any);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('CONTACT_SALES_REQUIRED');
    expect(mocks.worker).not.toHaveBeenCalled();
    expect(mocks.createSubscription).not.toHaveBeenCalled();
  });

  it('rejects Hybrid at payment verification even with a captured payment and spoofed standard pricing', async () => {
    mocks.client.mockReturnValue({ from: () => query({ ...rawPlan, pricing_matrix: { all: { yearly: 999 } } }) });
    mocks.worker.mockReturnValue({
      verifyPaymentSignature: vi.fn(async () => ({ success: true })),
      getPayment: vi.fn(async () => ({ status: 'captured', order_id: 'order-1', amount: 99900, currency: 'INR' })),
    });
    const response = await handleVerifyPayment({ request: new Request('https://example.test/api/payments/verify-payment', {
      method: 'POST', body: JSON.stringify({ razorpay_order_id: 'order-1', razorpay_payment_id: 'payment-1', razorpay_signature: 'signature-1',
        plan: { id: rawPlan.id, name: 'Starter', price: 999, duration: 'yearly' } }),
    }), env: {} } as any);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('CONTACT_SALES_REQUIRED');
    expect(mocks.createSubscription).not.toHaveBeenCalled();
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
  });

  it.each([fulfillOrgSubscription, fulfillLearnerSubscription])('rejects Hybrid in webhook fulfillment before activation or upgrade', async fulfill => {
    mocks.client.mockReturnValue({ from: () => query(rawPlan) });
    await expect(fulfill({} as any, { user_id: 'admin-1', org_id: 'org-1', plan_id: rawPlan.id, plan_code: 'starter', plan_name: 'Starter' } as any))
      .rejects.toMatchObject({ code: 'CONTACT_SALES_REQUIRED' });
    expect(mocks.createSubscription).not.toHaveBeenCalled();
    expect(mocks.updateSubscription).not.toHaveBeenCalled();
  });

  it('fails closed when a catalog lookup fails', async () => {
    const chain = query(null);
    chain.maybeSingle = async () => ({ data: null, error: { message: 'Unavailable' } });
    const client = { from: () => chain };
    await expect(requireSelfServePlan(client as any, { plan_id: rawPlan.id })).rejects.toMatchObject({ code: 'CATALOG_UNAVAILABLE' });
  });

  it('continues to create orders for a standard plan at its catalog price', async () => {
    const standardPlan = { ...rawPlan, plan_code: 'school_starter', name: 'Starter', entity_config: {}, pricing_matrix: { school: { yearly: 4999 } } };
    mocks.client.mockReturnValue({ from: (table: string) => query(table === 'users' ? { role: 'school_admin' } : standardPlan) });
    const createOrder = vi.fn(async () => ({ id: 'order-1', key_id: 'test-key' }));
    mocks.worker.mockReturnValue({ createOrder });
    const response = await handleCreateOrder({ request: new Request('https://example.test/api/payments/create-order', {
      method: 'POST', body: JSON.stringify({ amount: 499900, planId: rawPlan.id }),
    }), env: {} } as any);
    expect(response.status).toBe(200);
    expect(createOrder).toHaveBeenCalledOnce();
  });

  it.each([0, 99900])('rejects direct checkout with amount %s before creating a subscription or order', async amount => {
    mocks.client.mockReturnValue({ from: () => query(rawPlan) });
    const response = await handleCreateOrder({ request: new Request('https://example.test/api/payments/create-order', {
      method: 'POST', body: JSON.stringify({ amount, planId: rawPlan.id }),
    }), env: {} } as any);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('CONTACT_SALES_REQUIRED');
    expect(mocks.freemium).not.toHaveBeenCalled();
    expect(mocks.worker).not.toHaveBeenCalled();
  });

  it('rejects organization checkout using database metadata even when the client spoofs the name', async () => {
    mocks.client.mockReturnValue({ from: (table: string) => query(table === 'license_assignments' ? { role: 'admin' } : rawPlan) });
    const response = await handleCreateOrgOrder({ request: new Request('https://example.test/api/payments/create-org-order', {
      method: 'POST', body: JSON.stringify({ amount: 99900, org_id: 'org-1', plan_id: rawPlan.id, plan_name: 'Starter', seat_count: 10 }),
    }), env: {} } as any);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('CONTACT_SALES_REQUIRED');
    expect(mocks.worker).not.toHaveBeenCalled();
  });
});
