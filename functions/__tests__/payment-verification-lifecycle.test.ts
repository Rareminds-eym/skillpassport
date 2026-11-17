// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ signature: vi.fn(), payment: vi.fn(), order: vi.fn(), fulfill: vi.fn(), read: vi.fn(), scope: vi.fn(), catalog: vi.fn(), allocate: vi.fn(), user: { id: 'buyer', email: 'buyer@example.invalid', roles: ['learner'], org_id: undefined as string | undefined } }));
vi.mock('@/../functions/lib/auth', () => ({ getContextUser: () => f.user }));
vi.mock('@/../functions/lib/logger', () => ({ createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }) }));
vi.mock('@/../functions/lib/email-service', () => ({ sendEmailSafe: vi.fn() }));
vi.mock('@/../functions/lib/sso-client', () => ({ ssoFulfillSubscriptionPayment: f.fulfill, ssoGetSubscriptionPaymentFulfillment: f.read, ssoUpdateSubscriptionField: vi.fn(), ssoRecordTransaction: vi.fn(), ssoSyncSubscription: vi.fn(), ssoUpdateTransaction: vi.fn() }));
vi.mock('@/../functions/lib/sync-shadow', () => ({ syncSubscriptionCache: vi.fn(), syncUserShadow: vi.fn() }));
vi.mock('@/../functions/api/email/services/templates', () => ({ generateUserConfirmationHtml: vi.fn(), getUserConfirmationSubject: vi.fn() }));
vi.mock('@/../functions/api/storage/utils/pdf-generator', () => ({ fetchImageBytes: vi.fn(), generateReceiptPDF: vi.fn() }));
vi.mock('@/../functions/api/storage/utils/r2-client', () => ({ R2Client: vi.fn() }));
vi.mock('@/../functions/shared/lib/org-subscription', () => ({ completePlanSelection: vi.fn() }));
vi.mock('@/../functions/api/payments/lib/salesPlan', () => ({ requireSelfServePlan: f.catalog, assertPlanPurchaseScope: f.scope, catalogPlanErrorResponse: () => null }));
vi.mock('@/../functions/api/payments/lib/paymentBinding', () => ({ getPaymentWorker: () => ({ verifyPaymentSignature: f.signature, getPayment: f.payment, getOrder: f.order }), rpcErrorResponse: () => new Response(null, { status: 422 }) }));
vi.mock('@/../functions/lib/supabase', () => ({ getServiceClient: () => ({ from(table: string) {
  const plan = { id: 'plan', name: 'Mock', plan_code: 'mock', pricing_matrix: { all: { yearly: 4999 } }, business_type: 'b2c' };
  type Query = { select: () => Query; eq: () => Query; maybeSingle: () => Promise<{ data: typeof plan | null }>; single: () => Promise<{ data: typeof plan | null }> };
  const q: Query = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: table === 'plans_cache' ? plan : null }), single: async () => ({ data: table === 'plans_cache' ? plan : null }) }; return q;
} }) }));
vi.mock('@/../functions/shared/lib/entitlement-service', () => ({ allocateInitialPlanCredits: f.allocate }));
import { handleVerifyPayment } from '../api/payments/handlers/verify-payment';
import { fulfillLearnerSubscription } from '../api/payments/lib/fulfillment-core';
function request() { return handleVerifyPayment({ env: {}, request: new Request('https://example.test/api/payments/verify-payment', { method: 'POST', body: JSON.stringify({ razorpay_order_id: 'order', razorpay_payment_id: 'pay', razorpay_signature: 'synthetic-proof', plan: { id: 'plan', name: 'Mock', price: 4999, duration: 'yearly' } }) }) } as unknown as Parameters<typeof handleVerifyPayment>[0]); }

const subscription = { id: 'sub', user_id: 'buyer', plan_id: 'plan', status: 'active', plan_type: 'Mock', billing_cycle: 'yearly', razorpay_payment_id: 'pay' };
beforeEach(() => {
  vi.clearAllMocks(); f.signature.mockResolvedValue({ verified: true });
  f.user.org_id = undefined; f.user.roles = ['learner'];
  f.payment.mockResolvedValue({ status: 'captured', order_id: 'order', amount: 499900, currency: 'INR' });
  f.order.mockResolvedValue({ id: 'order', amount: 499900, currency: 'INR', notes: { user_id: 'buyer', plan_id: 'plan', org_id: '', organization_type: '', type: 'subscription' } });
  f.scope.mockResolvedValue({}); f.read.mockResolvedValue(null);
  f.catalog.mockResolvedValue({ id: 'plan', name: 'Mock', plan_code: 'mock', pricing_matrix: { all: { yearly: 4999 } }, business_type: 'b2c' });
  f.allocate.mockResolvedValue({ success: true });
  f.fulfill.mockResolvedValue({ subscription, transaction_id: 'tx', already_fulfilled: true, is_upgrade: false });
});
it('fulfills a correctly bound payment through the atomic SSO contract', async () => {
  expect((await request()).status).toBe(200);
  expect(f.fulfill).toHaveBeenCalledExactlyOnceWith(expect.anything(), expect.objectContaining({ user_id: 'buyer', plan_id: 'plan', amount: 4999, billing_cycle: 'yearly' }));
  expect(f.order).toHaveBeenCalledExactlyOnceWith('order');
});
it('completes the fresh-payment response after one atomic activation', async () => {
  f.fulfill.mockResolvedValue({ subscription, transaction_id: 'tx', already_fulfilled: false, is_upgrade: false });
  const response = await request();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ data: { subscription_created: true, subscription: { id: 'sub', status: 'active' } } });
  expect(f.fulfill).toHaveBeenCalledOnce();
});
it('accepts a correctly bound organization payment with catalog seat capacity', async () => {
  f.user.org_id = 'org'; f.user.roles = ['college_admin'];
  f.scope.mockResolvedValue({ organizationId: 'org', organizationType: 'college' });
  f.catalog.mockResolvedValue({ id: 'plan', name: 'Mock', plan_code: 'mock', pricing_matrix: { college: { yearly: 4999 } }, business_type: 'b2b', entity_config: { college: { max_users: 500 } } });
  f.order.mockResolvedValue({ id: 'order', amount: 499900, currency: 'INR', notes: { user_id: 'buyer', plan_id: 'plan', org_id: 'org', organization_type: 'college', type: 'subscription' } });
  expect((await request()).status).toBe(200);
  expect(f.fulfill).toHaveBeenCalledExactlyOnceWith(expect.anything(), expect.objectContaining({ organization_id: 'org', organization_type: 'college', seat_count: 500 }));
});
it.each([{ user_id: 'other_buyer' }, { plan_id: 'other_plan' }, { org_id: 'other_org' }, { type: 'addon' }, { organization_type: 'college' }, { org_id: undefined }])('rejects invalid or missing order notes before activation (%j)', async change => {
  const base = await f.order(); f.order.mockClear(); f.order.mockResolvedValue({ ...base, notes: { ...base.notes, ...change } });
  expect((await request()).status).toBe(400); expect(f.fulfill).not.toHaveBeenCalled();
});
it.each([{ amount: 1 }, { currency: 'USD' }, { id: 'other_order' }])('rejects mismatched provider order terms (%j)', async change => {
  const base = await f.order(); f.order.mockClear(); f.order.mockResolvedValue({ ...base, ...change });
  expect((await request()).status).toBe(400); expect(f.fulfill).not.toHaveBeenCalled();
});
it('uses durable fulfillment before consulting current catalog or cached plan pricing', async () => {
  f.read.mockResolvedValue({ subscription: { ...subscription, plan_id: 'later_plan', razorpay_payment_id: 'later_payment' }, transaction_id: 'tx', already_fulfilled: true, is_upgrade: false });
  const response = await request(); expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ data: { already_fulfilled: true, subscription: { plan_id: 'later_plan' } } });
  expect(f.catalog).not.toHaveBeenCalled(); expect(f.fulfill).not.toHaveBeenCalled(); expect(f.allocate).not.toHaveBeenCalled();
});
it('does not activate when the durable fulfillment lookup is unavailable', async () => {
  f.read.mockRejectedValue(new Error('Database unavailable'));
  expect((await request()).status).toBe(422); expect(f.fulfill).not.toHaveBeenCalled();
});
it('uses the same atomic fulfillment owner for captured-payment webhooks', async () => {
  const payload = { user_id: 'buyer', plan_id: 'plan', plan_name: 'Mock', plan_code: 'mock', amount: 4999,
    razorpay_order_id: 'order', razorpay_payment_id: 'pay', user_email: 'buyer@example.invalid' };
  await expect(fulfillLearnerSubscription({} as Parameters<typeof fulfillLearnerSubscription>[0], payload)).resolves.toMatchObject({ already_fulfilled: true });
  expect(f.fulfill).toHaveBeenCalledOnce();
  f.read.mockResolvedValue({ subscription, transaction_id: 'tx', already_fulfilled: true, is_upgrade: false });
  await expect(fulfillLearnerSubscription({} as Parameters<typeof fulfillLearnerSubscription>[0], payload)).resolves.toMatchObject({ already_fulfilled: true });
  expect(f.fulfill).toHaveBeenCalledOnce();
});
it('rejects a signature RPC failure before considering subscription writes', async () => {
  f.signature.mockRejectedValueOnce(new Error('UNAUTHORIZED: invalid proof'));
  expect((await request()).status).toBe(422); expect(f.payment).not.toHaveBeenCalled(); expect(f.fulfill).not.toHaveBeenCalled();
});
it.each([{ currency: 'USD' }, { amount: 1 }, { status: 'authorized' }, { order_id: 'another_order' }])('retains authoritative captured-payment validation (%j)', async change => {
  f.payment.mockResolvedValue({ status: 'captured', order_id: 'order', amount: 499900, currency: 'INR', ...change });
  expect((await request()).status).toBe(400); expect(f.fulfill).not.toHaveBeenCalled();
});
