import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({ plans: [], role: 'learner' }));
vi.mock('@/features/subscription/model', () => ({ useSubscriptionPlansData: () => ({ plans: f.plans, loading: false }) }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ subscriptionData: null, loading: false }) }));
vi.mock('@/features/subscription', () => ({ calculateDaysRemaining: () => 0, isActiveOrPaused: () => false }));
vi.mock('@/features/subscription/ui', () => ({ AddOnMarketplace: () => null, OrganizationPurchasePanel: () => null }));
vi.mock('@/features/subscription/ui/organization/HybridPlanCard', () => ({ default: () => null }));
vi.mock('@/features/subscription/lib/hybridPlan', () => ({ isHybridPlan: () => false }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: vi.fn() } }));
vi.mock('@/features/auth/lib/roleBasedRouter', () => ({ getRouteForRole: () => '/learner/dashboard' }));
vi.mock('@/shared/model/authStore', () => ({
  useIsAuthenticated: () => true, useUser: () => ({ id: 'buyer', email: 'buyer@example.invalid' }),
  useAuthLoading: () => false, useUserRole: () => ({ role: f.role }),
}));
import SubscriptionPlans from '../SubscriptionPlans';

function Payment() { const location = useLocation(); return <output data-testid="payment">{JSON.stringify(location.state)}</output>; }
function show(type = 'learner', code = 'DYNAMIC2026') {
  render(<MemoryRouter initialEntries={[`/subscription/plans/${type}?referralCode=${code}`]}><Routes>
    <Route path="/subscription/plans/:type" element={<SubscriptionPlans />} />
    <Route path="/subscription/payment" element={<Payment />} />
  </Routes></MemoryRouter>);
}
const starter = { id: 'starter', plan_code: 'skill_starter', name: 'Skill Starter', price: 1736, yearlyPrice: 1736, duration: 'yearly', features: [] };
beforeEach(() => { f.role = 'learner'; f.plans = [starter]; });
afterEach(cleanup);

it.each(['DYNAMIC2026', 'RAREMINDS2026'])('passes the exact API price to checkout for %s', (code) => {
  show('learner', code);
  fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));
  expect(JSON.parse(screen.getByTestId('payment').textContent)).toMatchObject({ plan: { price: 1736, yearlyPrice: 1736 }, referralCode: code });
});

it.each(['school', 'college'])('keeps backend restrictions for %s admins', (entity) => {
  f.role = `${entity}_admin`;
  f.plans = [
    { ...starter, name: `${entity} Starter`, plan_code: `${entity}_starter` },
    { ...starter, id: 'restricted', name: `${entity} Advanced`, plan_code: `${entity}_advanced`, isDisabled: true, hidePrice: true },
  ];
  show(`${entity}-admin`);
  const buttons = screen.getAllByRole('button', { name: 'Get Started' });
  expect(buttons).toHaveLength(2);
  expect(buttons[0]).toBeEnabled();
  expect(buttons[1]).toBeDisabled();
  fireEvent.click(buttons[0]);
  expect(JSON.parse(screen.getByTestId('payment').textContent)).toMatchObject({
    plan: { price: 1736, plan_code: `${entity}_starter` }, referralCode: 'DYNAMIC2026',
  });
});

it('does not restrict a rejected legacy code when the API returns normal plans', () => {
  f.plans = [{ ...starter, plan_code: 'career_builder', name: 'Career Builder' }];
  show('learner', 'RAREMINDS2026');
  expect(screen.getByRole('button', { name: 'Get Started' })).toBeEnabled();
});
