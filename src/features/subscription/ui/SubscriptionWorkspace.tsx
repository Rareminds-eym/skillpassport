import { Shield, Sparkles, Calendar, HelpCircle } from 'lucide-react';
import { ROLE_DASHBOARD_MAP } from '@/features/auth/lib/roleBasedRouter';
import { ROUTES } from '@/shared/config/constants';
import { useUser, useUserRole } from '@/shared/model/authStore';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';
import { lifecycleOperation, lifecycleReferenceFields, type Catalog, type Current, type Discovery, type FeatureGrant, type LifecycleRequest } from '../api/subscriptionExecutionService';
import { useCatalogPurchaseContext, useCreditHistory, useCreditUsage, useCurrentSubscription, useHistoricalCreditPools, usePublishedCatalog, useSubscriptionAudit, useSubscriptionCheckout, useSubscriptionDiscovery, useSubscriptionExecution, type LoadState } from '../model/useSubscriptionExecution';
import SubscriptionCatalog, { SubscriptionCatalogFrame, SubscriptionAddOns } from './SubscriptionCatalog';
import { enumLabel, featureName, featureValue, formatPrice, handleTabKeyDown } from '../lib/subscriptionPresentation';
import styles from './SubscriptionWorkspace.module.css';

function ReadPanel<T>({ state, retry, children }: { state: LoadState<T>; retry: () => void; children: (value: T) => ReactNode }) {
  if (state.status === 'loading') return <p role="status" className={styles.notice}>Loading subscription details…</p>;
  if (state.status === 'error') return <div role="alert" className={styles.notice}><p>{state.message}</p><button onClick={retry}>Try reading again</button></div>;
  return <>{children(state.data)}</>;
}
function FeatureList({ features }: { features: FeatureGrant[] }) {
  return <ul className={styles.features}>{features.map(feature => <li key={feature.key}>
    <span>{featureName(feature.key)}</span><strong>{featureValue(feature)}</strong>
  </li>)}</ul>;
}
/** Display only the tax treatment supplied by the published owner policy. */
function taxLabel(tax: Catalog['tax'], taxInclusive: boolean) {
  const rate = (tax.rateBasisPoints / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return taxInclusive ? `Includes ${rate}% ${tax.kind.toUpperCase()}` : `+${rate}% ${tax.kind.toUpperCase()}`;
}
/** Called once after owner-confirmed settlement; the page layer decides where the buyer goes next. */
type PaymentConfirmed = () => void;
type CatalogSelection = { managedSubscriptionId?: string; catalogMode?: 'upgrade' | 'renew' };
function CheckoutStatus({ checkout, onPaymentConfirmed }: { checkout: ReturnType<typeof useSubscriptionCheckout>; onPaymentConfirmed?: PaymentConfirmed }) {
  const { state } = checkout;
  const committed = state.status === 'committed';
  useEffect(() => { if (committed) onPaymentConfirmed?.(); }, [committed, onPaymentConfirmed]);
  if (state.status === 'idle' && state.notice === 'released') return <div className={styles.notice} role="status">
    <p>No payment was taken. Your previous checkout never created a payment order, so it has been closed.</p>
    <p>You can choose a plan again.</p></div>;
  if (state.status === 'idle' || state.status === 'checking') return null;
  if (state.status === 'resumable') return <div className={styles.notice} role="status">
    <p>No payment was completed. You can resume your existing checkout.</p>
    <button onClick={() => void checkout.resumePayment()}>Resume payment</button></div>;
  if (state.status === 'expired') return <div className={styles.notice} role="status">
    <p>This checkout expired without a completed payment. You can choose a plan again.</p>
    <p>Starting again rechecks the payment status and keeps your previous checkout references.</p>
    <button onClick={() => void checkout.restartExpiredCheckout()}>Start again</button></div>;
  if (state.status === 'paid') return <div className={styles.notice} role="status">
    <p>Your payment was received. Confirm it to finish activating your plan.</p>
    <button onClick={() => void checkout.reconcileSettlement()}>Confirm payment</button></div>;
  if (state.status === 'quoted' && state.journal.quote) {
    const quote = state.journal.quote;
    return <div className={styles.notice} role="status"><h4>Continue your checkout</h4>
      <strong>{formatPrice(quote.amountMinor, quote.minorUnit, quote.currency)}</strong>
      <p>{new Date(quote.periodStartsAt).toLocaleDateString()} – {new Date(quote.periodEndsAt).toLocaleDateString()}</p>
      <p>Your price is confirmed. Complete payment to activate your plan.</p>
      <button onClick={() => void checkout.pay()}>Continue to payment</button>
      {state.journal.phase === 'quote' && <button onClick={checkout.cancelQuote}>Choose another plan</button>}</div>;
  }
  if (state.status === 'error') return <div className={styles.notice} role="alert"><p>{state.message}</p>
    {state.journal?.phase === 'quote'
      ? <><p>No payment order was requested. You can choose a plan again.</p><button onClick={checkout.cancelQuote}>Choose another plan</button></>
      : <p>Please check this checkout before starting another payment. Contact support if its status cannot be confirmed.</p>}
    {state.journal && <details><summary>Support references</summary><p>Quote: {state.journal.quoteOperationId} · Order: {state.journal.orderOperationId} · Settlement: {state.journal.settlementOperationId}</p></details>}
    {state.journal?.settlementRequest && state.journal.order && <><p>Your confirmation request is saved. Retry it without opening checkout or charging again.</p>
      <button onClick={() => void checkout.reconcileSettlement()}>Retry payment confirmation</button></>}
    {state.journal?.quote && state.journal.phase !== 'quote' && <><p>Check your existing payment before continuing. This check does not create an order or charge.</p>
      <button onClick={() => void checkout.checkPayment()}>Check payment status</button></>}</div>;
  if (state.status === 'committed') return <div className={styles.notice} role="status">
    <p>Payment confirmed. Your plan is active.</p>
    {onPaymentConfirmed ? <p>Taking you to your dashboard…</p> : <a href="/subscription/manage">View my subscription</a>}
  </div>;
  const progress = {
    sdk: 'Connecting to Razorpay…', quote: 'Confirming your plan price…', order: 'Creating your payment order…',
    checkout: 'Complete payment in the Razorpay window. Your plan activates after payment is verified.',
    settlement: 'Verifying your payment and activating your plan…', status: 'Checking your existing payment…',
  };
  return <div className={styles.notice} role="status"><p>{progress[state.stage]}</p>
    {(state.stage === 'sdk' || state.stage === 'checkout') && <button onClick={checkout.stopCheckout}>
      {state.stage === 'sdk' ? 'Stop connecting' : 'Close payment window'}</button>}</div>;
}
function PlanPurchase({ plan, catalog, checkout, current, operations, allowRenewal = false }: {
  allowRenewal?: boolean; plan: Catalog['plans'][number]; catalog: Catalog;
  checkout: ReturnType<typeof useSubscriptionCheckout>; current?: Current; operations?: Discovery['items'][number]['lifecycleOperations']
}) {
  const user = useUser();
  const { role } = useUserRole();
  const dashboardRoute = role ? ROLE_DASHBOARD_MAP[role] : undefined;
  const isCurrentPlan = current?.state.planId === plan.plan.id;
  const purpose = current ? isCurrentPlan ? 'renew' : 'upgrade' : 'purchase';
  const permitted = !current || operations?.includes(purpose as 'renew' | 'upgrade');
  // The owner fixes the buyer subject per audience: individuals buy for themselves, institutions for their organization.
  const subject = current ? current.state.subject : catalog.subjectKind === 'user' ? { kind: 'user' as const, id: catalog.actorId }
    : catalog.subjectKind === 'organization' && user?.id === catalog.actorId && user.orgId ? { kind: 'organization' as const, id: user.orgId } : null;
  return <div className={styles.purchase}>
    {isCurrentPlan && !allowRenewal ? <section aria-label="Current plan access"><p className="font-semibold">Current plan</p>
      {plan.purchaseMode === 'free' && <p>Free access is activated automatically after email verification.</p>}
      {plan.purchaseMode === 'free'
        ? dashboardRoute ? <a href={dashboardRoute} className="inline-flex justify-center w-full py-4 px-4 rounded-2xl font-semibold bg-emerald-700 text-white hover:bg-emerald-800">Go to dashboard</a>
          : <p>Your dashboard is unavailable. Refresh your identity to continue.</p>
        : <a href="/subscription/manage" className="inline-flex justify-center w-full py-4 px-4 rounded-2xl font-semibold bg-slate-100 text-slate-900">Manage subscription</a>}
    </section> : !subject ? <p>Your selected organization context is unavailable. Refresh your identity before purchasing.</p>
      : plan.purchaseMode === 'free' ? <section aria-label="Free plan access">
        <p>Free access is activated automatically after email verification.</p>
        {dashboardRoute ? <a href={dashboardRoute} className="inline-flex justify-center w-full py-4 px-4 rounded-2xl font-semibold bg-emerald-700 text-white hover:bg-emerald-800">Go to dashboard</a>
          : <p>Your dashboard is unavailable. Refresh your identity to continue.</p>}
      </section>
        : plan.purchaseMode === 'contact_sales' ? <p>Contact our team to arrange your plan.</p>
          : !permitted ? <p>This change is unavailable for your configured role.</p>
            : plan.prices.length === 0 ? <p>Purchasing is unavailable until the purchase owner provides executable terms.</p>
              : plan.prices.map(price => <div key={price.id}>
                {price.quantityBasis === 'seat' ? <p>Seat quantity requires an owner agreement. Purchasing is unavailable until the purchase owner provides executable terms.</p>
                  : price.amountMinor === 0 ? <p>Free activation requires configured duration and entry terms from the subscription owner.</p>
                    : <button disabled={checkout.state.status !== 'idle'} onClick={() => void checkout.purchase({
                      kind: 'quote', purpose,
                      subscriptionId: current?.state.id ?? crypto.randomUUID(), subject, expectedVersion: current?.state.version ?? 0,
                      expectedRevisionId: current?.state.revisionId ?? plan.revisionId, revisionId: plan.revisionId, priceId: price.id
                    })}>
                      {purpose === 'purchase' ? 'Buy Now' : purpose === 'renew' ? 'Renew Plan' : 'Change Plan'} · {formatPrice(price.amountMinor, price.minorUnit, price.currency)}</button>}
              </div>)}
  </div>;
}
function CatalogPrices({ plan, catalog }: { plan: Catalog['plans'][number]; catalog: Catalog }) {
  if (plan.purchaseMode !== 'self_service') return <div className={styles.prices}>
    <strong>{plan.purchaseMode === 'free' ? 'Free' : 'Contact Sales'}</strong>
    <span className={styles.billingPeriod}>{plan.purchaseMode === 'free' ? 'No payment required' : 'Contact our team for pricing'}</span>
  </div>;
  return <ul className={styles.prices}>{plan.prices.map(price => <li key={price.id}>
    <strong>{plan.presentation.priceLabel === 'starting_at' ? 'From ' : ''}{formatPrice(price.amountMinor, price.minorUnit, price.currency)}</strong>
    <span className={styles.billingPeriod}>/ {price.intervalCount === 1 ? '' : `${price.intervalCount} `}{price.intervalUnit}{price.intervalCount === 1 ? '' : 's'}{price.quantityBasis === 'seat' ? ' · per seat' : ''}</span>
    {taxLabel(catalog.tax, plan.presentation.taxInclusive) && <span className={styles.tax}> {taxLabel(catalog.tax, plan.presentation.taxInclusive)}</span>}
    <small>For {price.audiences.map(audience => audience === 'individual' ? 'individuals' : enumLabel(audience)).join(', ')}</small></li>)}</ul>;
}
function PurchaseCatalog({ catalog, selectedRevisionId, qaPresentation = false, onPaymentConfirmed, managedSubscriptionId, catalogMode }: { catalog: Catalog; selectedRevisionId?: string; qaPresentation?: boolean; onPaymentConfirmed?: PaymentConfirmed } & CatalogSelection) {
  const checkout = useSubscriptionCheckout(catalog);
  const user = useUser();
  const subject = catalog.subjectKind === 'user' ? { kind: 'user' as const, id: catalog.actorId }
    : catalog.subjectKind === 'organization' && user?.id === catalog.actorId && user.orgId ? { kind: 'organization' as const, id: user.orgId } : null;
  const [context, retryContext] = useCatalogPurchaseContext(catalog, subject, managedSubscriptionId);
  const purchase = (plan: Catalog['plans'][number]) => <ReadPanel state={context} retry={retryContext}>{value =>
    <PlanPurchase plan={plan} catalog={catalog} current={value.current ?? undefined} operations={value.operations} checkout={checkout} allowRenewal={catalogMode === 'renew'} />
  }</ReadPanel>;
  if (qaPresentation) return <><CheckoutStatus checkout={checkout} onPaymentConfirmed={onPaymentConfirmed} /><SubscriptionCatalog catalog={catalog} selectedRevisionId={selectedRevisionId}
    currentPlanId={context.status === 'ready' ? context.data.current?.state.planId : undefined}
    renderPrices={plan => <CatalogPrices plan={plan} catalog={catalog} />}
    renderPurchase={plan => <>{plan.purchaseMode === 'contact_sales' && <a className="flex items-center justify-center w-full py-4 px-4 rounded-2xl font-semibold bg-black text-white hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl" href={ROUTES.CONTACT}>Talk to Sales</a>}{purchase(plan)}</>} /></>;
  return <><CheckoutStatus checkout={checkout} onPaymentConfirmed={onPaymentConfirmed} /><div className={styles.catalog}>{catalog.plans.map(plan => <article className={plan.revisionId === selectedRevisionId ? `${styles.plan} ${styles.selected}` : styles.plan} key={plan.revisionId}
    aria-current={plan.revisionId === selectedRevisionId ? 'true' : undefined}
    ref={plan.revisionId === selectedRevisionId ? node => node?.scrollIntoView?.({ block: 'center' }) : undefined}>
    {plan.revisionId === selectedRevisionId && <p className={styles.notice}>Your selected plan</p>}
    {plan.presentation.badge && <p className={styles.badge}>{plan.presentation.badge}</p>}
    <p className={styles.eyebrow}>{plan.plan.code} · Revision {plan.revisionNumber}</p><h3>{plan.name}</h3><p>For {plan.audiences.join(', ')}</p>
    <CatalogPrices plan={plan} catalog={catalog} />
    {plan.purchaseMode === 'contact_sales' && <a className={styles.sales} href={ROUTES.CONTACT}>Talk to Sales</a>}
    <FeatureList features={plan.features} />{purchase(plan)}
  </article>)}</div></>;
}
function PublishedPlans({ selectedRevisionId, qaPresentation = false, onPaymentConfirmed, managedSubscriptionId, catalogMode }: { selectedRevisionId?: string; qaPresentation?: boolean; onPaymentConfirmed?: PaymentConfirmed } & CatalogSelection) {
  const [state, retry] = usePublishedCatalog();
  return <section aria-label={qaPresentation ? "Published plans" : undefined} aria-labelledby={qaPresentation ? undefined : "published-plans"}>{!qaPresentation && <div className={styles.sectionHeading}><span>02 / Explore</span><h2 id="published-plans">Published plans</h2></div>}
    <ReadPanel state={state} retry={retry}>{catalog => <>
      {catalog.plans.length === 0 ? <p className={styles.notice}>{catalog.audience === null ? 'No plans are offered for your account type. Contact the subscription owner if this looks wrong.' : 'No published plans are available.'}</p> : <PurchaseCatalog key={`${catalog.actorId}:${catalog.productId}`} catalog={catalog} selectedRevisionId={selectedRevisionId} qaPresentation={qaPresentation} onPaymentConfirmed={onPaymentConfirmed} managedSubscriptionId={managedSubscriptionId} catalogMode={catalogMode} />}
    </>}</ReadPanel>
  </section>;
}
export function PaidSubscriptionChange({ current, operations, onPaymentConfirmed }: { current: Current; operations: Discovery['items'][number]['lifecycleOperations']; onPaymentConfirmed?: PaymentConfirmed }) {
  const [catalog, retry] = usePublishedCatalog();
  const checkout = useSubscriptionCheckout({ actorId: current.actorId, productId: current.state.productId });
  const [selected, setSelected] = useState(current.state.revisionId);
  return <section className={styles.actions}><h3>Renew or upgrade with payment</h3><ReadPanel state={catalog} retry={retry}>{data => {
    if (data.actorId !== current.actorId || data.productId !== current.state.productId) return <p role="alert">Published catalog scope differs.</p>;
    const plan = data.plans.find(value => value.revisionId === selected);
    return <><label>Plan<select value={selected} disabled={checkout.state.status !== 'idle'} onChange={event => setSelected(event.target.value)}>
      <option value="">Choose published terms</option>{data.plans.map(value => <option key={value.revisionId} value={value.revisionId}>{value.name} · Revision {value.revisionNumber}</option>)}</select></label>
      {plan && <PlanPurchase plan={plan} catalog={data} current={current} operations={operations} checkout={checkout} allowRenewal />}</>;
  }}</ReadPanel><CheckoutStatus checkout={checkout} onPaymentConfirmed={onPaymentConfirmed} /></section>;
}
function PoolHistory({ current, pool, recipientId, revisionId }: { current: Current; pool: Current['pools'][number]; recipientId: string; revisionId?: string }) {
  const [after, setAfter] = useState<string | null>(null);
  const [state, retry] = useCreditHistory(current, pool, recipientId, after, revisionId);
  return <ReadPanel state={state} retry={retry}>{history => <section aria-label="Credit allocation history">
    <h5>Allocation history</h5>
    <dl><dt>Lifetime allocated</dt><dd>{history.allocated.toLocaleString()}</dd>
      <dt>Lifetime consumed</dt><dd>{history.consumed.toLocaleString()}</dd>
      <dt>Expired unused</dt><dd>{history.expiredRemaining.toLocaleString()}</dd></dl>
    {history.allocations.length === 0 ? <p>No allocations on this page.</p> : <ul>{history.allocations.map(item => <li key={item.referenceId}>
      <span>{new Date(item.allocatedAt).toLocaleString()} · {item.quantity.toLocaleString()} allocated · {item.consumed.toLocaleString()} consumed</span>
      <small> · {item.remaining.toLocaleString()} available · {item.expiredRemaining.toLocaleString()} expired unused · Expires {new Date(item.expiresAt).toLocaleString()}</small>
    </li>)}</ul>}
    <small>As of {new Date(history.asOf).toLocaleString()}</small>
    <div className={styles.pagination}>{after && <button onClick={() => setAfter(null)}>First allocations</button>}
      {history.nextCursor && <button onClick={() => setAfter(history.nextCursor)}>Next allocations</button>}</div>
  </section>}</ReadPanel>;
}
export function SubscriptionActivity({ current }: { current: Current }) {
  const [after, setAfter] = useState<string | null>(null);
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [state, retry] = useSubscriptionAudit(current, after);
  return <ReadPanel state={state} retry={retry}>{activity => <section aria-label="Subscription activity">
    <h3>Subscription activity</h3>
    {activity.items.length === 0 ? <p>No activity on this page.</p> : <ol>{activity.items.map(item => <li key={item.operationId}>
      <strong>{item.operation.replace(/_/g, ' ')}</strong><p>{item.reason}</p>
      <small>{new Date(item.at).toLocaleString()} · Revision {item.revisionId} · Actor {item.actorId} · Version {item.toVersion}</small>
      <button onClick={() => setRevisionId(item.revisionId)}>View credit pools for revision {item.revisionId}</button>
    </li>)}</ol>}
    <div className={styles.pagination}>{after && <button onClick={() => setAfter(null)}>First activity</button>}
      {activity.nextCursor && <button onClick={() => setAfter(activity.nextCursor)}>Next activity</button>}</div>
    {revisionId && <HistoricalPools key={revisionId} current={current} revisionId={revisionId} />}
  </section>}</ReadPanel>;
}
function HistoricalPools({ current, revisionId }: { current: Current; revisionId: string }) {
  const [state, retry] = useHistoricalCreditPools(current, revisionId);
  return <ReadPanel state={state} retry={retry}>{retained => <section aria-label="Historical credit pools">
    <h4>Credit pools from revision {retained.revisionId}</h4>
    {retained.pools.length === 0 ? <p>No credit pools were configured for this revision.</p>
      : retained.pools.map(pool => <CreditPool key={pool.key} current={current} pool={pool} revisionId={retained.revisionId} />)}
  </section>}</ReadPanel>;
}
function PoolUsage({ current, pool, recipientId }: { current: Current; pool: Current['pools'][number]; recipientId: string }) {
  const [state, retry] = useCreditUsage(current, pool, recipientId);
  const [showHistory, setShowHistory] = useState(false);
  return <><ReadPanel state={state} retry={retry}>{usage => <div className={styles.usage}>
    <div><strong>{usage.remaining.toLocaleString()}</strong><span>remaining</span></div>
    <dl><dt>Active allocated</dt><dd>{usage.allocated.toLocaleString()}</dd><dt>Consumed from active allocation</dt><dd>{usage.consumed.toLocaleString()}</dd></dl>
    <small>As of {new Date(usage.asOf).toLocaleString()} · Recipient {usage.recipient.id}</small>
  </div>}</ReadPanel><button aria-expanded={showHistory} onClick={() => setShowHistory(value => !value)}>{showHistory ? 'Hide allocation history' : 'View allocation history'}</button>
    {showHistory && <PoolHistory current={current} pool={pool} recipientId={recipientId} />}</>;
}
export function CreditPool({ current, pool, revisionId }: { current: Current; pool: Current['pools'][number]; revisionId?: string }) {
  const [recipient, setRecipient] = useState('');
  const [selected, setSelected] = useState('');
  const [invalid, setInvalid] = useState(false);
  const managed = pool.recipient === 'managed_learner';
  return <article className={styles.pool}><h4>{pool.featureKey.replace(/_/g, ' ')}</h4><p>{pool.key} · {pool.recipient.replace(/_/g, ' ')}</p>
    {managed && <form onSubmit={event => {
      event.preventDefault(); const result = z.string().uuid().safeParse(recipient.trim());
      setInvalid(!result.success); if (result.success) setSelected(result.data);
    }}>
      <label>Managed learner ID<input value={recipient} onChange={event => { setRecipient(event.target.value); setSelected(''); }} required /></label>
      <p>The subscription owner verifies the selected recipient. No learner is selected automatically.</p>
      {invalid && <p role="alert">Enter a valid learner identifier.</p>}<button>{revisionId ? 'Read learner history' : 'Read learner usage'}</button>
    </form>}
    {managed && !selected ? <p>Select a managed learner to read usage.</p>
      : revisionId ? <PoolHistory key={selected} current={current} pool={pool} recipientId={managed ? selected : current.state.subject.id} revisionId={revisionId} />
        : <PoolUsage key={selected} current={current} pool={pool} recipientId={managed ? selected : current.state.subject.id} />}
  </article>;
}
const referenceFields = ['targetRevisionId', 'quoteId', 'settlementId', 'approvalId'] as const;
const labels = { targetRevisionId: 'Target revision ID', quoteId: 'Quote ID', settlementId: 'Settlement ID', approvalId: 'Approval ID' };
function LifecycleForm({ current, operations, execution }: { current: Current; operations: Discovery['items'][number]['lifecycleOperations']; execution: ReturnType<typeof useSubscriptionExecution> }) {
  const [operation, setOperation] = useState<LifecycleRequest['request']['operation'] | ''>('');
  const [reason, setReason] = useState('');
  const [references, setReferences] = useState<Record<typeof referenceFields[number], string>>({ targetRevisionId: '', quoteId: '', settlementId: '', approvalId: '' });
  const [timing, setTiming] = useState<'next_renewal' | 'immediate' | ''>('');
  const [error, setError] = useState('');
  const paid = operation === 'upgrade' || operation === 'renew';
  const applicableFields = operation ? lifecycleReferenceFields(operation) : [];
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError('');
    const parsedOperation = lifecycleOperation.safeParse(operation);
    if (!parsedOperation.success || !operations.includes(parsedOperation.data)) { setError('Choose an authorized operation.'); return; }
    if (!reason.trim()) { setError('A reason is required.'); return; }
    const provided: Partial<Record<typeof referenceFields[number], string>> = {};
    for (const key of applicableFields) {
      if (references[key].trim()) {
        const value = z.string().uuid().safeParse(references[key].trim());
        if (!value.success) { setError(`${labels[key]} must be a valid identifier.`); return; }
        provided[key] = value.data;
      }
    }
    if (paid && (!provided.quoteId || !provided.settlementId)) { setError('Provide genuine quote and settlement references from the payment owner.'); return; }
    if (operation === 'downgrade' && (!provided.targetRevisionId || !timing)) { setError('Choose a genuine target revision and explicit timing.'); return; }
    void execution.submit({
      operation: parsedOperation.data, subscriptionId: current.state.id, subject: current.state.subject,
      expectedVersion: current.state.version, expectedRevisionId: current.state.revisionId, reason: reason.trim(), ...provided,
      ...(operation === 'downgrade' && timing ? { timing } : {})
    }, current);
  };
  return <section className={styles.actions}><h3>Request a subscription change</h3>
    <p>Available operations reflect your configured role permissions. State, payment and approval prerequisites are checked by the subscription owner when submitted.</p>
    {operations.length === 0 ? <p>No lifecycle operations are authorized for your role.</p> : <form onSubmit={submit}>
      <fieldset disabled={execution.state.status !== 'idle'}><legend>Change request</legend>
        <label>Operation<select value={operation} onChange={event => { const next = lifecycleOperation.safeParse(event.target.value); setOperation(next.success ? next.data : ''); setReferences({ targetRevisionId: '', quoteId: '', settlementId: '', approvalId: '' }); setTiming(''); setError(''); }} required>
          <option value="">Choose an operation</option>{operations.map(value => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}
        </select></label>
        <label>Reason<textarea value={reason} maxLength={2000} onChange={event => setReason(event.target.value)} required /></label>
        <div className={styles.referenceGrid}>{applicableFields.map(key => <label key={key}>{labels[key]}<input value={references[key]} onChange={event => setReferences(value => ({ ...value, [key]: event.target.value }))}
          required={key !== 'approvalId'} /></label>)}</div>
        {operation === 'downgrade' && <label>Timing<select required value={timing} onChange={event => { const value = event.target.value; if (value === '' || value === 'immediate' || value === 'next_renewal') setTiming(value); }}>
          <option value="">Unspecified — owner validates</option><option value="next_renewal">Next renewal</option><option value="immediate">Immediate</option>
        </select></label>}
        <p>References must come from the relevant owner. This form does not create quotes, take payments, grant approval, or apply retention offers.</p>
        {error && <p role="alert">{error}</p>}<button type="submit">Submit change request</button>
      </fieldset>
    </form>}
  </section>;
}
function CurrentSubscription({ row, context, execution }: { row: Discovery['items'][number]; context: Discovery; execution: ReturnType<typeof useSubscriptionExecution> }) {
  const [state, retry] = useCurrentSubscription(row, context);
  const [showActivity, setShowActivity] = useState(false);
  return <ReadPanel state={state} retry={retry}>{current => <>
    <div className={styles.managementGrid}><div className={styles.managementPrimary}><article className={styles.current}><p className={styles.eyebrow}>Current Plan · Revision {current.plan.revisionNumber}</p><h2>{current.plan.name}</h2>
      <div className={styles.statuses}><span data-state={current.state.status}>{current.state.status}</span><span>{current.access.replace(/_/g, ' ')} access</span></div>
      <p>For {current.audience} · {current.state.subject.kind} subscription</p>
      <h3><Calendar size={18} aria-hidden="true" /> Subscription Details</h3>
      <dl className={styles.dates}><dt>Start Date</dt><dd>{new Date(current.state.periodStartsAt).toLocaleString()}</dd><dt>Current period ends</dt><dd>{current.state.periodEndsAt === null ? 'No expiry' : new Date(current.state.periodEndsAt).toLocaleString()}</dd>
        <dt>Subscription ends</dt><dd>{current.subscriptionEndsAt === null ? 'No expiry' : new Date(current.subscriptionEndsAt).toLocaleString()}</dd><dt>Renewal</dt><dd>{current.state.renewalEnabled ? 'Enabled' : 'Disabled'}</dd></dl>
      {current.state.scheduledChange && <p>Scheduled revision {current.state.scheduledChange.revisionId} takes effect {new Date(current.state.scheduledChange.effectiveAt).toLocaleString()}.</p>}
      <FeatureList features={current.features} />
    </article>
    <section className={styles.managementCard}><h3>Active credit usage</h3><p>These balances cover unexpired allocations and their consumption, rather than lifetime usage.</p>
      {current.pools.length === 0 ? <p>No credit pools are configured.</p> : <div className={styles.pools}>{current.pools.map(pool => <CreditPool key={pool.key} current={current} pool={pool} />)}</div>}
    </section>
    </div><aside className={styles.managementSidebar} aria-label="Subscription management">
    <LifecycleForm key={current.state.id} current={current} operations={row.lifecycleOperations} execution={execution} />
    {(row.lifecycleOperations.includes('renew') || row.lifecycleOperations.includes('upgrade')) && <PaidSubscriptionChange current={current} operations={row.lifecycleOperations} />}
    <section className={styles.managementCard}><h3><HelpCircle size={18} aria-hidden="true" /> Need Help?</h3><p>Have questions about your subscription or billing?</p><a className={styles.managementLink} href={ROUTES.CONTACT}>Contact Support</a></section>
    </aside></div>
    <div className={styles.managementCard}><button aria-expanded={showActivity} onClick={() => setShowActivity(value => !value)}>{showActivity ? 'Hide subscription activity' : 'View subscription activity'}</button>
    {showActivity && <SubscriptionActivity current={current} />}</div>
  </>}</ReadPanel>;
}
function DiscoveredSubscriptions({ discovery, refresh, execution, selectedId, setSelectedId }: { discovery: Discovery; refresh: () => void; execution: ReturnType<typeof useSubscriptionExecution>; selectedId: string; setSelectedId: (id: string) => void }) {
  const selected = discovery.items.find(row => row.id === selectedId);
  return <>
    <div className={styles.sectionHeading}><h2>Your subscription</h2></div>
    <button onClick={refresh} disabled={execution.state.status === 'pending'}>Refresh subscriptions</button>
    {discovery.items.length === 0 ? <p className={styles.notice}>{discovery.nextCursor ? 'No authorized subscriptions on this page. Continue to the next page.' : 'No subscriptions were found for your authorized account.'}</p> : <label className={styles.selector}>Subscription<select value={selectedId} onChange={event => setSelectedId(event.target.value)} disabled={execution.state.status === 'pending'}>
      <option value="">Choose a subscription</option>{discovery.items.map(row => <option key={row.id} value={row.id}>{row.subject.kind} · {row.id} · {row.status}</option>)}
    </select></label>}
    {selected?.kind === 'uninitialized' && <div className={styles.notice} role="status"><h3>Subscription setup required</h3><p>This subscription has no initialized execution revision. Contact the subscription owner to complete setup. Historical purchases remain unchanged.</p></div>}
    {selected?.kind === 'initialized' && <CurrentSubscription key={selected.id} row={selected} context={discovery} execution={execution} />}
  </>;
}
function SubscriptionAccess() {
  const [cursor, setCursor] = useState<string>();
  const [selectedId, setSelectedId] = useState('');
  const [discovery, retry] = useSubscriptionDiscovery(cursor);
  const execution = useSubscriptionExecution(discovery.status === 'ready' ? discovery.data : null);
  return <><section><ReadPanel state={discovery} retry={retry}>{data => <>
    <DiscoveredSubscriptions key={cursor ?? 'first'} discovery={data} refresh={retry} execution={execution} selectedId={selectedId} setSelectedId={setSelectedId} />
    <div className={styles.pagination}>{cursor && <button onClick={() => { setSelectedId(''); setCursor(undefined); }}>First subscriptions</button>}
      {data.nextCursor && <button onClick={() => { setSelectedId(''); setCursor(data.nextCursor!); }}>Next subscriptions</button>}</div>
  </>}</ReadPanel></section>
    {execution.state.status !== 'idle' && execution.state.status !== 'checking' && <div className={styles.notice} role={execution.state.status === 'error' || execution.state.status === 'blocked' ? 'alert' : 'status'}>
      <p>{execution.state.status === 'blocked' ? execution.state.message : execution.state.status === 'pending' ? 'Submitting change request…' : execution.state.status === 'committed' ? 'Change committed. Refresh subscriptions to read the authoritative state.'
        : `${execution.state.message} The outcome may be uncertain. Do not submit another request; ask the subscription owner to reconcile this operation.`}</p>
      {'operationId' in execution.state && <p>Operation ID: {execution.state.operationId}</p>}
    </div>}
  </>;
}
/** `selectedRevisionId` only highlights a published revision; it never sets price or grants purchase. */
export default function SubscriptionWorkspace({ view = 'all', selectedRevisionId, catalogType, onPaymentConfirmed, managedSubscriptionId, catalogMode }: { view?: 'all' | 'catalog'; selectedRevisionId?: string; catalogType?: string; onPaymentConfirmed?: PaymentConfirmed } & CatalogSelection) {
  if (view === 'catalog') return <SubscriptionCatalogFrame type={catalogType}><PublishedPlans qaPresentation selectedRevisionId={selectedRevisionId} onPaymentConfirmed={onPaymentConfirmed} managedSubscriptionId={managedSubscriptionId} catalogMode={catalogMode} /></SubscriptionCatalogFrame>;
  return <SubscriptionManagement selectedRevisionId={selectedRevisionId} />;
}
function SubscriptionManagement({ selectedRevisionId }: { selectedRevisionId?: string }) {
  const [tab, setTab] = useState<'subscription' | 'addons'>('subscription');
  const user = useUser();
  const { role } = useUserRole();
  return <div className={`${styles.workspace} ${styles.managementPage}`}>
    <header className={styles.hero}><div className={styles.managementContainer}>
      <div className={styles.managementHeading}><div><h1>My Subscription</h1><div className={styles.managementIdentity}>{user?.email && <span>{user.email}</span>}{role && <span className={styles.managementRole}><Shield size={12} aria-hidden="true" />{role.replace(/_/g, ' ')}</span>}</div><p>Manage your subscription and billing</p></div>
        <span className={styles.managementIcon}><Shield aria-hidden="true" /></span></div>
      <div className={styles.managementTabs} role="tablist" aria-label="Manage subscription">
        <button id="management-subscription-tab" role="tab" tabIndex={tab === 'subscription' ? 0 : -1} onKeyDown={handleTabKeyDown} aria-selected={tab === 'subscription'} aria-controls="management-subscription-panel" onClick={() => setTab('subscription')}><Shield size={16} aria-hidden="true" /> Subscription</button>
        <button id="management-addons-tab" role="tab" tabIndex={tab === 'addons' ? 0 : -1} onKeyDown={handleTabKeyDown} aria-selected={tab === 'addons'} aria-controls="management-addons-panel" onClick={() => setTab('addons')}><Sparkles size={16} aria-hidden="true" /> Add-Ons</button>
      </div>
    </div></header>
    <div className={styles.managementContainer}>
      <div id="management-subscription-panel" role="tabpanel" aria-labelledby="management-subscription-tab" hidden={tab !== 'subscription'}>
        <SubscriptionAccess />
        <details className={styles.managementCard}><summary>Explore available plans</summary><PublishedPlans selectedRevisionId={selectedRevisionId} /></details>
      </div>
      {tab === 'addons' && <section id="management-addons-panel" role="tabpanel" aria-labelledby="management-addons-tab" className={styles.managementCard}><SubscriptionAddOns /></section>}
    </div>
  </div>;
}
