import { expect, it, vi } from 'vitest';
vi.mock('./paymentsApiService', () => ({ default: { verifyPayment: vi.fn() } }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ error: vi.fn() }) }));
import { logFailedTransaction } from './paymentVerificationService';
it('does not claim a diagnostic was stored without a configured persistence path', async () => {
  await expect(logFailedTransaction({ razorpay_order_id: 'order_mock' })).resolves.toEqual({ success: false, logged: false, error: 'Payment failure persistence is not configured' });
});
it('does not report invalid diagnostics as stored', async () => {
  await expect(logFailedTransaction(null)).resolves.toMatchObject({ success: false, logged: false });
});
