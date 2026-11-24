import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addOnCostSummary, formatManagementPrice, managementPaymentLabel, monthlyPlanCost } from '../lib/subscriptionPresentation';

const io = vi.hoisted(() => ({ entitlementRead: vi.fn(), entitlementCancel: vi.fn(), payments: vi.fn(), receipt: vi.fn(), usage: vi.fn(), role: 'learner',
  management: null, addons: null, fetchAddons: vi.fn(), toggle: vi.fn(), cancel: vi.fn(), user: { id: 'synthetic-actor', email: 'synthetic@example.invalid' } }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => io.user, useUserRole: () => ({ role: io.role }),
  useAuthLoading: () => false, useAuthStore: { getState: () => ({ user: io.user }) } }));
vi.mock('@/features/auth/lib/roleBasedRouter', () => ({ getRouteForRole: role => role === 'recruiter' ? '/recruitment/overview' : '/learner/dashboard' }));
vi.mock('@/entities/learner', () => ({ useLearnerDataByEmail: () => ({ learnerData: null, loading: false }) }));
vi.mock('../model/useSubscriptionManagement', () => ({ useSubscriptionManagement: () => io.management }));
vi.mock('../model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ subscriptionData: null }) }));
vi.mock('../model/subscriptionStore', () => ({ useSubscription: () => ({ ...io.addons, fetchUserEntitlements: io.fetchAddons, cancelAddOn: io.cancel }) }));
vi.mock('../api/subscriptionService', () => ({ getUserPayments: io.payments }));
vi.mock('../api/paymentsApiService', () => ({ deactivateSubscription: vi.fn(), pauseSubscription: vi.fn(), resumeSubscription: vi.fn() }));
vi.mock('@/shared/api', () => ({ getPaymentReceiptPresignedUrl: io.receipt }));
vi.mock('../api/entitlementService', () => ({ entitlementService: { getUserEntitlements: io.entitlementRead, cancelAddOn: io.entitlementCancel, toggleAutoRenew: io.toggle } }));
vi.mock('@/features/subscription', () => ({ entitlementService: { toggleAutoRenew: io.toggle } }));
vi.mock('../ui/individual/SubscriptionOwnerActions', () => ({ default: () => null, SubscriptionOwnerUsage: () => <p>Owner usage</p> }));
vi.mock('@/features/analytics/api/usageStatisticsService', () => ({ default: {
  getUserUsageStatistics: io.usage,
  getSubscriptionLimits: () => ({}), combineUsageWithLimits: () => ({
    assessments: { used: 0, total: 2 }, profileViews: { used: 0, total: 2 }, reports: { used: 0, total: 2 },
  }),
} }));
import MySubscription from '../ui/individual/MySubscription';
import SubscriptionDashboard from '../ui/individual/SubscriptionDashboard';

const plan = () => ({ id: 'synthetic-subscription', planName: 'Discover', planPrice: 0, billingCycle: 'free',
  status: 'active', autoRenew: false, startDate: '2026-01-01', endDate: null, features: ['A benefit'] });
function Location() { return <output aria-label="route">{useLocation().pathname}</output>; }
function show(node = <MySubscription />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/subscription/manage']}>{node}<Location /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks(); io.role = 'learner';
  io.management = { subscriptionData: plan(), loading: false, modern: true, hasAccess: true,
    owner: { status: 'ready', current: { access: 'full', state: { validity: 'perpetual' } } }, subscriptions: [plan()], refreshSubscription: vi.fn() };
  io.addons = { entitlementsUserId: io.user.id, userEntitlements: [], activeEntitlements: [], totalAddOnCost: { monthly: 0, annual: 0 }, isLoadingEntitlements: false };
  io.payments.mockResolvedValue({ success: true, data: [] }); io.fetchAddons.mockResolvedValue();
  io.usage.mockResolvedValue({ success: true, data: {} });
});
afterEach(cleanup);

describe('management presentation and requests', () => {
  it('does not infer payment success from an active free subscription or fetch unused analytics', async () => {
    show(); expect(screen.getByText('No payment required')).toBeTruthy();
    expect(screen.queryByText('Paid')).toBeNull(); expect(screen.queryByText('/person')).toBeNull();
    expect(screen.getByRole('button', { name: 'Download Invoice' }).disabled).toBe(true);
    expect(io.usage).not.toHaveBeenCalled(); expect(io.payments).not.toHaveBeenCalled();
  });
  it('loads billing on demand, surfaces failure and retries only on request', async () => {
    io.payments.mockResolvedValue({ success: false, error: 'Synthetic billing outage' }); show();
    fireEvent.click(screen.getByRole('button', { name: 'Billing History' }));
    await screen.findByText('Unable to load billing history.');
    expect(screen.queryByText('No billing history found')).toBeNull();
    await new Promise(resolve => setTimeout(resolve, 1200)); expect(io.payments).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Retry billing history' }));
    await waitFor(() => expect(io.payments).toHaveBeenCalledTimes(2));
  });
  it('never offers another subscription receipt for a row without payment evidence', async () => {
    io.management.subscriptionData.razorpayPaymentId = 'other-transaction';
    io.payments.mockResolvedValue({ success: true, data: [{ id: 'row', amount: 100, created_at: '2026-01-01', status: 'completed', transaction_type: 'subscription' }] });
    show(); fireEvent.click(screen.getByRole('button', { name: 'Billing History' }));
    const rowButton = await screen.findByRole('button', { name: 'Download invoice for Subscription' });
    expect(rowButton.disabled).toBe(true); expect(io.receipt).not.toHaveBeenCalled();
  });
  it('resolves the shared management route using the authenticated role', () => {
    io.role = 'recruiter'; show(); fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }));
    expect(screen.getByLabelText('route').textContent).toBe('/recruitment/overview');
  });
  it('supports keyboard tabs and expanded-state announcements', async () => {
    show(); const tab = screen.getByRole('tab', { name: 'Subscription' });
    fireEvent.keyDown(tab, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Add-Ons' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Add-Ons' }), { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Subscription' }).getAttribute('aria-selected')).toBe('true');
    const history = screen.getByRole('button', { name: 'Billing History' });
    fireEvent.click(history); expect(history.getAttribute('aria-expanded')).toBe('true');
    await screen.findByText('No billing history found');
  });
  it('uses a named focus-managed legacy dialog without claiming a fictional discount', async () => {
    io.management.modern = false; show();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }));
    const dialog = screen.getByRole('dialog', { name: 'Cancel Subscription?' }); expect(dialog).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Too expensive'));
    expect(screen.queryByText(/30%/)).toBeNull();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('Add-Ons management', () => {
  it('loads entitlements on entry and resolves browse to the actual learner route', async () => {
    show(<SubscriptionDashboard subscriptionData={plan()} />);
    await waitFor(() => expect(io.fetchAddons).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Browse Add-ons' }));
    expect(screen.getByLabelText('route').textContent).toBe('/learner/subscription/add-ons');
  });
  it('does not display a failed entitlement load as an empty successful account', () => {
    io.addons.entitlementsError = new Error('Synthetic outage'); show(<SubscriptionDashboard subscriptionData={plan()} />);
    expect(screen.getByText('Unable to load add-ons.')).toBeTruthy(); expect(screen.queryByText('No active add-ons')).toBeNull();
  });
  it('labels the actual annual price separately from a monthly equivalent', () => {
    io.addons.totalAddOnCost = { monthly: 20, annual: 240 };
    show(<SubscriptionDashboard subscriptionData={{ ...plan(), planPrice: 1200, billingCycle: 'annual' }} />);
    expect(screen.getByText('/year')).toBeTruthy();
    expect(screen.getByText('Monthly equivalent')).toBeTruthy();
    expect(screen.getByText('₹120')).toBeTruthy();
  });
  it('surfaces a rejected renewal update and does not report success or refresh it', async () => {
    io.toggle.mockResolvedValue({ success: false, error: 'Synthetic renewal failure' });
    io.addons.userEntitlements = [{ id: 'addon', feature_key: 'synthetic', status: 'active', end_date: '2099-01-01', auto_renew: true, price_at_purchase: 120, billing_period: 'annual' }];
    show(<SubscriptionDashboard subscriptionData={plan()} />);
    const button = screen.getByRole('button', { name: /Automatic renewal/i }); fireEvent.click(button);
    await screen.findByText('Synthetic renewal failure'); expect(io.fetchAddons).toHaveBeenCalledTimes(1);
  });
});

describe('authoritative billing display', () => {
  it('keeps fractions only when needed and groups Indian currency', () => {
    expect(formatManagementPrice(25000)).toBe('₹25,000'); expect(formatManagementPrice(2500.5)).toBe('₹2,500.5');
    expect(formatManagementPrice(null)).toBe('Not available');
    expect(managementPaymentLabel(null, 'annual', 2500)).toBe('Not available');
  });
  it('calculates monthly equivalents without relabelling annual charges or inventing missing terms', () => {
    expect(monthlyPlanCost(1200, 'annual')).toBe(100); expect(monthlyPlanCost(1200, null)).toBeNull();
    expect(addOnCostSummary([{ status: 'active', price_at_purchase: 1200, billing_period: 'annual' }, { status: 'grace_period', price_at_purchase: 20, billing_period: 'monthly' }])).toEqual({ monthly: 120, annual: 1440 });
    expect(addOnCostSummary([{ status: 'active', price_at_purchase: 20 }])).toEqual({ monthly: null, annual: null });
  });
});


describe('entitlement store accounting and account isolation', () => {
  it('recalculates costs when entitlements load', async () => {
    const { useSubscriptionStore } = await vi.importActual('../model/subscriptionStore');
    useSubscriptionStore.getState().clearAccessCache();
    io.entitlementRead.mockResolvedValue({ success: true, data: [{ id: 'annual', status: 'active', price_at_purchase: 1200, billing_period: 'annual' }] });
    await useSubscriptionStore.getState().fetchUserEntitlements();
    expect(useSubscriptionStore.getState().totalAddOnCost).toEqual({ monthly: 100, annual: 1200 });
  });
  it('discards an earlier account response after account scope changes', async () => {
    const { useSubscriptionStore } = await vi.importActual('../model/subscriptionStore');
    useSubscriptionStore.getState().clearAccessCache();
    let resolveOld;
    io.entitlementRead.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    const oldRead = useSubscriptionStore.getState().fetchUserEntitlements();
    const original = io.user; io.user = { ...original, id: 'second-synthetic-actor' };
    try {
      io.entitlementRead.mockResolvedValueOnce({ success: true, data: [{ id: 'second-addon', status: 'active', price_at_purchase: 20, billing_period: 'monthly' }] });
      await useSubscriptionStore.getState().fetchUserEntitlements();
      resolveOld({ success: true, data: [{ id: 'first-account-addon', status: 'active', price_at_purchase: 500, billing_period: 'monthly' }] });
      await oldRead;
      expect(useSubscriptionStore.getState().userEntitlements.map(e => e.id)).toEqual(['second-addon']);
      expect(useSubscriptionStore.getState().totalAddOnCost.monthly).toBe(20);
    } finally { io.user = original; useSubscriptionStore.getState().clearAccessCache(); }
  });
  it('rejects a failed cancellation without refetching or reporting success', async () => {
    const actual = await vi.importActual('../model/subscriptionStore');
    io.entitlementCancel.mockResolvedValue({ success: false, error: 'Synthetic cancellation rejection' });
    const { result } = renderHook(actual.useSubscription);
    await expect(result.current.cancelAddOn('synthetic-addon')).rejects.toThrow('Synthetic cancellation rejection');
    expect(io.entitlementRead).not.toHaveBeenCalled();
  });
});
