import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'user' }), useAuthLoading: () => false, useUserRole: () => ({ role: 'learner' }) }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ loading: false, subscriptionData: { status: 'active' } }) }));
import SubscriptionRouteGuard from '../SubscriptionRouteGuard';
afterEach(cleanup);
function view(paymentInProgress: boolean) {
  render(<MemoryRouter initialEntries={['/subscription/payment']}><Routes>
    <Route path="/subscription/payment" element={<SubscriptionRouteGuard mode="payment" paymentInProgress={paymentInProgress}><div>Payment confirmation in progress</div></SubscriptionRouteGuard>} />
    <Route path="/learner/subscription/manage" element={<div>Manage existing plan</div>} />
  </Routes></MemoryRouter>);
}
it('keeps payment mounted when webhook activation arrives before confirmation completes', () => {
  view(true); expect(screen.getByText('Payment confirmation in progress')).toBeInTheDocument();
  expect(screen.queryByText('Manage existing plan')).toBeNull();
});
it('still redirects an idle checkout with existing active coverage to management', () => {
  view(false); expect(screen.getByText('Manage existing plan')).toBeInTheDocument();
});
