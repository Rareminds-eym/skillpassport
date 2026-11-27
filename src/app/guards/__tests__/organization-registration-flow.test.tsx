import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ role: 'college_admin', hasAccess: true, apiGet: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiGet: state.apiGet }));
vi.mock('@/shared/model/authStore', () => ({
  useUser: () => ({ id: 'admin', roles: [state.role] }),
  useUserRole: () => ({ role: state.role }), useIsAuthenticated: () => true, useAuthLoading: () => false,
}));
vi.mock('@/features/auth', () => ({ resolveRouteRole: (roles: string[]) => roles[0], getRouteForRole: (role: string) => `/${role.replace('_', '-')}/dashboard` }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ hasAccess: state.hasAccess, loading: false, isRefetching: false }) }));
vi.mock('@/features/subscription/model/subscriptionStore', () => ({ ACCESS_REASONS: {} }));
vi.mock('@/features/subscription/ui/shared/SubscriptionBanner', () => ({ default: () => null }));
vi.mock('@/features/subscription/ui/individual/SubscriptionPlans', () => ({
  default: ({ onPaymentConfirmed }: { onPaymentConfirmed: () => void }) => <button onClick={onPaymentConfirmed}>Confirmed payment</button>,
}));
import OrganizationGuard from '../OrganizationGuard';
import SubscriptionProtectedRoute from '@/features/subscription/ui/shared/SubscriptionProtectedRoute';
import SubscriptionPlansPage from '@/pages/subscription/SubscriptionPlans';

beforeEach(() => { state.apiGet.mockReset(); state.hasAccess = true; sessionStorage.clear(); });
afterEach(cleanup);

function open(type: 'school' | 'college', fromPayment = true) {
  state.role = `${type}_admin`;
  const dashboard = `/${type}-admin/dashboard`;
  render(<MemoryRouter initialEntries={[fromPayment ? '/subscription/plans' : dashboard]}><Routes>
    <Route path="/subscription/plans" element={<SubscriptionPlansPage />} />
    <Route path={dashboard} element={<SubscriptionProtectedRoute allowedRoles={[state.role]} subscriptionFallbackPath={`/subscription/plans?type=${state.role}`}>
      <OrganizationGuard organizationType={type}><p>Institution dashboard</p></OrganizationGuard>
    </SubscriptionProtectedRoute>} />
    <Route path="/organization-setup" element={<p>Institution registration</p>} />
  </Routes></MemoryRouter>);
  if (fromPayment) fireEvent.click(screen.getByRole('button', { name: 'Confirmed payment' }));
}

for (const type of ['school', 'college'] as const) {
  it.each([null, { id: 'org', name: 'Signup Admin' }, { id: 'org', name: 'Institution', city: ' ', state: 'Tamil Nadu' }])(
    `opens ${type} registration after payment when registration details are missing: %j`, async org => {
      state.apiGet.mockResolvedValue({ data: org && { ...org, organization_type: type } });
      open(type);
      expect(await screen.findByText('Institution registration')).toBeInTheDocument();
      expect(screen.queryByText('Institution dashboard')).toBeNull();
      expect(state.apiGet).toHaveBeenCalledWith(expect.stringContaining(`orgType=${type}`));
    });
  it(`preserves dashboard access after completed ${type} registration`, async () => {
    state.apiGet.mockResolvedValue({ data: { id: 'org', name: 'Registered Institution', organization_type: type, city: 'Chennai', state: 'Tamil Nadu' } });
    open(type);
    expect(await screen.findByText('Institution dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Institution registration')).toBeNull();
  });
  it(`keeps unpaid ${type} users at plan selection before registration`, () => {
    state.hasAccess = false;
    open(type, false);
    expect(screen.getByRole('button', { name: 'Confirmed payment' })).toBeInTheDocument();
    expect(state.apiGet).not.toHaveBeenCalled();
  });
  it(`shows a lookup failure instead of skipping ${type} registration`, async () => {
    state.apiGet.mockRejectedValue(new Error('Unavailable'));
    open(type);
    expect(await screen.findByText('Unable to Load Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Institution dashboard')).toBeNull();
    expect(screen.queryByText('Institution registration')).toBeNull();
  });
}
