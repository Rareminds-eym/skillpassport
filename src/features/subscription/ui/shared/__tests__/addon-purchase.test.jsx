import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureGate } from '../FeatureGate';
const f = vi.hoisted(() => ({
  gate: vi.fn(),
  create: vi.fn(),
  verify: vi.fn(),
  recover: vi.fn(),
  refresh: vi.fn(),
  entitlements: vi.fn(),
  callback: null,
  open: vi.fn(),
}));
vi.mock('../../../model/useFeatureGate', () => ({
  useFeatureGate: f.gate,
  clearFeatureAccessCache: vi.fn(),
}));
vi.mock('../../../model/subscriptionStore', () => ({
  useSubscription: () => ({
    purchaseAddOn: f.create,
    isPurchasing: false,
    refreshAccess: f.refresh,
    fetchUserEntitlements: f.entitlements,
  }),
}));
vi.mock('../../../api/razorpayService', () => ({
  loadRazorpayScript: vi.fn(async () => true),
}));
vi.mock('../../../api/addOnPaymentService', () => ({
  addOnPaymentService: {
    verifyAddonPayment: f.verify,
    reconcileAddonPayment: f.recover,
  },
}));
vi.mock('@/shared/model/authStore', () => ({
  useUser: () => ({ id: 'buyer' }),
}));
const addon = {
  feature_key: 'db_feature',
  feature_name: 'Database Feature',
  description: 'Database description',
  benefits: ['Catalog-exclusive benefit'],
  billing_options: [
    {
      id: 'offer-1',
      billing_period: 'quarterly',
      display_name: 'Every three months',
      amount_minor: 37100,
      minor_unit: 2,
      currency: 'INR',
    },
  ],
};
const show = () =>
  render(
    <MemoryRouter>
      <FeatureGate featureKey="db_feature" embedded>
        <p>Granted content</p>
      </FeatureGate>
    </MemoryRouter>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  f.gate.mockReturnValue({
    hasAccess: false,
    isLoading: false,
    requiredAddOn: addon,
  });
  f.create.mockResolvedValue({
    success: true,
    data: {
      orderId: 'order_existing',
      amount: 37100,
      currency: 'INR',
      razorpayKeyId: 'test-key',
    },
  });
  f.verify.mockResolvedValue({ success: false, error: 'Activation pending' });
  f.recover.mockResolvedValue({ success: true });
  f.refresh.mockResolvedValue(undefined);
  f.entitlements.mockResolvedValue(undefined);
  window.Razorpay = vi.fn(function (options) {
    f.callback = options.handler;
    return { open: f.open, on: vi.fn() };
  });
});
describe('database-backed purchase and recovery', () => {
  it('renders DB benefit and billing labels without invented plan benefits', async () => {
    show();
    await userEvent.click(
      screen.getByRole('button', { name: 'View purchase options' }),
    );
    const modal = within(screen.getByRole('dialog'));
    expect(modal.getByText('Every three months')).toBeInTheDocument();
    expect(modal.getByText('Catalog-exclusive benefit')).toBeInTheDocument();
    expect(modal.queryByText('Priority support')).not.toBeInTheDocument();
    expect(modal.queryByText('Cancel anytime')).not.toBeInTheDocument();
  });
  it('retries the captured order without creating another checkout, including after reopening', async () => {
    show();
    await userEvent.click(
      screen.getByRole('button', { name: 'View purchase options' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Purchase', exact: true }),
    );
    expect(f.create).toHaveBeenCalledWith('db_feature', 'quarterly');
    expect(f.open).toHaveBeenCalledOnce();
    await act(async () => {
      await f.callback({
        razorpay_order_id: 'order_existing',
        razorpay_payment_id: 'pay_existing',
        razorpay_signature: 'private-proof',
      });
    });
    expect(
      screen.getByRole('button', { name: 'Retry verification' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Purchase', exact: true }),
    ).not.toBeInTheDocument();
    expect(sessionStorage.getItem('pending-addon-order:buyer:db_feature')).toBe(
      'order_existing',
    );
    expect(JSON.stringify(sessionStorage)).not.toContain('private-proof');
    await userEvent.click(
      screen.getByRole('button', { name: 'Close purchase dialog' }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'View purchase options' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Retry verification' }),
    );
    expect(f.recover).toHaveBeenCalledWith('order_existing');
    expect(f.create).toHaveBeenCalledOnce();
    expect(f.open).toHaveBeenCalledOnce();
    expect(
      sessionStorage.getItem('pending-addon-order:buyer:db_feature'),
    ).toBeNull();
  });
  it('offers reconciliation when the server detects an earlier captured purchase', async () => {
    f.create.mockResolvedValue({
      success: false,
      error: 'Previous activation pending',
      recoveryOrderId: 'order_old',
    });
    show();
    await userEvent.click(
      screen.getByRole('button', { name: 'View purchase options' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Purchase', exact: true }),
    );
    expect(
      screen.getByRole('button', { name: 'Retry verification' }),
    ).toBeVisible();
    expect(f.open).not.toHaveBeenCalled();
  });
  it('continues verification and in-memory recovery when browser storage is blocked', async () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
    try {
      show();
      await userEvent.click(
        screen.getByRole('button', { name: 'View purchase options' }),
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Purchase', exact: true }),
      );
      await act(async () => {
        await f.callback({
          razorpay_order_id: 'order_existing',
          razorpay_payment_id: 'pay_existing',
          razorpay_signature: 'private-proof',
        });
      });
      expect(f.verify).toHaveBeenCalledOnce();
      expect(
        screen.getByRole('button', { name: 'Retry verification' }),
      ).toBeVisible();
      await userEvent.click(
        screen.getByRole('button', { name: 'Retry verification' }),
      );
      expect(f.recover).toHaveBeenCalledWith('order_existing');
      expect(f.open).toHaveBeenCalledOnce();
    } finally {
      spy.mockRestore();
    }
  });
});
