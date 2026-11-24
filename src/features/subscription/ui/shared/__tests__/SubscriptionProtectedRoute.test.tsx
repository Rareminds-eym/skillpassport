import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ hasAccess: false, error: null as Error | null, refreshSubscription: vi.fn() }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ ...state, loading: false, isRefetching: false }) }));
vi.mock('@/features/subscription/model/subscriptionStore', () => ({ ACCESS_REASONS: {} }));
vi.mock('@/shared/model/authStore', () => ({ useIsAuthenticated: () => true, useAuthLoading: () => false, useUserRole: () => ({ role: 'learner' }), useUser: () => ({ id: 'learner', roles: ['learner'] }) }));
vi.mock('../SubscriptionBanner', () => ({ default: () => null }));
import SubscriptionProtectedRoute from '../SubscriptionProtectedRoute';
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
beforeEach(() => { state.hasAccess = false; state.error = null; state.refreshSubscription.mockReset(); sessionStorage.clear(); vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {}); });
function view(fromPayment = false) {
  render(<MemoryRouter initialEntries={[{ pathname: '/learner/dashboard', state: { fromPayment } }]}><Routes>
    <Route path="/learner/dashboard" element={<SubscriptionProtectedRoute allowedRoles={['learner']}><div>Protected dashboard</div></SubscriptionProtectedRoute>} />
    <Route path="/subscription/plans" element={<div>Choose a plan</div>} />
  </Routes></MemoryRouter>);
}

function viewWithFallback(dashboardPath: string, fallbackPath: string) {
  const captured = { search: '' };
  render(<MemoryRouter initialEntries={[{ pathname: dashboardPath }]}><Routes>
    <Route path={dashboardPath} element={<SubscriptionProtectedRoute allowedRoles={['learner', 'college_admin', 'school_admin']} subscriptionFallbackPath={fallbackPath}><div>Protected dashboard</div></SubscriptionProtectedRoute>} />
    <Route path="/subscription/plans" element={<CaptureSearch captured={captured} />} />
  </Routes></MemoryRouter>);
  return captured;
}

function CaptureSearch({ captured }: { captured: { search: string } }) {
  captured.search = useLocation().search;
  return <div>Choose a plan</div>;
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

// Regression: a referral code lost by UnifiedSignup's post-signup redirect
// (stashed in sessionStorage as 'pending_referral_code') must reach the
// subscription-plans fallback URL for every role whose dashboard route wraps
// this guard with its own subscriptionFallbackPath — same mocked role
// throughout since the relay logic itself doesn't branch on role, only the
// route's configured fallback path (matching learnerRoutes.jsx/adminRoutes.jsx).
const roleFallbacks: Array<[string, string, string]> = [
  ['learner', '/learner/dashboard', '/subscription/plans?type=learner'],
  ['college_admin', '/college-admin/dashboard', '/subscription/plans?type=college_admin'],
  ['school_admin', '/school-admin/dashboard', '/subscription/plans?type=school_admin'],
];
for (const [role, dashboardPath, fallbackPath] of roleFallbacks) {
  it(`relays a pending referral code into the ${role} subscription fallback redirect`, async () => {
    sessionStorage.setItem('pending_referral_code', 'DIDAC2026');
    const captured = viewWithFallback(dashboardPath, fallbackPath);
    await screen.findByText('Choose a plan');
    expect(captured.search).toContain('referralCode=DIDAC2026');
    expect(captured.search).toContain(`type=${role}`);
    expect(sessionStorage.getItem('pending_referral_code')).toBeNull();
  });
}
it('does not inject a referralCode param when none is pending', async () => {
  const captured = viewWithFallback('/learner/dashboard', '/subscription/plans?type=learner');
  await screen.findByText('Choose a plan');
  expect(captured.search).not.toContain('referralCode');
  expect(captured.search).toContain('type=learner');
});
