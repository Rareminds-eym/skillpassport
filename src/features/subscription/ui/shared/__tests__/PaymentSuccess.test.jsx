import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ verify: vi.fn(), refresh: vi.fn(), access: vi.fn(), getSubscription: vi.fn(), user: { id: 'buyer' } }));
vi.mock('@/features/subscription/api/paymentsApiService', () => ({ verifyPayment: f.verify }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', async () => ({ ...(await vi.importActual('@/features/subscription/model/useSubscriptionQuery')), useSubscriptionQuery: () => ({ refreshSubscription: f.refresh }) }));
vi.mock('@/features/subscription/model/subscriptionStore', () => ({ useSubscription: () => ({ refreshAccess: f.access }) }));
vi.mock('@/features/subscription/api/subscriptionService', () => ({ getActiveSubscription: f.getSubscription }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => f.user, useUserRole: () => ({ role: 'learner' }), useAuthStore: { getState: () => ({ user: f.user }) } }));
vi.mock('@/shared/api', () => ({ getPaymentReceiptPresignedUrl: vi.fn() }));
vi.mock('@/features/auth/lib/roleBasedRouter', () => ({ getRouteForRole: () => '/learner/dashboard' }));
import PaymentSuccess from '@/features/subscription/ui/shared/PaymentSuccess';
import { queryKeys } from '@/shared/lib/queryKeys';
const plan = { id: 'plan', name: 'Mock', price: 4999 };
function state(id) { return { plan, razorpay_payment_id: 'pay_' + id, razorpay_order_id: 'order_' + id, razorpay_signature: 'synthetic-proof' }; }
function Driver() { const navigate = useNavigate(); return <button onClick={() => navigate('/subscription/payment/success', { state: state('second') })}>Next payment</button>; }
function show(initial = state('first'), probe = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = () => <QueryClientProvider client={client}><MemoryRouter initialEntries={[{ pathname: '/subscription/payment/success', state: initial }]}><Driver />{probe}<Routes><Route path="/subscription/payment/success" element={<PaymentSuccess />} /></Routes></MemoryRouter></QueryClientProvider>;
  const view = render(tree());
  return { client, refreshView: () => view.rerender(tree()) };
}
beforeEach(() => { vi.clearAllMocks(); f.user = { id: 'buyer' }; f.refresh.mockResolvedValue(undefined); f.access.mockResolvedValue(undefined); f.getSubscription.mockResolvedValue({ success: true, data: null }); });
afterEach(cleanup);
it('resets verification when the same route receives another payment', async () => {
  f.verify.mockResolvedValue({ subscription: { id: 'sub', status: 'active' }, amount: 499900 });
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  expect(await screen.findByText('Payment Success!')).toBeVisible();
  await waitFor(() => expect(f.verify).toHaveBeenCalledOnce());
  f.verify.mockReturnValue(new Promise(() => {}));
  fireEvent.click(screen.getByRole('button', { name: 'Next payment' }));
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  await act(async () => { await Promise.resolve(); });
  expect(screen.queryByText('Payment Success!')).toBeNull();
  expect(await screen.findByText('Verifying payment...')).toBeVisible();
  expect(f.verify).toHaveBeenCalledTimes(2);
});
it('publishes verified data at the actual subscription consumer key', async () => {
  const { useSubscriptionQuery } = await vi.importActual('@/features/subscription/model/useSubscriptionQuery');
  function Probe() { const query = useSubscriptionQuery(); return <output data-testid="consumer">{query.hasAccess ? 'active' : 'no access'}</output>; }
  const { client } = show({ ...state('first'), verificationResult: { subscription: { id: 'sub', status: 'active' }, is_existing_subscription: true } }, <Probe />);
  await waitFor(() => expect(f.getSubscription).toHaveBeenCalled());
  const baseKey = queryKeys.subscription.data.byOrganization('buyer');
  expect(client.getQueryData(baseKey)).toBeUndefined();
  await waitFor(() => expect(client.getQueryData([...baseKey, 'default'])).toMatchObject({ status: 'active' }));
  expect(client.getQueryData([...baseKey, 'learner'])).toMatchObject({ status: 'active' });
  await waitFor(() => expect(screen.getByTestId('consumer')).toHaveTextContent('active'));
});
it('ignores an old verification that resolves after another payment has mounted', async () => {
  let resolveFirst; let resolveSecond;
  f.verify.mockReturnValueOnce(new Promise(resolve => { resolveFirst = resolve; }))
    .mockReturnValueOnce(new Promise(resolve => { resolveSecond = resolve; }));
  show(); fireEvent.click(screen.getByRole('button', { name: 'Retry verification' })); await waitFor(() => expect(f.verify).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole('button', { name: 'Next payment' }));
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  await waitFor(() => expect(f.verify).toHaveBeenCalledTimes(2));
  await act(async () => resolveFirst({ subscription: { id: 'old_sub', status: 'active' }, amount: 100 }));
  expect(screen.queryByText('Payment Success!')).toBeNull();
  expect(screen.getByText('Verifying payment...')).toBeVisible();
  await act(async () => resolveSecond({ subscription: { id: 'sub', status: 'active' }, amount: 499900 }));
  expect(await screen.findByText('Payment Success!')).toBeVisible();
  expect(screen.getByText('pay_second')).toBeVisible();
});
it('keeps the actual query owner disabled when its caller requests enabled false', async () => {
  const { useSubscriptionQuery } = await vi.importActual('@/features/subscription/model/useSubscriptionQuery');
  function Probe() { useSubscriptionQuery({ enabled: false }); return null; }
  f.verify.mockReturnValue(new Promise(() => {}));
  show(state('first'), <Probe />);
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  await waitFor(() => expect(f.verify).toHaveBeenCalledOnce());
  expect(f.getSubscription).not.toHaveBeenCalled();
});
it('does not verify or show a receipt for another buyer recorded in payment context', async () => {
  show({ ...state('first'), paymentUserId: 'another_buyer', verificationResult: { subscription_created: true } });
  expect(await screen.findByText('Sign in with the account that made this payment before verifying it.')).toBeVisible();
  expect(screen.queryByText('Payment Success!')).toBeNull();
  expect(f.verify).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  expect(f.verify).not.toHaveBeenCalled();
});
it('invalidates an in-flight verification when the authenticated buyer changes', async () => {
  let resolveOld; f.verify.mockReturnValue(new Promise(resolve => { resolveOld = resolve; }));
  const view = show({ ...state('first'), paymentUserId: 'buyer', paymentOrganizationId: null });
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  await waitFor(() => expect(f.verify).toHaveBeenCalledOnce());
  f.user = { id: 'next_buyer' }; view.refreshView();
  expect(await screen.findByText('Sign in with the account that made this payment before verifying it.')).toBeVisible();
  await act(async () => resolveOld({ subscription_created: true }));
  expect(screen.queryByText('Payment Success!')).toBeNull(); expect(f.verify).toHaveBeenCalledOnce();
});

it('starts unresolved without verifying automatically and retries only the original proof', async () => {
  f.verify.mockRejectedValueOnce(new Error('Service unavailable')).mockResolvedValueOnce({ subscription: { id: 'sub', status: 'active' }, email_sent: false });
  show({ ...state('first'), verificationRequired: true });
  expect(screen.getByText('Unable to confirm activation')).toBeVisible();
  expect(screen.getByText(/Do not pay again/)).toBeVisible();
  await act(async () => { await Promise.resolve(); });
  expect(f.verify).not.toHaveBeenCalled();
  expect(screen.queryByText('Payment Success!')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Receipt' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  expect(await screen.findByText('Unable to confirm activation')).toBeVisible();
  expect(f.verify).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  expect(await screen.findByText('Payment Success!')).toBeVisible();
  expect(f.verify).toHaveBeenCalledTimes(2);
  for (const [request] of f.verify.mock.calls) expect(request).toEqual(state('first'));
});
it.each([{}, { subscription_created: true }, { subscription_error: 'pending' }, { subscription: { id: 'sub', status: 'pending' } }])('keeps unconfirmed successful HTTP responses unresolved (%j)', async result => {
  f.verify.mockResolvedValue(result);
  show({ ...state('first'), verificationResult: result });
  expect(screen.getByText('Unable to confirm activation')).toBeVisible();
  expect(f.verify).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  expect(await screen.findByText('Unable to confirm activation')).toBeVisible();
  expect(screen.queryByText('Payment Success!')).toBeNull();
  expect(f.access).not.toHaveBeenCalled();
});
it('permits only one verification while a manual retry is pending', async () => {
  f.verify.mockReturnValue(new Promise(() => {})); show();
  const button = screen.getByRole('button', { name: 'Retry verification' });
  act(() => { fireEvent.click(button); fireEvent.click(button); });
  expect(f.verify).toHaveBeenCalledOnce();
  expect(screen.getByText('Verifying payment...')).toBeVisible();
});
it('shows confirmed free activation without paid verification', async () => {
  show({ ...state('free'), verificationResult: { isFreemium: true, data: { id: 'free_sub', status: 'active' } } });
  expect(await screen.findByText('Payment Success!')).toBeVisible();
  expect(f.verify).not.toHaveBeenCalled();
});

it('blocks manual verification when the original proof is incomplete', async () => {
  show({ ...state('first'), razorpay_signature: '' });
  fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
  expect(await screen.findByText(/Payment details are missing/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/contact');
  expect(f.verify).not.toHaveBeenCalled();
});
it('preserves confirmed already-fulfilled activation without repeating verification', async () => {
  show({ ...state('first'), verificationResult: { already_fulfilled: true, subscription: { id: 'sub', status: 'active' }, email_sent: false } });
  expect(await screen.findByText('Payment Success!')).toBeVisible();
  expect(f.verify).not.toHaveBeenCalled();
});
