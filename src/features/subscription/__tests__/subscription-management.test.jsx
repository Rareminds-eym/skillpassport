import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatSubscriptionData } from '../model/useSubscriptionQuery';
import { readManagedSubscription, useSubscriptionManagement } from '../model/useSubscriptionManagement';

const io = vi.hoisted(() => ({ active: vi.fn(), history: vi.fn(), discover: vi.fn(), current: vi.fn(), user: { id: 'buyer' } }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => io.user }));
vi.mock('../api/subscriptionService', () => ({ getActiveSubscription: io.active, getUserSubscriptions: io.history }));
vi.mock('../api/subscriptionExecutionService', () => ({ subscriptionExecutionService: { discover: io.discover, current: io.current } }));
const legacy = { id: 'legacy', user_id: 'buyer', plan_id: 'old-plan', plan_code: 'old-code', plan_name: 'Purchased membership',
  product_id: 'product', plan_amount: 749, status: 'active', features: ['Original benefit'], subscription_start_date: '2025-01-01', subscription_end_date: '2099-01-01' };
const row = { id: 'new', kind: 'initialized', planId: 'new-plan', revisionId: 'revision', status: 'active' };
const page = { actorId: 'buyer', productId: 'product', items: [], nextCursor: null };
const current = { actorId: 'buyer', plan: { id: 'new-plan', code: 'new-code', name: 'New membership' },
  state: { id: 'new', periodStartsAt: 1000, periodEndsAt: null, renewalEnabled: false, status: 'active' }, subscriptionEndsAt: null,
  features: [{ key: 'assessment_attempts', type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: 2 } }, { key: 'excluded', type: 'boolean', enabled: false }] };
function wrapper({ children }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}><MemoryRouter initialEntries={['/subscription/manage']}>{children}</MemoryRouter></QueryClientProvider>;
}
beforeEach(() => {
  vi.clearAllMocks();
  io.active.mockResolvedValue({ success: true, data: legacy });
  io.history.mockResolvedValue({ success: true, data: [legacy] });
  io.discover.mockResolvedValue({ ...page, items: [{ id: 'legacy', kind: 'uninitialized' }] });
  io.current.mockResolvedValue(current);
});
afterEach(cleanup);

describe('Manage Subscription compatibility', () => {
  it('uses only the backend Hybrid flag instead of a plan label', () => {
    expect(formatSubscriptionData({ ...legacy, is_hybrid: true }).isHybrid).toBe(true);
    expect(formatSubscriptionData({ ...legacy, plan_type: 'Hybrid' }).isHybrid).toBe(false);
    expect(formatSubscriptionData({ ...legacy, is_hybrid: 'true' }).isHybrid).toBe(false);
  });
  it('retains plan identity and binding when formatting cached purchases', () => {
    expect(formatSubscriptionData(legacy)).toMatchObject({ plan: 'old-code', planName: 'Purchased membership', revisionId: null, autoRenew: null });
  });
  it('shows an old purchase without requiring execution setup or replacing its benefits', async () => {
    const { result } = renderHook(useSubscriptionManagement, { wrapper });
    await waitFor(() => expect(result.current.owner.status).toBe('ready'));
    expect(result.current.modern).toBe(false);
    expect(result.current.subscriptionData.features).toEqual(['Original benefit']);
    expect(io.current).not.toHaveBeenCalled();
  });
  it('lets an account select between old and new purchases and reads the new owner terms', async () => {
    io.history.mockResolvedValue({ success: true, data: [legacy, { ...legacy, id: 'new', plan_revision_id: 'revision' }] });
    io.discover.mockResolvedValue({ ...page, items: [{ id: 'legacy', kind: 'uninitialized' }, row] });
    const { result } = renderHook(useSubscriptionManagement, { wrapper });
    await waitFor(() => expect(result.current.subscriptions).toHaveLength(2));
    act(() => result.current.selectSubscription('new'));
    await waitFor(() => expect(result.current.subscriptionData.planName).toBe('New membership'));
    expect(result.current.modern).toBe(true);
    expect(result.current.subscriptionData.endDate).toBeNull();
    expect(result.current.subscriptionData.features).toEqual(['assessment attempts: 2']);
    act(() => result.current.selectSubscription('legacy'));
    await waitFor(() => expect(result.current.modern).toBe(false));
    expect(result.current.subscriptionData.planName).toBe('Purchased membership');
  });
  it('does not reclassify a bound purchase as legacy during an owner outage', async () => {
    io.active.mockResolvedValue({ success: true, data: { ...legacy, plan_revision_id: 'revision' } });
    io.discover.mockRejectedValue(new Error('Owner unavailable'));
    const { result } = renderHook(useSubscriptionManagement, { wrapper });
    await waitFor(() => expect(result.current.owner.status).toBe('error'));
    expect(result.current.modern).toBe(true);
    expect(result.current.subscriptionData.planName).toBe('Purchased membership');
  });
  it('does not let an unbound cache downgrade a live initialized owner record', async () => {
    io.active.mockResolvedValue({ success: true, data: { ...legacy, id: 'new' } });
    io.discover.mockResolvedValue({ ...page, items: [row] });
    const { result } = renderHook(useSubscriptionManagement, { wrapper });
    await waitFor(() => expect(result.current.subscriptionData.planName).toBe('New membership'));
    expect(result.current.modern).toBe(true);
  });
  it('preserves organization-license metadata when history also contains its parent purchase', async () => {
    io.active.mockResolvedValue({ success: true, data: { ...legacy, is_organization_license: true, organization_name: 'College' } });
    const { result } = renderHook(useSubscriptionManagement, { wrapper });
    await waitFor(() => expect(result.current.subscriptionData?.isOrganizationLicense).toBe(true));
    expect(result.current.subscriptionData.organizationName).toBe('College');
    expect(io.discover).not.toHaveBeenCalled();
  });
  it('keeps organization purchases out of the personal history selector', async () => {
    io.history.mockResolvedValue({ success: true, data: [legacy, { ...legacy, id: 'organization', is_organization_subscription: true }] });
    const { result } = renderHook(useSubscriptionManagement, { wrapper });
    await waitFor(() => expect(result.current.owner.status).toBe('ready'));
    expect(result.current.subscriptions.map(item => item.id)).toEqual(['legacy']);
  });
  it('finds a selected purchase on a later owner page', async () => {
    io.discover.mockResolvedValueOnce({ ...page, nextCursor: 'page-2' }).mockResolvedValueOnce({ ...page, items: [row] });
    expect((await readManagedSubscription('new')).current).toEqual(current);
    expect(io.discover).toHaveBeenLastCalledWith(undefined, 'page-2');
  });
  it('rejects account scope changes during owner pagination', async () => {
    io.discover.mockResolvedValueOnce({ ...page, nextCursor: 'page-2' }).mockResolvedValueOnce({ ...page, actorId: 'other', items: [row] });
    await expect(readManagedSubscription('new')).rejects.toThrow('scope changed');
    expect(io.current).not.toHaveBeenCalled();
  });
});
