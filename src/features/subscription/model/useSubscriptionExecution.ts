import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { payIssuedSubscriptionOrder, prepareSubscriptionCheckout } from '../api/razorpayService';
import { subscriptionExecutionService as api, commerceQuoteRequest, commerceQuoteSchema, commerceSettlementRequest, contractActivationRequest, issuedOrderSchema, type Catalog, type CommerceIntent, type CommerceSettlementRequest, type ContractActivationRequest, type CreditHistory, type Current, type Discovery, type HistoricalCreditPools, type LifecycleRequest, type SubscriptionAudit, type Usage } from '../api/subscriptionExecutionService';

export type LoadState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Subscription request failed.';

function useRead<T>(read: (signal: AbortSignal) => Promise<T>): [LoadState<T>, () => void] {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState({ status: 'loading' });
    void read(controller.signal).then(data => { if (active) setState({ status: 'ready', data }); }, error => {
      if (active) setState({ status: 'error', message: errorMessage(error) });
    });
    return () => { active = false; controller.abort(); };
  }, [read, revision]);
  return [state, useCallback(() => setRevision(value => value + 1), [])];
}

export function useSubscriptionDiscovery(cursor?: string) {
  return useRead(useCallback(signal => api.discover(signal, cursor), [cursor]));
}
export function usePublishedCatalog(cursor?: string) {
  return useRead<Catalog>(useCallback(signal => api.catalog(signal, cursor), [cursor]));
}
export function useCurrentSubscription(row: Discovery['items'][number], context: Discovery) {
  return useRead<Current>(useCallback(signal => api.current(row, context, signal), [row, context]));
}
/** Resolve the buyer's live subscription before choosing purchase, renewal or upgrade. */
export function useCatalogPurchaseContext(catalog: Catalog, subject: Current['state']['subject'] | null) {
  const actorId = catalog.actorId, productId = catalog.productId, kind = subject?.kind, subjectId = subject?.id;
  return useRead(useCallback(async signal => {
    if (!kind || !subjectId) throw new Error('Your purchasing account is unavailable. Refresh your identity before purchasing.');
    const matches: Discovery['items'] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    do {
      const page = await api.discover(signal, cursor);
      if (page.actorId !== actorId || page.productId !== productId) throw new Error('Subscription account scope differs.');
      for (const row of page.items) {
        if (seen.has(row.id)) throw new Error('Subscription discovery repeated a record.');
        seen.add(row.id);
        if (row.subject.kind === kind && row.subject.id === subjectId && row.status !== 'cancelled' && row.status !== 'expired') matches.push(row);
      }
      if (page.nextCursor && page.nextCursor === cursor) throw new Error('Subscription discovery did not advance.');
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    if (matches.length > 1) throw new Error('Multiple current subscriptions need review before another payment.');
    const row = matches[0];
    if (!row) return { current: null, operations: [] as Discovery['items'][number]['lifecycleOperations'] };
    if (row.kind !== 'initialized') throw new Error('Your current subscription needs setup before it can be upgraded. Contact support before paying.');
    return { current: await api.current(row, { actorId, productId }, signal), operations: row.lifecycleOperations };
  }, [actorId, productId, kind, subjectId]));
}
export function useCreditUsage(current: Current, pool: Current['pools'][number], recipientId: string) {
  return useRead<Usage>(useCallback(signal => api.usage(current, pool, recipientId, signal), [current, pool, recipientId]));
}
export function useCreditHistory(current: Current, pool: Current['pools'][number], recipientId: string, after: string | null, revisionId?: string) {
  return useRead<CreditHistory>(useCallback(signal => api.history(current, pool, recipientId, after, signal, revisionId), [current, pool, recipientId, after, revisionId]));
}
export function useHistoricalCreditPools(current: Current, revisionId: string) {
  return useRead<HistoricalCreditPools>(useCallback(signal => api.historicalPools(current, revisionId, signal), [current, revisionId]));
}
export function useSubscriptionAudit(current: Current, after: string | null) {
  return useRead<SubscriptionAudit>(useCallback(signal => api.audit(current, after, signal), [current, after]));
}

type WriteState = { status: 'idle' } | { status: 'checking' } | { status: 'blocked'; message: string } | { status: 'pending'; operationId: string }
  | { status: 'error'; operationId: string; message: string } | { status: 'committed'; operationId: string };
const trackedOperation = z.object({ version: z.literal(1), operationId: z.string().uuid() }).strict();
/** This same-tab journal tracks uncertainty only; it never grants authority or substitutes a receipt. */
export function useSubscriptionExecution(scope: Pick<Discovery, 'actorId' | 'productId'> | null) {
  const key = scope ? `subscription:lifecycle:${scope.actorId}:${scope.productId}` : null;
  const [saved, setSaved] = useState<{ key: string | null; state: WriteState }>({ key: null, state: { status: 'checking' } });
  const state: WriteState = key === saved.key && key !== null ? saved.state : { status: 'checking' };
  const locked = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const activeKey = useRef<string | null>(null);
  const update = (writeKey: string, next: WriteState) => { if (activeKey.current === writeKey) setSaved({ key: writeKey, state: next }); };
  useEffect(() => {
    activeKey.current = key; locked.current = true;
    if (key) {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw !== null) {
          const pending = trackedOperation.parse(JSON.parse(raw));
          setSaved({ key, state: { status: 'error', operationId: pending.operationId, message: 'A previous request needs owner reconciliation.' } });
        } else {
          locked.current = false; setSaved({ key, state: { status: 'idle' } });
        }
      } catch {
        setSaved({ key, state: { status: 'blocked', message: 'Operation tracking is unavailable or invalid. Resolve tracking before submitting a change.' } });
      }
    }
    return () => { activeKey.current = null; controller.current?.abort(); };
  }, [key]);
  const submit = async (request: LifecycleRequest['request'], current: Current) => {
    if (locked.current || !key || state.status !== 'idle' || current.actorId !== scope?.actorId || current.state.productId !== scope.productId) return;
    locked.current = true;
    const operationId = crypto.randomUUID();
    try {
      // Recheck immediately before writing; another mounted view may have stored an intent.
      if (sessionStorage.getItem(key) !== null || sessionStorage.getItem(`subscription:commerce:${scope.actorId}:${scope.productId}`) !== null) throw new Error('An operation is already tracked');
      const value = JSON.stringify(trackedOperation.parse({ version: 1, operationId }));
      sessionStorage.setItem(key, value);
      if (sessionStorage.getItem(key) !== value) throw new Error('Operation tracking was not saved');
    } catch {
      update(key, { status: 'blocked', message: 'Operation tracking could not be saved. No request was sent; reconcile any existing tracked operation.' });
      return;
    }
    update(key, { status: 'pending', operationId });
    controller.current = new AbortController();
    try {
      await api.lifecycle({ operationId, request }, current, controller.current.signal);
      // Remove only our own reference after a validated owner acknowledgement.
      const raw = sessionStorage.getItem(key);
      if (raw === null || trackedOperation.parse(JSON.parse(raw)).operationId !== operationId) throw new Error('Operation tracking changed; owner reconciliation is required');
      sessionStorage.removeItem(key);
      update(key, { status: 'committed', operationId });
    } catch (error) {
      update(key, { status: 'error', operationId, message: errorMessage(error) });
    }
  };
  return { state, submit };
}

const checkoutJournal = z.object({
  version: z.literal(1), quoteOperationId: z.string().uuid(), orderOperationId: z.string().uuid(),
  settlementOperationId: z.string().uuid(), phase: z.enum(['quote', 'order_requested']).optional(), intent: commerceQuoteRequest, quote: commerceQuoteSchema.optional(),
  order: issuedOrderSchema.optional(), paymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/).optional(),
  settlementRequest: commerceSettlementRequest.optional()
}).strict().superRefine((journal, context) => {
  if (journal.phase === 'quote' && (journal.order || journal.paymentId || journal.settlementRequest)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Quote-only tracking contains payment evidence.' });
  }
  if (journal.settlementRequest && (!journal.quote || !journal.order
    || (journal.paymentId !== undefined && (!('paymentId' in journal.settlementRequest) || journal.settlementRequest.paymentId !== journal.paymentId)))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Tracked settlement request differs from retained payment evidence.' });
  }
});
type CheckoutJournal = z.infer<typeof checkoutJournal>;
type CheckoutState = { status: 'checking' } | { status: 'committed' } | { status: 'idle'; notice?: 'released' }
  | { status: 'pending'; stage: 'sdk' | 'quote' | 'order' | 'checkout' | 'settlement' | 'status' }
  | { status: 'quoted' | 'resumable' | 'paid' | 'expired'; journal: CheckoutJournal }
  | { status: 'error'; message: string; journal?: CheckoutJournal };
/** Durable references precede every mutation; only matching owner settlement clears them. */
export function useSubscriptionCheckout(scope: Pick<Catalog, 'actorId' | 'productId'>) {
  const key = `subscription:commerce:${scope.actorId}:${scope.productId}`;
  const lifecycleKey = `subscription:lifecycle:${scope.actorId}:${scope.productId}`;
  const [saved, setSaved] = useState<{ key: string; state: CheckoutState }>({ key, state: { status: 'checking' } });
  const state: CheckoutState = saved.key === key ? saved.state : { status: 'checking' };
  const active = useRef<string | null>(null), busy = useRef(false), controller = useRef<AbortController | null>(null);
  const update = (next: CheckoutState) => { if (active.current === key) setSaved({ key, state: next }); };
  useEffect(() => {
    active.current = key; busy.current = false;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) setSaved({ key, state: { status: 'idle' } });
      else {
        const journal = checkoutJournal.parse(JSON.parse(raw));
        // Older records cannot prove whether an order request was sent. Keep their lock.
        const restored: CheckoutState = journal.phase === 'quote'
          ? journal.quote ? { status: 'quoted', journal }
            : { status: 'error', message: 'The quote request was interrupted before payment started.', journal }
          : { status: 'error', message: 'Your previous checkout was interrupted. Check its payment status before continuing.', journal };
        setSaved({ key, state: restored });
      }
    } catch { setSaved({ key, state: { status: 'error', message: 'Checkout tracking is invalid or unavailable. No payment can start.' } }); }
    return () => { active.current = null; controller.current?.abort(); };
  }, [key]);
  const store = (journal: CheckoutJournal, previous: CheckoutJournal | null) => {
    const raw = sessionStorage.getItem(key);
    if (previous === null ? raw !== null : raw !== JSON.stringify(previous)) throw new Error('Checkout tracking changed; reconcile with the owner.');
    if (sessionStorage.getItem(lifecycleKey) !== null) throw new Error('A lifecycle operation needs reconciliation before checkout.');
    const serialized = JSON.stringify(checkoutJournal.parse(journal));
    sessionStorage.setItem(key, serialized);
    if (sessionStorage.getItem(key) !== serialized) throw new Error('Checkout tracking could not be saved.');
  };
  const confirm = async (journal: CheckoutJournal, signal: AbortSignal) => {
    if (!journal.quote || !journal.order || !journal.settlementRequest) throw new Error('Payment references require owner reconciliation.');
    if (journal.quote.actorId !== scope.actorId || journal.quote.productId !== scope.productId) throw new Error('Checkout scope differs.');
    update({ status: 'pending', stage: 'settlement' });
    await api.settle(journal.settlementOperationId, journal.quote, journal.order, journal.settlementRequest, signal);
    if (sessionStorage.getItem(key) !== JSON.stringify(journal)) throw new Error('Checkout tracking changed; reconcile the payment.');
    sessionStorage.removeItem(key);
    update({ status: 'committed' });
  };
  const quote = async (intent: CommerceIntent, checkoutImmediately = false) => {
    if (busy.current || state.status !== 'idle') return;
    busy.current = true;
    let journal: CheckoutJournal | undefined;
    controller.current = new AbortController();
    try {
      journal = checkoutJournal.parse({
        version: 1, quoteOperationId: crypto.randomUUID(), orderOperationId: crypto.randomUUID(),
        settlementOperationId: crypto.randomUUID(), phase: 'quote', intent
      });
      store(journal, null);
      if (checkoutImmediately) {
        update({ status: 'pending', stage: 'sdk' });
        await prepareSubscriptionCheckout(controller.current.signal);
      }
      update({ status: 'pending', stage: 'quote' });
      const ownerQuote = await api.quote(journal.quoteOperationId, intent, scope, controller.current.signal);
      const next = { ...journal, quote: ownerQuote }; store(next, journal); journal = next;
      if (checkoutImmediately) await processPayment(journal, controller.current.signal);
      else update({ status: 'quoted', journal });
    } catch (error) { update({ status: 'error', message: errorMessage(error), journal }); }
    finally { busy.current = false; }
  };
  async function processPayment(original: CheckoutJournal, signal: AbortSignal) {
    let journal = original;
    try {
      const ownerQuote = journal.quote;
      if (!ownerQuote) throw new Error('Validated pricing is required before payment.');
      update({ status: 'pending', stage: 'sdk' });
      await prepareSubscriptionCheckout(signal);
      // Persist uncertainty before sending the order request, including response loss.
      const requested: CheckoutJournal = { ...journal, phase: 'order_requested' };
      store(requested, journal); journal = requested; update({ status: 'pending', stage: 'order' });
      const order = await api.order(journal.orderOperationId, ownerQuote, signal);
      const ordered = { ...journal, order }; store(ordered, journal); journal = ordered;
      await completePayment(journal, signal);
    } catch (error) { update({ status: 'error', message: errorMessage(error), journal }); }
  }
  async function completePayment(original: CheckoutJournal, signal: AbortSignal) {
    let journal = original;
    try {
      if (!journal.quote || !journal.order) throw new Error('Tracked order is unavailable.');
      const q = journal.quote;
      update({ status: 'pending', stage: 'checkout' });
      const proof = await payIssuedSubscriptionOrder(journal.order.order, 'Subscription payment', signal, q.validUntil);
      // A previously reserved reconciliation must retain its exact request identity.
      const settlementRequest = journal.settlementRequest ?? commerceSettlementRequest.parse({
        kind: 'settle',
        subscriptionId: q.subscriptionId, subject: q.subject, expectedVersion: q.stateVersion,
        expectedRevisionId: q.expectedRevisionId, quoteId: q.id, paymentId: proof.razorpay_payment_id
      });
      const payable = { ...journal, ...('paymentId' in settlementRequest ? { paymentId: proof.razorpay_payment_id } : {}), settlementRequest };
      store(payable, journal); journal = payable;
      await confirm(journal, signal);
    } catch (error) { update({ status: 'error', message: errorMessage(error), journal }); }
  }
  const pay = async () => {
    if (busy.current || state.status !== 'quoted' || !state.journal.quote) return;
    busy.current = true; controller.current = new AbortController();
    try { await processPayment(state.journal, controller.current.signal); }
    finally { busy.current = false; }
  };
  const purchase = (intent: CommerceIntent) => quote(intent, true);
  async function inspectCheckout(journal: CheckoutJournal, signal: AbortSignal) {
    if (!journal.quote) throw new Error('Checkout references are unavailable. Contact support.');
    const result = await api.checkoutStatus(journal.orderOperationId, journal.quote, signal);
    if (!('issued' in result)) {
      // No provider order exists for this reservation, so no payment can be attached to it.
      if (journal.order || journal.paymentId || journal.settlementRequest) throw new Error('Saved payment evidence differs from the payment status. Contact support.');
      return { status: result.status, journal };
    }
    if (journal.order && result.issued.order.id !== journal.order.order.id) throw new Error('Payment order changed. Contact support.');
    if ((result.status === 'unpaid' || result.status === 'expired') && (journal.paymentId || journal.settlementRequest && 'paymentId' in journal.settlementRequest)) {
      throw new Error('Saved payment evidence differs from the payment status. Contact support.');
    }
    const tracked = { ...journal, order: result.issued };
    store(tracked, journal);
    return { status: result.status, journal: tracked };
  }
  /** Archive exact references, then release the active lock. No order or charge is created here. */
  const release = (journal: CheckoutJournal) => {
    const serialized = JSON.stringify(journal);
    if (sessionStorage.getItem(key) !== serialized || sessionStorage.getItem(lifecycleKey) !== null) {
      throw new Error('Checkout tracking changed; reconcile with the owner.');
    }
    const archiveKey = key + ':archive:' + journal.quoteOperationId;
    const archived = sessionStorage.getItem(archiveKey);
    if (archived !== null && archived !== serialized) throw new Error('Archived checkout evidence differs. Contact support.');
    sessionStorage.setItem(archiveKey, serialized);
    if (sessionStorage.getItem(archiveKey) !== serialized || sessionStorage.getItem(key) !== serialized) {
      throw new Error('Checkout evidence could not be archived. The existing checkout remains protected.');
    }
    sessionStorage.removeItem(key);
    if (sessionStorage.getItem(key) !== null) throw new Error('Checkout tracking could not be released.');
  };
  const checkPayment = async () => {
    if (busy.current || state.status !== 'error' || !state.journal?.quote) return;
    busy.current = true; controller.current = new AbortController();
    let journal = state.journal;
    try {
      update({ status: 'pending', stage: 'status' });
      const result = await inspectCheckout(journal, controller.current.signal); journal = result.journal;
      if (result.status === 'unpaid') update({ status: 'resumable', journal });
      else if (result.status === 'paid') update({ status: 'paid', journal });
      else if (result.status === 'expired' && !journal.settlementRequest && !journal.paymentId) update({ status: 'expired', journal });
      else if (result.status === 'not_issued') { release(journal); update({ status: 'idle', notice: 'released' }); }
      else if (result.status === 'order_pending') throw new Error('Your payment order is still being set up. No payment has been taken. Check again in a minute.');
      else throw new Error('This payment is still pending or needs review. Contact support before another payment.');
    } catch (error) { update({ status: 'error', message: errorMessage(error), journal }); }
    finally { busy.current = false; }
  };
  const restartExpiredCheckout = async () => {
    if (busy.current || state.status !== 'expired') return;
    busy.current = true; controller.current = new AbortController();
    let journal = state.journal;
    try {
      update({ status: 'pending', stage: 'status' });
      const result = await inspectCheckout(journal, controller.current.signal); journal = result.journal;
      if (result.status === 'paid') { update({ status: 'paid', journal }); return; }
      if ((result.status !== 'expired' && result.status !== 'not_issued') || journal.paymentId || journal.settlementRequest) {
        throw new Error('This checkout cannot be restarted. Check its payment status before continuing.');
      }
      release(journal);
      update({ status: 'idle' });
    } catch (error) { update({ status: 'error', message: errorMessage(error), journal }); }
    finally { busy.current = false; }
  };
  const resumePayment = async () => {
    if (busy.current || state.status !== 'resumable') return;
    busy.current = true; controller.current = new AbortController();
    let journal = state.journal;
    try {
      update({ status: 'pending', stage: 'status' });
      const result = await inspectCheckout(journal, controller.current.signal); journal = result.journal;
      if (result.status === 'paid') { update({ status: 'paid', journal }); return; }
      if (result.status !== 'unpaid') throw new Error('This checkout can no longer be resumed. Check its payment status before continuing.');
      await completePayment(journal, controller.current.signal);
    } catch (error) { update({ status: 'error', message: errorMessage(error), journal }); }
    finally { busy.current = false; }
  };
  const reconcileSettlement = async () => {
    if (busy.current || (state.status !== 'error' && state.status !== 'paid') || !state.journal?.quote || !state.journal.order) return;
    busy.current = true;
    let journal = state.journal; controller.current = new AbortController();
    try {
      if (!journal.settlementRequest) {
        const q = state.journal.quote;
        const common = {
          kind: 'settle' as const, subscriptionId: q.subscriptionId, subject: q.subject,
          expectedVersion: q.stateVersion, expectedRevisionId: q.expectedRevisionId, quoteId: q.id
        };
        // Persist the exact original payment request when evidence exists; callback loss uses explicit owner reconciliation.
        const settlementRequest: CommerceSettlementRequest = commerceSettlementRequest.parse(journal.paymentId ? { ...common, paymentId: journal.paymentId } : { ...common, reconcile: true });
        const tracked = { ...journal, settlementRequest }; store(tracked, journal); journal = tracked;
      } else store(journal, journal);
      await confirm(journal, controller.current.signal);
    }
    catch (error) { update({ status: 'error', message: errorMessage(error), journal }); }
    finally { busy.current = false; }
  };
  const cancelQuote = () => {
    if (busy.current || (state.status !== 'quoted' && state.status !== 'error') || state.journal?.phase !== 'quote') return;
    const journal = state.journal;
    try {
      if (journal.order || journal.paymentId || journal.settlementRequest || sessionStorage.getItem(key) !== JSON.stringify(journal)) {
        throw new Error('Checkout tracking changed; reconcile with the owner.');
      }
      // Only the explicit pre-order phase can be cancelled locally. No provider operation is replayed.
      sessionStorage.removeItem(key); update({ status: 'idle' });
    } catch (error) { update({ status: 'error', message: errorMessage(error), journal }); }
  };
  const stopCheckout = () => {
    if (state.status === 'pending' && (state.stage === 'sdk' || state.stage === 'checkout')) controller.current?.abort();
  };
  return { state, quote, purchase, pay, checkPayment, restartExpiredCheckout, resumePayment, reconcileSettlement, cancelQuote, stopCheckout };
}

const activationJournal = z.object({
  version: z.literal(2), operationId: z.string().uuid(),
  request: contractActivationRequest
}).strict();
type ActivationJournal = z.infer<typeof activationJournal>;
type ActivationState = { status: 'checking' | 'idle' | 'pending' | 'committed' }
  | { status: 'error'; message: string; journal?: ActivationJournal };
/** Shares the commerce journal lock with paid checkout. A contract authorizes
 * the exact validity/terms; the browser sends only its retained reference. */
export function useSubscriptionContractActivation(scope: Pick<Catalog, 'actorId' | 'productId'>) {
  const key = `subscription:commerce:${scope.actorId}:${scope.productId}`;
  const [saved, setSaved] = useState<{ key: string; state: ActivationState }>({ key, state: { status: 'checking' } });
  const state: ActivationState = saved.key === key ? saved.state : { status: 'checking' };
  const active = useRef<string | null>(null), busy = useRef(false), controller = useRef<AbortController | null>(null);
  const update = (next: ActivationState) => { if (active.current === key) setSaved({ key, state: next }); };
  useEffect(() => {
    active.current = key; busy.current = false;
    try {
      const raw = sessionStorage.getItem(key);
      setSaved({
        key, state: raw === null ? { status: 'idle' } : {
          status: 'error',
          message: 'A retained commerce operation needs reconciliation.', journal: activationJournal.parse(JSON.parse(raw))
        }
      });
    } catch { setSaved({ key, state: { status: 'error', message: 'Existing commerce tracking must be reconciled before contract activation.' } }); }
    return () => { active.current = null; controller.current?.abort(); };
  }, [key]);
  const commit = async (journal: ActivationJournal) => {
    if (sessionStorage.getItem(`subscription:lifecycle:${scope.actorId}:${scope.productId}`) !== null) throw new Error('A lifecycle operation requires reconciliation.');
    const serialized = JSON.stringify(journal);
    if (sessionStorage.getItem(key) !== serialized) throw new Error('Contract activation tracking changed.');
    update({ status: 'pending' }); controller.current = new AbortController();
    await api.activateContract(journal.operationId, journal.request, scope, controller.current.signal);
    if (sessionStorage.getItem(key) !== serialized) throw new Error('Contract activation tracking changed; reconcile the original operation.');
    sessionStorage.removeItem(key); update({ status: 'committed' });
  };
  const submit = async (request: ContractActivationRequest) => {
    if (busy.current || state.status !== 'idle') return;
    busy.current = true;
    let journal: ActivationJournal | undefined;
    try {
      if (sessionStorage.getItem(key) !== null) throw new Error('A commerce operation requires reconciliation.');
      journal = activationJournal.parse({ version: 2, operationId: crypto.randomUUID(), request });
      sessionStorage.setItem(key, JSON.stringify(journal));
      await commit(journal);
    } catch (error) { update({ status: 'error', message: errorMessage(error), journal }); }
    finally { busy.current = false; }
  };
  const reconcile = async () => {
    if (busy.current || state.status !== 'error' || !state.journal) return;
    busy.current = true;
    try { await commit(state.journal); }
    catch (error) { update({ status: 'error', message: errorMessage(error), journal: state.journal }); }
    finally { busy.current = false; }
  };
  return { state, submit, reconcile };
}
