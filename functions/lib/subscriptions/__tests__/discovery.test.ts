import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet as catalog } from '../../../api/subscriptions/catalog';
import { onRequestGet as list } from '../../../api/subscriptions/index';
import type { PagesFunction } from '../../types';
import { SKILLPASSPORT_PRODUCT_ID } from '../../subscription-config';
const io = vi.hoisted(() => ({ user: {} as Record<string, unknown>, authenticated: true, list: vi.fn(), catalog: vi.fn(), projection: vi.fn(), inventory: vi.fn(), database: vi.fn() }));
vi.mock('../../auth', () => ({
  getAuthInstance: () => ({
    authenticate: (handler: (request: Request, auth: unknown) => Promise<Response>) =>
      (request: Request) => io.authenticated ? handler(request, { user: io.user }) : Response.json({}, { status: 401 })
  })
}));
vi.mock('../publication', () => ({
  readApplicationPlanProjections: async (...args: unknown[]) => {
    const stored = await io.projection(...args);
    return new Map([[stored.projection.bundle.draft.id, stored]]);
  }
}));
vi.mock('../catalog-inventory', () => ({
  catalogInventoryDatabase: io.database, readApplicationFeatureInventory: io.inventory,
  applicationFeatureDefinition: (value: unknown) => value
}));

const actor = 'a0000000-0000-4000-8000-000000000001', org = 'a0000000-0000-4000-8000-000000000002';
const id = 'b0000000-0000-4000-8000-000000000001', plan = 'c0000000-0000-4000-8000-000000000001';
const revision = 'd0000000-0000-4000-8000-000000000001', product = SKILLPASSPORT_PRODUCT_ID;
const binding = () => ({
  id, planId: plan, productId: product, subject: { kind: 'user', id: actor }, status: 'active',
  kind: 'initialized', revisionId: revision, version: 1, lifecycleOperations: ['cancel']
});
const discovery = () => ({ schemaVersion: 1, actorId: actor, productId: product, items: [binding()], nextCursor: id });
const terms = () => ({
  plan: { id: plan, code: `pln_${'a'.repeat(32)}`, productId: product }, revisionId: revision,
  revisionNumber: 1, name: 'Synthetic', audiences: ['synthetic'], purchaseMode: 'self_service',
  prices: [{
    id: actor, currency: 'TST', minorUnit: 2, amountMinor: 1234, intervalUnit: 'month', intervalCount: 1,
    quantityBasis: 'subscription', audiences: ['synthetic']
  }], features: [{ key: 'synthetic', type: 'boolean', enabled: true }]
});
const presentation = { priceLabel: 'starting_at', taxInclusive: false, badge: 'Synthetic badge', copy: null };
const listed = <T extends object>(value: T) => ({ ...value, presentation });
const tax = { kind: 'gst', rateBasisPoints: 1800, priceDisplay: 'exclusive' };
const catalogPage = () => ({ schemaVersion: 1, actorId: actor, productId: product, audience: 'synthetic', subjectKind: 'user', tax, plans: [listed(terms())], nextCursor: plan });
const projection = () => {
  const { revisionId, ...draft } = terms();
  return { projection: { bundle: { draft: { ...draft, id: revisionId, schemaVersion: 2 }, includedCredits: { rules: [] } } } };
};
const run = (handler: PagesFunction, query = '', bearer = true, configuration = {}) => handler({
  request: new Request('https://owner.invalid/api/subscriptions/test' + query,
    { headers: bearer ? { authorization: 'Bearer synthetic-token' } : {} }),
  env: { SKILLPASSPORT_PRODUCT_ID: product, SSO_SERVICE: { listSubscriptionExecutions: io.list, listPublishedSubscriptionPlans: io.catalog }, ...configuration },
  params: {}, data: {}, waitUntil: vi.fn(), next: vi.fn(),
} as unknown as Parameters<PagesFunction>[0]);
beforeEach(() => {
  vi.resetAllMocks(); io.authenticated = true;
  io.user = { sub: actor, org_id: org, membership_status: 'active', is_email_verified: true };
  io.list.mockResolvedValue(discovery()); io.catalog.mockResolvedValue(catalogPage()); io.projection.mockResolvedValue(projection());
  io.database.mockReturnValue({}); io.inventory.mockResolvedValue([{ key: 'synthetic', type: 'boolean' }]);
});
describe('subscription discovery and published catalog HTTP owner contracts', () => {
  it.each(['qa', 'production', 'development', undefined])('reads the canonical catalog without an external product ID in %s', async environment => {
    const productId = SKILLPASSPORT_PRODUCT_ID;
    const page = catalogPage();
    page.productId = productId;
    page.plans[0].plan.productId = productId;
    const stored = projection();
    stored.projection.bundle.draft.plan.productId = productId;
    io.catalog.mockResolvedValue(page);
    io.projection.mockResolvedValue(stored);
    const response = await run(catalog, '', true, { ENVIRONMENT: environment, SKILLPASSPORT_PRODUCT_ID: undefined });
    expect(response.status).toBe(200);
    expect(io.catalog).toHaveBeenCalledExactlyOnceWith('synthetic-token', productId,
      [{ key: 'synthetic', type: 'boolean' }], null);
    expect(await response.json()).toEqual(page);
  });
  it('still rejects a catalog from another product', async () => {
    io.catalog.mockResolvedValue({ ...catalogPage(), productId: actor });
    expect((await run(catalog)).status).toBe(503);
    expect(io.projection).not.toHaveBeenCalled();
  });
  it('forwards only the verified token, configured product and explicit cursor', async () => {
    const response = await run(list);
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual(discovery());
    expect(io.list).toHaveBeenCalledExactlyOnceWith('synthetic-token', product, null);
  });
  it.each(['?cursor=bad', '?cursor=' + id + '&cursor=' + id, '?actorId=' + actor, '?productId=' + product])('rejects query %s before owner access', async query => {
    expect((await run(list, query)).status).toBe(400); expect((await run(catalog, query)).status).toBe(400);
    expect(io.list).not.toHaveBeenCalled(); expect(io.catalog).not.toHaveBeenCalled(); expect(io.database).not.toHaveBeenCalled();
  });
  it('denies missing authentication, revoked membership and forced password changes', async () => {
    expect((await run(list, '', false)).status).toBe(401);
    io.user.membership_status = 'inactive'; expect((await run(list)).status).toBe(403);
    io.user.membership_status = 'active'; io.user.user_metadata = { must_change_password: true };
    expect((await run(catalog)).status).toBe(403); expect(io.list).not.toHaveBeenCalled(); expect(io.catalog).not.toHaveBeenCalled();
  });
  it('retains owner denial rather than returning empty success', async () => {
    io.list.mockResolvedValue({ kind: 'forbidden' }); io.catalog.mockResolvedValue({ kind: 'forbidden' });
    expect((await run(list)).status).toBe(403); expect((await run(catalog)).status).toBe(403); expect(io.projection).not.toHaveBeenCalled();
  });
  it.each(['actor', 'product', 'subject', 'organization', 'partial', 'duplicate', 'cursor'])('rejects discovery %s drift', async defect => {
    const value = discovery();
    if (defect === 'actor') value.actorId = org;
    if (defect === 'product') value.items[0].productId = org;
    if (defect === 'subject') value.items[0].subject.id = org;
    if (defect === 'organization') value.items[0].subject = { kind: 'organization', id: product };
    if (defect === 'partial') value.items[0].kind = 'uninitialized';
    if (defect === 'duplicate') value.items.push(value.items[0]);
    if (defect === 'cursor') value.nextCursor = actor;
    io.list.mockResolvedValue(value); expect((await run(list)).status).toBe(503);
  });
  it('accepts explicit uninitialized state and filtered page progress without fabricating terms', async () => {
    io.list.mockResolvedValue({ ...discovery(), items: [{ ...binding(), kind: 'uninitialized', revisionId: null, version: null, lifecycleOperations: [] }] });
    expect((await run(list)).status).toBe(200);
    io.list.mockResolvedValue({ ...discovery(), items: [] }); expect((await run(list)).status).toBe(200);
    io.list.mockResolvedValue({ ...discovery(), items: [], nextCursor: null }); expect((await run(list, '?cursor=' + id)).status).toBe(200);
    expect(io.projection).not.toHaveBeenCalled();
  });
  it('returns complete published terms only after independent app projection verification', async () => {
    const response = await run(catalog);
    expect(response.status).toBe(200); expect(await response.json()).toEqual(catalogPage());
    expect(io.catalog).toHaveBeenCalledExactlyOnceWith('synthetic-token', product, [{ key: 'synthetic', type: 'boolean' }], null);
    expect(io.projection).toHaveBeenCalledExactlyOnceWith({}, [{ planId: plan, revisionId: revision }], product, [{ key: 'synthetic', type: 'boolean' }]);
    expect(io.inventory).toHaveBeenCalledTimes(1);
  });
  it('preserves free offers through owner and application projection without inventing a billing interval', async () => {
    const value = { ...terms(), purchaseMode: 'free', prices: [] };
    io.catalog.mockResolvedValue({ ...catalogPage(), plans: [listed(value)] });
    const { revisionId, ...draft } = value;
    io.projection.mockResolvedValue({ projection: { bundle: { draft: { ...draft, id: revisionId, schemaVersion: 2 } } } });
    const response = await run(catalog);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ plans: [listed(value)] });
  });
  it.each(['missing', 'tax_display', 'tax_absent'])('refuses %s published display terms before reading projections', async defect => {
    const page: Record<string, unknown> = catalogPage();
    if (defect === 'missing') page.plans = [terms()];
    if (defect === 'tax_display') page.plans = [{ ...terms(), presentation: { ...presentation, taxInclusive: true } }];
    if (defect === 'tax_absent') delete page.tax;
    io.catalog.mockResolvedValue(page);
    expect((await run(catalog)).status).toBe(503);
    expect(io.projection).not.toHaveBeenCalled();
  });
  it('rejects a free offer carrying checkout prices before reading its projection', async () => {
    io.catalog.mockResolvedValue({ ...catalogPage(), plans: [listed({ ...terms(), purchaseMode: 'free' })] });
    expect((await run(catalog)).status).toBe(503);
    expect(io.projection).not.toHaveBeenCalled();
  });
  it.each([
    { type: 'numeric_limit', enabled: false, limit: { kind: 'contract_required' } },
    { type: 'metered', enabled: true, limit: { kind: 'finite', value: 5 } },
    { type: 'metered', enabled: true, limit: { kind: 'unlimited' } },
    { type: 'metered', enabled: false, limit: { kind: 'contract_required' } },
    { type: 'metered', enabled: true, limit: { kind: 'allocation_policy' } },
  ])('preserves canonical feature-grant variants %j', async grant => {
    const value = { ...terms(), features: [{ key: 'synthetic', ...grant }] };
    io.catalog.mockResolvedValue({ ...catalogPage(), plans: [listed(value)] });
    const { revisionId, ...draft } = value;
    io.projection.mockResolvedValue({ projection: { bundle: { draft: { ...draft, id: revisionId, schemaVersion: 2 } } } });
    const response = await run(catalog);
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ plans: [listed(value)] });
  });
  it.each(['price', 'feature', 'revision', 'product', 'extra'])('rejects published projection %s differences', async defect => {
    const stored = projection();
    if (defect === 'price') stored.projection.bundle.draft.prices[0].amountMinor++;
    if (defect === 'feature') stored.projection.bundle.draft.features[0].enabled = false;
    if (defect === 'revision') stored.projection.bundle.draft.id = actor;
    if (defect === 'product') stored.projection.bundle.draft.plan.productId = actor;
    if (defect === 'extra') Object.assign(stored.projection.bundle.draft, { fabricated: true });
    io.projection.mockResolvedValue(stored);
    expect((await run(catalog)).status).toBe(503);
  });
  it('does not read a legacy catalog or retry an unavailable projection', async () => {
    io.projection.mockRejectedValue(new Error('missing'));
    expect((await run(catalog)).status).toBe(503); expect(io.projection).toHaveBeenCalledTimes(1); expect(io.catalog).toHaveBeenCalledTimes(1);
  });
  it('returns empty success only for an explicit empty owner catalog', async () => {
    io.catalog.mockResolvedValue({ ...catalogPage(), plans: [], nextCursor: null });
    const response = await run(catalog); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ plans: [] }); expect(io.projection).not.toHaveBeenCalled();
  });
});
