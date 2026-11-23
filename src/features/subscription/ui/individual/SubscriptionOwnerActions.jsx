import { useEffect, useRef, useState } from 'react';
import { useSubscriptionExecution } from '../../model/useSubscriptionExecution';
import { CreditPool, SubscriptionActivity } from '../SubscriptionWorkspace';
import styles from './SubscriptionOwnerActions.module.css';

export default function SubscriptionOwnerActions({ owner, onRefresh }) {
  const execution = useSubscriptionExecution(owner.status === 'ready' ? owner.discovery : null);
  const [reason, setReason] = useState('');
  const refreshed = useRef(null);
  useEffect(() => {
    if (execution.state.status === 'committed' && refreshed.current !== execution.state.operationId) {
      refreshed.current = execution.state.operationId;
      void onRefresh();
    }
  }, [execution.state, onRefresh]);
  if (owner.status === 'loading') return <p role="status">Loading subscription actions…</p>;
  if (owner.status === 'error') return <div role="alert"><p>{owner.message}</p><button onClick={onRefresh} className="mt-3 underline">Try again</button></div>;
  const { current, row } = owner;
  if (!current || !row) return null;
  const cancellable = row.lifecycleOperations.includes('cancel') && current.state.status !== 'cancelled';
  return <div className={styles.controls}>
    {cancellable && <form onSubmit={event => {
      event.preventDefault();
      if (!reason.trim() || !window.confirm('Cancel this subscription? Access will follow the terms of your plan.')) return;
      void execution.submit({ operation: 'cancel', subscriptionId: current.state.id, subject: current.state.subject,
        expectedVersion: current.state.version, expectedRevisionId: current.state.revisionId, reason: reason.trim() }, current);
    }}>
      <label>Cancellation reason<textarea value={reason} onChange={event => setReason(event.target.value)} required maxLength={2000} /></label>
      <button disabled={execution.state.status !== 'idle'}>Cancel Subscription</button>
    </form>}
    {execution.state.status === 'pending' && <p role="status">Saving your subscription change…</p>}
    {execution.state.status === 'committed' && <p role="status">Subscription change confirmed.</p>}
    {(execution.state.status === 'error' || execution.state.status === 'blocked') && <div role="alert"><p>{execution.state.message}</p><p>Contact support before submitting another change.</p></div>}
  </div>;
}

export function SubscriptionOwnerUsage({ owner }) {
  if (owner.status !== 'ready') return <p>{owner.status === 'error' ? 'Usage is temporarily unavailable.' : 'Loading usage…'}</p>;
  if (!owner.current) return null;
  const { current } = owner;
  return <div className={styles.controls}>{current.pools.length ? current.pools.map(pool => <CreditPool key={pool.key} current={current} pool={pool} />) : <p>No credit pools are included with this plan.</p>}
    <details><summary>Subscription activity</summary><SubscriptionActivity current={current} /></details>
  </div>;
}
