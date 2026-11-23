import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useUser } from '@/shared/model/authStore';
import { getUserSubscriptions } from '../api/subscriptionService';
import { subscriptionExecutionService as api } from '../api/subscriptionExecutionService';
import { formatSubscriptionData, getSubscriptionScope, subscriptionQueryKey, useSubscriptionQuery } from './useSubscriptionQuery';

export async function readManagedSubscription(id, signal) {
  let cursor;
  const cursors = new Set();
  let scope;
  do {
    const discovery = await api.discover(signal, cursor);
    if (scope && (scope.actorId !== discovery.actorId || scope.productId !== discovery.productId)) throw new Error('Subscription account scope changed. Please refresh.');
    scope = discovery;
    const row = discovery.items.find(item => item.id === id);
    if (row) return { discovery, row, current: row.kind === 'initialized' ? await api.current(row, discovery, signal) : null };
    cursor = discovery.nextCursor ?? undefined;
    if (cursor && (cursors.has(cursor) || cursors.size >= 100)) throw new Error('Subscription pagination did not complete.');
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return { discovery: scope, row: null, current: null };
}

function featureLabel(feature) {
  const name = feature.key.replace(/_/g, ' ');
  if (feature.type === 'enum') return `${name}${feature.value === null ? '' : `: ${feature.value}`}`;
  if (feature.type === 'boolean') return name;
  return `${name}: ${feature.limit.kind === 'finite' ? feature.limit.value : feature.limit.kind === 'unlimited' ? 'Unlimited' : feature.limit.kind === 'contract_required' ? 'By agreement' : 'Allocated by policy'}`;
}

/** A legacy purchase is displayed as purchased; it is never assigned a new revision. */
export function useSubscriptionManagement() {
  const base = useSubscriptionQuery();
  const queryClient = useQueryClient();
  const user = useUser();
  const location = useLocation();
  const scope = getSubscriptionScope(location.pathname);
  const [selection, setSelection] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const history = useQuery({
    queryKey: ['subscription-management', user?.id], enabled: Boolean(user?.id),
    queryFn: async () => {
      const result = await getUserSubscriptions(true);
      if (!result.success) throw new Error(result.error || 'Unable to load other subscriptions.');
      return result.data.map(formatSubscriptionData);
    },
  });
  const subscriptions = useMemo(() => {
    // Do not offer institution purchases from another dashboard as personal plans.
    const own = (history.data ?? []).filter(item => !item.isOrganizationSubscription
      && (!base.subscriptionData?.productId || !item.productId || item.productId === base.subscriptionData.productId));
    return [...new Map([...own, base.subscriptionData].filter(Boolean).map(item => [item.id, item])).values()];
  }, [history.data, base.subscriptionData]);
  const selectedId = selection?.userId === user?.id && selection.scope === scope ? selection.id : null;
  const selected = subscriptions.find(item => item.id === selectedId) ?? base.subscriptionData ?? subscriptions[0] ?? null;
  const id = selected?.id;
  const member = selected?.isOrganizationLicense === true;
  const owner = useQuery({
    queryKey: ['subscription-management-owner', user?.id, scope, id, refresh],
    enabled: Boolean(user?.id && id && !member), retry: false,
    queryFn: ({ signal }) => readManagedSubscription(id, signal),
  });
  const modern = Boolean(selected?.revisionId || selected?.lifecycleState || owner.data?.row?.kind === 'initialized');
  const current = modern ? owner.data?.current : null;
  const subscriptionData = useMemo(() => current ? {
    ...selected, plan: current.plan.code, planId: current.plan.id, planName: current.plan.name,
    status: current.state.status, autoRenew: current.state.renewalEnabled, lifecycleAccess: current.access,
    startDate: new Date(current.state.periodStartsAt).toISOString(),
    endDate: current.subscriptionEndsAt === null ? null : new Date(current.subscriptionEndsAt).toISOString(),
    nextBillingDate: current.state.periodEndsAt === null ? null : new Date(current.state.periodEndsAt).toISOString(),
    features: current.features.filter(feature => feature.enabled).map(featureLabel),
  } : selected, [current, selected]);
  const ownerState = owner.isError ? { status: 'error', message: owner.error.message }
    : owner.isPending ? { status: 'loading' }
      : modern && !current ? { status: 'error', message: 'Subscription details are still synchronizing. Please refresh.' }
        : { status: 'ready', ...owner.data };
  const userId = user?.id;
  const refetchHistory = history.refetch;
  const refreshSubscription = useCallback(async () => {
    setRefresh(value => value + 1);
    await Promise.all([queryClient.invalidateQueries({ queryKey: subscriptionQueryKey(userId, scope) }), refetchHistory()]);
  }, [queryClient, userId, scope, refetchHistory]);
  return { ...base, loading: base.loading || (!base.subscriptionData && history.isPending), subscriptionData, subscriptions, modern, owner: ownerState,
    historyError: history.error, selectedId: id, refreshSubscription,
    selectSubscription: id => setSelection({ id, userId: user?.id, scope }),
  };
}
