import { SKILLPASSPORT_PRODUCT_ID } from '../../subscription-config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ user: {} as Record<string, unknown>, authenticated: true, current: vi.fn(), prepare: vi.fn(),
  projection: vi.fn(), database: vi.fn(), inventory: vi.fn(), allocate: vi.fn(), consume: vi.fn(), usage: vi.fn(), readConsumption: vi.fn(), readAllocation: vi.fn() }));
vi.mock('../../auth', () => ({ getAuthInstance: () => ({ authenticate: (handler: (request: Request, auth: unknown) => Promise<Response>) =>
  (request: Request) => io.authenticated ? handler(request, { user: io.user }) : Response.json({}, { status: 401 }) }) }));
vi.mock('../publication', () => ({ readApplicationPlanProjection: io.projection }));
vi.mock('../catalog-inventory', () => ({ catalogInventoryDatabase: io.database, readApplicationFeatureInventory: io.inventory,
  applicationFeatureDefinition: (value: unknown) => value }));
vi.mock('../credits', async importOriginal => ({ ...await importOriginal<typeof import('../credits')>(),
  allocateSubscriptionCredits: io.allocate, consumeSubscriptionCredits: io.consume, readSubscriptionCreditUsage: io.usage,
  readSubscriptionCreditConsumption: io.readConsumption, readSubscriptionCreditAllocation: io.readAllocation }));
import { onRequestGet as current } from '../../../api/subscriptions/current';
import { onRequestPost as credits } from '../../../api/subscriptions/credits';
import type { PagesFunction } from '../../types';

const actor = 'a0000000-0000-4000-8000-000000000001', id = 'b0000000-0000-4000-8000-000000000001';
const plan = 'c0000000-0000-4000-8000-000000000001', revision = 'd0000000-0000-4000-8000-000000000001';
const product = SKILLPASSPORT_PRODUCT_ID;
const state = () => ({ id, planId: plan, revisionId: revision, productId: product, version: 1, subject: { kind: 'user', id: actor },
  status: 'active', periodStartsAt: 100, periodEndsAt: 1000, trialEndsAt: null, renewalEnabled: true,
  cancelledAt: null, paymentFailedAt: null, scheduledChange: null });
const snapshot = () => ({ schemaVersion: 1, actorId: actor, state: state(), access: 'full', audience: 'synthetic',
  activatedAt: 100, subscriptionEndsAt: 2000, pools: [] });
const run = (handler: PagesFunction, query = '', body?: unknown, bearer = true) => handler({
  request: new Request('https://owner.invalid/api/subscriptions/test' + query, { method: body === undefined ? 'GET' : 'POST',
    headers: { ...(bearer ? { authorization: 'Bearer synthetic-token' } : {}), 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body) }),
  env: { SKILLPASSPORT_PRODUCT_ID: product, SSO_SERVICE: { getCurrentSubscriptionExecution: io.current, prepareSubscriptionCreditExecution: io.prepare } },
  params: {}, data: {}, waitUntil: vi.fn(), next: vi.fn(),
} as unknown as Parameters<PagesFunction>[0]);
beforeEach(() => {
  vi.resetAllMocks(); io.authenticated = true; io.user = { sub: actor, membership_status: 'active', is_email_verified: true };
  io.current.mockResolvedValue(snapshot()); io.database.mockReturnValue({});
  io.projection.mockResolvedValue({ projection: { bundle: { draft: { plan: { id: plan, code: 'pln_' + 'a'.repeat(32), productId: product },
    name: 'Synthetic', revisionNumber: 1, audiences: ['synthetic'], features: [] }, includedCredits: { rules: [] } } } });
  io.readConsumption.mockResolvedValue(null); io.readAllocation.mockResolvedValue(null);
  io.inventory.mockResolvedValue([{ key: 'synthetic_credit', type: 'metered' }]);
});
describe('subscription consumer owner boundary', () => {
  it.each([null, 500])('preserves the owner downgrade event marker %s', async downgradedAt => {
    io.current.mockResolvedValue({ ...snapshot(), state: { ...state(), downgradedAt }, access: 'read_only' });
    const response = await run(current, '?subscriptionId=' + id);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ state: { downgradedAt }, access: 'read_only' });
  });
  it.each([-1, 99, 0.5, '500', Number.MAX_SAFE_INTEGER + 1])('denies malformed owner downgrade marker %s', async downgradedAt => {
    io.current.mockResolvedValue({ ...snapshot(), state: { ...state(), downgradedAt } });
    expect((await run(current, '?subscriptionId=' + id)).status).toBe(503);
    expect(io.projection).not.toHaveBeenCalled();
  });
  it('loads a current subscription through authenticated SSO and exact app revision', async () => {
    const response = await run(current, '?subscriptionId=' + id);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(io.current).toHaveBeenCalledExactlyOnceWith('synthetic-token', id, product);
    expect(io.projection).toHaveBeenCalledExactlyOnceWith({}, plan, revision, product);
    expect(await response.json()).toMatchObject({ state: { revisionId: revision } });
  });
  it.each(['', '?subscriptionId=bad', '?subscriptionId=' + id + '&subscriptionId=' + id, '?subscriptionId=' + id + '&actorId=' + actor])('rejects query %s before SSO', async query => {
    expect((await run(current, query)).status).toBe(400); expect(io.current).not.toHaveBeenCalled();
  });
  it('denies missing or invalid authentication before any owner calls', async () => {
    expect((await run(current, '?subscriptionId=' + id, undefined, false)).status).toBe(401);
    io.authenticated = false;
    expect((await run(current, '?subscriptionId=' + id)).status).toBe(401);
    expect(io.current).not.toHaveBeenCalled(); expect(io.database).not.toHaveBeenCalled();
  });
  it('retains owner denial and does not read projection', async () => {
    io.current.mockResolvedValue({ kind: 'forbidden' });
    expect((await run(current, '?subscriptionId=' + id)).status).toBe(403); expect(io.projection).not.toHaveBeenCalled();
  });
  it.each(['actor', 'subscription', 'product', 'period', 'contract_end'])('rejects altered owner %s', async defect => {
    const currentValue = snapshot();
    if (defect === 'actor') currentValue.actorId = product;
    if (defect === 'subscription') currentValue.state.id = actor;
    if (defect === 'product') currentValue.state.productId = actor;
    if (defect === 'period') currentValue.state.periodEndsAt = 10;
    if (defect === 'contract_end') currentValue.subscriptionEndsAt = 500;
    io.current.mockResolvedValue(currentValue);
    expect((await run(current, '?subscriptionId=' + id)).status).toBe(503); expect(io.projection).not.toHaveBeenCalled();
  });
  it('fails without substituting legacy data when retained projection is unavailable', async () => {
    io.projection.mockRejectedValue(new Error('missing'));
    expect((await run(current, '?subscriptionId=' + id)).status).toBe(503); expect(io.current).toHaveBeenCalledTimes(1);
  });
  it('forwards only credit references and uses the server-derived tariff command', async () => {
    const body = { kind: 'consume', subscriptionId: id, recipientId: actor, poolKey: 'synthetic_pool', actionKey: 'synthetic_action', operationId: revision };
    const command = { productId: product, subscriptionId: id, recipient: { kind: 'subscriber', id: actor },
      featureKey: 'synthetic_credit', poolKey: 'synthetic_pool', operationId: revision, amount: 7, actionKey: 'synthetic_action', spendingOrder: 'expires_first' };
    io.prepare.mockImplementation(async (_token, _product, request) => request.kind === 'replay'
      ? { kind: 'replay', actorId: actor, scope: { productId: product, subscriptionId: id, recipient: { kind: 'subscriber', id: actor },
        featureKey: 'synthetic_credit', poolKey: 'synthetic_pool' }, operationId: revision, actionKey: 'synthetic_action' }
      : { kind: 'consume', actorId: actor, command });
    io.consume.mockResolvedValue({ stored: true });
    expect((await run(credits, '', body)).status).toBe(200);
    expect(io.prepare).toHaveBeenNthCalledWith(2, 'synthetic-token', product, body, [{ key: 'synthetic_credit', type: 'metered' }]);
    expect(io.consume).toHaveBeenCalledExactlyOnceWith({}, command, actor);
    expect((await run(credits, '', { ...body, amount: 0 })).status).toBe(400);
    expect(io.consume).toHaveBeenCalledTimes(1);
  });
  it('does not retry an uncertain credit write', async () => {
    io.prepare.mockResolvedValue({ kind: 'usage', actorId: actor, scope: { subscriptionId: id, productId: product, recipient: { kind: 'subscriber', id: actor }, poolKey: 'synthetic_pool', featureKey: 'synthetic_credit' } });
    io.usage.mockRejectedValue(new Error('owner outage'));
    expect((await run(credits, '', { kind: 'usage', subscriptionId: id, recipientId: actor, poolKey: 'synthetic_pool' })).status).toBe(503);
    expect(io.usage).toHaveBeenCalledTimes(1);
  });
  it('returns an authorized original debit receipt without new spending after expiry', async () => {
    io.prepare.mockResolvedValue({ kind: 'replay', actorId: actor, scope: { productId: product, subscriptionId: id,
      recipient: { kind: 'subscriber', id: actor }, featureKey: 'synthetic_credit', poolKey: 'synthetic_pool' },
      operationId: revision, actionKey: 'synthetic_action' });
    const receipt = { command: { operationId: revision }, consumedAt: '2026-11-19T10:00:00Z' };
    io.readConsumption.mockResolvedValue(receipt);
    const response = await run(credits, '', { kind: 'consume', subscriptionId: id, recipientId: actor,
      poolKey: 'synthetic_pool', actionKey: 'synthetic_action', operationId: revision });
    expect(response.status).toBe(200); expect(await response.json()).toEqual(receipt);
    expect(io.prepare).toHaveBeenCalledTimes(1); expect(io.consume).not.toHaveBeenCalled();
  });

  it('returns an authorized original allocation without preparing a new grant', async () => {
    const occurrence = { subscriptionId: id, productId: product, ruleId: revision, recipient: { kind: 'subscriber', id: actor } };
    io.prepare.mockResolvedValue({ kind: 'allocation_replay', actorId: actor, occurrence });
    const receipt = { occurrence, allocatedAt: '2026-11-19T10:00:00Z' };
    io.readAllocation.mockResolvedValue(receipt);
    const response = await run(credits, '', { kind: 'allocate', subscriptionId: id, recipientId: actor, ruleId: revision, occurrenceIndex: 0 });
    expect(response.status).toBe(200); expect(await response.json()).toEqual(receipt);
    expect(io.prepare).toHaveBeenCalledTimes(1); expect(io.allocate).not.toHaveBeenCalled();
  });

});
