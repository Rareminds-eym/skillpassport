import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ isAuthenticated: true, loading: false, signupInProgress: false, loginInProgress: false }));
vi.mock('@/shared/model/authStore', () => ({
  useIsAuthenticated: () => auth.isAuthenticated, useAuthLoading: () => auth.loading,
  useUserRole: () => ({ role: 'learner' }), useAuthStore: (select: (state: typeof auth) => unknown) => select(auth),
}));
vi.mock('@/features/auth/lib/roleBasedRouter', () => ({ getRouteForRole: () => '/learner/dashboard' }));
import GuestOnlyRoute from './GuestOnlyRoute';
afterEach(cleanup);
beforeEach(() => { auth.signupInProgress = false; auth.loginInProgress = false; auth.loading = false; });
it('keeps signup mounted while a newly authenticated profile is being created', () => {
  auth.signupInProgress = true;
  render(<MemoryRouter initialEntries={['/signup']}><GuestOnlyRoute><div>Signup form</div></GuestOnlyRoute></MemoryRouter>);
  expect(screen.getByText('Signup form')).toBeInTheDocument();
});
it('preserves the LTE handoff for already authenticated users', () => {
  render(<MemoryRouter initialEntries={['/login?target_app=lte']}><GuestOnlyRoute><div>LTE login</div></GuestOnlyRoute></MemoryRouter>);
  expect(screen.getByText('LTE login')).toBeInTheDocument();
});
it('keeps login mounted while the selected role is being validated', () => {
  auth.loginInProgress = true;
  render(<MemoryRouter initialEntries={['/login']}><GuestOnlyRoute><div>Login form</div></GuestOnlyRoute></MemoryRouter>);
  expect(screen.getByText('Login form')).toBeInTheDocument();
});
it('redirects an authenticated visitor away from login once no login is in progress', () => {
  render(<MemoryRouter initialEntries={['/login']}><GuestOnlyRoute><div>Login form</div></GuestOnlyRoute></MemoryRouter>);
  expect(screen.queryByText('Login form')).toBeNull();
});
it('still redirects an authenticated visitor outside an active signup', () => {
  render(<MemoryRouter initialEntries={['/signup']}><GuestOnlyRoute><div>Signup form</div></GuestOnlyRoute></MemoryRouter>);
  expect(screen.queryByText('Signup form')).toBeNull();
});
