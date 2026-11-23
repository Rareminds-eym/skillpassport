// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SubscriptionWorkspace from '../ui/SubscriptionWorkspace';
import SubscriptionCatalogSummary from '../ui/SubscriptionCatalogSummary';

const { fetchMock, accountQuery } = vi.hoisted(() => ({ fetchMock: vi.fn(), accountQuery: vi.fn() }));
vi.mock('../model/useSubscriptionQuery', () => ({ useSubscriptionQuery: accountQuery }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: fetchMock } }));
vi.mock('@/shared/api/httpClient', () => ({ DEFAULT_TIMEOUT: 30000 }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => null, useUserRole: () => ({ role: 'learner' }) }));
vi.mock('../api/razorpayService', () => ({ payIssuedSubscriptionOrder: vi.fn(), prepareSubscriptionCheckout: vi.fn() }));
vi.mock('../ui/AddOnMarketplace', () => ({ default: ({ role }: { role: string }) => <p>Existing add-ons for {role}</p> }));
const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const features = Array.from({ length: 7 }, (_, index) => ({ key: `configured_feature_${index}`, type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: index + 1 } }));
const offer = { plan: { id: id(3), code: 'configured-offer', productId: id(2) }, revisionId: id(4), revisionNumber: 1,
  name: 'Configured membership', audiences: ['learner'], purchaseMode: 'self_service', features,
  prices: [{ id: id(5), currency: 'INR', minorUnit: 2, amountMinor: 456789, intervalUnit: 'year', intervalCount: 1, quantityBasis: 'subscription', audiences: ['learner'] }],
  presentation: { priceLabel: 'starting_at', taxInclusive: false, badge: 'Configured badge', copy: null } };
const catalog = { schemaVersion: 1, actorId: id(1), productId: id(2), audience: 'learner', subjectKind: 'user',
  tax: { kind: 'gst', rateBasisPoints: 1800, priceDisplay: 'exclusive' }, plans: [offer], nextCursor: null };
const emptyDiscovery = { schemaVersion: 1, actorId: id(1), productId: id(2), items: [], nextCursor: null };
let visibleCatalog = catalog;
const response = (value: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(value), { status }));
beforeEach(() => {
  sessionStorage.clear(); fetchMock.mockReset(); accountQuery.mockReset();
  visibleCatalog = catalog;
  fetchMock.mockImplementation((url: string) => response(url === '/api/subscriptions/catalog' ? visibleCatalog : emptyDiscovery));
});
afterEach(cleanup);

describe('restored QA catalog presentation', () => {
  it('uses the existing free subscription for an upgrade even when it is on a later discovery page', async () => {
    const subject = { kind: 'user', id: catalog.actorId };
    const row = { id: id(20), planId: id(21), productId: catalog.productId, subject, status: 'active', kind: 'initialized',
      revisionId: id(22), version: 1, lifecycleOperations: ['upgrade'] };
    const current = { schemaVersion: 1, actorId: catalog.actorId, audience: 'learner', activatedAt: 1000, subscriptionEndsAt: null,
      access: 'full', pools: [], features: [], plan: { id: row.planId, code: 'free', productId: catalog.productId, name: 'Free', revisionNumber: 1 },
      state: { id: row.id, planId: row.planId, revisionId: row.revisionId, productId: catalog.productId, subject, version: 1,
        status: 'active', periodStartsAt: 1000, periodEndsAt: null, validity: 'perpetual', trialEndsAt: null,
        renewalEnabled: false, cancelledAt: null, paymentFailedAt: null, scheduledChange: null } };
    fetchMock.mockImplementation((url: string, options: RequestInit) => {
      if (url === '/api/subscriptions/catalog') return response(catalog);
      if (url === '/api/subscriptions') return response({ ...emptyDiscovery, nextCursor: id(10) });
      if (url.includes('cursor=')) return response({ ...emptyDiscovery, items: [row] });
      if (url.includes('/current?')) return response(current);
      if (options.method === 'POST') return response({}, 503);
      throw new Error('Unexpected request');
    });
    render(<SubscriptionWorkspace view="catalog" />);
    fireEvent.click(await screen.findByRole('button', { name: /Upgrade Plan/ }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, options]) => options.method === 'POST')).toBe(true));
    const [, options] = fetchMock.mock.calls.find(([, init]) => init.method === 'POST')!;
    expect(JSON.parse(options.body).request).toMatchObject({ purpose: 'upgrade', subscriptionId: row.id, expectedVersion: 1,
      expectedRevisionId: row.revisionId, revisionId: offer.revisionId, subject });
    expect(screen.queryByRole('button', { name: /Buy Now/ })).not.toBeInTheDocument();
  });
  it('does not offer payment when current-subscription discovery fails', async () => {
    fetchMock.mockImplementation((url: string) => url === '/api/subscriptions/catalog' ? response(catalog) : response({}, 503));
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('503');
    expect(screen.queryByRole('button', { name: /Buy Now|Upgrade Plan/ })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  });
  it('uses the prior page heading, rounded cards and comparison with current owner terms', async () => {
    render(<SubscriptionWorkspace view="catalog" catalogType="learner" selectedRevisionId={offer.revisionId} />);
    expect(screen.getByRole('heading', { name: 'Learner Subscription Plans' })).toBeInTheDocument();
    expect(screen.queryByText('Find your next chapter.')).not.toBeInTheDocument();
    const card = await screen.findByRole('article', { name: offer.name });
    expect(card).toHaveClass('rounded-3xl');
    expect(card.closest('main')).toHaveClass('bg-gradient-to-b', 'from-blue-400', 'via-blue-100', 'to-white');
    expect(screen.getByRole('tab', { name: 'Subscription Plans' })).toHaveClass('bg-black');
    expect(card).toHaveAttribute('aria-current', 'true');
    expect(card).toHaveTextContent('From INR 4567.89');
    expect(card).toHaveTextContent('+18% GST');
    expect(card).toHaveTextContent('Configured badge');
    expect(within(card).queryByText('Configured Feature 6')).not.toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: 'Show all 7 features' }));
    expect(within(card).getByText('Configured Feature 6')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('Configured Feature 6');
    fireEvent.click(screen.getByRole('button', { name: 'Extras 7 features' }));
    expect(screen.getByRole('table')).not.toHaveTextContent('Configured Feature 6');
    fireEvent.click(screen.getByRole('button', { name: 'Extras 7 features' }));
    expect(screen.getByRole('table')).toHaveTextContent('Configured Feature 6');
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([url, options]) => ['/api/subscriptions/catalog', '/api/subscriptions'].includes(url) && options.method === 'GET')).toBe(true);
  });
  it('restores the existing add-ons tab without losing the selected card or creating checkout requests', async () => {
    render(<SubscriptionWorkspace view="catalog" />);
    await screen.findByRole('article', { name: offer.name });
    fireEvent.click(screen.getByRole('tab', { name: 'Add-Ons' }));
    expect(await screen.findByText('Existing add-ons for learner')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Subscription Plans' }));
    expect(screen.getByRole('article', { name: offer.name })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('displays free and sales-led offers without fabricating paid prices', async () => {
    const free = { ...offer, purchaseMode: 'free', prices: [] };
    const sales = { ...offer, plan: { ...offer.plan, id: id(8) }, revisionId: id(9), name: 'Configured enterprise', purchaseMode: 'contact_sales', prices: [] };
    visibleCatalog = { ...catalog, plans: [free, sales] };
    render(<SubscriptionWorkspace view="catalog" />);
    const freeCard = await screen.findByRole('article', { name: offer.name });
    expect(within(freeCard).getByText('Free')).toBeInTheDocument();
    expect(await within(freeCard).findByRole('link', { name: 'View my access' })).toHaveAttribute('href', '/subscription/manage');
    expect(screen.queryByLabelText('Owner contract reference')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activate recorded contract' })).not.toBeInTheDocument();
    expect(freeCard).not.toHaveTextContent('INR 4567.89');
    const enterprise = screen.getByRole('article', { name: sales.name });
    expect(within(enterprise).getByRole('link', { name: 'Talk to Sales' })).toHaveAttribute('href', '/contact');
    expect(within(enterprise).queryByRole('button', { name: /Buy Now/ })).not.toBeInTheDocument();
  });
  it('restores the account banner from the existing query without deriving purchase authority', () => {
    accountQuery.mockReturnValue({ subscriptionData: { planName: 'Existing account plan', status: 'active',
      startDate: '2026-11-01', endDate: '2027-01-01', features: [], billingCycle: 'monthly', autoRenew: true },
      loading: false, error: null, hasActiveOrPausedSubscription: true });
    render(<SubscriptionCatalogSummary title="Plans" subtitle="Choose a plan" />);
    expect(screen.getByRole('region', { name: 'Current subscription' })).toHaveTextContent('Existing account plan');
    expect(screen.getByText('Currently Active')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Manage Your Plan' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('surfaces account read errors without substituting a successful subscription summary', () => {
    const refresh = vi.fn();
    accountQuery.mockReturnValue({ error: new Error('Unavailable'), refreshSubscription: refresh });
    render(<SubscriptionCatalogSummary title="Plans" subtitle="Choose a plan" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load your current subscription.');
    expect(screen.queryByRole('region', { name: 'Current subscription' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try reading again' }));
    expect(refresh).toHaveBeenCalledOnce();
  });

});
