import { beforeEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ authenticated: true, list: vi.fn(), action: vi.fn(), projection: vi.fn(), database: vi.fn() }));
// Only authentication and the two persistence owners are isolated. The real
// discovery, immutable grant and action evaluators run through the HTTP handler.
vi.mock('../../../lib/auth', () => ({ getAuthInstance: () => ({ authenticate: (handler: (request: Request, auth: unknown) => Promise<Response>) =>
  (request: Request) => io.authenticated ? handler(request, { user: { sub: actor, membership_status: 'active', is_email_verified: true } }) : Response.json({}, { status: 401 }) }) }));
vi.mock('../../../lib/subscriptions/publication', () => ({ readApplicationPlanProjection: io.projection }));
vi.mock('../../../lib/subscriptions/catalog-inventory', () => ({ catalogInventoryDatabase: io.database }));
import { onRequestPost } from '../action-context';
import type { PagesFunction } from '../../../lib/types';
const actor = 'a0000000-0000-4000-8000-000000000001';
const id = 'b0000000-0000-4000-8000-000000000001';
const plan = 'c0000000-0000-4000-8000-000000000001';
const revision = 'd0000000-0000-4000-8000-000000000001';
const product = 'e0000000-0000-4000-8000-000000000001';
const subject = { kind: 'user', id: actor };
const binding = () => ({ actionKey: 'lte.track.activate', featureKey: 'learning_tracks', mode: 'write',
  quota: { period: 'billing_period', countingEvent: 'track_activated' } });
const owner = () => ({ schemaVersion: 1, actorId: actor, access: 'full', audience: 'synthetic', activatedAt: 100, subscriptionEndsAt: 3000,
  state: { id, planId: plan, revisionId: revision, productId: product, subject, version: 1, status: 'active',
    periodStartsAt: 200, periodEndsAt: 2000, trialEndsAt: null, renewalEnabled: true, cancelledAt: null, paymentFailedAt: null, scheduledChange: null },
  actions: { schemaVersion: 1, bindings: [binding()] } });
const grant = (limit: unknown = { kind: 'finite', value: 2 }) => ({ key: 'learning_tracks', enabled: true, type: 'numeric_limit', limit });
const projection = (feature = grant()) => ({ projection: { bundle: { draft: { id: revision, plan: { id: plan, productId: product },
  audiences: ['synthetic'], features: [feature] } } } });
const body = () => ({ actionKey: 'lte.track.activate', mode: 'write', subject });
const run = (value: unknown = body(), query = '', bearer = true) => onRequestPost({
  request: new Request('https://application.invalid/api/subscriptions/action-context' + query, { method: 'POST',
    headers: { ...(bearer ? { authorization: 'Bearer isolated-token' } : {}), 'content-type': 'application/json' }, body: JSON.stringify(value) }),
  env: { SKILLPASSPORT_PRODUCT_ID: product, SSO_SERVICE: { listSubscriptionExecutions: io.list, getSubscriptionActionContext: io.action } },
} as unknown as Parameters<PagesFunction>[0]);
beforeEach(() => {
  vi.resetAllMocks(); vi.spyOn(Date, 'now').mockReturnValue(1000); io.authenticated = true;
  io.list.mockImplementation(async (_token, _product, cursor) => ({ schemaVersion: 1, actorId: actor, productId: product,
    items: cursor === null ? [{ id, subject, productId: product, kind: 'initialized' }] : [], nextCursor: cursor === null ? id : null }));
  io.action.mockResolvedValue(owner()); io.database.mockReturnValue({}); io.projection.mockResolvedValue(projection());
});
describe('canonical action HTTP transport with real grant evaluation', () => {
  it('derives the complete bounded proof from signed owner and immutable application revision', async () => {
    const response = await run(); expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ schemaVersion: 1, actorId: actor, subject, subscriptionId: id, productId: product,
      revisionId: revision, version: 1, actionKey: 'lte.track.activate', featureKey: 'learning_tracks', mode: 'write', validUntil: 2000,
      quota: { period: 'billing_period', countingEvent: 'track_activated', periodStartsAt: 200, periodEndsAt: 2000, limit: 2 } });
    expect(io.action).toHaveBeenCalledExactlyOnceWith('isolated-token', id, product);
    expect(io.projection).toHaveBeenCalledExactlyOnceWith({}, plan, revision, product);
  });
  it('permits only explicitly unlimited grants', async () => {
    io.projection.mockResolvedValue(projection(grant({ kind: 'unlimited' })));
    const response = await run(); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ quota: { limit: null } });
  });
  it.each([0])('denies exhausted or zero capacity %s', async value => {
    io.projection.mockResolvedValue(projection(grant({ kind: 'finite', value })));
    expect((await run()).status).toBe(403);
  });
  it.each([{ ...body(), limit: null }, { ...body(), price: 0 }, { ...body(), subject: { kind: 'user', id: product } }])('rejects client authority before owner lookup', async value => {
    expect((await run(value)).status).toBe(value.subject.id === product ? 403 : 400); expect(io.list).not.toHaveBeenCalled();
  });
  it('rejects query parameters and missing or invalid authentication', async () => {
    expect((await run(body(), '?limit=99')).status).toBe(400);
    expect((await run(body(), '', false)).status).toBe(401);
    io.authenticated = false; expect((await run()).status).toBe(401); expect(io.list).not.toHaveBeenCalled();
  });
  it.each(['read_only', 'suspended'])('denies writes under %s lifecycle', async access => {
    io.action.mockResolvedValue({ ...owner(), access }); expect((await run()).status).toBe(403);
  });
  it('rejects expired authority', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(2000); expect((await run()).status).toBe(403);
  });
  it('derives a subscription quota interval from activation and commercial end', async () => {
    const value = owner(); value.actions.bindings[0].quota.period = 'subscription'; io.action.mockResolvedValue(value);
    const response = await run(); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ quota: { periodStartsAt: 100, periodEndsAt: 3000 } });
  });
  it('rejects payment-required actions without issuing a free resource proof', async () => {
    const value = owner(); Object.assign(value.actions.bindings[0], { paymentRequired: true }); io.action.mockResolvedValue(value);
    expect((await run()).status).toBe(503);
  });
  it('fails explicitly on immutable projection outage without alternate grants', async () => {
    io.projection.mockRejectedValue(new Error('unavailable')); expect((await run()).status).toBe(503);
    expect(io.projection).toHaveBeenCalledTimes(1);
  });
});
