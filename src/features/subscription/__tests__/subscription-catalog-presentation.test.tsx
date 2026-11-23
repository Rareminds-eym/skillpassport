// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ascendingPlans, featureValue, formatPrice } from '../lib/subscriptionPresentation';
import { catalogSchema, type FeatureGrant } from '../api/subscriptionExecutionService';
import SubscriptionWorkspace from '../ui/SubscriptionWorkspace';
import SubscriptionCatalogSummary from '../ui/SubscriptionCatalogSummary';

const { fetchMock, accountQuery, identity } = vi.hoisted(() => ({ fetchMock: vi.fn(), accountQuery: vi.fn(), identity: { role: 'learner' as string | null } }));
vi.mock('../model/useSubscriptionQuery', () => ({ useSubscriptionQuery: accountQuery }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: fetchMock } }));
vi.mock('@/shared/api/httpClient', () => ({ DEFAULT_TIMEOUT: 30000 }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => null, useUserRole: () => ({ role: identity.role }) }));
vi.mock('../api/razorpayService', () => ({ payIssuedSubscriptionOrder: vi.fn(), prepareSubscriptionCheckout: vi.fn() }));
vi.mock('../ui/AddOnMarketplace', () => ({ default: ({ role }: { role: string }) => <p>Existing add-ons for {role}</p> }));
const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const features: FeatureGrant[] = Array.from({ length: 7 }, (_, index) => ({ key: `configured_feature_${index}`, type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: index + 1 } }));
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
  visibleCatalog = catalog; identity.role = 'learner';
  fetchMock.mockImplementation((url: string) => response(url === '/api/subscriptions/catalog' ? visibleCatalog : emptyDiscovery));
});
afterEach(cleanup);

describe('restored QA catalog presentation', () => {
  function activatedFree() {
    const subject = { kind: 'user', id: catalog.actorId };
    const row = { id: id(20), planId: offer.plan.id, productId: catalog.productId, subject, status: 'active', kind: 'initialized',
      revisionId: offer.revisionId, version: 1, lifecycleOperations: ['upgrade'] };
    const current = { schemaVersion: 1, actorId: catalog.actorId, audience: 'learner', activatedAt: 1000, subscriptionEndsAt: null,
      access: 'full', pools: [], features: [], plan: { ...offer.plan, name: offer.name, revisionNumber: 1 },
      state: { id: row.id, planId: row.planId, revisionId: row.revisionId, productId: catalog.productId, subject, version: 1,
        status: 'active', periodStartsAt: 1000, periodEndsAt: null, validity: 'perpetual', trialEndsAt: null,
        renewalEnabled: false, cancelledAt: null, paymentFailedAt: null, scheduledChange: null } };
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/subscriptions/catalog') return response(visibleCatalog);
      if (url === '/api/subscriptions') return response({ ...emptyDiscovery, items: [row] });
      if (url.includes('/current?')) return response(current);
      throw new Error('Unexpected synthetic request');
    });
  }
  it('formats published enum terms and acronyms consistently in cards and comparison cells', async () => {
    const terms = [
      {key: 'career_roadmap', type: 'enum', enabled: true, value: 'advanced_roadmap_with_milestone_tracking'},
      {key: 'profile_review', type: 'enum', enabled: true, value: 'ai_expert_assisted_review_as_add_on_included_by_policy'},
      {key: 'ai_credits', type: 'numeric_limit', enabled: true, limit: {kind: 'finite', value: 12}},
      {key: 'course_lte_assignments', type: 'numeric_limit', enabled: true, limit: {kind: 'finite', value: 25}},
    ];
    fetchMock.mockImplementation((url: string) => response(url === '/api/subscriptions/catalog'
      ? {...catalog, plans: [{...offer, features: terms}]} : emptyDiscovery));
    render(<SubscriptionWorkspace view="catalog" />);
    const card = await screen.findByRole('article', {name: offer.name});
    const comparison = screen.getByRole('region', {name: 'Plan comparison'});
    for (const container of [card, comparison]) {
      expect(container).toHaveTextContent('Advanced roadmap with milestone tracking');
      expect(container).toHaveTextContent('AI expert assisted review as add on included by policy');
      expect(container).toHaveTextContent('AI Credits');
      expect(container).toHaveTextContent('Course LTE Assignments');
      expect(container.textContent).not.toContain('_');
    }
    expect(within(comparison).getByRole('button', {name: 'Career 2 features'})).toBeInTheDocument();
    expect(comparison).toHaveAttribute('tabindex', '0');
    expect(fetchMock.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  });
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
    fireEvent.click(await screen.findByRole('button', { name: /Change Plan/ }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, options]) => options.method === 'POST')).toBe(true));
    const [, options] = fetchMock.mock.calls.find(([, init]) => init.method === 'POST')!;
    expect(JSON.parse(options.body).request).toMatchObject({ purpose: 'upgrade', subscriptionId: row.id, expectedVersion: 1,
      expectedRevisionId: row.revisionId, revisionId: offer.revisionId, subject });
    expect(screen.queryByRole('button', { name: /Buy Now/ })).not.toBeInTheDocument();
  });
  it('identifies the paid current plan separately from a selected offer and never asks to buy it again', async () => {
    const subject = { kind: 'user', id: catalog.actorId };
    const row = { id: id(20), planId: offer.plan.id, productId: catalog.productId, subject, status: 'active', kind: 'initialized',
      revisionId: offer.revisionId, version: 1, lifecycleOperations: ['renew', 'upgrade'] };
    const current = { schemaVersion: 1, actorId: catalog.actorId, audience: 'learner', activatedAt: 1000, subscriptionEndsAt: 9999999999999,
      access: 'full', pools: [], features: [], plan: { ...offer.plan, name: offer.name, revisionNumber: 1 },
      state: { id: row.id, planId: row.planId, revisionId: row.revisionId, productId: catalog.productId, subject, version: 1,
        status: 'active', periodStartsAt: 1000, periodEndsAt: 9999999999999, trialEndsAt: null,
        renewalEnabled: true, cancelledAt: null, paymentFailedAt: null, scheduledChange: null } };
    const other = { ...offer, plan: { ...offer.plan, id: id(8) }, revisionId: id(9), name: 'Another membership' };
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/subscriptions/catalog') return response({ ...catalog, plans: [offer, other] });
      if (url === '/api/subscriptions') return response({ ...emptyDiscovery, items: [row] });
      if (url.includes('/current?')) return response(current);
      throw new Error('Unexpected request');
    });
    render(<SubscriptionWorkspace view="catalog" selectedRevisionId={other.revisionId} />);
    const card = await screen.findByRole('article', {name: offer.name});
    expect(await within(card).findByText('Your current plan')).toBeInTheDocument();
    expect(within(card).getByRole('link', {name: 'Manage subscription'})).toHaveAttribute('href', '/subscription/manage');
    expect(within(card).queryByRole('button', {name: /Buy Now|Renew Plan|Change Plan|Upgrade Plan/})).not.toBeInTheDocument();
    expect(screen.getByRole('article', {name: other.name})).toHaveTextContent('Your selected plan');
    expect(within(screen.getByRole('article', {name: other.name})).getByRole('button', {name: /Change Plan/})).toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  });
  it('does not offer payment when current-subscription discovery fails', async () => {
    fetchMock.mockImplementation((url: string) => url === '/api/subscriptions/catalog' ? response(catalog) : response({}, 503));
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('503');
    expect(screen.queryByRole('button', { name: /Buy Now|Change Plan/ })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  });
  it('uses the prior page heading, rounded cards and comparison with current owner terms', async () => {
    render(<SubscriptionWorkspace view="catalog" catalogType="learner" selectedRevisionId={offer.revisionId} />);
    expect(screen.getByRole('heading', { name: 'Learner Subscription Plans' })).toBeInTheDocument();
    expect(screen.queryByText('Find your next chapter.')).not.toBeInTheDocument();
    const card = await screen.findByRole('article', { name: offer.name });
    expect(card).toHaveClass('rounded-3xl');
    expect(card.closest('[class*=catalogPage]')).toHaveClass('bg-gradient-to-b', 'from-blue-400', 'via-blue-100', 'to-white');
    expect(screen.getByRole('tab', { name: 'Subscription Plans' })).toHaveClass('bg-black');
    expect(card).toHaveAttribute('aria-current', 'true');
    expect(card).toHaveTextContent('From ₹4,567.89');
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
    activatedFree();
    render(<SubscriptionWorkspace view="catalog" />);
    const freeCard = await screen.findByRole('article', { name: offer.name });
    expect(within(freeCard).getByText('Free')).toBeInTheDocument();
    expect(await within(freeCard).findByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/learner/dashboard');
    expect(screen.queryByLabelText('Owner contract reference')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activate recorded contract' })).not.toBeInTheDocument();
    expect(freeCard).not.toHaveTextContent('₹4,567.89');
    const enterprise = screen.getByRole('article', { name: sales.name });
    expect(within(enterprise).getByRole('link', { name: 'Talk to Sales' })).toHaveAttribute('href', '/contact');
    expect(within(enterprise).queryByRole('button', { name: /Buy Now/ })).not.toBeInTheDocument();
  });
  it.each([['learner', '/learner/dashboard'], ['educator', '/educator/dashboard'], ['school_admin', '/school-admin/dashboard']])('takes free-access %s users to their dashboard without a purchase', async (role, route) => {
    identity.role = role;
    visibleCatalog = { ...catalog, plans: [{ ...offer, purchaseMode: 'free', prices: [] }] };
    activatedFree();
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', route);
    expect(screen.queryByText('View my access')).not.toBeInTheDocument();
    expect(screen.getByText('Free access is activated automatically after email verification.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  });
  it('surfaces missing role context instead of linking free access to an unrelated page', async () => {
    identity.role = null;
    visibleCatalog = { ...catalog, plans: [{ ...offer, purchaseMode: 'free', prices: [] }] };
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByText('Your dashboard is unavailable. Refresh your identity to continue.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Go to dashboard' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  });
  it('restores the account banner from the existing query without deriving purchase authority', () => {
    accountQuery.mockReturnValue({ subscriptionData: { planName: 'Existing account plan', status: 'active',
      startDate: '2026-11-01', endDate: '2027-01-01', features: [], billingCycle: 'monthly', autoRenew: true, reportedAutoRenew: true },
      loading: false, error: null, hasActiveOrPausedSubscription: true });
    render(<SubscriptionCatalogSummary title="Plans" subtitle="Choose a plan" />);
    expect(screen.getByRole('region', { name: 'Current subscription' })).toHaveTextContent('Existing account plan');
    expect(screen.getByText('Currently Active')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Manage Your Plan' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('shows cancelled read-only access in the account summary without promising unlimited access or active benefits', () => {
    accountQuery.mockReturnValue({ subscriptionData: { planName: 'Cancelled membership', status: 'cancelled', lifecycleAccess: 'read_only',
      startDate: '2026-11-01', endDate: null, features: ['sample roadmap'], billingCycle: 'free', reportedAutoRenew: false },
      loading: false, error: null, hasActiveOrPausedSubscription: false });
    render(<SubscriptionCatalogSummary title="Plans" subtitle="Choose a plan" />);
    const summary = screen.getByRole('region', { name: 'Current subscription' });
    expect(summary).toHaveTextContent('Cancelled membership');
    expect(summary).toHaveTextContent('Your subscription is cancelled. Read-only subscription access is available.');
    expect(summary).toHaveTextContent('No scheduled plan expiry');
    expect(within(summary).getByRole('heading', { name: 'Plan features' })).toBeInTheDocument();
    expect(summary).not.toHaveTextContent('Currently Active');
    expect(summary).not.toHaveTextContent('Paused');
    expect(summary).not.toHaveTextContent('Days Left');
    expect(summary).not.toHaveTextContent('No expiry');
    expect(screen.queryByText('Upgrade to unlock more features')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('renders enabled typed account features without treating objects as strings', () => {
    accountQuery.mockReturnValue({ subscriptionData: { planName: 'Existing account plan', status: 'active',
      startDate: '2026-11-01', endDate: null, features: [
        {key: 'career_roadmap', type: 'enum', enabled: true, value: 'sample_roadmap'},
        {key: 'assessment_access', type: 'boolean', enabled: false},
      ], billingCycle: 'free', autoRenew: false, reportedAutoRenew: false },
      loading: false, error: null, hasActiveOrPausedSubscription: true });
    render(<SubscriptionCatalogSummary title="Plans" subtitle="Choose a plan" />);
    const banner = screen.getByRole('region', {name: 'Current subscription'});
    expect(banner).toHaveTextContent('Career Roadmap');
    expect(banner).not.toHaveTextContent('assessment access');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('surfaces invalid account feature data without fabricating benefits', () => {
    accountQuery.mockReturnValue({ subscriptionData: { status: 'active', features: [{unexpected: true}] },
      loading: false, error: null, hasActiveOrPausedSubscription: true });
    render(<SubscriptionCatalogSummary title="Plans" subtitle="Choose a plan" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to read your current subscription features');
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


describe('subscription presentation accessibility and precision', () => {
  it('orders cards and comparison columns from free to higher equivalent prices without changing source data', async () => {
    const lower = {...offer, plan:{...offer.plan,id:id(31)},revisionId:id(32),name:'Lower membership',prices:[{...offer.prices[0],amountMinor:123400}]};
    const free = {...offer, plan:{...offer.plan,id:id(33)},revisionId:id(34),name:'Free membership',purchaseMode:'free',prices:[]};
    visibleCatalog = {...catalog,plans:[offer,lower,free]};
    const original = JSON.stringify(visibleCatalog);
    render(<SubscriptionWorkspace view="catalog" />);
    await screen.findByRole('article', {name: free.name});
    const names = [free.name,lower.name,offer.name];
    expect(screen.getAllByRole('article').map(card=>card.getAttribute('aria-label'))).toEqual(names);
    expect(within(screen.getByRole('table')).getAllByRole('columnheader').filter(cell=>cell.closest('thead')).slice(1).map(cell=>cell.firstElementChild?.textContent)).toEqual(names);
    expect(JSON.stringify(visibleCatalog)).toBe(original);
    expect(screen.getByRole('article',{name:lower.name})).toHaveTextContent('/ year');
    expect(screen.getByRole('article',{name:lower.name})).not.toHaveTextContent('per subscription');
  });
  it('compares exact prices across minor-unit precision while keeping different billing bases separate', () => {
    const make = (n:number,amountMinor:number,minorUnit:number,intervalUnit='year')=>({...offer,plan:{...offer.plan,id:id(n)},revisionId:id(n+1),prices:[{...offer.prices[0],amountMinor,minorUnit,intervalUnit}]});
    const plans = catalogSchema.parse({...catalog,plans:[make(40,1234,2),make(42,100,2,'month'),make(44,12339,3),{...make(46,1,2),purchaseMode:'contact_sales',prices:[]}]}).plans;
    expect(ascendingPlans(plans).map(plan=>plan.revisionId)).toEqual([plans[2].revisionId,plans[1].revisionId,plans[0].revisionId,plans[3].revisionId]);
  });
  it('describes published limits without inventing policy amounts or reset periods', () => {
    expect(featureValue({key:'ai_credits',type:'metered',enabled:true,limit:{kind:'allocation_policy'}})).toBe('Policy-based; amount not specified');
    expect(featureValue({key:'assessment_attempts',type:'numeric_limit',enabled:true,limit:{kind:'finite',value:2}})).toBe('2 attempts');
    expect(featureValue({key:'course_lte_assignments',type:'numeric_limit',enabled:true,limit:{kind:'finite',value:1}})).toBe('1 assignment');
  });
  it('groups Indian prices without rounding configured minor units', () => {
    expect(formatPrice(123456789, 2, 'INR')).toBe('₹12,34,567.89');
    expect(formatPrice(9007199254740991, 3, 'INR')).toBe('₹90,07,19,92,54,740.991');
    expect(formatPrice(12345, 3, 'USD')).toBe('USD 12.345');
    expect(formatPrice(0, 2, 'INR')).toBe('₹0');
    expect(formatPrice(250000, 2, 'INR')).toBe('₹2,500');
    expect(formatPrice(250050, 2, 'INR')).toBe('₹2,500.5');
    expect(formatPrice(250005, 2, 'INR')).toBe('₹2,500.05');
    expect(formatPrice(12000, 3, 'USD')).toBe('USD 12');
    expect(formatPrice(12010, 3, 'USD')).toBe('USD 12.01');
  });
  it('supports arrow, Home and End keys with a single tab stop', async () => {
    render(<SubscriptionWorkspace view="catalog" />);
    await screen.findByRole('article');
    const plans = screen.getByRole('tab', {name: 'Subscription Plans'});
    const addons = screen.getByRole('tab', {name: 'Add-Ons'});
    plans.focus(); fireEvent.keyDown(plans, {key: 'ArrowRight'});
    expect(addons).toHaveFocus(); expect(addons).toHaveAttribute('aria-selected', 'true');
    expect(plans).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(addons, {key: 'Home'});
    expect(plans).toHaveFocus(); expect(plans).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(plans, {key: 'End'}); expect(addons).toHaveFocus();
  });
  it('keeps focus on the comparison toggle after hiding and restoring the table', async () => {
    render(<SubscriptionWorkspace view="catalog" />); await screen.findByRole('article');
    fireEvent.click(screen.getByRole('button', {name:'Hide'}));
    expect(screen.getByRole('button', {name:'Show Feature Comparison'})).toHaveFocus();
    fireEvent.click(screen.getByRole('button', {name:'Show Feature Comparison'}));
    expect(screen.getByRole('button', {name:'Hide'})).toHaveFocus();
  });
  it('uses singular feature counts in comparison categories', async () => {
    visibleCatalog = {...catalog, plans:[{...offer, features:[{key:'support_tier',type:'enum',enabled:true,value:'priority_email'}]}]};
    render(<SubscriptionWorkspace view="catalog" />);
    expect(await screen.findByRole('button', {name:'Support 1 feature'})).toHaveTextContent('1 feature');
  });
  it('displays free-plan expiry and renewal from account data rather than assuming perpetual access', () => {
    accountQuery.mockReturnValue({ subscriptionData: {planName:'Free fixture',status:'active',startDate:'2026-11-01',endDate:null,features:[],billingCycle:'free',autoRenew:false,reportedAutoRenew:false},loading:false,error:null,hasActiveOrPausedSubscription:true });
    const {rerender}=render(<SubscriptionCatalogSummary title="Plans" subtitle="Choose" />);
    expect(screen.getByText('No expiry')).toBeInTheDocument(); expect(screen.getByText('Disabled')).toBeInTheDocument();
    accountQuery.mockReturnValue({ subscriptionData: {planName:'Free fixture',status:'active',startDate:'2026-11-01',endDate:'2026-12-01',features:[],billingCycle:'free',autoRenew:true,reportedAutoRenew:true},loading:false,error:null,hasActiveOrPausedSubscription:true });
    rerender(<SubscriptionCatalogSummary title="Plans" subtitle="Choose" />);
    expect(screen.queryByText('No expiry')).not.toBeInTheDocument(); expect(screen.getByText('December 1, 2026')).toBeInTheDocument(); expect(screen.getByText('Enabled')).toBeInTheDocument();
  });
});

it('does not claim renewal is enabled when the summary source omits it', () => {
  accountQuery.mockReturnValue({subscriptionData:{planName:'Free fixture',status:'active',startDate:'2026-11-01',endDate:null,features:[],billingCycle:'free',autoRenew:true,reportedAutoRenew:null},loading:false,error:null,hasActiveOrPausedSubscription:true});
  render(<SubscriptionCatalogSummary title="Plans" subtitle="Choose" />);
  expect(screen.queryByText('Enabled')).not.toBeInTheDocument();
  expect(screen.getByText('Not reported — check subscription details')).toBeInTheDocument();
});
