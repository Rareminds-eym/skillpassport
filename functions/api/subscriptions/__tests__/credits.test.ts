import { SKILLPASSPORT_PRODUCT_ID } from '../../../lib/subscription-config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ authenticated: true, prepare: vi.fn(), refresh: vi.fn(), inventory: vi.fn(), database: vi.fn(), promo: vi.fn(), current: vi.fn(), projection: vi.fn(), creditRead: vi.fn(), consume: vi.fn() }));
vi.mock('../../../shared/lib/promo-access', () => ({ promoPaymentRequired: io.promo }));
vi.mock('../../../lib/subscriptions/current-subscription', async original => ({ ...await original<object>(), readCurrentSubscriptionOwner: io.current }));
vi.mock('../../../lib/subscriptions/publication', () => ({ readApplicationPlanProjection: io.projection }));
vi.mock('../../../lib/subscriptions/credits', async original => ({ ...await original<object>(), readSubscriptionCreditConsumption: io.creditRead, consumeSubscriptionCredits: io.consume }));
vi.mock('../../../lib/auth', () => ({ getAuthInstance: () => ({ authenticate: (handler: (request: Request, auth: unknown) => Promise<Response>) =>
  (request: Request) => io.authenticated ? handler(request, { user: { sub: id(1), membership_status: 'active', is_email_verified: true } })
    : Promise.resolve(Response.json({}, { status: 401 })) }) }));
vi.mock('../../../lib/subscriptions/catalog-inventory', () => ({ catalogInventoryDatabase: io.database,
  readApplicationFeatureInventory: io.inventory, applicationFeatureDefinition: (value: unknown) => value }));
vi.mock('../../../lib/subscriptions/credit-refresh', () => ({ refreshSubscriptionCredits: io.refresh }));
import { onRequestPost } from '../credits';
import type { PagesFunction } from '../../../lib/types';
const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const body = () => ({ kind: 'refresh', subscriptionId: id(2), recipientId: id(1), ruleId: id(4), cursor: null });
const run = (value: unknown = body(), query = '', token = true) => onRequestPost({
  request: new Request('https://application.invalid/api/subscriptions/credits' + query, { method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer isolated-token' } : {}) }, body: JSON.stringify(value) }),
  env: { SSO_SERVICE: { prepareSubscriptionCreditExecution: io.prepare } },
} as unknown as Parameters<PagesFunction>[0]);
beforeEach(() => {
  vi.resetAllMocks(); io.authenticated = true; io.promo.mockResolvedValue(false); io.creditRead.mockResolvedValue(null); io.database.mockReturnValue({ synthetic: 'database' });
  io.inventory.mockResolvedValue([{ key: 'synthetic_credit', type: 'metered' }]);
  io.prepare.mockResolvedValue({ synthetic: 'owner page' }); io.refresh.mockResolvedValue({ receipts: [], nextCursor: null });
});
describe('authenticated refresh HTTP caller, isolated SSO and page-delivery owners', () => {
  it('passes only signed identity and reference fields through existing credit authority', async () => {
    const response = await run(); expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(io.prepare).toHaveBeenCalledExactlyOnceWith('isolated-token', SKILLPASSPORT_PRODUCT_ID, body(), [{ key: 'synthetic_credit', type: 'metered' }]);
    expect(io.refresh).toHaveBeenCalledExactlyOnceWith({ synthetic: 'database' }, { synthetic: 'owner page' }, {
      actorId: id(1), productId: SKILLPASSPORT_PRODUCT_ID, subscriptionId: id(2), recipientId: id(1), ruleId: id(4), cursor: null });
  });
  it.each([{ amount: 100 }, { occurrenceIndex: 100 }, { actorId: id(9) }, { cursor: -1 }, { cursor: 0.5 }, { ruleId: 'bad' }])('rejects client authority or malformed input %j', async patch => {
    expect((await run({ ...body(), ...patch })).status).toBe(400);
    expect(io.prepare).not.toHaveBeenCalled(); expect(io.refresh).not.toHaveBeenCalled();
  });
  it('rejects anonymous requests and unsupported query inputs', async () => {
    expect((await run(body(), '', false)).status).toBe(401);
    expect((await run(body(), '?amount=999')).status).toBe(400);
    io.authenticated = false; expect((await run()).status).toBe(401);
    expect(io.prepare).not.toHaveBeenCalled(); expect(io.refresh).not.toHaveBeenCalled();
  });
  it('returns actual owner role/access denials without ledger delivery', async () => {
    io.prepare.mockResolvedValue({ kind: 'forbidden' });
    expect((await run()).status).toBe(403); expect(io.refresh).not.toHaveBeenCalled();
  });
  it('surfaces unavailable or uncertain owners without retry', async () => {
    io.prepare.mockRejectedValueOnce(new Error('Owner unavailable'));
    expect((await run()).status).toBe(503); expect(io.prepare).toHaveBeenCalledTimes(1);
    expect(io.refresh).not.toHaveBeenCalled();
    io.refresh.mockRejectedValueOnce(new Error('Uncertain ledger acknowledgement'));
    expect((await run()).status).toBe(503); expect(io.refresh).toHaveBeenCalledTimes(1);
  });
});


describe('promo payment gate for credit consumption RPCs', () => {
  const spending = () => ({ kind: 'consume', subscriptionId: id(2), recipientId: id(1), poolKey: 'credits', actionKey: 'lesson', operationId: id(5) });
  function prepareSpending(purchaseMode = 'free') {
    const scope = { subscriptionId: id(2), productId: SKILLPASSPORT_PRODUCT_ID, recipient: { kind: 'subscriber', id: id(1) }, featureKey: 'credits', poolKey: 'credits' };
    io.promo.mockResolvedValue(true);
    io.current.mockResolvedValue({ state: { planId: id(3), revisionId: id(4) } });
    io.projection.mockResolvedValue({ projection: { bundle: { draft: { purchaseMode } } } });
    io.prepare.mockImplementation(async (_token, _product, request) => request.kind === 'replay'
      ? { kind: 'replay', actorId: id(1), actionKey: 'lesson', operationId: id(5), scope }
      : { kind: 'consume', actorId: id(1), command: { ...scope, operationId: id(5) } });
    io.consume.mockResolvedValue({ spent: 1 });
  }
  it.each(['learner', 'school_admin', 'college_admin'])('blocks new free spending for an applied %s promo', async () => {
    prepareSpending(); const result = await run(spending());
    expect(result.status).toBe(402);
    expect(await result.json()).toMatchObject({ code: 'PROMO_PAYMENT_REQUIRED' });
    expect(io.consume).not.toHaveBeenCalled();
    expect(io.prepare).toHaveBeenCalledTimes(1);
  });
  it('allows spending from the paid subscription after payment', async () => {
    prepareSpending('self_service'); const result = await run(spending());
    expect(result.status).toBe(200); expect(io.consume).toHaveBeenCalledTimes(1);
  });
  it('keeps existing consumption replays readable without spending again', async () => {
    prepareSpending(); io.creditRead.mockResolvedValue({ replay: true });
    expect((await run(spending())).status).toBe(200);
    expect(io.promo).not.toHaveBeenCalled(); expect(io.consume).not.toHaveBeenCalled();
  });
});
