// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
const request = vi.hoisted(() => vi.fn());
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: request } }));
import { verifyPayment } from './paymentsApiService';
const details = { razorpay_order_id: 'existing-order', razorpay_payment_id: 'existing-payment', razorpay_signature: 'signature', plan: { id: 'plan' } };
afterEach(() => { vi.unstubAllGlobals(); request.mockReset(); });
function configure(body: unknown, status = 200) {
  vi.stubGlobal('window', { location: { origin: 'https://example.test' } });
  request.mockResolvedValue(Response.json(body, { status }));
}
it('passes the verified activation payload to the success page without the API envelope', async () => {
  configure({ success: true, data: { subscription_created: true, subscription: { id: 'contract', status: 'active' } } });
  await expect(verifyPayment(details)).resolves.toEqual({ subscription_created: true, subscription: { id: 'contract', status: 'active' } });
});
it('supports an already-fulfilled payment response', async () => {
  configure({ success: true, data: { subscription_created: true, already_fulfilled: true } });
  await expect(verifyPayment(details)).resolves.toMatchObject({ already_fulfilled: true });
});
it('verification retries reuse the original payment and never create a checkout', async () => {
  configure({ error: { message: 'Activation is pending' } }, 503);
  await expect(verifyPayment(details)).rejects.toThrow('Activation is pending');
  request.mockResolvedValueOnce(Response.json({ success: true, data: { already_fulfilled: true } }));
  await verifyPayment(details);
  expect(request).toHaveBeenCalledTimes(2);
  for (const [url, options] of request.mock.calls) {
    expect(url).toBe('https://example.test/api/payments/verify-payment');
    expect(JSON.parse(options.body)).toEqual(details);
  }
});
it('does not treat an unsuccessful envelope as verification success', async () => {
  configure({ success: false, error: { message: 'Not activated' } });
  await expect(verifyPayment(details)).rejects.toThrow('Not activated');
});
