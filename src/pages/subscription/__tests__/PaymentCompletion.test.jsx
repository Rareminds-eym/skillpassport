import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ initiate: vi.fn(), post: vi.fn(), create: vi.fn(), verify: vi.fn(), user: null, subscription: null, authenticated: true }));
vi.mock('@/features/subscription/api', () => ({ initiateRazorpayPayment: f.initiate }));
vi.mock('@/features/subscription/api/paymentsApiService', () => ({ default: { createOrder: f.create, verifyPayment: f.verify } }));
vi.mock('@/features/subscription', async () => ({ SubscriptionRouteGuard: (await vi.importActual('@/features/subscription/ui/shared/SubscriptionRouteGuard')).default }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ subscriptionData: f.subscription, loading: false }) }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost: f.post }));
vi.mock('@/shared/model/authStore', () => ({
  useUser: () => f.user, useIsAuthenticated: () => f.authenticated, useAuthLoading: () => false,
  useUserRole: () => ({ role: 'learner' }), useAuthStore: { getState: () => ({ user: f.user }) },
}));
import PaymentCompletion from '../PaymentCompletion';
const plan = { id: 'plan_mock', name: 'Mock plan', price: 4999, duration: 'yearly', features: [] };
function Destination({ name }) { const location = useLocation(); return <div>{name}<output data-testid="route-state">{JSON.stringify(location.state)}</output></div>; }
function RouteDriver() { const navigate = useNavigate(); return <button onClick={() => navigate('/subscription/payment', { state: { plan: { ...plan, id: 'next_plan' }, learnerType: 'educator' } })}>Change route context</button>; }
function show(extra = {}) {
  const tree = () => <StrictMode><MemoryRouter initialEntries={[{ pathname: '/subscription/payment', state: { plan, learnerType: 'educator', ...extra } }]}><RouteDriver /><Routes>
    <Route path="/subscription/payment" element={<PaymentCompletion />} />
    <Route path="/signup" element={<Destination name="Signup destination" />} />
    <Route path="/subscription/payment/failure" element={<Destination name="Failure destination" />} />
    <Route path="/subscription/payment/success" element={<Destination name="Success destination" />} />
    <Route path="/learner/subscription/manage" element={<Destination name="Management destination" />} />
  </Routes></MemoryRouter></StrictMode>;
  const view = render(tree());
  return { ...view, refresh: () => view.rerender(tree()) };
}
async function submit() {
  await waitFor(() => expect(screen.getByLabelText(/Full Name/)).toHaveValue('Mock Buyer'));
  fireEvent.click(screen.getByRole('button', { name: /Pay ₹4999/ }));
  await waitFor(() => expect(f.initiate).toHaveBeenCalledOnce());
  return f.initiate.mock.calls[0][0];
}
beforeEach(() => {
  vi.clearAllMocks(); f.user = { id: 'buyer_mock', email: 'buyer@example.invalid' }; f.subscription = null; f.authenticated = true;
  f.post.mockResolvedValue({ data: { firstName: 'Mock', lastName: 'Buyer', email: 'buyer@example.invalid', phone: '' } });
  f.initiate.mockResolvedValue({ dispose: vi.fn() });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('preserves complete context through a terminal failure', async () => {
  show({ isUpgrade: true, isRenewal: false, isFreemium: false, referralCode: 'MOCK_REF' }); const request = await submit();
  expect(request.signal.aborted).toBe(false);
  act(() => request.onFailure({ error_code: 'MOCK_FAILURE', error_description: 'Attempt declined', razorpay_order_id: 'order_mock' }));
  expect(await screen.findByText('Failure destination')).toBeVisible();
  expect(JSON.parse(screen.getByTestId('route-state').textContent)).toMatchObject({ plan, learnerType: 'educator', isUpgrade: true, isRenewal: false, isFreemium: false, referralCode: 'MOCK_REF' });
});
it('invalidates checkout when the same buyer changes organization', async () => {
  f.user = { ...f.user, orgId: 'organization_one' };
  const view = show(); const previous = await submit();
  f.user = { ...f.user, orgId: 'organization_two' }; view.refresh();
  expect(previous.signal.aborted).toBe(true);
  act(() => previous.onSuccess({ razorpay_payment_id: 'pay_old', plan }));
  expect(screen.queryByText('Success destination')).toBeNull();
  await waitFor(() => expect(screen.getByRole('button', { name: /Pay ₹4999/ })).toBeEnabled());
});
it('excludes same-tick duplicate submissions', async () => {
  show(); await waitFor(() => expect(screen.getByLabelText(/Full Name/)).toHaveValue('Mock Buyer'));
  const form = screen.getByRole('button', { name: /Pay ₹4999/ }).closest('form');
  act(() => { fireEvent.submit(form); fireEvent.submit(form); });
  await waitFor(() => expect(f.initiate).toHaveBeenCalledOnce());
});
it('keeps both subscription redirect owners suppressed during payment', async () => {
  const view = show(); const request = await submit(); f.subscription = { status: 'active' };
  view.refresh();
  expect(screen.getByRole('button', { name: /Processing/ })).toBeDisabled();
  expect(screen.queryByText('Management destination')).toBeNull();
  act(() => request.onCancel());
  // Once the explicit cancellation ends payment, normal active-plan management resumes.
  expect(await screen.findByText('Management destination')).toBeVisible();
  view.unmount();
});
it('aborts on unmount and ignores later callbacks', async () => {
  const view = show(); const request = await submit(); view.unmount();
  expect(request.signal.aborted).toBe(true);
  act(() => request.onFailure({ error_code: 'LATE', error_description: 'Late result' }));
  expect(screen.queryByText('Failure destination')).toBeNull();
});
it('releases busy state on cancellation and gives the next attempt a fresh signal', async () => {
  show(); const first = await submit(); act(() => first.onCancel());
  fireEvent.click(screen.getByRole('button', { name: /Pay ₹4999/ }));
  await waitFor(() => expect(f.initiate).toHaveBeenCalledTimes(2));
  expect(f.initiate.mock.calls[1][0].signal).not.toBe(first.signal);
  expect(f.initiate.mock.calls[1][0].signal.aborted).toBe(false);
});
it('handles pending activation without navigating to a new-payment failure page', async () => {
  show(); const request = await submit(); act(() => request.onFailure({ error_code: 'SUBSCRIPTION_PENDING', error_description: 'Activation pending; do not pay again.' }));
  expect(await screen.findByText('Activation pending; do not pay again.')).toBeVisible();
  expect(screen.queryByText('Failure destination')).toBeNull();
});
it('routes an explicit subscription conflict to management', async () => {
  show(); const request = await submit(); act(() => request.onFailure({ error_code: 'SUBSCRIPTION_CONFLICT', error_description: 'Manage your existing plan.' }));
  expect(await screen.findByText('Management destination')).toBeVisible();
});
it.each([{ isOrganizationPurchase: true }, { isAddOn: true }])('blocks unsupported purchase intent before a payable order (%j)', async intent => {
  show(intent); await waitFor(() => expect(screen.getByLabelText(/Full Name/)).toHaveValue('Mock Buyer'));
  fireEvent.click(screen.getByRole('button', { name: /Pay ₹4999/ }));
  expect(await screen.findByText(/This purchase requires its dedicated checkout/)).toBeVisible(); expect(f.initiate).not.toHaveBeenCalled();
});

it('invalidates the previous buyer callbacks and clears busy state on user change', async () => {
  const view = show(); const previous = await submit(); f.user = { id: 'next_buyer_mock', email: 'next@example.invalid' }; view.refresh();
  expect(previous.signal.aborted).toBe(true);
  act(() => previous.onSuccess({ razorpay_payment_id: 'pay_old', plan }));
  expect(screen.queryByText('Success destination')).toBeNull();
  await waitFor(() => expect(screen.getByRole('button', { name: /Pay ₹4999/ })).toBeEnabled());
  await act(async () => { await Promise.resolve(); });
});

it('disposes the old checkout when the same route receives another purchase context', async () => {
  show(); const previous = await submit(); fireEvent.click(screen.getByRole('button', { name: 'Change route context' }));
  expect(previous.signal.aborted).toBe(true);
  act(() => previous.onFailure({ error_code: 'LATE', error_description: 'Old purchase' }));
  expect(screen.queryByText('Failure destination')).toBeNull();
  await waitFor(() => expect(screen.getByRole('button', { name: /Pay ₹4999/ })).toBeEnabled());
});
it('disposes on session loss even while the user object is retained', async () => {
  const view = show(); const previous = await submit(); f.authenticated = false; view.refresh();
  expect(previous.signal.aborted).toBe(true);
});
it('shows HTTP authorization failures without labelling them as declined payment', async () => {
  show(); const request = await submit(); act(() => request.onFailure({ error_code: 'AUTH_REQUIRED', http_status: 401, error_description: 'Sign in again.' }));
  expect(await screen.findByText('Sign in again.')).toBeVisible(); expect(screen.queryByText('Failure destination')).toBeNull();
});
it('composes the actual service and page: a failed attempt stays busy, then verified retry navigates once', async () => {
  const service = await vi.importActual('@/features/subscription/api/razorpayService');
  f.initiate.mockImplementation(service.initiateRazorpayPayment);
  f.create.mockResolvedValue({ success: true, data: { id: 'order_mock', amount: 499900, currency: 'INR', razorpay_key_id: 'rzp_test_mock' } });
  f.verify.mockResolvedValue({ subscription: { id: 'sub_mock', status: 'active' } });
  let options; let failed;
  vi.stubGlobal('Razorpay', vi.fn(function (value) {
    options = value;
    return { open: vi.fn(), close: () => options.modal.ondismiss(), on: (_event, listener) => { failed = listener; } };
  }));
  show(); await submit(); await waitFor(() => expect(failed).toBeTypeOf('function'));
  act(() => failed({ error: { code: 'MOCK', description: 'First attempt failed' } }));
  expect(screen.getByRole('button', { name: /Processing/ })).toBeDisabled();
  expect(screen.queryByText('Failure destination')).toBeNull(); expect(f.create).toHaveBeenCalledOnce();
  await act(async () => { await options.handler({ razorpay_order_id: 'order_mock', razorpay_payment_id: 'pay_mock', razorpay_signature: 'synthetic-proof' }); });
  expect(await screen.findByText('Success destination')).toBeVisible();
  expect(f.verify).toHaveBeenCalledOnce(); expect(f.create).toHaveBeenCalledOnce();
});

it('ignores a delayed previous-buyer profile after the current buyer has loaded', async () => {
  let resolveOld;
  const old = new Promise(resolve => { resolveOld = resolve; });
  f.post.mockImplementation((_url, body) => body.userId === 'buyer_mock' ? old : Promise.resolve({ data: { firstName: 'Current', lastName: 'Buyer', email: 'current@example.invalid' } }));
  const view = show(); await waitFor(() => expect(f.post).toHaveBeenCalled());
  f.user = { id: 'current', email: 'current@example.invalid' }; view.refresh();
  await waitFor(() => expect(screen.getByLabelText(/Full Name/)).toHaveValue('Current Buyer'));
  await act(async () => resolveOld({ data: { firstName: 'Old', lastName: 'Buyer', email: 'old@example.invalid' } }));
  expect(screen.getByLabelText(/Full Name/)).toHaveValue('Current Buyer');
  expect(screen.getByLabelText(/Email Address/)).toHaveValue('current@example.invalid');
});
it('prevents submission of the previous buyer profile while the new profile is pending', async () => {
  const view = show(); await waitFor(() => expect(screen.getByLabelText(/Full Name/)).toHaveValue('Mock Buyer'));
  let resolveCurrent; f.post.mockReturnValue(new Promise(resolve => { resolveCurrent = resolve; }));
  f.user = { id: 'current', email: 'current@example.invalid' }; view.refresh();
  expect(screen.getByLabelText(/Full Name/)).toHaveValue('');
  fireEvent.submit(screen.getByRole('button', { name: /Pay ₹4999/ }).closest('form'));
  expect(f.initiate).not.toHaveBeenCalled();
  await act(async () => resolveCurrent({ data: { firstName: 'Current', lastName: 'Buyer', email: 'current@example.invalid' } }));
});
it('ignores a failed previous-buyer profile response after the current buyer has loaded', async () => {
  let rejectOld;
  const old = new Promise((_resolve, reject) => { rejectOld = reject; });
  f.post.mockImplementation((_url, body) => body.userId === 'buyer_mock' ? old : Promise.resolve({ data: { firstName: 'Current', lastName: 'Buyer', email: 'current@example.invalid' } }));
  const view = show(); await waitFor(() => expect(f.post).toHaveBeenCalled());
  f.user = { id: 'current', email: 'current@example.invalid' }; view.refresh();
  await waitFor(() => expect(screen.getByLabelText(/Full Name/)).toHaveValue('Current Buyer'));
  await act(async () => rejectOld(new Error('Synthetic delayed failure')));
  expect(screen.getByLabelText(/Full Name/)).toHaveValue('Current Buyer');
  expect(screen.getByLabelText(/Email Address/)).toHaveValue('current@example.invalid');
});

it('transfers unresolved payment proof and complete buyer context to manual recovery', async () => {
  show({ isUpgrade: true, referralCode: 'MOCK_REF' }); const request = await submit();
  act(() => request.onVerificationRequired({ razorpay_payment_id: 'pay_pending', razorpay_order_id: 'order_pending', razorpay_signature: 'synthetic-proof', plan: { ...plan, referralCode: 'MOCK_REF' } }));
  expect(await screen.findByText('Success destination')).toBeVisible();
  expect(JSON.parse(screen.getByTestId('route-state').textContent)).toMatchObject({ verificationRequired: true, razorpay_payment_id: 'pay_pending', razorpay_order_id: 'order_pending', razorpay_signature: 'synthetic-proof', paymentUserId: 'buyer_mock', paymentOrganizationId: null, learnerType: 'educator', isUpgrade: true, referralCode: 'MOCK_REF' });
  expect(f.initiate).toHaveBeenCalledOnce();
});

it('composes actual SDK verification failure into recovery without creating another order', async () => {
  const service = await vi.importActual('@/features/subscription/api/razorpayService');
  f.initiate.mockImplementation(service.initiateRazorpayPayment);
  f.create.mockResolvedValue({ success: true, data: { id: 'order_mock', amount: 499900, currency: 'INR', razorpay_key_id: 'rzp_test_mock' } });
  f.verify.mockRejectedValue(new Error('Unavailable'));
  let options;
  vi.stubGlobal('Razorpay', vi.fn(function (value) {
    options = value;
    return { open: vi.fn(), close: () => options.modal.ondismiss(), on: vi.fn() };
  }));
  show(); await submit(); await waitFor(() => expect(options).toBeDefined());
  await act(async () => options.handler({ razorpay_order_id: 'order_mock', razorpay_payment_id: 'pay_mock', razorpay_signature: 'synthetic-proof' }));
  expect(await screen.findByText('Success destination')).toBeVisible();
  expect(JSON.parse(screen.getByTestId('route-state').textContent)).toMatchObject({ verificationRequired: true, razorpay_payment_id: 'pay_mock', razorpay_order_id: 'order_mock', paymentUserId: 'buyer_mock' });
  expect(f.verify).toHaveBeenCalledOnce(); expect(f.create).toHaveBeenCalledOnce();
  expect(screen.queryByText('Failure destination')).toBeNull();
});
