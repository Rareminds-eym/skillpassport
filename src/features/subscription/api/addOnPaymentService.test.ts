import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addOnPaymentService } from './addOnPaymentService';
const f = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: f.fetch } }));
beforeEach(() => vi.clearAllMocks());
describe('add-on verification transport', () => {
  it('does not retry a permanent validation failure', async () => {
    f.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'ORDER_TERMS_MISMATCH', message: 'Terms differ' },
        }),
        { status: 400 },
      ),
    );
    const result = await addOnPaymentService.verifyAddonPayment(
      'order',
      'pay',
      'signature',
      'db_feature',
      1,
      'quarterly',
      3,
    );
    expect(result.success).toBe(false);
    expect(f.fetch).toHaveBeenCalledOnce();
    const payload = JSON.parse(f.fetch.mock.calls[0][1].body);
    expect(payload).not.toHaveProperty('amount');
  });
  it('requires an explicit verified acknowledgement even on HTTP 200', async () => {
    f.fetch.mockResolvedValue(
      new Response(JSON.stringify({ data: { verified: false } }), {
        status: 200,
      }),
    );
    expect(
      (await addOnPaymentService.reconcileAddonPayment('order')).success,
    ).toBe(false);
    expect(f.fetch).toHaveBeenCalledOnce();
  });
  it('sends recovery order references without storing callback signatures', async () => {
    f.fetch.mockResolvedValue(
      new Response(JSON.stringify({ data: { verified: true } }), {
        status: 200,
      }),
    );
    expect(
      (await addOnPaymentService.reconcileAddonPayment('order_existing'))
        .success,
    ).toBe(true);
    expect(f.fetch.mock.calls[0][0]).toContain('/reconcile-addon-payment');
    expect(JSON.parse(f.fetch.mock.calls[0][1].body)).toEqual({
      razorpay_order_id: 'order_existing',
    });
  });
});
