import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/features/subscription/api', () => ({ logFailedTransaction: vi.fn(async () => ({ success: true, logged: true })) }));
vi.mock('@/shared/model/authStore', () => ({ useUserRole: () => ({ role: 'educator' }) }));
import PaymentFailure from '../PaymentFailure';
function Destination() { return <output data-testid="state">{JSON.stringify(useLocation().state)}</output>; }
afterEach(cleanup);
it.each([
  { learnerType: 'college_educator', isUpgrade: true, isRenewal: false, isFreemium: false, referralCode: 'MOCK_REF' },
  { learnerType: 'learner', isUpgrade: false, isRenewal: true },
])('preserves explicit purchase context on retry (%j)', async context => {
  const plan = { id: 'plan_mock', name: 'Mock', price: 4999 };
  render(<MemoryRouter initialEntries={[{ pathname: '/failure', state: { plan, ...context, error_description: 'Mock failure' } }]}><Routes>
    <Route path="/failure" element={<PaymentFailure />} /><Route path="/subscription/payment" element={<Destination />} />
  </Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Try Payment Again' }));
  expect(JSON.parse((await screen.findByTestId('state')).textContent)).toMatchObject({ plan, ...context, retryAttempt: 1 });
});
