// @vitest-environment jsdom
import ProtectedRoute from '@/app/components/ProtectedRoute';
import MySubscriptionPage from '@/pages/subscription/MySubscription';
import SubscriptionManagePage from '@/pages/subscription/SubscriptionManage';
import SubscriptionPlansPage from '@/pages/subscription/SubscriptionPlans';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, renderHook, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decideSubscriptionLifecycle } from '../../../../../sso-worker/src/lib/subscriptions/lifecycle';
import { subscriptionExecutionService as api, catalogSchema, commerceSettlementRequest, currentSchema, discoverySchema, lifecycleRequestSchema } from '../api/subscriptionExecutionService';
import { useSubscriptionCheckout } from '../model/useSubscriptionExecution';
import SubscriptionWorkspace from '../ui/SubscriptionWorkspace';

const { fetchMock, auth, payMock, prepareMock } = vi.hoisted(() => ({ fetchMock: vi.fn(), payMock: vi.fn(), prepareMock: vi.fn(), auth: { authenticated: true, user: null as null | { id?: string; roles: string[] } } }));
vi.mock('@/shared/model/authStore', () => ({
  useIsAuthenticated: () => auth.authenticated, useUserRole: () => ({ role: 'learner' }), useAuthLoading: () => false,
  useUser: () => auth.user, pickPrimaryRole: (roles: string[]) => roles[0] ?? null,
  useAuthStore: { getState: () => ({ isAuthenticated: auth.authenticated }) },
}));
vi.mock('@/entities/learner', () => ({ useLearnerDataByEmail: () => ({ learnerData: null, loading: false, error: null }) }));
vi.mock('@/features/analytics/model/useUsageStatistics', () => ({ useUsageStatistics: () => ({ usageStats: null, loading: false, error: null }) }));
vi.mock('../ui/organization/MemberSubscriptionView', () => ({ default: () => null }));
vi.mock('../ui/individual/SubscriptionDashboard', () => ({ default: () => null }));
vi.mock('@/shared/api', () => ({ getPaymentReceiptPresignedUrl: vi.fn() }));
vi.mock('../api/subscriptionService', () => ({ getActiveSubscription: vi.fn(), getUserPayments: vi.fn().mockResolvedValue({ success: true, data: [] }), getUserSubscriptions: vi.fn().mockResolvedValue({ success: true, data: [] }) }));
vi.mock('../model/useSubscriptionQuery', async importOriginal => ({
  ...await importOriginal<typeof import('../model/useSubscriptionQuery')>(),
  useSubscriptionQuery: () => ({ loading: false, error: null, subscriptionData: {
    id: '00000000-0000-4000-8000-000000000003', productId: '00000000-0000-4000-8000-000000000002',
    revisionId: '00000000-0000-4000-8000-000000000004', plan: 'configured', planName: 'Configured membership',
    status: 'active', features: [], autoRenew: true,
  } }),
}));
vi.mock('../api/razorpayService', () => ({ payIssuedSubscriptionOrder: payMock, prepareSubscriptionCheckout: prepareMock }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: fetchMock } }));
vi.mock('@/shared/api/httpClient', () => ({ DEFAULT_TIMEOUT: 30000 }));
function RouteProbe() { const location = useLocation(); return <output data-testid="route" data-from-payment={String(location.state?.fromPayment === true)}>{location.pathname}</output>; }
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const actor = id(1), product = id(2), subscription = id(3), revision = id(4), plan = id(5), organization = id(6), learner = id(7);
const row = {
  id: subscription, planId: plan, productId: product, subject: { kind: 'organization' as const, id: organization },
  status: 'active', kind: 'initialized', revisionId: revision, version: 1, lifecycleOperations: ['cancel', 'renew']
};
const discovery = { schemaVersion: 1, actorId: actor, productId: product, items: [row], nextCursor: null };
const state = {
  id: subscription, planId: plan, revisionId: revision, productId: product, subject: row.subject, version: 1,
  status: 'active', periodStartsAt: 1000, periodEndsAt: 2000, trialEndsAt: null, renewalEnabled: true,
  cancelledAt: null, paymentFailedAt: null, scheduledChange: null
};
const pools = [{ key: 'org_pool', featureKey: 'reports', recipient: 'organization', audiences: ['educator'] },
{ key: 'learner_pool', featureKey: 'assessment', recipient: 'managed_learner', audiences: ['educator'] }];
const features = [{ key: 'custom_reports', type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: 8 } }];
const current = {
  schemaVersion: 1, actorId: actor, state, access: 'full', audience: 'educator', activatedAt: 500,
  subscriptionEndsAt: 3000, pools, plan: { id: plan, code: 'configured', productId: product, name: 'Configured membership', revisionNumber: 3 }, features
};
const catalog = {
  schemaVersion: 1, actorId: actor, productId: product, audience: 'educator', subjectKind: 'user', tax: { kind: 'gst', rateBasisPoints: 1800, priceDisplay: 'exclusive' }, plans: [{
    plan: { id: plan, code: 'published', productId: product },
    revisionId: revision, revisionNumber: 3, name: 'Published membership', audiences: ['educator'], purchaseMode: 'self_service',
    prices: [{
      id: id(8), currency: 'USD', minorUnit: 3, amountMinor: 12345, intervalUnit: 'month', intervalCount: 2,
      quantityBasis: 'seat', audiences: ['educator']
    }], features, presentation: { priceLabel: 'exact', taxInclusive: false, badge: null, copy: null }
  }], nextCursor: null
};
const response = (value: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(value), { status }));
function router(url: string, init?: RequestInit) {
  if (url === '/api/subscriptions') return response(discovery);
  if (url === '/api/subscriptions/catalog') return response(catalog);
  if (url.includes('/current?')) return response(current);
  if (url.endsWith('/credits')) {
    const request = JSON.parse(String(init?.body));
    const pool = pools.find(value => value.key === request.poolKey)!;
    return response({
      productId: product, subscriptionId: subscription, recipient: { kind: pool.recipient, id: request.recipientId },
      featureKey: pool.featureKey, poolKey: pool.key, allocated: 10, consumed: 3, remaining: 7, asOf: '2026-11-19T12:00:00Z'
    });
  }
  throw new Error(`Unexpected synthetic request: ${url}`);
}
async function selectSubscription() {
  const select = await screen.findByRole('combobox', { name: 'Subscription' });
  fireEvent.change(select, { target: { value: subscription } });
  await screen.findByRole('heading', { name: 'Configured membership' });
}
beforeEach(() => { sessionStorage.clear(); auth.authenticated = true; auth.user = null; fetchMock.mockImplementation(router); payMock.mockReset(); prepareMock.mockReset(); prepareMock.mockResolvedValue(undefined); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); fetchMock.mockReset(); });

describe('subscription execution consumer', () => {
  function freeCancellationRouter(access: string, live = false) {
    const subject = { kind: 'user', id: actor };
    const freeCatalog = { ...catalog, audience: 'educator', plans: [
      { ...catalog.plans[0], purchaseMode: 'free', prices: [] },
      { ...catalog.plans[0], plan: { ...catalog.plans[0].plan, id: id(50) }, revisionId: id(51), name: 'Paid option',
        prices: catalog.plans[0].prices.map(price => ({ ...price, quantityBasis: 'subscription' })) },
    ] };
    const selectedRow = { ...row, subject, status: live ? 'active' : 'cancelled' };
    return (url: string, init?: RequestInit) => {
      if (url === '/api/subscriptions') return response({ ...discovery, items: [selectedRow] });
      if (url === '/api/subscriptions/catalog') return response(freeCatalog);
      if (url.includes('/current?')) return response({ ...current, access, state: { ...state, subject, status: selectedRow.status,
        periodEndsAt: null, validity: 'perpetual', trialEndsAt: null, renewalEnabled: false, cancelledAt: live ? null : 1500 }, subscriptionEndsAt: null });
      return router(url, init);
    };
  }
  it.each(['read_only', 'suspended'])('keeps a cancelled free contract visible with %s access and no new checkout', async access => {
    fetchMock.mockImplementation(freeCancellationRouter(access));
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('region', { name: 'Cancelled plan access' })).toHaveTextContent('Cancelled plan');
    expect(screen.getByRole('link', { name: 'Review cancelled subscription' })).toHaveAttribute('href', '/subscription/manage');
    if (access === 'read_only') expect(screen.getByRole('link', { name: 'View read-only dashboard' })).toHaveAttribute('href', '/learner/dashboard');
    else expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Buy Now|Renew Plan|Change Plan/ })).toBeNull();
    expect(screen.queryByText('Current plan')).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => /commerce|lifecycle/.test(url))).toBe(false);
  });
  it('preserves the active free dashboard link', async () => {
    fetchMock.mockImplementation(freeCancellationRouter('full', true));
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/learner/dashboard');
    expect(screen.queryByRole('region', { name: 'Cancelled plan access' })).toBeNull();
  });
  it('does not send a user with no activated subscription back into a guarded dashboard', async () => {
    const base = freeCancellationRouter('full');
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url === '/api/subscriptions' ? response({ ...discovery, items: [] }) : base(url, init));
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('link', { name: 'Review subscription access' })).toHaveAttribute('href', '/subscription/manage');
    expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
  });
  it('does not offer unsupported lifecycle changes for a cancelled subscription in management', async () => {
    fetchMock.mockImplementation(freeCancellationRouter('read_only'));
    render(<SubscriptionWorkspace />); await selectSubscription();
    expect(await screen.findByRole('heading', { name: 'Cancelled subscription' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Operation' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Renew or upgrade with payment' })).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => /commerce|lifecycle/.test(url))).toBe(false);
  });
  it.each(['read_only', 'suspended'])('the main management page explains cancellation and %s access without renewal actions', async access => {
    auth.user = { id: actor, roles: ['learner'] };
    fetchMock.mockImplementation(freeCancellationRouter(access));
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/subscription/manage']}><MySubscriptionPage /></MemoryRouter>
    </QueryClientProvider>);
    expect(await screen.findByRole('heading', { name: 'Subscription cancelled' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Renew Now' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Upgrade Plan' })).toBeNull();
    if (access === 'read_only') expect(screen.getByRole('button', { name: 'View read-only dashboard' })).toBeInTheDocument();
    else expect(screen.queryByRole('button', { name: /dashboard/i })).toBeNull();
    expect(screen.queryByText('Manual renewal required')).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => /commerce|lifecycle/.test(url))).toBe(false);
  });
  it('discovers removed pools from actual activity revisions and reads history without using active balances', async () => {
    const historicalRevision = id(90);
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (!url.endsWith('/history')) return router(url, init);
      const input = JSON.parse(String(init?.body));
      if (input.kind === 'audit') return response({
        schemaVersion: 1, actorId: actor, subscriptionId: subscription, productId: product,
        items: [{
          operationId: id(30), actorId: actor, operation: 'initialize', reason: 'Original subscription', at: 500,
          committedAt: new Date(500).toISOString(), fromVersion: null, toVersion: 1, planId: plan, revisionId: historicalRevision, transactionId: null
        }], nextCursor: null
      });
      if (input.kind === 'pools') return response({
        kind: 'history_pools', actorId: actor, productId: product, subscriptionId: subscription,
        revisionId: historicalRevision, audience: 'educator', pools: [{ key: 'retired_pool', featureKey: 'retired_credits', recipient: 'organization', audiences: ['educator'] }]
      });
      return response({
        schemaVersion: 1, scope: {
          productId: product, subscriptionId: subscription,
          recipient: { kind: 'organization', id: organization }, featureKey: 'retired_credits', poolKey: 'retired_pool'
        },
        allocated: 8, consumed: 3, remaining: 0, expiredRemaining: 5, asOf: '2026-11-19T12:00:00Z', allocations: [], nextCursor: null
      });
    });
    render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.click(screen.getByRole('button', { name: 'View subscription activity' }));
    fireEvent.click(await screen.findByRole('button', { name: `View credit pools for revision ${historicalRevision}` }));
    expect(await screen.findByRole('region', { name: 'Historical credit pools' })).toBeInTheDocument();
    expect(await screen.findByText('Lifetime allocated')).toBeInTheDocument();
    const calls = fetchMock.mock.calls.filter(([url]) => url.endsWith('/history')).map(([, init]) => JSON.parse(init.body));
    expect(calls).toContainEqual({ kind: 'pools', subscriptionId: subscription, revisionId: historicalRevision });
    expect(calls).toContainEqual({ kind: 'credits', subscriptionId: subscription, poolKey: 'retired_pool', recipientId: organization, after: null, revisionId: historicalRevision });
    expect(fetchMock.mock.calls.some(([url, init]) => url.endsWith('/credits') && JSON.parse(init.body).poolKey === 'retired_pool')).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/lifecycle'))).toBe(false);
  });
  it('rejects altered historical revision and pool scope acknowledgements', async () => {
    const parsed = currentSchema.parse(current);
    const saved = {
      kind: 'history_pools', actorId: actor, productId: product, subscriptionId: subscription,
      revisionId: id(90), audience: 'educator', pools: []
    };
    fetchMock.mockImplementation(() => response(saved));
    expect(await api.historicalPools(parsed, id(90))).toEqual(saved);
    for (const defect of [{ actorId: learner }, { revisionId: revision }, { subscriptionId: learner }, { productId: learner }, { audience: 'foreign' }]) {
      fetchMock.mockImplementation(() => response({ ...saved, ...defect }));
      await expect(api.historicalPools(parsed, id(90))).rejects.toThrow('Historical pool scope differs');
    }
  });
  it('reads lifetime history on demand and displays expired unused credits separately', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (!url.endsWith('/history')) return router(url, init);
      const input = JSON.parse(String(init?.body));
      return response({
        schemaVersion: 1, scope: {
          productId: product, subscriptionId: subscription,
          recipient: { kind: 'organization', id: organization }, featureKey: 'reports', poolKey: 'org_pool'
        },
        allocated: 15, consumed: 3, remaining: 7, expiredRemaining: 5, asOf: '2026-11-19T12:00:00Z',
        allocations: [], nextCursor: null, ...('amount' in input ? { invalid: true } : {})
      });
    });
    render(<SubscriptionWorkspace />); await selectSubscription();
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/history'))).toBe(false);
    fireEvent.click(await screen.findByRole('button', { name: 'View allocation history' }));
    expect(await screen.findByText('Lifetime allocated')).toBeInTheDocument();
    expect(screen.getByText('Expired unused')).toBeInTheDocument();
    const sent = JSON.parse(fetchMock.mock.calls.find(([url]) => url.endsWith('/history'))![1].body);
    expect(sent).toEqual({ kind: 'credits', subscriptionId: subscription, recipientId: organization, poolKey: 'org_pool', after: null });
  });
  it('reads scoped subscription activity on demand without submitting a lifecycle command', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (!url.endsWith('/history')) return router(url, init);
      return response({
        schemaVersion: 1, actorId: actor, subscriptionId: subscription, productId: product,
        items: [{
          operationId: id(30), actorId: actor, operation: 'renew', reason: 'Synthetic renewal audit', at: 1000,
          committedAt: new Date(2000).toISOString(), fromVersion: 1, toVersion: 2, planId: plan, revisionId: revision, transactionId: id(31)
        }], nextCursor: null
      });
    });
    render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.click(screen.getByRole('button', { name: 'View subscription activity' }));
    expect(await screen.findByText('Synthetic renewal audit')).toBeInTheDocument();
    const sent = JSON.parse(fetchMock.mock.calls.find(([url]) => url.endsWith('/history'))![1].body);
    expect(sent).toEqual({ kind: 'audit', subscriptionId: subscription, after: null });
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/lifecycle'))).toBe(false);
  });
  it('submits upgrade from the real form through the actual lifecycle decision owner', async () => {
    const target = { planId: id(41), revisionId: id(42), productId: product };
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/subscriptions') return response({ ...discovery, items: [{ ...row, lifecycleOperations: ['upgrade'] }] });
      if (!url.endsWith('/lifecycle')) return router(url, init);
      const body = JSON.parse(String(init?.body));
      const quote = {
        ...target, id: id(43), subscriptionId: subscription, subject: row.subject, stateVersion: 1,
        operation: 'upgrade' as const, amountMinor: 100, currency: 'XYZ', periodStartsAt: 1000, periodEndsAt: 2000, validUntil: 1900
      };
      const settlement = {
        id: id(44), quoteId: quote.id, subscriptionId: subscription, subject: row.subject, stateVersion: 1,
        revisionId: target.revisionId, amountMinor: quote.amountMinor, currency: quote.currency, operation: 'upgrade' as const,
        kind: 'verified_payment' as const, recordedAt: 1500, validUntil: null
      };
      const decision = decideSubscriptionLifecycle(state, body.request, {
        id: id(45), version: 1, productId: product,
        graceDurationMs: 0, graceAccess: 'read_only', expiredAccess: 'suspended', cancellationAccess: 'until_period_end',
        immediateDowngradeAllowed: false, paymentFailureRestrictedMs: 0, paymentFailureAfterAccess: 'suspended',
        paymentRetryOffsetsMs: [1], suspensionApprovalRequired: true, reactivationApprovalRequired: true
      },
        {
          now: 1500, actorId: actor, subject: row.subject, allowedOperations: new Set(['upgrade']),
          quotes: new Map([[quote.id, quote]]), settlements: new Map([[settlement.id, settlement]]), approvals: new Map(),
          publishedRevisions: new Map([[revision, { planId: plan, revisionId: revision, productId: product }], [target.revisionId, target]]),
          revisionChanges: [{ fromRevisionId: revision, toRevisionId: target.revisionId, operation: 'upgrade' }]
        });
      return response({ operationId: body.operationId, decision, committedAt: '2026-11-19T12:00:00Z' });
    });
    render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.change(screen.getByLabelText('Operation'), { target: { value: 'upgrade' } });
    expect(screen.queryByLabelText('Target revision ID')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Timing')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Upgrade contract' } });
    fireEvent.change(screen.getByLabelText('Quote ID'), { target: { value: id(43) } });
    fireEvent.change(screen.getByLabelText('Settlement ID'), { target: { value: id(44) } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }));
    expect(await screen.findByText(/Change committed/)).toBeInTheDocument();
    const sent = JSON.parse(fetchMock.mock.calls.find(([url]) => url.endsWith('/lifecycle'))![1].body);
    expect(sent.request).not.toHaveProperty('targetRevisionId'); expect(sent.request).not.toHaveProperty('timing');
  });
  it('clears downgrade fields when switching to cancellation', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url === '/api/subscriptions'
      ? response({ ...discovery, items: [{ ...row, lifecycleOperations: ['downgrade', 'cancel'] }] })
      : url.endsWith('/lifecycle') ? Promise.reject(new Error('Synthetic unknown outcome')) : router(url, init));
    render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.change(screen.getByLabelText('Operation'), { target: { value: 'downgrade' } });
    fireEvent.change(screen.getByLabelText('Target revision ID'), { target: { value: id(42) } });
    fireEvent.change(screen.getByLabelText('Timing'), { target: { value: 'next_renewal' } });
    fireEvent.change(screen.getByLabelText('Operation'), { target: { value: 'cancel' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Cancel contract' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Synthetic unknown outcome');
    const sent = JSON.parse(fetchMock.mock.calls.find(([url]) => url.endsWith('/lifecycle'))![1].body);
    expect(sent.request).toEqual({
      operation: 'cancel', subscriptionId: subscription, subject: row.subject,
      expectedVersion: 1, expectedRevisionId: revision, reason: 'Cancel contract'
    });
  });
  it('retains an uncertain operation after remount and never sends a second write', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.endsWith('/lifecycle')
      ? Promise.reject(new Error('Connection lost')) : router(url, init));
    const first = render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.change(screen.getByLabelText('Operation'), { target: { value: 'cancel' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Cancel once' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }));
    await screen.findByRole('alert');
    const sent = JSON.parse(fetchMock.mock.calls.find(([url]) => url.endsWith('/lifecycle'))![1].body);
    first.unmount(); render(<SubscriptionWorkspace />); await selectSubscription();
    expect(screen.getByRole('alert')).toHaveTextContent(sent.operationId);
    expect(screen.getByRole('button', { name: 'Submit change request' })).toBeDisabled();
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/lifecycle'))).toHaveLength(1);
  });
  it('does not send a lifecycle write when its reference cannot be saved', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.change(screen.getByLabelText('Operation'), { target: { value: 'cancel' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Cancel once' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/tracking|Storage unavailable/);
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/lifecycle'))).toBe(false);
  });
  it('rejects contaminated operation fields at the browser API contract', () => {
    const request = {
      operation: 'upgrade', subscriptionId: subscription, subject: row.subject,
      expectedVersion: 1, expectedRevisionId: revision, reason: 'Upgrade', quoteId: id(43), settlementId: id(44)
    };
    expect(lifecycleRequestSchema.safeParse({ operationId: id(90), request }).success).toBe(true);
    for (const extra of [{ targetRevisionId: id(42) }, { timing: 'immediate' }, { approvalId: id(45) }]) {
      expect(lifecycleRequestSchema.safeParse({ operationId: id(90), request: { ...request, ...extra } }).success).toBe(false);
    }
  });
  it('blocks malformed local tracking without removing it or sending a write', async () => {
    const key = `subscription:lifecycle:${actor}:${product}`;
    sessionStorage.setItem(key, '{malformed');
    render(<SubscriptionWorkspace />); await selectSubscription();
    expect(screen.getByRole('alert')).toHaveTextContent('tracking is unavailable or invalid');
    expect(screen.getByRole('button', { name: 'Submit change request' })).toBeDisabled();
    expect(sessionStorage.getItem(key)).toBe('{malformed');
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/lifecycle'))).toBe(false);
  });
  it('does not restore another actor or product operation into the current workspace', async () => {
    sessionStorage.setItem(`subscription:lifecycle:${id(91)}:${product}`, JSON.stringify({ version: 1, operationId: id(90) }));
    sessionStorage.setItem(`subscription:lifecycle:${actor}:${id(92)}`, JSON.stringify({ version: 1, operationId: id(90) }));
    render(<SubscriptionWorkspace />); await selectSubscription();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit change request' })).toBeEnabled();
  });
  it.each([null, 1500])('retains the durable downgrade marker %s in authenticated current reads', async downgradedAt => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ...current, state: { ...state, downgradedAt }, access: 'read_only' })));
    const result = await api.current(discoverySchema.parse(discovery).items[0], discoverySchema.parse(discovery));
    expect(result.state.downgradedAt).toBe(downgradedAt); expect(result.access).toBe('read_only');
  });
  it.each([-1, 499, 1.5, '1500', Number.MAX_SAFE_INTEGER + 1])('rejects malformed durable downgrade marker %s', downgradedAt => {
    expect(currentSchema.safeParse({ ...current, state: { ...state, downgradedAt } }).success).toBe(false);
  });
  it('preserves the durable downgrade marker in lifecycle acknowledgements', async () => {
    const selected = currentSchema.parse({ ...current, state: { ...state, downgradedAt: 1500 }, access: 'read_only' });
    const input = {
      operationId: id(90), request: {
        operation: 'cancel' as const, subscriptionId: subscription,
        subject: selected.state.subject, expectedVersion: 1, expectedRevisionId: revision, reason: 'Synthetic cancellation'
      }
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      operationId: input.operationId, committedAt: '2026-11-19T12:00:00Z',
      decision: {
        expectedVersion: 1, expectedRevisionId: revision, next: {
          ...selected.state, version: 2, status: 'cancelled',
          cancelledAt: 1800, renewalEnabled: false
        }, access: 'read_only', retryAt: [],
        audit: { operation: 'cancel', actorId: actor, reason: input.request.reason, at: 1800, policyId: id(20), policyVersion: 1 }
      }
    })));
    expect((await api.lifecycle(input, selected)).decision.next.downgradedAt).toBe(1500);
  });
  it('renders actual authenticated catalog and management page entrypoints through the established auth guard', async () => {
    render(<MemoryRouter initialEntries={['/subscription/plans']}><Routes>
      <Route path="/subscription/plans" element={<ProtectedRoute><SubscriptionPlansPage /></ProtectedRoute>} />
    </Routes></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Published membership' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage your subscription' })).toHaveAttribute('href', '/subscription/manage');
    expect(fetchMock.mock.calls.every(([url, options]) => ['/api/subscriptions/catalog', '/api/subscriptions'].includes(url) && options.method === 'GET')).toBe(true);
    cleanup(); fetchMock.mockClear();
    auth.user = { id: actor, roles: ['learner'] };
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/subscription/manage']}><Routes>
      <Route path="/subscription/manage" element={<ProtectedRoute><SubscriptionManagePage /></ProtectedRoute>} />
    </Routes></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByRole('heading', { name: 'Configured membership' })).toBeInTheDocument();
    expect(await screen.findByText('custom reports: 8')).toBeInTheDocument();
    cleanup();
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><MySubscriptionPage /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByRole('heading', { name: 'Configured membership' })).toBeInTheDocument();
  });
  it.each([SubscriptionPlansPage, SubscriptionManagePage])('does not mount subscription data for an unauthenticated routed page', async Page => {
    auth.authenticated = false;
    render(<MemoryRouter initialEntries={['/subscription/manage']}><Routes>
      <Route path="/subscription/manage" element={<ProtectedRoute><Page /></ProtectedRoute>} />
      <Route path="/login" element={<p>Sign in required</p>} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText('Sign in required')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['plan', 'revision', 'version'])('rejects a current %s that differs from the discovered authority before exposing lifecycle controls', async changed => {
    const nextState = { ...state, ...(changed === 'plan' ? { planId: id(99) } : changed === 'revision' ? { revisionId: id(99) } : { version: 2 }) };
    const nextCurrent = { ...current, state: nextState, plan: { ...current.plan, id: nextState.planId } };
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.includes('/current') ? response(nextCurrent) : router(url, init));
    render(<SubscriptionWorkspace />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Subscription' }), { target: { value: subscription } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Current subscription scope differs');
    expect(screen.queryByLabelText('Operation')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/credits') || url.endsWith('/lifecycle'))).toBe(false);
  });
  it('allows continuation after an empty authorized discovery scan page', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url === '/api/subscriptions'
      ? response({ ...discovery, items: [], nextCursor: id(30) })
      : url.startsWith('/api/subscriptions?cursor=') ? response(discovery) : router(url, init));
    render(<SubscriptionWorkspace />);
    expect(await screen.findByText('No authorized subscriptions on this page. Continue to the next page.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next subscriptions' }));
    expect(await screen.findByRole('combobox', { name: 'Subscription' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`/api/subscriptions?cursor=${id(30)}`, expect.anything());
  });
  it('connects the execution workspace to owner reads and renders exact terms and usage', async () => {
    render(<SubscriptionWorkspace />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(await screen.findByText('USD 12.345')).toBeInTheDocument();
    expect(screen.getByText(/per seat/)).toBeInTheDocument();
    expect(screen.getByText('Custom Reports')).toBeInTheDocument();
    await selectSubscription();
    await screen.findByText('7');
    const usageRequests = fetchMock.mock.calls.filter(([url]) => url.endsWith('/credits'));
    expect(usageRequests).toHaveLength(1);
    expect(JSON.parse(usageRequests[0][1].body)).toEqual({ kind: 'usage', subscriptionId: subscription, poolKey: 'org_pool', recipientId: organization });
    expect(screen.getByText(/Select a managed learner/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /checkout|buy now/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/purchase owner provides executable terms/)).not.toHaveLength(0);
    expect(screen.getByRole('option', { name: 'cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'suspend' })).not.toBeInTheDocument();
  });
  it('retains the explicit subscription selection across a refresh', async () => {
    render(<SubscriptionWorkspace />); await selectSubscription();
    await screen.findByRole('button', {name:'View subscription activity'});
    fireEvent.click(screen.getByRole('button', {name:'Refresh subscriptions'}));
    await waitFor(() => expect(screen.getByRole('combobox', {name:'Subscription'})).toHaveValue(subscription));
    expect(await screen.findByRole('button', {name:'View subscription activity'})).toBeInTheDocument();
  });
  it('requires explicit managed learner selection and never substitutes the actor', async () => {
    render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.change(screen.getByLabelText('Managed learner ID'), { target: { value: learner } });
    fireEvent.click(screen.getByRole('button', { name: 'Read learner usage' }));
    await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/credits'))).toHaveLength(2));
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/credits')).map(([, init]) => JSON.parse(init.body).recipientId)).toEqual([organization, learner]);
  });
  it('keeps the QA management heading and tabs while displaying authoritative subscription details', async () => {
    render(<SubscriptionWorkspace />); await selectSubscription();
    expect(screen.getByRole('heading', { name: 'My Subscription', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Subscription' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Add-Ons' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('heading', { name: 'Subscription Details' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Subscription management' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Support' })).toHaveAttribute('href', '/contact');
  });
  it('rejects unavailable discovery explicitly without legacy substitution', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url === '/api/subscriptions' ? response({ error: 'denied' }, 503) : router(url, init));
    render(<SubscriptionWorkspace />);
    expect(await screen.findByRole('alert')).toHaveTextContent('503');
    expect(screen.queryByRole('combobox', { name: 'Subscription' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([url]) => url.startsWith('/api/subscriptions'))).toBe(true);
  });
  it('scans empty filtered catalog pages without offering an empty Next page', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.includes('/catalog')
      ? response({ ...catalog, plans: [], nextCursor: url.includes('?') ? null : id(30) }) : router(url, init));
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByText('No published plans are available.')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(`/api/subscriptions/catalog?cursor=${id(30)}`, expect.anything()));
    expect(screen.queryByRole('button', { name: 'Next plans' })).not.toBeInTheDocument();
  });
  it('keeps first and later catalog plans together after scanning an empty intermediate page', async () => {
    const later = {...catalog.plans[0], plan: {...catalog.plans[0].plan, id: id(32)}, revisionId: id(33), name: 'Later membership'};
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/subscriptions/catalog') return response({...catalog, nextCursor: id(30)});
      if (url === `/api/subscriptions/catalog?cursor=${id(30)}`) return response({...catalog, plans: [], nextCursor: id(31)});
      if (url === `/api/subscriptions/catalog?cursor=${id(31)}`) return response({...catalog, plans: [later], nextCursor: id(34)});
      if (url === `/api/subscriptions/catalog?cursor=${id(34)}`) return response({...catalog, plans: [], nextCursor: null});
      return router(url, init);
    });
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('article', {name: 'Later membership'})).toBeInTheDocument();
    expect(screen.getByRole('article', {name: 'Published membership'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Next plans'})).not.toBeInTheDocument();
  });
  it.each(['unavailable', 'repeated cursor', 'different actor', 'duplicate plan'])('surfaces %s on a later catalog page without presenting a partial catalog', async fault => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/subscriptions/catalog') return response({...catalog, nextCursor: id(30)});
      if (url.includes('/catalog?')) {
        if (fault === 'unavailable') return response({}, 503);
        return response({...catalog, actorId: fault === 'different actor' ? id(90) : actor,
          plans: fault === 'duplicate plan' ? catalog.plans : [], nextCursor: fault === 'repeated cursor' ? id(30) : null});
      }
      return router(url, init);
    });
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('article', {name: 'Published membership'})).not.toBeInTheDocument();
  });
  it('renders setup state for uninitialized rows without current or credit substitution', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url === '/api/subscriptions'
      ? response({ ...discovery, items: [{ ...row, kind: 'uninitialized', revisionId: null, version: null, lifecycleOperations: [] }] }) : router(url, init));
    render(<SubscriptionWorkspace />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Subscription' }), { target: { value: subscription } });
    expect(await screen.findByText('Subscription setup required')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url.includes('/current') || url.includes('/credits'))).toBe(false);
  });
  it('surfaces failed current and usage reads without showing fabricated balances', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.endsWith('/credits') ? response({}, 403) : router(url, init));
    render(<SubscriptionWorkspace />); await selectSubscription();
    expect(await screen.findByRole('alert')).toHaveTextContent('403');
    expect(screen.queryByText('7')).not.toBeInTheDocument();
    cleanup();
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.includes('/current') ? response({}, 503) : router(url, init));
    render(<SubscriptionWorkspace />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Subscription' }), { target: { value: subscription } });
    expect(await screen.findByRole('alert')).toHaveTextContent('503');
    expect(screen.queryByRole('heading', { name: 'Configured membership' })).not.toBeInTheDocument();
  });
  it('does not apply stale current responses after changing the selection and aborts the read', async () => {
    let resolveCurrent!: (value: Response) => void;
    let signal!: AbortSignal;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/current')) { signal = init!.signal!; return new Promise<Response>(resolve => { resolveCurrent = resolve; }); }
      return router(url, init);
    });
    render(<SubscriptionWorkspace />);
    const select = await screen.findByRole('combobox', { name: 'Subscription' });
    fireEvent.change(select, { target: { value: subscription } });
    await waitFor(() => expect(resolveCurrent).toBeDefined());
    fireEvent.change(select, { target: { value: '' } });
    expect(signal.aborted).toBe(true);
    await act(async () => { resolveCurrent(new Response(JSON.stringify(current))); });
    expect(screen.queryByRole('heading', { name: 'Configured membership' })).not.toBeInTheDocument();
  });
  it('keeps uncertain lifecycle writes locked with stable operation identity and never retries', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.endsWith('/lifecycle') ? Promise.reject(new Error('Connection lost')) : router(url, init));
    render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.change(screen.getByLabelText('Operation'), { target: { value: 'cancel' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'End contract' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/outcome may be uncertain/);
    const writes = fetchMock.mock.calls.filter(([url]) => url.endsWith('/lifecycle'));
    expect(writes).toHaveLength(1);
    const body = JSON.parse(writes[0][1].body);
    expect(body.operationId).toMatch(/^[\da-f-]{36}$/);
    expect(body.request).toEqual({
      operation: 'cancel', subscriptionId: subscription, subject: row.subject,
      expectedVersion: 1, expectedRevisionId: revision, reason: 'End contract'
    });
    expect(screen.getByRole('alert')).toHaveTextContent(body.operationId);
    expect(screen.getByRole('button', { name: 'Submit change request' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }));
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/lifecycle'))).toHaveLength(1);
  });
  it('requires genuine paid references and sends configured revision/version without client policy', async () => {
    render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.change(screen.getByLabelText('Operation'), { target: { value: 'renew' } });
    expect(screen.getByLabelText('Quote ID')).toBeRequired();
    expect(screen.getByLabelText('Settlement ID')).toBeRequired();
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Renew contract' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Submit change request' }).closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('genuine quote and settlement references');
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/lifecycle'))).toBe(false);
  });
  it('bounds read duration without retrying the request', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init!.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }));
    const pending = api.catalog();
    const expectation = expect(pending).rejects.toThrow('Aborted');
    await vi.advanceTimersByTimeAsync(30000);
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it('surfaces catalog failure without substituting static offerings and allows an explicit read retry', async () => {
    fetchMock.mockImplementation(() => response({}, 503));
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('503');
    expect(screen.queryByRole('heading', { name: 'Published membership' })).not.toBeInTheDocument();
    fetchMock.mockImplementation(router);
    fireEvent.click(screen.getByRole('button', { name: 'Try reading again' }));
    expect(await screen.findByRole('heading', { name: 'Published membership' })).toBeInTheDocument();
  });
  it('renders the published badge, "From" label, owner tax label and Talk to Sales from catalog data only', async () => {
    const starting = { ...catalog.plans[0], presentation: { priceLabel: 'starting_at', taxInclusive: false, badge: 'Recommended for Active Learner Management', copy: null } };
    const sales = {
      ...catalog.plans[0], plan: { ...catalog.plans[0].plan, id: id(41) }, revisionId: id(42), name: 'Enterprise membership',
      purchaseMode: 'contact_sales', prices: [], presentation: { priceLabel: 'starting_at', taxInclusive: false, badge: null, copy: null }
    };
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url === '/api/subscriptions/catalog'
      ? response({ ...catalog, plans: [starting, sales] }) : router(url, init));
    render(<SubscriptionWorkspace view="catalog" />);
    const card = (await screen.findByRole('heading', { name: 'Published membership' })).closest('article')!;
    expect(card).toHaveTextContent('Recommended for Active Learner Management');
    expect(card).toHaveTextContent('From USD 12.345');
    expect(card).toHaveTextContent('+18% GST');
    expect(card.querySelector('a[href="/contact"]')).toBeNull();
    const enterprise = screen.getByRole('heading', { name: 'Enterprise membership' }).closest('article')!;
    expect(enterprise.querySelector('a[href="/contact"]')).toHaveTextContent('Talk to Sales');
    // A plan display that disagrees with the owner tax policy is rejected at the API boundary.
    expect(catalogSchema.safeParse({ ...catalog, plans: [{ ...starting, presentation: { ...starting.presentation, taxInclusive: true } }] }).success).toBe(false);
  });
  it('highlights only a preselected published revision', async () => {
    render(<SubscriptionWorkspace view="catalog" selectedRevisionId={revision} />);
    const card = (await screen.findByRole('heading', { name: 'Published membership' })).closest('article')!;
    expect(card).toHaveAttribute('aria-current', 'true');
    expect(card).toHaveTextContent('Your selected plan');
    cleanup();
    render(<SubscriptionWorkspace view="catalog" selectedRevisionId={id(77)} />);
    expect((await screen.findByRole('heading', { name: 'Published membership' })).closest('article')).not.toHaveAttribute('aria-current');
  });
  it('rejects malformed DTOs and exact-scope substitutions at API boundaries', async () => {
    expect(discoverySchema.safeParse({ ...discovery, items: [{ ...row, kind: 'uninitialized' }] }).success).toBe(false);
    expect(catalogSchema.safeParse({ ...catalog, plans: [{ ...catalog.plans[0], policy: {} }] }).success).toBe(false);
    expect(catalogSchema.safeParse({ ...catalog, plans: [{ ...catalog.plans[0], prices: [{ ...catalog.plans[0].prices[0], minorUnit: Number.MAX_SAFE_INTEGER }] }] }).success).toBe(false);
    expect(currentSchema.safeParse({ ...current, state: { ...state, planId: id(99) } }).success).toBe(false);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ...current, actorId: id(99) })));
    await expect(api.current(discoverySchema.parse(discovery).items[0], discoverySchema.parse(discovery))).rejects.toThrow('scope differs');
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      productId: product, subscriptionId: subscription,
      recipient: { kind: 'organization', id: actor }, featureKey: 'reports', poolKey: 'org_pool', allocated: 10, consumed: 3, remaining: 7, asOf: '2026-11-19T12:00:00Z'
    })));
    const parsedCurrent = currentSchema.parse(current);
    await expect(api.usage(parsedCurrent, parsedCurrent.pools[0], organization)).rejects.toThrow('scope differs');
  });
  it('validates a genuine committed receipt before reporting success', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (!url.endsWith('/lifecycle')) return router(url, init);
      const body = JSON.parse(String(init?.body));
      return response({
        operationId: body.operationId, committedAt: '2026-11-19T12:00:00Z', decision: {
          expectedVersion: 1, expectedRevisionId: revision, next: { ...state, version: 2, status: 'cancelled' }, access: 'read_only', retryAt: [],
          audit: { operation: 'cancel', actorId: actor, reason: 'End contract', at: 2000, policyId: id(20), policyVersion: 1 }
        }
      });
    });
    render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.change(screen.getByLabelText('Operation'), { target: { value: 'cancel' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'End contract' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }));
    expect(await screen.findByText(/Change committed/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit change request' })).toBeDisabled();
  });
});

describe('owner-issued customer checkout', () => {
  const key = `subscription:commerce:${actor}:${product}`;
  const executableCatalog = { ...catalog, plans: [{ ...catalog.plans[0], prices: [{ ...catalog.plans[0].prices[0], quantityBasis: 'subscription' }] }] };
  const paymentId = 'pay_synthetic';
  function commerceRouter(options: { failSettlement?: boolean; mismatchSettlement?: boolean; invalidOrder?: boolean; checkoutStatus?: 'unpaid' | 'paid' | 'expired' | 'blocked' } = {}) {
    let quote: Record<string, unknown>;
    return (url: string, init?: RequestInit) => {
      if (url === '/api/subscriptions/catalog') return response(executableCatalog);
      if (!url.endsWith('/commerce')) return router(url, init);
      // The operation intent and identities must be durable before every POST.
      const saved = JSON.parse(sessionStorage.getItem(key)!);
      const command = JSON.parse(String(init?.body)); const r = command.request;
      expect(command.operationId).toBe(saved[r.kind === 'quote' ? 'quoteOperationId' : r.kind === 'order' || r.kind === 'checkout' ? 'orderOperationId' : 'settlementOperationId']);
      expect(r).not.toHaveProperty('amountMinor'); expect(r).not.toHaveProperty('currency'); expect(r).not.toHaveProperty('roles');
      if (r.kind === 'quote') {
        quote = {
          id: command.operationId, actorId: actor, subscriptionId: r.subscriptionId, productId: product, subject: r.subject,
          audience: 'educator', stateVersion: r.expectedVersion, expectedRevisionId: r.expectedRevisionId, planId: plan, revisionId: r.revisionId,
          purpose: r.purpose, referenceId: null, priceId: r.priceId, amountMinor: 550, currency: 'USD', minorUnit: 2,
          periodStartsAt: 1000, periodEndsAt: 2000, createdAt: 1000, validUntil: 2000
        };
        return response({ kind: 'quote', operationId: command.operationId, quote });
      }
      if (r.kind === 'order') return response({
        kind: 'order', operationId: command.operationId, quoteId: quote.id,
        order: {
          id: 'order_synthetic', key_id: options.invalidOrder ? '' : 'rzp_test_synthetic', amount: quote.amountMinor,
          currency: quote.currency, receipt: quote.id, status: 'created', notes: {}
        }
      });
      if (r.kind === 'checkout') return response({ kind: 'checkout', status: options.checkoutStatus ?? 'paid', issued: saved.order });
      expect(saved.settlementRequest).toEqual(r);
      if ('paymentId' in r) expect(saved.paymentId).toBe(paymentId);
      else { expect(r.reconcile).toBe(true); expect(saved.paymentId).toBeUndefined(); }
      if (options.failSettlement) return Promise.reject(new Error('Settlement connection lost'));
      return response({
        kind: 'settlement', operationId: command.operationId, quoteId: quote.id,
        settlement: {
          id: command.operationId, quoteId: quote.id, subscriptionId: quote.subscriptionId, productId: product,
          subject: quote.subject, purpose: quote.purpose, referenceId: null, providerPaymentId: paymentId,
          amountMinor: options.mismatchSettlement ? 1 : quote.amountMinor, currency: quote.currency, settledAt: 1500
        }
      });
    };
  }
  function commerceMutations() {
    return fetchMock.mock.calls.filter(([url, init]) => url.endsWith('/commerce') && JSON.parse(String(init?.body)).request.kind !== 'checkout');
  }
  async function reconcilePayment() {
    fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm payment' }));
  }
  async function requestPurchase() {
    fireEvent.click(await screen.findByRole('button', { name: /Buy Now/ }));
    await waitFor(() => expect(commerceMutations().length).toBeGreaterThanOrEqual(2));
  }
  it('reports confirmed settlement to the page exactly once and never before confirmation', async () => {
    const confirmed = vi.fn();
    const options = { failSettlement: true };
    fetchMock.mockImplementation(commerceRouter(options));
    payMock.mockResolvedValue({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    render(<SubscriptionWorkspace view="catalog" onPaymentConfirmed={confirmed} />); await requestPurchase();
    await screen.findByRole('button', { name: 'Retry payment confirmation' });
    expect(confirmed).not.toHaveBeenCalled();
    options.failSettlement = false;
    fireEvent.click(await screen.findByRole('button', { name: 'Retry payment confirmation' }));
    expect(await screen.findByText('Taking you to your dashboard…')).toBeInTheDocument();
    expect(confirmed).toHaveBeenCalledOnce();
  });
  it.each([
    [[] as string[], '/learner/dashboard'],
    [['learner', 'owner'], '/learner/dashboard'],
    [['educator'], '/educator/dashboard'],
    [['college_admin'], '/college-admin/dashboard'],
  ])('the plans page redirects to the role dashboard after confirmed payment (roles %j)', async (roles, dashboard) => {
    auth.user = { roles };
    fetchMock.mockImplementation(commerceRouter());
    payMock.mockResolvedValueOnce({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/subscription/plans']}><Routes>
        <Route path="/subscription/plans" element={<SubscriptionPlansPage />} />
        <Route path="*" element={<RouteProbe />} />
      </Routes></MemoryRouter></QueryClientProvider>);
    await requestPurchase();
    const route = await screen.findByTestId('route');
    expect(route).toHaveTextContent(dashboard); expect(route).toHaveAttribute('data-from-payment', 'true');
    expect(sessionStorage.getItem(key)).toBeNull();
  });
  it('checks an interrupted unpaid checkout and resumes the same order without creating another', async () => {
    fetchMock.mockImplementation(commerceRouter({ checkoutStatus: 'unpaid' }));
    payMock.mockRejectedValueOnce(new Error('Checkout dismissed'));
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    const saved = JSON.parse(sessionStorage.getItem(key)!);
    fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' }));
    await screen.findByRole('button', { name: 'Resume payment' });
    expect(payMock).toHaveBeenCalledTimes(1);
    payMock.mockResolvedValueOnce({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    fireEvent.click(screen.getByRole('button', { name: 'Resume payment' }));
    await screen.findByText(/Payment confirmed/);
    expect(payMock).toHaveBeenCalledTimes(2);
    expect(payMock.mock.calls[1][0].id).toBe(saved.order.order.id);
    expect(commerceMutations().map(([, init]) => JSON.parse(String(init.body)).request.kind)).toEqual(['quote', 'order', 'settle']);
    expect(sessionStorage.getItem(key)).toBeNull();
  });
  it.each(['blocked'] as const)('keeps %s orders locked without reopening checkout', async checkoutStatus => {
    fetchMock.mockImplementation(commerceRouter({ checkoutStatus })); payMock.mockRejectedValueOnce(new Error('Checkout dismissed'));
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' }));
    await waitFor(() => expect(screen.getByRole('alert')).not.toHaveTextContent('Checkout dismissed'));
    expect(screen.queryByRole('button', { name: 'Resume payment' })).not.toBeInTheDocument();
    expect(payMock).toHaveBeenCalledTimes(1); expect(sessionStorage.getItem(key)).not.toBeNull();
  });
  async function expiredCheckout() {
    fetchMock.mockImplementation(commerceRouter({ checkoutStatus: 'expired' }));
    payMock.mockRejectedValueOnce(new Error('Checkout dismissed'));
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' }));
    await screen.findByRole('button', { name: 'Start again' });
    return sessionStorage.getItem(key)!;
  }
  it('rechecks expired unpaid checkout, archives exact evidence, and unlocks without a new order or charge', async () => {
    const saved = await expiredCheckout(); const journal = JSON.parse(saved);
    const readsBefore = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Start again' }));
    await waitFor(() => expect(sessionStorage.getItem(key)).toBeNull());
    expect(sessionStorage.getItem(key + ':archive:' + journal.quoteOperationId)).toBe(saved);
    expect(await screen.findByRole('button', { name: /Buy Now/ })).toBeEnabled();
    expect(fetchMock.mock.calls.slice(readsBefore).filter(([url]) => url.endsWith('/commerce')).map(([, init]) => JSON.parse(String(init.body)).request.kind)).toEqual(['checkout']);
    expect(commerceMutations()).toHaveLength(2); expect(payMock).toHaveBeenCalledTimes(1);
  });
  it.each(['blocked', 'paid'] as const)('does not release expired checkout if the fresh status changes to %s', async status => {
    const saved = await expiredCheckout(); const previous = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.endsWith('/commerce') && JSON.parse(String(init?.body)).request.kind === 'checkout'
      ? response({ kind: 'checkout', status, issued: JSON.parse(sessionStorage.getItem(key)!).order }) : previous(url, init));
    fireEvent.click(screen.getByRole('button', { name: 'Start again' }));
    if (status === 'paid') await screen.findByRole('button', { name: 'Confirm payment' });
    else await screen.findByRole('alert');
    expect(sessionStorage.getItem(key)).toBe(saved);
    expect(screen.queryByRole('button', { name: 'Start again' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buy Now/ })).toBeDisabled();
    expect(commerceMutations()).toHaveLength(2); expect(payMock).toHaveBeenCalledTimes(1);
  });
  it('keeps the active checkout if preserving the archive fails', async () => {
    const saved = await expiredCheckout(); const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, name: string, value: string) {
      if (name.includes(':archive:')) throw new Error('Archive storage unavailable');
      original.call(this, name, value);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Archive storage unavailable');
    expect(sessionStorage.getItem(key)).toBe(saved); expect(screen.getByRole('button', { name: /Buy Now/ })).toBeDisabled();
  });
  it('does not offer expired restart when a saved payment confirmation exists', async () => {
    fetchMock.mockImplementation(commerceRouter({ checkoutStatus: 'expired', failSettlement: true }));
    payMock.mockResolvedValueOnce({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await screen.findByRole('button', { name: 'Retry payment confirmation' });
    const saved = sessionStorage.getItem(key);
    fireEvent.click(screen.getByRole('button', { name: 'Check payment status' }));
    await screen.findByText('Saved payment evidence differs from the payment status. Contact support.');
    expect(screen.queryByRole('button', { name: 'Start again' })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(key)).toBe(saved);
  });
  it('preserves a previously reserved reconciliation identity when resuming an unpaid order', async () => {
    fetchMock.mockImplementation(commerceRouter({ checkoutStatus: 'unpaid' })); payMock.mockRejectedValueOnce(new Error('Checkout dismissed'));
    const first = render(<SubscriptionWorkspace view="catalog" />); await requestPurchase(); await screen.findByRole('alert');
    const journal = JSON.parse(sessionStorage.getItem(key)!); const q = journal.quote;
    journal.settlementRequest = commerceSettlementRequest.parse({ kind: 'settle', subscriptionId: q.subscriptionId, subject: q.subject, expectedVersion: q.stateVersion, expectedRevisionId: q.expectedRevisionId, quoteId: q.id, reconcile: true });
    sessionStorage.setItem(key, JSON.stringify(journal)); first.unmount(); render(<SubscriptionWorkspace view="catalog" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' })); await screen.findByRole('button', { name: 'Resume payment' });
    payMock.mockResolvedValueOnce({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    fireEvent.click(screen.getByRole('button', { name: 'Resume payment' })); await screen.findByText(/Payment confirmed/);
    const sent = JSON.parse(String(commerceMutations().at(-1)![1].body));
    expect(sent.operationId).toBe(journal.settlementOperationId); expect(sent.request).toEqual(journal.settlementRequest);
  });
  it('rechecks before resuming and does not open checkout if payment arrived in the meantime', async () => {
    fetchMock.mockImplementation(commerceRouter({ checkoutStatus: 'unpaid' })); payMock.mockRejectedValueOnce(new Error('Checkout dismissed'));
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' })); await screen.findByRole('button', { name: 'Resume payment' });
    const previous = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.endsWith('/commerce') && JSON.parse(String(init?.body)).request.kind === 'checkout'
      ? response({ kind: 'checkout', status: 'paid', issued: JSON.parse(sessionStorage.getItem(key)!).order }) : previous(url, init));
    fireEvent.click(screen.getByRole('button', { name: 'Resume payment' })); await screen.findByRole('button', { name: 'Confirm payment' });
    expect(payMock).toHaveBeenCalledTimes(1);
  });
  it('does not request a quote or order when the primary SDK cannot load', async () => {
    fetchMock.mockImplementation(commerceRouter()); prepareMock.mockRejectedValueOnce(new Error('Razorpay could not load in time'));
    render(<SubscriptionWorkspace view="catalog" />); fireEvent.click(await screen.findByRole('button', { name: /Buy Now/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Razorpay could not load in time');
    expect(commerceMutations()).toHaveLength(0); expect(payMock).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem(key)!).phase).toBe('quote');
    fireEvent.click(screen.getByRole('button', { name: 'Choose another plan' }));
    expect(sessionStorage.getItem(key)).toBeNull(); expect(await screen.findByRole('button', { name: /Buy Now/ })).toBeEnabled();
  });
  it('stops SDK preparation without issuing an order and allows choosing a plan again', async () => {
    fetchMock.mockImplementation(commerceRouter());
    prepareMock.mockImplementationOnce((signal: AbortSignal) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new Error('Checkout stopped')), { once: true });
    }));
    render(<SubscriptionWorkspace view="catalog" />); fireEvent.click(await screen.findByRole('button', { name: /Buy Now/ }));
    expect(await screen.findByText('Connecting to Razorpay…')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop connecting' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Checkout stopped');
    expect(commerceMutations()).toHaveLength(0); expect(payMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Choose another plan' }));
    expect(sessionStorage.getItem(key)).toBeNull();
  });
  it('closes a stalled checkout while preserving its order for the existing recovery flow', async () => {
    fetchMock.mockImplementation(commerceRouter());
    payMock.mockImplementationOnce((_order, _description, signal: AbortSignal) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new Error('Checkout stopped')), { once: true });
    }));
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    fireEvent.click(await screen.findByRole('button', { name: 'Close payment window' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Checkout stopped');
    expect(JSON.parse(sessionStorage.getItem(key)!).order.order.id).toBe('order_synthetic');
    expect(screen.getByRole('button', { name: /Buy Now/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Check payment status' })).toBeEnabled();
    expect(commerceMutations()).toHaveLength(2);
  });
  it('shows activation progress and retains payment evidence until the settlement receipt arrives', async () => {
    const route = commerceRouter(); let release!: (value: Response) => void;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/commerce') && JSON.parse(String(init?.body)).request.kind === 'settle') {
        return new Promise<Response>(resolve => { release = resolve; });
      }
      return route(url, init);
    });
    payMock.mockResolvedValue({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await screen.findByText('Verifying your payment and activating your plan…');
    expect(screen.queryByText(/Your plan is active/)).not.toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem(key)!).paymentId).toBe(paymentId);
    const command = commerceMutations().at(-1)!;
    await act(async () => { release(await route(command[0], command[1])); });
    expect(await screen.findByText(/Payment confirmed. Your plan is active/)).toBeInTheDocument();
    expect(sessionStorage.getItem(key)).toBeNull(); expect(payMock).toHaveBeenCalledOnce();
  });
  it('replays a saved confirmation directly when payment-status reads are unavailable', async () => {
    const behavior = { failSettlement: true }; const route = commerceRouter(behavior);
    fetchMock.mockImplementation(route);
    payMock.mockResolvedValue({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await screen.findByText('Settlement connection lost');
    const original = commerceMutations().at(-1)![1].body;
    behavior.failSettlement = false;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.endsWith('/commerce') && JSON.parse(String(init?.body)).request.kind === 'checkout'
      ? response({}, 503) : route(url, init));
    fireEvent.click(screen.getByRole('button', { name: 'Retry payment confirmation' }));
    await screen.findByText(/Payment confirmed/);
    expect(commerceMutations().at(-1)![1].body).toBe(original);
    expect(payMock).toHaveBeenCalledOnce(); expect(sessionStorage.getItem(key)).toBeNull();
    expect(fetchMock.mock.calls.filter(([url, init]) => url.endsWith('/commerce') && JSON.parse(String(init?.body)).request.kind === 'checkout')).toHaveLength(0);
  });
  it('purchases with references only, reviews exact owner pricing, and clears only a confirmed settlement', async () => {
    fetchMock.mockImplementation(commerceRouter());
    payMock.mockResolvedValue({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await screen.findByText(/Payment confirmed/);
    expect(screen.queryByText('Continue your checkout')).not.toBeInTheDocument();
    const quoteCommand = JSON.parse(fetchMock.mock.calls.find(([url]) => url.endsWith('/commerce'))![1].body);
    expect(quoteCommand.request).toMatchObject({ expectedVersion: 0, expectedRevisionId: revision, revisionId: revision, priceId: id(8), subject: { kind: 'user', id: actor } });
    expect(quoteCommand.request.subscriptionId).toMatch(/^[\da-f-]{36}$/);
    expect(await screen.findByText(/Payment confirmed/)).toBeInTheDocument();
    expect(sessionStorage.getItem(key)).toBeNull(); expect(payMock).toHaveBeenCalledOnce();
    expect(commerceMutations()).toHaveLength(3);
    expect(fetchMock.mock.calls.every(([url]) => url.startsWith('/api/subscriptions'))).toBe(true);
  });
  async function prepareRetainedQuote() {
    const hook = renderHook(() => useSubscriptionCheckout(executableCatalog));
    await waitFor(() => expect(hook.result.current.state.status).toBe('idle'));
    await act(async () => {
      await hook.result.current.quote({
        kind: 'quote', purpose: 'purchase',
        subscriptionId: id(80), subject: { kind: 'user', id: actor }, expectedVersion: 0,
        expectedRevisionId: revision, revisionId: revision, priceId: id(8)
      });
    });
    hook.unmount();
  }
  it('restores an unpaid quote for review without reporting payment uncertainty or starting an order', async () => {
    fetchMock.mockImplementation(commerceRouter());
    await prepareRetainedQuote();
    const raw = sessionStorage.getItem(key);
    expect(JSON.parse(raw!).phase).toBe('quote');
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('button', { name: 'Continue to payment' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(key)).toBe(raw);
    expect(commerceMutations()).toHaveLength(1);
    expect(payMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Choose another plan' }));
    expect(sessionStorage.getItem(key)).toBeNull();
    expect(await screen.findByRole('button', { name: /Buy Now/ })).toBeEnabled();
  });
  it('allows cancelling a failed quote without claiming a payment result', async () => {
    const route = commerceRouter();
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.endsWith('/commerce')
      ? Promise.reject(new Error('Quote connection lost')) : route(url, init));
    render(<SubscriptionWorkspace view="catalog" />);
    fireEvent.click(await screen.findByRole('button', { name: /Buy Now/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Quote connection lost');
    expect(screen.getByRole('alert')).not.toHaveTextContent('outcome may be uncertain');
    fireEvent.click(screen.getByRole('button', { name: 'Choose another plan' }));
    expect(sessionStorage.getItem(key)).toBeNull(); expect(payMock).not.toHaveBeenCalled();
  });
  it('persists order uncertainty before a lost order response and prevents quote cancellation after remount', async () => {
    const route = commerceRouter();
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/commerce') && JSON.parse(String(init?.body)).request.kind === 'order') {
        expect(JSON.parse(sessionStorage.getItem(key)!).phase).toBe('order_requested');
        return Promise.reject(new Error('Order response lost'));
      }
      return route(url, init);
    });
    const first = render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    expect(await screen.findByRole('alert')).toHaveTextContent('Order response lost');
    const raw = sessionStorage.getItem(key);
    first.unmount(); render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('previous checkout');
    expect(screen.queryByRole('button', { name: 'Choose another plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue to payment' })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(key)).toBe(raw); expect(payMock).not.toHaveBeenCalled();
  });
  describe('recovery when the order response was lost before any provider order was recorded', () => {
    function lostOrder(checkout: (command: { operationId: string; request: { quoteId: string } }) => Promise<Response>) {
      const route = commerceRouter();
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        const kind = url.endsWith('/commerce') ? JSON.parse(String(init?.body)).request.kind : null;
        if (kind === 'order') return Promise.reject(new Error('Order response lost'));
        if (kind === 'checkout') return checkout(JSON.parse(String(init?.body)));
        return route(url, init);
      });
    }
    it('releases the checkout only after the owner reports not issued, archiving exact references', async () => {
      lostOrder(command => response({ kind: 'checkout', status: 'not_issued', operationId: command.operationId, quoteId: command.request.quoteId }));
      render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
      expect(await screen.findByRole('alert')).toHaveTextContent('Order response lost');
      const raw = sessionStorage.getItem(key)!;
      fireEvent.click(screen.getByRole('button', { name: 'Check payment status' }));
      expect(await screen.findByText(/No payment was taken/)).toBeInTheDocument();
      expect(sessionStorage.getItem(key)).toBeNull();
      expect(sessionStorage.getItem(`${key}:archive:${JSON.parse(raw).quoteOperationId}`)).toBe(raw);
      expect(await screen.findByRole('button', { name: /Buy Now/ })).toBeEnabled();
      expect(payMock).not.toHaveBeenCalled();
    });
    it('keeps the lock and explains an order that is still being set up', async () => {
      lostOrder(command => response({ kind: 'checkout', status: 'order_pending', operationId: command.operationId, quoteId: command.request.quoteId }));
      render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
      const raw = await waitFor(() => sessionStorage.getItem(key)!);
      fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('still being set up. No payment has been taken');
      expect(sessionStorage.getItem(key)).toBe(raw);
      expect(screen.getByRole('button', { name: 'Check payment status' })).toBeEnabled();
      expect(screen.getByRole('button', { name: /Buy Now/ })).toBeDisabled();
    });
    it('shows a specific message for a deterministic owner rejection instead of a status code', async () => {
      lostOrder(() => response({ error: 'Subscription request rejected', reason: 'reconciliation_required' }, 409));
      render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
      fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('needs review by support before another payment');
      expect(screen.getByRole('alert')).not.toHaveTextContent('(409)');
      expect(sessionStorage.getItem(key)).not.toBeNull();
    });
    it('rejects a not-issued status when the tab already holds a provider order', async () => {
      const route = commerceRouter(); payMock.mockRejectedValueOnce(new Error('Checkout dismissed'));
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        const command = url.endsWith('/commerce') ? JSON.parse(String(init?.body)) : null;
        if (command?.request.kind === 'checkout') return response({ kind: 'checkout', status: 'not_issued', operationId: command.operationId, quoteId: command.request.quoteId });
        return route(url, init);
      });
      render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
      const raw = await waitFor(() => sessionStorage.getItem(key)!);
      fireEvent.click(await screen.findByRole('button', { name: 'Check payment status' }));
      expect(await screen.findByText('Saved payment evidence differs from the payment status. Contact support.')).toBeInTheDocument();
      expect(sessionStorage.getItem(key)).toBe(raw);
    });
  });
  it('keeps older journals without an explicit pre-order phase locked', async () => {
    fetchMock.mockImplementation(commerceRouter());
    await prepareRetainedQuote();
    const journal = JSON.parse(sessionStorage.getItem(key)!); delete journal.phase;
    sessionStorage.setItem(key, JSON.stringify(journal));
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('previous checkout');
    expect(screen.queryByRole('button', { name: 'Choose another plan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue to payment' })).not.toBeInTheDocument();
    expect(payMock).not.toHaveBeenCalled();
  });
  it.each(['dismissed', 'aborted'])('retains the exact journal after checkout %s and blocks another payment after remount', async failure => {
    fetchMock.mockImplementation(commerceRouter()); payMock.mockRejectedValue(new Error(`Checkout ${failure}`));
    const first = render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    expect(await screen.findByRole('alert')).toHaveTextContent(failure);
    const raw = sessionStorage.getItem(key); expect(JSON.parse(raw!).order.order.id).toBe('order_synthetic');
    first.unmount(); render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('previous checkout');
    expect(await screen.findByRole('button', { name: /Buy Now/ })).toBeDisabled();
    expect(sessionStorage.getItem(key)).toBe(raw); expect(payMock).toHaveBeenCalledOnce();
  });
  it('retains failed settlement and explicitly replays only its same operation without another charge', async () => {
    const route = commerceRouter({ failSettlement: true }); fetchMock.mockImplementation(route);
    payMock.mockResolvedValue({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    const first = render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await screen.findByRole('button', { name: 'Check payment status' });
    const originalCalls = commerceMutations();
    const original = originalCalls[originalCalls.length - 1][1].body;
    // Use the original authoritative quote from the saved journal for replay response.
    const saved = JSON.parse(sessionStorage.getItem(key)!);
    // A journal written before explicit settlement-request tracking already retained the original payment ID.
    delete saved.settlementRequest; sessionStorage.setItem(key, JSON.stringify(saved));
    first.unmount(); render(<SubscriptionWorkspace view="catalog" />);
    fetchMock.mockImplementation((url: string, init?: RequestInit) => url.endsWith('/commerce') && JSON.parse(String(init?.body)).request.kind === 'settle' ? response({
      kind: 'settlement', operationId: saved.settlementOperationId,
      quoteId: saved.quote.id, settlement: {
        id: saved.settlementOperationId, quoteId: saved.quote.id, subscriptionId: saved.quote.subscriptionId,
        productId: product, subject: saved.quote.subject, purpose: saved.quote.purpose, referenceId: null, providerPaymentId: paymentId,
        amountMinor: saved.quote.amountMinor, currency: saved.quote.currency, settledAt: 1500
      }
    }) : route(url, init));
    await reconcilePayment(); await screen.findByText(/Payment confirmed/);
    const replayCalls = commerceMutations();
    expect(replayCalls[replayCalls.length - 1][1].body).toBe(original);
    expect(payMock).toHaveBeenCalledOnce(); expect(sessionStorage.getItem(key)).toBeNull();
  });
  it.each([{ invalidOrder: true }, { mismatchSettlement: true }])('preserves uncertainty for malformed owner acknowledgements %j', async options => {
    fetchMock.mockImplementation(commerceRouter(options)); payMock.mockResolvedValue({ razorpay_order_id: 'order_synthetic', razorpay_payment_id: paymentId, razorpay_signature: 'synthetic' });
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await screen.findByRole('alert'); expect(sessionStorage.getItem(key)).not.toBeNull(); expect(screen.queryByText(/Payment confirmed/)).not.toBeInTheDocument();
    if (options.invalidOrder) expect(payMock).not.toHaveBeenCalled();
  });
  it('explicitly reconciles callback loss from the retained order after remount without reopening checkout', async () => {
    fetchMock.mockImplementation(commerceRouter()); payMock.mockRejectedValue(new Error('Callback lost'));
    const first = render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await screen.findByRole('button', { name: 'Check payment status' });
    expect(commerceMutations()).toHaveLength(2);
    const pending = JSON.parse(sessionStorage.getItem(key)!); expect(pending.paymentId).toBeUndefined(); expect(pending.order.order.id).toBe('order_synthetic');
    first.unmount(); render(<SubscriptionWorkspace view="catalog" />);
    await reconcilePayment();
    await screen.findByText(/Payment confirmed/);
    const calls = commerceMutations();
    const command = JSON.parse(calls[2][1].body);
    expect(command.operationId).toBe(pending.settlementOperationId);
    expect(command.request).toEqual({
      kind: 'settle', subscriptionId: pending.quote.subscriptionId, subject: pending.quote.subject,
      expectedVersion: 0, expectedRevisionId: revision, quoteId: pending.quote.id, reconcile: true
    });
    expect(payMock).toHaveBeenCalledOnce(); expect(calls).toHaveLength(3); expect(sessionStorage.getItem(key)).toBeNull();
  });
  it('persists the explicit reconciliation request before POST and replays it unchanged after uncertainty and remount', async () => {
    fetchMock.mockImplementation(commerceRouter({ failSettlement: true })); payMock.mockRejectedValue(new Error('Callback lost'));
    const first = render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await reconcilePayment();
    await screen.findByText('Settlement connection lost');
    const raw = sessionStorage.getItem(key); const saved = JSON.parse(raw!);
    expect(saved.settlementRequest.reconcile).toBe(true); expect(saved.settlementRequest).not.toHaveProperty('paymentId');
    const previousCalls = commerceMutations();
    const command = previousCalls[previousCalls.length - 1][1].body;
    first.unmount(); render(<SubscriptionWorkspace view="catalog" />);
    expect(sessionStorage.getItem(key)).toBe(raw);
    await reconcilePayment();
    await screen.findByText('Settlement connection lost');
    const replayCalls = commerceMutations();
    expect(replayCalls[replayCalls.length - 1][1].body).toBe(command); expect(payMock).toHaveBeenCalledOnce();
    expect(replayCalls.map(([, init]) => JSON.parse(init.body).request.kind)).toEqual(['quote', 'order', 'settle', 'settle']);
  });
  it.each(['productId', 'subject', 'quoteId', 'amountMinor', 'providerPaymentId'])('rejects mismatched owner reconciliation %s and retains tracking', async changed => {
    const route = commerceRouter();
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const result = await route(url, init);
      if (!url.endsWith('/commerce') || JSON.parse(String(init?.body)).request.kind !== 'settle') return result;
      const body = await result.json();
      body.settlement[changed] = changed === 'subject' ? { kind: 'user', id: id(99) } : changed === 'amountMinor' ? 1 : changed === 'providerPaymentId' ? 'invalid' : id(99);
      return response(body);
    });
    payMock.mockRejectedValue(new Error('Callback lost'));
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await reconcilePayment();
    await waitFor(() => expect(screen.getByRole('alert')).not.toHaveTextContent('Callback lost'));
    expect(sessionStorage.getItem(key)).not.toBeNull(); expect(payMock).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Payment confirmed/)).not.toBeInTheDocument();
  });
  it('sends no reconciliation when the exact request cannot be persisted', async () => {
    fetchMock.mockImplementation(commerceRouter()); payMock.mockRejectedValue(new Error('Callback lost'));
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await screen.findByRole('button', { name: 'Check payment status' });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Cannot persist intent'); });
    fireEvent.click(screen.getByRole('button', { name: 'Check payment status' })); await screen.findByText('Cannot persist intent');
    expect(commerceMutations()).toHaveLength(2); expect(sessionStorage.getItem(key)).not.toBeNull();
  });
  it('keeps quote/order uncertainty without a retained order in manual resolution', async () => {
    fetchMock.mockImplementation(commerceRouter({ invalidOrder: true }));
    render(<SubscriptionWorkspace view="catalog" />); await requestPurchase();
    await screen.findByRole('alert'); expect(screen.queryByRole('button', { name: 'Reconcile this payment' })).not.toBeInTheDocument();
    expect(payMock).not.toHaveBeenCalled();
  });
  it('requires exactly one explicit settlement selector', () => {
    const common = { kind: 'settle', subscriptionId: subscription, subject: row.subject, expectedVersion: 1, expectedRevisionId: revision, quoteId: id(90) };
    expect(commerceSettlementRequest.safeParse({ ...common, paymentId }).success).toBe(true);
    expect(commerceSettlementRequest.safeParse({ ...common, reconcile: true }).success).toBe(true);
    for (const extra of [{}, { reconcile: false }, { paymentId, reconcile: true }, { paymentId: 'invalid' }]) {
      expect(commerceSettlementRequest.safeParse({ ...common, ...extra }).success).toBe(false);
    }
  });
  it('sends no POST if tracking cannot be persisted', async () => {
    fetchMock.mockImplementation(commerceRouter()); vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Tracking unavailable'); });
    render(<SubscriptionWorkspace view="catalog" />); fireEvent.click(await screen.findByRole('button', { name: /Buy Now/ }));
    await screen.findByRole('alert'); expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/commerce'))).toBe(false);
  });
  it('renews from the current subject and expected state rather than creating another subscription', async () => {
    fetchMock.mockImplementation(commerceRouter()); render(<SubscriptionWorkspace />); await selectSubscription();
    fireEvent.change(screen.getByRole('combobox', { name: 'Plan' }), { target: { value: revision } });
    fireEvent.click(screen.getByRole('button', { name: /Renew Plan/ })); await screen.findByRole('alert');
    const command = JSON.parse(fetchMock.mock.calls.find(([url]) => url.endsWith('/commerce'))![1].body);
    expect(command.request).toMatchObject({ purpose: 'renew', subscriptionId: subscription, subject: row.subject, expectedVersion: 1, expectedRevisionId: revision });
    expect(payMock).toHaveBeenCalledOnce();
  });
});
