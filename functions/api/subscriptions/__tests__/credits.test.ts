import { beforeEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ authenticated: true, prepare: vi.fn(), refresh: vi.fn(), inventory: vi.fn(), database: vi.fn() }));
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
  env: { SKILLPASSPORT_PRODUCT_ID: id(3), SSO_SERVICE: { prepareSubscriptionCreditExecution: io.prepare } },
} as unknown as Parameters<PagesFunction>[0]);
beforeEach(() => {
  vi.resetAllMocks(); io.authenticated = true; io.database.mockReturnValue({ synthetic: 'database' });
  io.inventory.mockResolvedValue([{ key: 'synthetic_credit', type: 'metered' }]);
  io.prepare.mockResolvedValue({ synthetic: 'owner page' }); io.refresh.mockResolvedValue({ receipts: [], nextCursor: null });
});
describe('authenticated refresh HTTP caller, isolated SSO and page-delivery owners', () => {
  it('passes only signed identity and reference fields through existing credit authority', async () => {
    const response = await run(); expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(io.prepare).toHaveBeenCalledExactlyOnceWith('isolated-token', id(3), body(), [{ key: 'synthetic_credit', type: 'metered' }]);
    expect(io.refresh).toHaveBeenCalledExactlyOnceWith({ synthetic: 'database' }, { synthetic: 'owner page' }, {
      actorId: id(1), productId: id(3), subscriptionId: id(2), recipientId: id(1), ruleId: id(4), cursor: null });
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
