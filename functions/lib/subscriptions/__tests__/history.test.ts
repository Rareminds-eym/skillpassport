import { describe, expect, it, vi } from 'vitest';
import { readSubscriptionCreditHistory } from '../history';
const io = vi.hoisted(() => ({ inventory: vi.fn(), prepare: vi.fn(), audit: vi.fn() }));
vi.mock('../catalog-inventory', () => ({ catalogInventoryDatabase: () => io.inventory(),
  readApplicationFeatureInventory: async () => [], applicationFeatureDefinition: (value: unknown) => value }));
// Isolated handler tests. Signed authentication remains the existing wrapper's responsibility.
vi.mock('../current-subscription', () => ({ subscriptionConsumerEndpoint: (_method: string, handler: unknown) => handler,
  subscriptionFailure: (status: number) => Response.json({ error: 'denied' }, { status }), subscriptionResponseHeaders: { 'Cache-Control': 'private, no-store' } }));
import { onRequestPost } from '../../../api/subscriptions/history';

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const scope = { productId: id(1), subscriptionId: id(2), recipient: { kind: 'subscriber' as const, id: id(3) }, featureKey: 'synthetic_credit', poolKey: 'synthetic_pool' };
const ref = (n: number) => `sc1_${String(n).padStart(64, '0')}`;
const row = () => ({ referenceId: ref(1), planId: id(4), revisionId: id(5), policyId: id(6), ruleId: id(7),
  quantity: 10, consumed: 3, remaining: 0, expiredRemaining: 7, startsAt: 1000, endsAt: 2000, expiresAt: 3000,
  allocatedAt: new Date(1500).toISOString() });
const history = () => ({ schemaVersion: 1 as const, scope: structuredClone(scope), allocated: 10, consumed: 3,
  remaining: 0, expiredRemaining: 7, asOf: new Date(4000).toISOString(), allocations: [row()], nextCursor: null as string | null });
const db = (data: unknown, error: unknown = null) => ({ rpc: vi.fn().mockReturnValue({ abortSignal: vi.fn().mockResolvedValue({ data, error }) }) });

describe('subscription credit history', () => {
  it('reads actual lifetime attribution and expired remainder without writing balances', async () => {
    const database = db(history());
    expect(await readSubscriptionCreditHistory(database, scope)).toEqual(history());
    expect(database.rpc).toHaveBeenCalledExactlyOnceWith('get_subscription_credit_history', { p_scope: scope, p_after: null });
  });
  it('accepts an empty history and zero quantity allocation', async () => {
    const empty = { ...history(), allocated: 0, consumed: 0, expiredRemaining: 0, allocations: [] };
    expect(await readSubscriptionCreditHistory(db(empty), scope)).toEqual(empty);
    const zero = { ...empty, allocations: [{ ...row(), quantity: 0, consumed: 0, expiredRemaining: 0 }] };
    expect(await readSubscriptionCreditHistory(db(zero), scope)).toEqual(zero);
  });
  it.each(['scope', 'recipient', 'pool', 'totals', 'row_totals', 'expired', 'interval', 'allocation_time', 'duplicate', 'cursor', 'unsafe', 'negative', 'extra'])('rejects inconsistent %s', async defect => {
    const value = history();
    if (defect === 'scope') value.scope.subscriptionId = id(10);
    if (defect === 'recipient') value.scope.recipient.id = id(10);
    if (defect === 'pool') value.scope.poolKey = 'other';
    if (defect === 'totals') value.remaining++;
    if (defect === 'row_totals') value.allocations[0].consumed++;
    if (defect === 'expired') { value.allocations[0].remaining = 7; value.allocations[0].expiredRemaining = 0; }
    if (defect === 'interval') value.allocations[0].endsAt = 1000;
    if (defect === 'allocation_time') value.allocations[0].allocatedAt = new Date(3000).toISOString();
    if (defect === 'duplicate') value.allocations.push(row());
    if (defect === 'cursor') value.nextCursor = ref(1);
    if (defect === 'unsafe') value.allocated = Number.MAX_SAFE_INTEGER + 1;
    if (defect === 'negative') value.consumed = -1;
    if (defect === 'extra') Object.assign(value, { monetaryValue: 0 });
    await expect(readSubscriptionCreditHistory(db(value), scope)).rejects.toThrow();
  });
  it('checks stable ordered pagination and rejects replayed page rows', async () => {
    const value = { ...history(), allocations: Array.from({ length: 50 }, (_, n) => ({ ...row(), referenceId: ref(n + 1) })), nextCursor: ref(50) };
    // Summary is for the entire scope and therefore cannot understate the current page.
    value.allocated = 500; value.consumed = 150; value.expiredRemaining = 350;
    expect((await readSubscriptionCreditHistory(db(value), scope)).nextCursor).toBe(ref(50));
    await expect(readSubscriptionCreditHistory(db(history()), scope, ref(1))).rejects.toThrow();
  });
  it('propagates unavailable owner and abort without retries or invented empty history', async () => {
    const database = db(null, { message: 'private diagnostic' });
    await expect(readSubscriptionCreditHistory(database, scope)).rejects.toThrow('Subscription credit history is unavailable');
    expect(database.rpc).toHaveBeenCalledTimes(1);
    const failing = { rpc: vi.fn().mockReturnValue({ abortSignal: vi.fn().mockRejectedValue(new Error('timeout')) }) };
    await expect(readSubscriptionCreditHistory(failing, scope)).rejects.toThrow('timeout');
    await expect(readSubscriptionCreditHistory(db(history()), scope, 'invalid')).rejects.toThrow();
  });
});

describe('scoped history API handler (isolated authentication boundary)', () => {
  const invoke = (body: unknown, suffix = '') => (onRequestPost as unknown as (context: unknown) => Promise<Response>)({
    request: new Request(`https://example.invalid/api/subscriptions/history${suffix}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    env: { SSO_SERVICE: { prepareSubscriptionCreditExecution: io.prepare, getSubscriptionAudit: io.audit } }, token: 'synthetic-signed-context',
    actorId: id(3), productId: id(1), organizationId: null,
  });
  const input = { kind: 'credits', subscriptionId: id(2), recipientId: id(3), poolKey: 'synthetic_pool' };
  it('discovers only owner-authorized historical pools and rejects foreign acknowledgements before database IO', async () => {
    const saved = { kind: 'history_pools', actorId: id(3), productId: id(1), subscriptionId: id(2), revisionId: id(5),
      audience: 'synthetic_audience', pools: [{ key: 'retired_pool', featureKey: 'synthetic_credit', recipient: 'subscriber', audiences: ['synthetic_audience'] }] };
    const database = db(history()); io.inventory.mockReturnValue(database); io.prepare.mockResolvedValue(saved);
    const body = { kind: 'pools', subscriptionId: id(2), revisionId: id(5) };
    expect(await (await invoke(body)).json()).toEqual(saved);
    expect(io.prepare).toHaveBeenLastCalledWith('synthetic-signed-context', id(1), { ...body, kind: 'history_pools' }, []);
    expect(database.rpc).not.toHaveBeenCalled();
    io.prepare.mockResolvedValue({ ...saved, revisionId: id(9) });
    await expect(invoke(body)).rejects.toThrow('Historical pool scope differs');
    io.prepare.mockResolvedValue({ kind: 'forbidden' });
    expect((await invoke(body)).status).toBe(403);
    expect((await invoke({ ...body, pools: [] })).status).toBe(400);
    expect(database.rpc).not.toHaveBeenCalled();
  });
  it('requests historical scope using references without enabling allocation or consumption', async () => {
    const database = db(history()); io.inventory.mockReturnValue(database);
    io.prepare.mockResolvedValue({ kind: 'usage', actorId: id(3), scope });
    expect((await invoke({ ...input, revisionId: id(5) })).status).toBe(200);
    expect(io.prepare).toHaveBeenLastCalledWith('synthetic-signed-context', id(1), { ...input, kind: 'history', revisionId: id(5) }, []);
    expect(database.rpc).toHaveBeenCalledExactlyOnceWith('get_subscription_credit_history', { p_scope: scope, p_after: null });
  });
  it('passes only references to canonical authorization before reading application attribution', async () => {
    const database = db(history()); io.inventory.mockReturnValue(database);
    io.prepare.mockResolvedValue({ kind: 'usage', actorId: id(3), scope });
    const result = await invoke(input);
    expect(result.status).toBe(200); expect(result.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await result.json()).toEqual(history());
    expect(io.prepare).toHaveBeenLastCalledWith('synthetic-signed-context', id(1), { ...input, kind: 'usage' }, []);
    expect(database.rpc).toHaveBeenCalledWith('get_subscription_credit_history', { p_scope: scope, p_after: null });
  });
  it('rejects client policy/price and repeated query parameters', async () => {
    expect((await invoke({ ...input, amount: 0 })).status).toBe(400);
    expect((await invoke(input, '?poolKey=other')).status).toBe(400);
  });
  it('does not read history when canonical owner denies or acknowledges another recipient', async () => {
    const database = db(history()); io.inventory.mockReturnValue(database);
    io.prepare.mockResolvedValue({ kind: 'forbidden' });
    expect((await invoke(input)).status).toBe(403); expect(database.rpc).not.toHaveBeenCalled();
    io.prepare.mockResolvedValue({ kind: 'usage', actorId: id(3), scope: { ...scope, recipient: { kind: 'subscriber', id: id(9) } } });
    await expect(invoke(input)).rejects.toThrow('scope differs'); expect(database.rpc).not.toHaveBeenCalled();
  });
  it('reads only signed actor-scoped audit output without querying the application database', async () => {
    const saved = { schemaVersion: 1, actorId: id(3), productId: id(1), subscriptionId: id(2), items: [], nextCursor: null };
    io.audit.mockResolvedValue(saved);
    expect(await (await invoke({ kind: 'audit', subscriptionId: id(2) })).json()).toEqual(saved);
    expect(io.audit).toHaveBeenLastCalledWith('synthetic-signed-context', id(2), id(1), null);
    io.audit.mockResolvedValue({ ...saved, actorId: id(10) });
    await expect(invoke({ kind: 'audit', subscriptionId: id(2) })).rejects.toThrow('audit acknowledgement differs');
    io.audit.mockResolvedValue({ kind: 'forbidden' });
    expect((await invoke({ kind: 'audit', subscriptionId: id(2) })).status).toBe(403);
  });
});
