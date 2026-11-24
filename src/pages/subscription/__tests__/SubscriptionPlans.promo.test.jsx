import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ role: 'learner' }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ roles: [state.role] }) }));
vi.mock('@/features/auth', () => ({ resolveRouteRole: roles => roles[0], getRouteForRole: role => `/${role.replace('_', '-')}/dashboard` }));
vi.mock('@/features/subscription/ui/individual/SubscriptionPlans', () => ({
  default: ({ onPaymentConfirmed }) => <button onClick={onPaymentConfirmed}>Owner confirmed payment</button>,
}));
import SubscriptionPlans from '../SubscriptionPlans';
afterEach(cleanup);
it.each(['learner', 'school_admin', 'college_admin'])('routes %s only after owner-confirmed payment', role => {
  state.role = role;
  render(<MemoryRouter initialEntries={['/subscription/plans']}><Routes>
    <Route path="/subscription/plans" element={<SubscriptionPlans />} />
    <Route path={`/${role.replace('_', '-')}/dashboard`} element={<p>Verified dashboard</p>} />
  </Routes></MemoryRouter>);
  expect(screen.queryByText('Verified dashboard')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Owner confirmed payment' }));
  expect(screen.getByText('Verified dashboard')).toBeInTheDocument();
});
