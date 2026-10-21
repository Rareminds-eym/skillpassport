import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ hasAccess: false, error: null as Error | null, refreshSubscription: vi.fn() }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ ...state, loading: false, isRefetching: false }) }));
vi.mock('@/features/subscription/model/subscriptionStore', () => ({ ACCESS_REASONS: {} }));
vi.mock('@/shared/model/authStore', () => ({ useIsAuthenticated: () => true, useAuthLoading: () => false, useUserRole: () => ({ role: 'learner' }), useUser: () => ({ id: 'learner', roles: ['learner'] }) }));
vi.mock('../SubscriptionBanner', () => ({ default: () => null }));
import SubscriptionProtectedRoute from '../SubscriptionProtectedRoute';
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
beforeEach(() => { state.hasAccess = false; state.error = null; state.refreshSubscription.mockReset(); vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {}); });
function view(fromPayment = false) {
  render(<MemoryRouter initialEntries={[{ pathname: '/learner/dashboard', state: { fromPayment } }]}><Routes>
    <Route path="/learner/dashboard" element={<SubscriptionProtectedRoute allowedRoles={['learner']}><div>Protected dashboard</div></SubscriptionProtectedRoute>} />
    <Route path="/subscription/plans" element={<div>Choose a plan</div>} />
  </Routes></MemoryRouter>);
}
it('shows Retry instead of the dashboard when verification fails', () => {
  state.error = new Error('Network unavailable'); view();
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByText('Protected dashboard')).toBeNull();
});
it('lets users with verified coverage access their dashboard', () => {
  state.hasAccess = true; view();
  expect(screen.getByText('Protected dashboard')).toBeInTheDocument();
});
it('shows plan selection when a new learner has no verified coverage', () => {
  view();
  expect(screen.getByText('Choose a plan')).toBeInTheDocument();
  expect(screen.queryByText('Protected dashboard')).toBeNull();
});
it('does not accept fromPayment as entitlement after sync fails', async () => {
  vi.useFakeTimers(); state.refreshSubscription.mockRejectedValue(new Error('Activation pending'));
  view(true);
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
  expect(screen.queryByText('Protected dashboard')).toBeNull();
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
