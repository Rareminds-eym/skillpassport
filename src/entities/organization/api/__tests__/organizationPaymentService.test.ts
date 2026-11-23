import { beforeEach, expect, it, vi } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: request } }));
vi.mock('@/shared/config', () => ({ getRazorpayKeyId: vi.fn(), getRazorpayKeyMode: vi.fn() }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ error: vi.fn() }) }));
import { createOrganizationOrder, verifyOrganizationPayment, purchaseOrganizationSubscription, type OrganizationPurchaseData } from '../organizationPaymentService';
const purchase = { organizationId: 'org', organizationType: 'college', planId: 'plan', planName: 'Self serve', seatCount: 3, billingCycle: 'annual', pricing: { finalAmount: 100 } } as OrganizationPurchaseData;
beforeEach(() => { request.mockReset(); request.mockResolvedValue(Response.json({ success: true, data: { id: 'synthetic-order' } })); });
it.each([createOrganizationOrder, purchaseOrganizationSubscription])('org order sends the canonical server contract', async call => {
  await call(purchase); const body=JSON.parse(request.mock.calls[0][1].body);
  expect(body).toMatchObject({ org_id: 'org', org_type: 'college', plan_id: 'plan', plan_name: 'Self serve', seat_count: 3, billing_cycle: 'annual', amount: 10000 });
  expect(body).not.toHaveProperty('organizationId'); expect(body).not.toHaveProperty('seatCount');
});
it('verification sends top-level catalog/seat data beside the provider signature', async () => {
  await verifyOrganizationPayment({ razorpay_order_id: 'order', razorpay_payment_id: 'payment', razorpay_signature: 'synthetic-signature', purchaseData: purchase });
  const body=JSON.parse(request.mock.calls[0][1].body);
  expect(body).toMatchObject({ org_id: 'org', plan_name: 'Self serve', seat_count: 3, billing_cycle: 'annual', razorpay_order_id: 'order' });
  expect(body).not.toHaveProperty('purchaseData');
});
it('order failure remains an error', async () => {
  request.mockResolvedValue(Response.json({ error: { message: 'Seat purchase rejected' } }, { status: 400 }));
  await expect(createOrganizationOrder(purchase)).rejects.toThrow('Seat purchase rejected');
});
