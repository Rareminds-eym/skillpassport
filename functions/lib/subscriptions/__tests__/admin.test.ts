import { SKILLPASSPORT_PRODUCT_ID } from '../../subscription-config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
const auth = vi.hoisted(() => ({ user: {} as Record<string, unknown>, valid: true }));
vi.mock('../../auth', () => ({ getAuthInstance: () => ({
  authenticate: (handler: (request: Request, context: unknown) => Promise<Response>) => (request: Request) => auth.valid
    ? handler(request, { user: auth.user }) : Promise.resolve(Response.json({ error: 'Invalid token' }, { status: 401 })),
}) }));
import { onRequestGet as catalog } from '../../../api/admin/subscriptions/catalog';
import { onRequestGet as commercial } from '../../../api/admin/subscriptions/authoring/context';
import { onRequestGet as credit } from '../../../api/admin/subscriptions/authoring/credits/context';
import { onRequestPost as drafts } from '../../../api/admin/subscriptions/authoring/drafts';
import { onRequestPost as publications } from '../../../api/admin/subscriptions/publications';
import type { PagesFunction } from '../../types';

const actor = 'a0000000-0000-4000-8000-000000000001', id = 'b0000000-0000-4000-8000-000000000001';
const product = SKILLPASSPORT_PRODUCT_ID, revision = 'd0000000-0000-4000-8000-000000000001';
const platform = '00000000-0000-0000-0000-000000000001';
const plan = { id, productId: product, code: `pln_${'a'.repeat(32)}` };
const settings = () => ({ schemaVersion: 1, plan, audiences: ['college'], currencies: [{ code: 'INR', minorUnit: 2 }],
  credit: { schemaVersion: 1, pools: [], timePolicies: [] } });
const bundle = () => ({ schemaVersion: 1, draft: { id: revision, plan }, includedCredits: { revisionId: revision } });
const receipt = () => ({ bundle: bundle(), stagedBy: actor, stagedAt: '2026-11-18T12:00:00Z' });
const publicationInput = () => ({ planId: id, revisionId: revision, expectedPreviousRevisionId: null });
const publicationReceipt = () => ({ planId: id, revisionId: revision, previousRevisionId: null,
  publishedBy: actor, publishedAt: '2026-11-19T12:00:00Z' });
const projection = () => ({ schemaVersion: 1, bundle: { schemaVersion: 1, draft: { schemaVersion: 2,
  id: revision, revisionNumber: 1, plan, name: 'Synthetic offer', audiences: ['college'], purchaseMode: 'contact_sales', prices: [],
  features: [{ key: 'ai', type: 'metered', enabled: false, limit: { kind: 'allocation_policy' } }] },
  includedCredits: { schemaVersion: 1, id: product, revisionId: revision, funding: 'included', rules: [] } },
  entitlements: [{ plan_id: id, feature_id: id, is_enabled: false, value_numeric: null, value_text: null }] });
const sso = { getUserById: vi.fn(), getUserMemberships: vi.fn(), getSubscriptionCatalogInventory: vi.fn(),
  getSubscriptionPlanAuthoringContext: vi.fn(), getSubscriptionCreditAuthoringContext: vi.fn(), stageSubscriptionPlanRevisionBundle: vi.fn(),
  prepareSubscriptionPlanPublication: vi.fn(), publishSubscriptionPlanRevision: vi.fn() };
let transport = vi.fn<typeof fetch>();
// The unit test stubs signed authentication only. It does not certify JWT verification or deployed bindings.
function run(handler: PagesFunction, query = '', body?: string, bearer = true, contentType = 'application/json') {
  return handler({ request: new Request(`https://owner.example.invalid/api/admin/subscriptions/test${query}`, {
    method: body === undefined ? 'GET' : 'POST', headers: { ...(bearer ? { authorization: 'Bearer synthetic-token' } : {}), 'content-type': contentType }, body,
  }), env: { SSO_SERVICE: sso, SKILLPASSPORT_PRODUCT_ID: product, SUPABASE_URL: 'https://app.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-key' },
  data: {}, params: {}, waitUntil: vi.fn(), next: vi.fn() } as unknown as Parameters<PagesFunction>[0]);
}
beforeEach(() => {
  vi.resetAllMocks(); auth.valid = true;
  auth.user = { sub: actor, org_id: platform, roles: ['super_admin'], membership_status: 'active', is_email_verified: true };
  sso.getUserById.mockResolvedValue({ id: actor, is_blocked: false, is_email_verified: true });
  sso.getUserMemberships.mockResolvedValue({ memberships: [{ org_id: platform, status: 'active', roles: ['super_admin'] }] });
  sso.getSubscriptionCatalogInventory.mockResolvedValue({ schemaVersion: 1, plans: [
    { ...plan, name: 'Dynamic plan', isActive: true, applicableEntities: ['college'] },
    { ...plan, id: actor, code: 'legacy', productId: null, name: 'Unscoped', isActive: true, applicableEntities: [] },
    { ...plan, id: product, code: 'other', productId: actor, name: 'Other product', isActive: true, applicableEntities: [] },
  ] });
  const { credit: _, ...ordinary } = settings();
  sso.getSubscriptionPlanAuthoringContext.mockResolvedValue(ordinary);
  sso.getSubscriptionCreditAuthoringContext.mockResolvedValue(settings());
  sso.stageSubscriptionPlanRevisionBundle.mockResolvedValue({ kind: 'staged', receipt: receipt() });
  sso.prepareSubscriptionPlanPublication.mockResolvedValue({ kind: 'prepared', projection: projection(), preparedBy: actor });
  sso.publishSubscriptionPlanRevision.mockResolvedValue({ kind: 'published', receipt: publicationReceipt() });
  transport = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/stage_subscription_plan_projection')) {
      const request = JSON.parse(String(init?.body));
      return Response.json({ projection: request.p_projection, stagedBy: request.p_actor_id, stagedAt: '2026-11-19T12:00:00Z' });
    }
    return Response.json(url.searchParams.has('id') ? []
      : [{ id, feature_key: 'ai', display_name: 'AI', feature_type: 'metered', value_options: null, category: 'ai' }]);
  });
  vi.stubGlobal('fetch', transport);
});
afterEach(() => vi.unstubAllGlobals());

describe('SkillPassport subscription owner endpoint contracts', () => {
  it('carries owner enum options through both contexts and staging without trusting HTTP definitions', async () => {
    transport.mockImplementation(async input => Response.json(new URL(String(input)).searchParams.has('id') ? []
      : [{ id, feature_key: 'synthetic_choice', display_name: 'Synthetic choice', feature_type: 'enum',
        value_options: ['option_b', 'option_a'], category: 'synthetic' }]));
    for (const handler of [commercial, credit]) {
      const response = await run(handler, `?planId=${id}`);
      expect(response.status).toBe(200);
      expect(z.object({ features: z.array(z.record(z.unknown())) }).parse(await response.json()).features[0])
        .toMatchObject({ type: 'enum', options: ['option_b', 'option_a'] });
    }
    expect((await run(drafts, '', JSON.stringify({ bundle: bundle() }))).status).toBe(200);
    expect(sso.stageSubscriptionPlanRevisionBundle).toHaveBeenCalledExactlyOnceWith('synthetic-token', bundle(), product,
      [{ key: 'synthetic_choice', type: 'enum', options: ['option_b', 'option_a'] }]);
    expect((await run(drafts, '', JSON.stringify({ bundle: bundle(), features: [{ key: 'synthetic_choice', type: 'enum', options: ['forged'] }] }))).status).toBe(400);
    expect(sso.stageSubscriptionPlanRevisionBundle).toHaveBeenCalledTimes(1);
  });
  it('returns only this product catalog, excluding ambiguous legacy and other-product rows', async () => {
    const response = await run(catalog); expect(response.status).toBe(200);
    expect(z.object({ plans: z.array(z.object({ id: z.string() })) }).parse(await response.json()).plans.map(value => value.id)).toEqual([id]);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(sso.getUserMemberships.mock.invocationCallOrder[0]).toBeLessThan(transport.mock.invocationCallOrder[0]);
  });
  it.each([commercial, credit])('returns canonical context with app-owned feature definitions', async handler => {
    const response = await run(handler, `?planId=${id}`); expect(response.status).toBe(200);
    expect(z.record(z.unknown()).parse(await response.json()).features).toEqual([{ id, key: 'ai', name: 'AI', type: 'metered', category: 'ai' }]);
  });
  it('stages exactly once using signed actor token and owner feature definitions', async () => {
    const response = await run(drafts, '', JSON.stringify({ bundle: bundle() }));
    expect(response.status).toBe(200); expect(await response.json()).toEqual(receipt());
    expect(sso.stageSubscriptionPlanRevisionBundle).toHaveBeenCalledExactlyOnceWith('synthetic-token', bundle(), product, [{ key: 'ai', type: 'metered' }]);
  });
  it('denies cookie-only requests before live or data IO', async () => {
    expect((await run(catalog, '', undefined, false)).status).toBe(401);
    expect(sso.getUserById).not.toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled();
  });
  it('preserves invalid signature rejection from auth-core', async () => {
    auth.valid = false; const response = await run(catalog); expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('private, no-store'); expect(sso.getUserById).not.toHaveBeenCalled();
  });
  it.each([{ sub: 'bad' }, { org_id: product }, { roles: ['admin'] }, { membership_status: 'suspended' },
    { is_email_verified: false }, { user_metadata: { must_change_password: true } }])('denies insufficient signed authority %j', async change => {
    Object.assign(auth.user, change); expect((await run(catalog)).status).toBe(403);
    expect(sso.getUserById).not.toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, { id: product, is_blocked: false, is_email_verified: true }, { id: actor, is_blocked: true, is_email_verified: true },
    { id: actor, is_email_verified: true }, { id: actor, is_blocked: false, is_email_verified: false },
    { id: actor, is_blocked: false, is_email_verified: true, user_metadata: { must_change_password: true } }])('denies inactive or mismatched live actor %j', async identity => {
    sso.getUserById.mockResolvedValue(identity); expect((await run(catalog)).status).toBe(403); expect(transport).not.toHaveBeenCalled();
  });
  it.each([[], [{ org_id: product, status: 'active', roles: ['super_admin'] }], [{ org_id: platform, status: 'suspended', roles: ['super_admin'] }],
    [{ org_id: platform, status: 'active', roles: ['admin'] }], [{ org_id: platform, status: 'active', role: 'super_admin' }]].map(memberships => ({ memberships })))('requires explicit live platform authority %j', async ({ memberships }) => {
    sso.getUserMemberships.mockResolvedValue({ memberships }); expect((await run(catalog)).status).toBe(403);
    expect(transport).not.toHaveBeenCalled();
  });
  it('surfaces live authority failure without reading or staging', async () => {
    sso.getUserMemberships.mockRejectedValue(new Error('sensitive'));
    const response = await run(catalog); expect(response.status).toBe(503); expect(await response.text()).not.toContain('sensitive');
    expect(transport).not.toHaveBeenCalled(); expect(sso.stageSubscriptionPlanRevisionBundle).not.toHaveBeenCalled();
  });
  it.each(['', '?planId=bad', `?planId=${id}&planId=${id}`, `?planId=${id}&productId=${product}`])('rejects invalid query %s before app IO', async query => {
    expect((await run(commercial, query)).status).toBe(400); expect(transport).not.toHaveBeenCalled();
  });
  it.each([{ actorId: actor, bundle: bundle() }, { registry: {}, bundle: bundle() }, {}, { bundle: null }])('rejects caller authority/registry or invalid staging envelope %j', async value => {
    expect((await run(drafts, '', JSON.stringify(value))).status).toBe(400);
    expect(sso.getSubscriptionCreditAuthoringContext).not.toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled();
  });
  it('bounds streamed staging bytes and rejects malformed JSON, query and media type', async () => {
    expect((await run(drafts, '', ' '.repeat(262145))).status).toBe(413);
    expect((await run(drafts, '', '{')).status).toBe(400);
    expect((await run(drafts, '?actorId=x', '{}')).status).toBe(400);
    expect((await run(drafts, '', '{}', true, 'text/plain')).status).toBe(400);
    expect(sso.stageSubscriptionPlanRevisionBundle).not.toHaveBeenCalled(); expect(transport).not.toHaveBeenCalled();
  });
  it('rejects another canonical product before app IO or staging', async () => {
    sso.getSubscriptionCreditAuthoringContext.mockResolvedValue({ ...settings(), plan: { ...plan, productId: actor } });
    expect((await run(drafts, '', JSON.stringify({ bundle: bundle() }))).status).toBe(503);
    expect(transport).not.toHaveBeenCalled(); expect(sso.stageSubscriptionPlanRevisionBundle).not.toHaveBeenCalled();
  });
  it.each([{ kind: 'invalid', status: 400 }, { kind: 'forbidden', status: 403 }])('preserves canonical staging denial %j', async value => {
    sso.stageSubscriptionPlanRevisionBundle.mockResolvedValue({ kind: value.kind });
    expect((await run(drafts, '', JSON.stringify({ bundle: bundle() }))).status).toBe(value.status);
    expect(sso.stageSubscriptionPlanRevisionBundle).toHaveBeenCalledTimes(1);
  });
  it.each([null, {}, { kind: 'staged' }, { kind: 'staged', receipt: { ...receipt(), stagedBy: product } },
    { kind: 'staged', receipt: { ...receipt(), bundle: { ...bundle(), draft: { id: actor, plan } } } },
    { kind: 'staged', receipt: { ...receipt(), bundle: { ...bundle(), includedCredits: { revisionId: actor } } } },
    { kind: 'staged', receipt: { ...receipt(), bundle: { ...bundle(), draft: { id: revision, plan: { ...plan, productId: actor } } } } }])('does not acknowledge malformed or misbound receipt %j', async value => {
    sso.stageSubscriptionPlanRevisionBundle.mockResolvedValue(value);
    expect((await run(drafts, '', JSON.stringify({ bundle: bundle() }))).status).toBe(503);
    expect(sso.stageSubscriptionPlanRevisionBundle).toHaveBeenCalledTimes(1);
  });
  it('never retries an uncertain write', async () => {
    sso.stageSubscriptionPlanRevisionBundle.mockRejectedValue(new Error('sensitive write detail'));
    const response = await run(drafts, '', JSON.stringify({ bundle: bundle() }));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('sensitive');
    expect(sso.stageSubscriptionPlanRevisionBundle).toHaveBeenCalledTimes(1);
  });

  it('publishes only after signed/live authority, SSO preparation and actual application snapshot staging', async () => {
    const response = await run(publications, '', JSON.stringify(publicationInput()));
    expect(response.status).toBe(200); expect(await response.json()).toEqual(publicationReceipt());
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(sso.prepareSubscriptionPlanPublication).toHaveBeenCalledExactlyOnceWith('synthetic-token', id, revision, product,
      [{ id, key: 'ai', type: 'metered' }]);
    expect(sso.publishSubscriptionPlanRevision).toHaveBeenCalledExactlyOnceWith('synthetic-token', id, revision, null, product,
      [{ id, key: 'ai', type: 'metered' }]);
    const writes = transport.mock.calls.filter(([target]) => new URL(String(target)).pathname.endsWith('/stage_subscription_plan_projection'));
    expect(writes).toHaveLength(1);
    expect(JSON.parse(String(writes[0][1]?.body))).toMatchObject({ p_projection: projection(), p_actor_id: actor, p_product_id: product });
    expect(sso.prepareSubscriptionPlanPublication.mock.invocationCallOrder[0]).toBeLessThan(transport.mock.invocationCallOrder[
      transport.mock.calls.indexOf(writes[0])]);
    expect(transport.mock.invocationCallOrder[transport.mock.calls.indexOf(writes[0])])
      .toBeLessThan(sso.publishSubscriptionPlanRevision.mock.invocationCallOrder[0]);
  });
  it.each([{}, { ...publicationInput(), ready: true }, { ...publicationInput(), actorId: actor },
    { ...publicationInput(), expectedPreviousRevisionId: undefined }, { ...publicationInput(), revisionId: 'invalid' }])(
    'rejects caller authority/readiness or malformed references before app data IO %#', async value => {
      expect((await run(publications, '', JSON.stringify(value))).status).toBe(400);
      expect(transport).not.toHaveBeenCalled(); expect(sso.prepareSubscriptionPlanPublication).not.toHaveBeenCalled();
    });
  it('denies publication without bearer or live permission before preparing or staging', async () => {
    expect((await run(publications, '', JSON.stringify(publicationInput()), false)).status).toBe(401);
    sso.getUserMemberships.mockResolvedValue({ memberships: [] });
    expect((await run(publications, '', JSON.stringify(publicationInput()))).status).toBe(403);
    expect(transport).not.toHaveBeenCalled(); expect(sso.publishSubscriptionPlanRevision).not.toHaveBeenCalled();
  });
  it.each(['actor', 'plan', 'revision', 'product'] as const)('rejects misbound prepared %s before staging', async field => {
    const prepared = { kind: 'prepared', projection: projection(), preparedBy: actor };
    if (field === 'actor') prepared.preparedBy = product;
    if (field === 'plan') prepared.projection.bundle.draft.plan = { ...plan, id: actor };
    if (field === 'revision') prepared.projection.bundle.draft.id = actor;
    if (field === 'product') prepared.projection.bundle.draft.plan = { ...plan, productId: actor };
    sso.prepareSubscriptionPlanPublication.mockResolvedValue(prepared);
    expect((await run(publications, '', JSON.stringify(publicationInput()))).status).toBe(503);
    expect(transport.mock.calls.some(([target]) => new URL(String(target)).pathname.endsWith('/stage_subscription_plan_projection'))).toBe(false);
    expect(sso.publishSubscriptionPlanRevision).not.toHaveBeenCalled();
  });
  it('does not publish or retry after an uncertain application staging write', async () => {
    const original = transport.getMockImplementation()!;
    transport.mockImplementation(async (input, init) => {
      if (new URL(String(input)).pathname.endsWith('/stage_subscription_plan_projection')) throw new Error('Synthetic uncertain staging');
      return original(input, init);
    });
    expect((await run(publications, '', JSON.stringify(publicationInput()))).status).toBe(503);
    expect(transport.mock.calls.filter(([target]) => new URL(String(target)).pathname.endsWith('/stage_subscription_plan_projection'))).toHaveLength(1);
    expect(sso.publishSubscriptionPlanRevision).not.toHaveBeenCalled();
  });
  it('surfaces uncertain SSO publication without retry, compensation or success', async () => {
    sso.publishSubscriptionPlanRevision.mockRejectedValue(new Error('Synthetic uncertain publication'));
    expect((await run(publications, '', JSON.stringify(publicationInput()))).status).toBe(503);
    expect(sso.publishSubscriptionPlanRevision).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls.filter(([target]) => new URL(String(target)).pathname.endsWith('/stage_subscription_plan_projection'))).toHaveLength(1);
  });
  it.each([null, { kind: 'published', receipt: { ...publicationReceipt(), publishedBy: product } },
    { kind: 'published', receipt: { ...publicationReceipt(), previousRevisionId: actor } }])('rejects a malformed/misbound publication acknowledgement %#', async value => {
    sso.publishSubscriptionPlanRevision.mockResolvedValue(value);
    expect((await run(publications, '', JSON.stringify(publicationInput()))).status).toBe(503);
    expect(sso.publishSubscriptionPlanRevision).toHaveBeenCalledTimes(1);
  });
});
