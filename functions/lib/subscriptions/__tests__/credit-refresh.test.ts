import { describe, expect, it, vi } from 'vitest';
import { refreshSubscriptionCredits } from '../credit-refresh';

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const occurrence = (suffix = 'a') => ({ schemaVersion: 1, referenceId: 'sc1_' + suffix.repeat(64),
  subscriptionId: id(1), productId: id(2), planId: id(3), revisionId: id(4), policyId: id(5), ruleId: id(6),
  featureKey: 'synthetic_credit', poolKey: 'synthetic_pool', audience: 'synthetic', recipient: { kind: 'organization', id: id(7) },
  quantity: 10, startsAt: 1000, endsAt: 2000, expiresAt: 2000, rollover: { kind: 'none' }, timePolicies: [] });
const owner = (items = [occurrence()]) => ({ kind: 'refresh', schemaVersion: 1, actorId: id(8),
  subscriptionId: id(1), productId: id(2), planId: id(3), revisionId: id(4), ruleId: id(6), audience: 'synthetic',
  recipient: { kind: 'organization', id: id(7) }, asOf: 1500, occurrences: items, nextCursor: null });
const expected = () => ({ actorId: id(8), subscriptionId: id(1), productId: id(2), recipientId: id(7), ruleId: id(6), cursor: null });
const receipt = (value = occurrence(), actorId = id(8)) => ({ occurrence: value, actorId, ledgerId: id(9), allocatedAt: '1970-01-01T00:00:01.500Z' });
function database() {
  const rows = new Map<string, ReturnType<typeof receipt>>();
  const abortSignal = vi.fn().mockResolvedValue({ data: receipt(), error: null });
  const rpc = vi.fn().mockReturnValue({ abortSignal });
  const eq = vi.fn().mockImplementation((_key, ref: string) => ({ limit: () => ({ abortSignal: async () => ({ data: rows.has(ref) ? [{ receipt: rows.get(ref) }] : [], error: null }) }) }));
  const from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });
  return { rows, rpc, from, eq, abortSignal };
}
type Database = Parameters<typeof refreshSubscriptionCredits>[0];

describe('credit refresh page delivery, isolated ledger owners', () => {
  it('allocates only the complete scoped owner page', async () => {
    const db = database();
    const result = await refreshSubscriptionCredits(db as unknown as Database, owner(), expected());
    expect(result.receipts).toEqual([receipt()]);
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith('allocate_subscription_credits', { p_occurrence: occurrence(), p_actor_id: id(8) });
  });
  it('retains the original allocator audit for another authorized organization administrator', async () => {
    const db = database(), original = receipt(occurrence(), id(30)); db.rows.set(occurrence().referenceId, original);
    const result = await refreshSubscriptionCredits(db as unknown as Database, owner(), expected());
    expect(result.receipts).toEqual([original]); expect(db.rpc).not.toHaveBeenCalled();
  });
  it('accepts an empty due page and carries its explicit continuation', async () => {
    const db = database();
    expect(await refreshSubscriptionCredits(db as unknown as Database, { ...owner([]), nextCursor: 50 }, expected()))
      .toMatchObject({ receipts: [], nextCursor: 50 });
    expect(db.from).not.toHaveBeenCalled(); expect(db.rpc).not.toHaveBeenCalled();
  });
  it.each(['actorId', 'productId', 'subscriptionId', 'ruleId', 'recipient', 'extra', 'cursor', 'duplicate', 'future', 'expired', 'revision', 'scope'])('rejects %s drift before reading or writing the ledger', async defect => {
    const value = owner();
    if (['actorId', 'productId', 'subscriptionId', 'ruleId'].includes(defect)) Reflect.set(value, defect, id(50));
    if (defect === 'recipient') value.recipient.id = id(50);
    if (defect === 'extra') Object.assign(value, { ready: true });
    if (defect === 'cursor') Object.assign(value, { nextCursor: 0 });
    if (defect === 'duplicate') value.occurrences.push(occurrence());
    if (defect === 'future') value.occurrences[0].startsAt = 1501;
    if (defect === 'expired') value.asOf = 2000;
    if (defect === 'revision') value.occurrences[0].revisionId = id(50);
    if (defect === 'scope') value.occurrences[0].recipient.id = id(50);
    const db = database();
    await expect(refreshSubscriptionCredits(db as unknown as Database, value, expected())).rejects.toThrow();
    expect(db.rpc).not.toHaveBeenCalled(); expect(db.from).not.toHaveBeenCalled();
  });
  it('validates later rows before allowing the first allocation', async () => {
    const db = database(), changed = occurrence('b'); changed.productId = id(50);
    await expect(refreshSubscriptionCredits(db as unknown as Database, owner([occurrence(), changed]), expected())).rejects.toThrow();
    expect(db.rpc).not.toHaveBeenCalled(); expect(db.from).not.toHaveBeenCalled();
  });
  it('propagates uncertain delivery once and allows explicit receipt-based recovery', async () => {
    const db = database(), interrupted = new Error('transport interrupted');
    db.abortSignal.mockImplementationOnce(async () => { db.rows.set(occurrence().referenceId, receipt()); throw interrupted; });
    await expect(refreshSubscriptionCredits(db as unknown as Database, owner(), expected())).rejects.toBe(interrupted);
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect((await refreshSubscriptionCredits(db as unknown as Database, owner(), expected())).receipts).toEqual([receipt()]);
    expect(db.rpc).toHaveBeenCalledTimes(1);
  });
  it('does not treat a failed receipt lookup as permission to allocate', async () => {
    const db = database(); db.from.mockReturnValueOnce({ select: () => ({ eq: () => ({ limit: () => ({ abortSignal: async () => ({ data: null, error: {} }) }) }) }) });
    await expect(refreshSubscriptionCredits(db as unknown as Database, owner(), expected())).rejects.toThrow('read is unavailable');
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
