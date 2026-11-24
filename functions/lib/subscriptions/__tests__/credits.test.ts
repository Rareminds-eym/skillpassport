import { describe, expect, it, vi } from 'vitest';
import { allocateSubscriptionCredits, consumeSubscriptionCredits, readSubscriptionCreditUsage, readSubscriptionCreditConsumption, readSubscriptionCreditAllocation } from '../credits';

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const actorId = id(1), ledgerId = id(2);
const scope = () => ({ productId: id(3), subscriptionId: id(4), recipient: { kind: 'subscriber', id: id(5) },
  featureKey: 'synthetic_meter', poolKey: 'synthetic_pool' });
const occurrence = () => ({ ...scope(), schemaVersion: 1, referenceId: `sc1_${'a'.repeat(64)}`,
  planId: id(6), revisionId: id(7), policyId: id(8), ruleId: id(9), audience: 'synthetic_audience', quantity: 10,
  startsAt: Date.parse('2020-01-01T00:00:00Z'), endsAt: Date.parse('2020-02-01T00:00:00Z'), expiresAt: Date.parse('2020-03-01T00:00:00Z'),
  rollover: { kind: 'none' }, timePolicies: [{ id: id(10), timeZone: 'UTC', monthlyAnchor: 'subscription_anniversary',
    monthDayOverflow: 'clamp', ambiguousTime: 'reject', nonexistentTime: 'reject' }] });
const command = () => ({ ...scope(), operationId: id(11), actionKey: 'synthetic_action', amount: 4, spendingOrder: 'expires_first' });
const allocationReceipt = () => ({ occurrence: occurrence(), actorId, ledgerId, allocatedAt: '2020-01-01T00:00:00.123456Z' });
const consumptionReceipt = () => ({ command: command(), actorId, ledgerId, consumedAt: '2020-01-02T00:00:00Z',
  allocations: [{ referenceId: occurrence().referenceId, amount: 4 }] });
const usage = () => ({ ...scope(), allocated: 10, consumed: 4, remaining: 6, asOf: '2020-01-02T00:00:00Z' });
const database = (data: unknown, error: unknown = null) => {
  const abortSignal = vi.fn().mockResolvedValue({ data, error });
  return { rpc: vi.fn().mockReturnValue({ abortSignal }), abortSignal };
};

describe('subscription credit boundary (isolated RPC receipts, not SQL atomicity)', () => {
  it('submits the complete occurrence and returns original replay after expiry', async () => {
    const stored = allocationReceipt(), db = database(stored);
    expect(await allocateSubscriptionCredits(db, occurrence(), actorId)).toEqual(stored);
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith('allocate_subscription_credits', { p_occurrence: occurrence(), p_actor_id: actorId });
    // Occurrence is historical. Local wall-clock validation would incorrectly break exact replay.
    expect(Date.parse(stored.allocatedAt)).toBeLessThan(Date.now());
  });
  it('accepts finite zero only with no ledger row', async () => {
    const input = { ...occurrence(), quantity: 0 }, stored = { ...allocationReceipt(), occurrence: input, ledgerId: null };
    expect(await allocateSubscriptionCredits(database(stored), input, actorId)).toEqual(stored);
    await expect(allocateSubscriptionCredits(database({ ...stored, ledgerId }), input, actorId)).rejects.toThrow('acknowledgement');
    await expect(allocateSubscriptionCredits(database({ ...allocationReceipt(), ledgerId: null }), occurrence(), actorId)).rejects.toThrow('acknowledgement');
  });
  it.each(['quantity', 'fraction', 'negative', 'reference', 'uuid', 'feature-width', 'interval', 'expiry', 'unknown', 'rollover', 'calendar', 'duplicate-calendar'])('rejects malformed %s allocation before RPC', async mutation => {
    const input = occurrence();
    if (mutation === 'quantity') input.quantity = 2147483648;
    if (mutation === 'fraction') input.quantity = 1.5;
    if (mutation === 'negative') input.quantity = -1;
    if (mutation === 'reference') input.referenceId = 'caller-chosen';
    if (mutation === 'uuid') input.subscriptionId = 'invalid';
    if (mutation === 'feature-width') input.featureKey = 'x'.repeat(101);
    if (mutation === 'interval') input.endsAt = input.startsAt;
    if (mutation === 'expiry') input.expiresAt = input.startsAt;
    if (mutation === 'unknown') Object.assign(input, { ready: true });
    if (mutation === 'rollover') input.rollover = { kind: 'approved', approvalId: id(12) } as never;
    if (mutation === 'calendar') input.timePolicies[0].timeZone = 'Unknown/Zone';
    if (mutation === 'duplicate-calendar') input.timePolicies.push(input.timePolicies[0]);
    const db = database(allocationReceipt());
    await expect(allocateSubscriptionCredits(db, input, actorId)).rejects.toThrow();
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it.each(['actor', 'recipient', 'product', 'subscription', 'pool', 'feature', 'quantity', 'revision', 'calendar', 'audience', 'time', 'future-expiry', 'extra'])('rejects changed allocation receipt %s', async mutation => {
    const stored = allocationReceipt();
    if (mutation === 'actor') stored.actorId = id(20);
    if (mutation === 'recipient') stored.occurrence.recipient.kind = 'organization';
    if (mutation === 'product') stored.occurrence.productId = id(20);
    if (mutation === 'subscription') stored.occurrence.subscriptionId = id(20);
    if (mutation === 'pool') stored.occurrence.poolKey = 'different';
    if (mutation === 'feature') stored.occurrence.featureKey = 'different';
    if (mutation === 'quantity') stored.occurrence.quantity++;
    if (mutation === 'revision') stored.occurrence.revisionId = id(20);
    if (mutation === 'calendar') stored.occurrence.timePolicies[0].monthDayOverflow = 'reject';
    if (mutation === 'audience') stored.occurrence.audience = 'different';
    if (mutation === 'time') stored.allocatedAt = '2019-12-31T23:59:59Z';
    if (mutation === 'future-expiry') stored.allocatedAt = '2020-03-01T00:00:00Z';
    if (mutation === 'extra') Object.assign(stored, { success: true });
    await expect(allocateSubscriptionCredits(database(stored), occurrence(), actorId)).rejects.toThrow();
  });
  it('compares complete JSON without depending on object key insertion order', async () => {
    const input = occurrence(), { timePolicies, ...terms } = input;
    const stored = { ...allocationReceipt(), occurrence: { timePolicies, ...terms } };
    await expect(allocateSubscriptionCredits(database(stored), input, actorId)).resolves.toEqual(stored);
  });
  it.each(['expires_first', 'oldest_first'])('retains explicit %s consumption and complete attribution', async spendingOrder => {
    const input = { ...command(), spendingOrder }, stored = { ...consumptionReceipt(), command: input }, db = database(stored);
    expect(await consumeSubscriptionCredits(db, input, actorId)).toEqual(stored);
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith('consume_subscription_credits', { p_command: input, p_actor_id: actorId });
  });
  it.each(['zero', 'negative', 'capacity', 'fraction', 'order', 'actor', 'action', 'missing-action', 'unknown'])('rejects malformed %s consumption before RPC', async mutation => {
    const input = command();
    if (mutation === 'zero') input.amount = 0;
    if (mutation === 'negative') input.amount = -1;
    if (mutation === 'capacity') input.amount = 2147483648;
    if (mutation === 'fraction') input.amount = 1.5;
    if (mutation === 'order') input.spendingOrder = '';
    if (mutation === 'action') input.actionKey = ' ';
    if (mutation === 'missing-action') Reflect.deleteProperty(input, 'actionKey');
    if (mutation === 'unknown') Object.assign(input, { actorId });
    const db = database(consumptionReceipt());
    await expect(consumeSubscriptionCredits(db, input, mutation === 'actor' ? 'invalid' : actorId)).rejects.toThrow();
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it.each(['actor', 'operation', 'action', 'recipient', 'pool', 'amount', 'order', 'sum', 'duplicate', 'empty', 'negative', 'timestamp', 'ledger'])('rejects altered consumption %s acknowledgement', async mutation => {
    const stored = consumptionReceipt();
    if (mutation === 'actor') stored.actorId = id(20);
    if (mutation === 'operation') stored.command.operationId = id(20);
    if (mutation === 'action') stored.command.actionKey = 'different_same_price_action';
    if (mutation === 'recipient') stored.command.recipient.id = id(20);
    if (mutation === 'pool') stored.command.poolKey = 'different';
    if (mutation === 'amount') stored.command.amount = 5;
    if (mutation === 'order') stored.command.spendingOrder = 'oldest_first';
    if (mutation === 'sum') stored.allocations[0].amount = 3;
    if (mutation === 'duplicate') stored.allocations = [{ ...stored.allocations[0], amount: 2 }, { ...stored.allocations[0], amount: 2 }];
    if (mutation === 'empty') stored.allocations = [];
    if (mutation === 'negative') stored.allocations[0].amount = -4;
    if (mutation === 'timestamp') stored.consumedAt = 'invalid';
    if (mutation === 'ledger') stored.ledgerId = 'invalid';
    await expect(consumeSubscriptionCredits(database(stored), command(), actorId)).rejects.toThrow();
  });
  it('accepts consumption attribution split across distinct allocations', async () => {
    const stored = consumptionReceipt(); stored.allocations = [{ referenceId: `sc1_${'b'.repeat(64)}`, amount: 1 }, { referenceId: occurrence().referenceId, amount: 3 }];
    expect(await consumeSubscriptionCredits(database(stored), command(), actorId)).toEqual(stored);
  });
  it('accepts exact active-allocation accounting including aggregates beyond int4', async () => {
    const stored = { ...usage(), allocated: 4294967294, consumed: 2147483647, remaining: 2147483647 }, db = database(stored);
    expect(await readSubscriptionCreditUsage(db, scope())).toEqual(stored);
    expect(db.rpc).toHaveBeenCalledExactlyOnceWith('get_subscription_credit_usage', { p_scope: scope() });
    expect(await readSubscriptionCreditUsage(database({ ...usage(), allocated: 0, consumed: 0, remaining: 0 }), scope())).toMatchObject({ remaining: 0 });
  });
  it.each(['product', 'recipient', 'pool', 'accounting', 'negative', 'unsafe', 'fraction', 'timestamp', 'missing'])('rejects invalid %s usage', async mutation => {
    const stored = usage();
    if (mutation === 'product') stored.productId = id(20);
    if (mutation === 'recipient') stored.recipient.kind = 'managed_learner';
    if (mutation === 'pool') stored.poolKey = 'different';
    if (mutation === 'accounting') stored.remaining++;
    if (mutation === 'negative') stored.consumed = -1;
    if (mutation === 'unsafe') stored.allocated = Number.MAX_SAFE_INTEGER + 1;
    if (mutation === 'fraction') stored.consumed = 0.5;
    if (mutation === 'timestamp') stored.asOf = 'invalid';
    await expect(readSubscriptionCreditUsage(database(mutation === 'missing' ? null : stored), scope())).rejects.toThrow();
  });
  it.each(['allocate', 'consume', 'usage'])('propagates %s database failures without retry, fallback or private diagnostics', async kind => {
    const db = database(null, { message: 'private diagnostic' });
    const run = () => kind === 'allocate' ? allocateSubscriptionCredits(db, occurrence(), actorId)
      : kind === 'consume' ? consumeSubscriptionCredits(db, command(), actorId) : readSubscriptionCreditUsage(db, scope());
    await expect(run()).rejects.toThrow('Subscription credit persistence is unavailable');
    expect(db.rpc).toHaveBeenCalledTimes(1);
    const uncertain = new Error('transport interrupted'); db.abortSignal.mockRejectedValueOnce(uncertain);
    await expect(run()).rejects.toBe(uncertain);
    expect(db.rpc).toHaveBeenCalledTimes(2);
  });
  it.each(['allocate', 'consume', 'usage'])('bounds %s IO with the existing application deadline and preserves abort failure', async kind => {
    const signal = new AbortController().signal;
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal);
    try {
      const db = database(kind === 'allocate' ? allocationReceipt() : kind === 'consume' ? consumptionReceipt() : usage());
      const run = () => kind === 'allocate' ? allocateSubscriptionCredits(db, occurrence(), actorId)
        : kind === 'consume' ? consumeSubscriptionCredits(db, command(), actorId) : readSubscriptionCreditUsage(db, scope());
      await run();
      expect(timeout).toHaveBeenCalledWith(15000);
      expect(db.abortSignal).toHaveBeenCalledExactlyOnceWith(signal);
      const aborted = new DOMException('Deadline elapsed', 'TimeoutError');
      db.abortSignal.mockRejectedValueOnce(aborted);
      await expect(run()).rejects.toBe(aborted);
      expect(db.rpc).toHaveBeenCalledTimes(2);
    } finally { timeout.mockRestore(); }
  });
});


describe('immutable scoped debit lookup (isolated app read)', () => {
  const receiptDatabase = (data: unknown, error: unknown = null) => {
    const abortSignal = vi.fn().mockResolvedValue({ data, error });
    const limit = vi.fn().mockReturnValue({ abortSignal });
    const eq = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ eq });
    return { from: vi.fn().mockReturnValue({ select }), eq, abortSignal };
  };
  it('returns the original scoped receipt after expiry without executing a debit', async () => {
    const stored = consumptionReceipt(), db = receiptDatabase([{ receipt: stored }]);
    expect(await readSubscriptionCreditConsumption(db, command().operationId, scope(), actorId, command().actionKey)).toEqual(stored);
    expect(db.from).toHaveBeenCalledExactlyOnceWith('subscription_credit_consumptions');
    expect(db.eq).toHaveBeenCalledExactlyOnceWith('operation_id', command().operationId);
  });
  it('distinguishes an absent operation from an unavailable owner', async () => {
    expect(await readSubscriptionCreditConsumption(receiptDatabase([]), command().operationId, scope(), actorId, command().actionKey)).toBeNull();
    await expect(readSubscriptionCreditConsumption(receiptDatabase(null, {}), command().operationId, scope(), actorId, command().actionKey)).rejects.toThrow('unavailable');
  });
  it.each(['actor', 'subscription', 'product', 'recipient', 'pool', 'action', 'operation', 'attribution', 'duplicate', 'extra-row'])('rejects altered original %s', async mutation => {
    const stored = consumptionReceipt();
    if (mutation === 'actor') stored.actorId = id(20);
    if (mutation === 'subscription') stored.command.subscriptionId = id(20);
    if (mutation === 'product') stored.command.productId = id(20);
    if (mutation === 'recipient') stored.command.recipient.id = id(20);
    if (mutation === 'pool') stored.command.poolKey = 'other';
    if (mutation === 'action') stored.command.actionKey = 'other';
    if (mutation === 'operation') stored.command.operationId = id(20);
    if (mutation === 'attribution') stored.allocations[0].amount++;
    if (mutation === 'duplicate') stored.allocations = [{ ...stored.allocations[0], amount: 2 }, { ...stored.allocations[0], amount: 2 }];
    const rows = mutation === 'extra-row' ? [{ receipt: stored }, { receipt: stored }] : [{ receipt: stored }];
    await expect(readSubscriptionCreditConsumption(receiptDatabase(rows), command().operationId, scope(), actorId, command().actionKey)).rejects.toThrow();
  });
});


describe('immutable allocation lookup', () => {
  const read = (rows: unknown, error: unknown = null) => ({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ abortSignal: vi.fn().mockResolvedValue({ data: rows, error }) }) }),
  }) }) });
  it('returns original expired allocation with complete identity and preserves absence', async () => {
    const saved = allocationReceipt();
    expect(await readSubscriptionCreditAllocation(read([{ receipt: saved }]), occurrence(), actorId)).toEqual(saved);
    expect(await readSubscriptionCreditAllocation(read([]), occurrence(), actorId)).toBeNull();
  });
  it.each(['actor', 'quantity', 'calendar', 'duplicate'])('rejects altered allocation %s', async defect => {
    const saved = allocationReceipt();
    if (defect === 'actor') saved.actorId = id(30);
    if (defect === 'quantity') saved.occurrence.quantity++;
    if (defect === 'calendar') saved.occurrence.timePolicies[0].monthDayOverflow = 'reject';
    await expect(readSubscriptionCreditAllocation(read(defect === 'duplicate' ? [{ receipt: saved }, { receipt: saved }] : [{ receipt: saved }]), occurrence(), actorId)).rejects.toThrow();
  });
  it('does not treat an unavailable owner as an absent operation', async () => {
    await expect(readSubscriptionCreditAllocation(read(null, {}), occurrence(), actorId)).rejects.toThrow('unavailable');
  });
});
