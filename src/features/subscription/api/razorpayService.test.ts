import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ createOrder: vi.fn(), verifyPayment: vi.fn() }));
vi.mock('./paymentsApiService', () => ({ default: api }));
import { initiateRazorpayPayment } from './razorpayService';

const plan = { id: 'plan_mock', name: 'Mock plan', price: 4999, duration: 'yearly' };
const proof = { razorpay_order_id: 'order_mock', razorpay_payment_id: 'pay_mock', razorpay_signature: 'synthetic-proof' };
const order = { success: true, data: { id: 'order_mock', amount: 499900, currency: 'INR', razorpay_key_id: 'rzp_test_mock' } };
const failure = (reason = 'attempt failed') => ({ error: { code: 'BAD_REQUEST_ERROR', description: reason, reason: 'mock_reason', source: 'bank', step: 'payment_authorization', metadata: { payment_id: 'pay_failed' } } });
type Options = { handler: (value: typeof proof) => Promise<void>; modal: { ondismiss: () => void } };
let options: Options;
let failed: (value: ReturnType<typeof failure>) => void;
let close: ReturnType<typeof vi.fn>;
let open: ReturnType<typeof vi.fn>;
let constructor: ReturnType<typeof vi.fn>;
const callbacks = () => ({ onSuccess: vi.fn(), onVerificationRequired: vi.fn(), onFailure: vi.fn(), onCancel: vi.fn() });
const start = (extra = {}) => initiateRazorpayPayment({ plan, userDetails: { name: 'Mock', email: 'mock@example.invalid' }, ...callbacks(), ...extra });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.clearAllMocks();
  api.createOrder.mockResolvedValue(structuredClone(order));
  api.verifyPayment.mockResolvedValue({ subscription: { id: 'sub_mock', status: 'active' } });
  close = vi.fn(() => options.modal.ondismiss());
  open = vi.fn();
  constructor = vi.fn(function (value: Options) {
    options = value;
    return { open, close, on: (_event: string, listener: typeof failed) => { failed = listener; } };
  });
  vi.stubGlobal('Razorpay', constructor);
});
afterEach(() => vi.unstubAllGlobals());

describe('checkout lifecycle', () => {
  it('keeps failed attempts inside the same checkout until dismissal', async () => {
    const c = callbacks(); await start(c);
    failed(failure('first')); failed(failure('last'));
    expect(c.onFailure).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(api.createOrder).toHaveBeenCalledOnce();
    options.modal.ondismiss(); options.modal.ondismiss();
    expect(c.onFailure).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ error_description: 'last', razorpay_order_id: 'order_mock', error_source: 'bank', error_step: 'payment_authorization' }));
    expect(c.onCancel).not.toHaveBeenCalled();
  });
  it('allows failure then successful retry, with exactly one terminal outcome', async () => {
    const c = callbacks(); await start(c);
    failed(failure()); await options.handler(proof);
    failed(failure()); options.modal.ondismiss(); await options.handler(proof);
    expect(c.onSuccess).toHaveBeenCalledOnce();
    expect(c.onFailure).not.toHaveBeenCalled(); expect(c.onCancel).not.toHaveBeenCalled();
    expect(api.verifyPayment).toHaveBeenCalledOnce(); expect(api.createOrder).toHaveBeenCalledOnce();
  });
  it('settles dismissal without an attempt error as cancellation once', async () => {
    const c = callbacks(); await start(c);
    options.modal.ondismiss(); options.modal.ondismiss(); failed(failure());
    expect(c.onCancel).toHaveBeenCalledOnce(); expect(c.onFailure).not.toHaveBeenCalled();
  });
  it('ignores dismissal, failures and duplicate handlers while verifying', async () => {
    const verification = deferred<object>(); api.verifyPayment.mockReturnValue(verification.promise);
    const c = callbacks(); await start(c);
    const pending = options.handler(proof); options.modal.ondismiss(); failed(failure()); const duplicate = options.handler(proof);
    expect(c.onCancel).not.toHaveBeenCalled(); expect(c.onFailure).not.toHaveBeenCalled();
    expect(api.verifyPayment).toHaveBeenCalledOnce();
    verification.resolve({ subscription: { id: 'sub_mock', status: 'active' } }); await Promise.all([pending, duplicate]);
    expect(c.onSuccess).toHaveBeenCalledOnce();
  });
  it('does not interpret a consumer exception as a verification failure', async () => {
    const c = callbacks(); c.onSuccess.mockImplementation(() => { throw new Error('consumer failed'); }); await start(c);
    await expect(options.handler(proof)).rejects.toThrow('consumer failed');
    expect(c.onSuccess).toHaveBeenCalledOnce(); expect(c.onFailure).not.toHaveBeenCalled();
  });
  it.each([new Error('activation pending'), {}, { subscription_created: true }, { subscription_error: 'pending' }, { subscription: { id: 'sub', status: 'pending' } }])('requires manual recovery when activation is unconfirmed (%j)', async value => {
    if (value instanceof Error) api.verifyPayment.mockRejectedValue(value);
    else api.verifyPayment.mockResolvedValue(value);
    const c = callbacks(); await start({ ...c, referralCode: 'MOCK_REFERRAL' }); await options.handler(proof);
    expect(c.onVerificationRequired).toHaveBeenCalledExactlyOnceWith({ ...proof, plan: { ...plan, referralCode: 'MOCK_REFERRAL' } });
    expect(c.onSuccess).not.toHaveBeenCalled(); expect(c.onFailure).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
    failed(failure()); options.modal.ondismiss(); await options.handler(proof);
    expect(c.onVerificationRequired).toHaveBeenCalledOnce(); expect(api.verifyPayment).toHaveBeenCalledOnce();
    expect(api.createOrder).toHaveBeenCalledOnce();
  });
  it('disposes checkout before close can dispatch cancellation', async () => {
    const controller = new AbortController(); const c = callbacks();
    const checkout = await start({ ...c, signal: controller.signal }); controller.abort(); checkout.dispose();
    expect(close).toHaveBeenCalledOnce();
    failed(failure()); options.modal.ondismiss(); await options.handler(proof);
    expect(c.onCancel).not.toHaveBeenCalled(); expect(c.onFailure).not.toHaveBeenCalled(); expect(c.onSuccess).not.toHaveBeenCalled();
    expect(api.verifyPayment).not.toHaveBeenCalled();
  });
  it('does not open checkout if disposal occurs during order creation', async () => {
    const pending = deferred<typeof order>(); api.createOrder.mockReturnValue(pending.promise);
    const controller = new AbortController(); const c = callbacks();
    const checkout = start({ ...c, signal: controller.signal }); await Promise.resolve(); controller.abort(); pending.resolve(order); await checkout;
    expect(constructor).not.toHaveBeenCalled(); expect(c.onFailure).not.toHaveBeenCalled();
  });
  it('does not create an order for a pre-aborted initiation', async () => {
    const controller = new AbortController(); controller.abort(); await start({ signal: controller.signal });
    expect(api.createOrder).not.toHaveBeenCalled();
  });
  it('does not create an order after SDK loading completes on an abandoned page', async () => {
    vi.stubGlobal('Razorpay', undefined);
    let script!: HTMLScriptElement;
    const append = vi.spyOn(document.body, 'appendChild').mockImplementation(node => { script = node as HTMLScriptElement; return node; });
    const controller = new AbortController(); const c = callbacks();
    const pending = start({ ...c, signal: controller.signal }); controller.abort();
    script.dispatchEvent(new Event('load')); await pending;
    expect(api.createOrder).not.toHaveBeenCalled(); expect(c.onFailure).not.toHaveBeenCalled(); append.mockRestore();
  });
  it('reports an SDK script failure once', async () => {
    vi.stubGlobal('Razorpay', undefined);
    let script!: HTMLScriptElement;
    const append = vi.spyOn(document.body, 'appendChild').mockImplementation(node => { script = node as HTMLScriptElement; return node; });
    const c = callbacks(); const pending = start(c); script.dispatchEvent(new Event('error')); await pending;
    expect(c.onFailure).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ error_code: 'INITIALIZATION_ERROR' }));
    expect(api.createOrder).not.toHaveBeenCalled(); append.mockRestore();
  });
  it('reports constructor/open exceptions once without cancellation reentry', async () => {
    open.mockImplementation(() => { throw new Error('SDK open failed'); });
    const c = callbacks(); await start(c);
    expect(c.onFailure).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ error_description: 'SDK open failed' }));
    expect(c.onCancel).not.toHaveBeenCalled();
  });
  it('suppresses verification results after disposal without claiming reversal', async () => {
    const verification = deferred<object>(); api.verifyPayment.mockReturnValue(verification.promise);
    const c = callbacks(); const checkout = await start(c); const pending = options.handler(proof);
    checkout.dispose(); verification.resolve({ subscription: { id: 'sub_mock', status: 'active' } }); await pending;
    expect(c.onSuccess).not.toHaveBeenCalled(); expect(c.onFailure).not.toHaveBeenCalled();
  });
  it('preserves server-confirmed free activation without a checkout or paid verification', async () => {
    const payload = { isFreemium: true, data: { id: 'free_mock', status: 'active' } };
    api.createOrder.mockResolvedValue({ success: true, data: payload }); const c = callbacks(); await start({ ...c, plan: { ...plan, price: 0 } });
    expect(c.onSuccess).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ verificationResult: payload }));
    expect(constructor).not.toHaveBeenCalled(); expect(api.verifyPayment).not.toHaveBeenCalled();
  });
  it.each([
    { success: false, data: order.data }, { success: true },
    { success: true, data: { ...order.data, amount: 0 } },
    { success: true, data: { ...order.data, currency: 'USD' } },
    { success: true, data: { ...order.data, razorpay_key_id: '' } },
  ])('reports malformed paid order responses without opening checkout (%j)', async value => {
    api.createOrder.mockResolvedValue(value); const c = callbacks(); await start(c);
    expect(c.onFailure).toHaveBeenCalledOnce(); expect(constructor).not.toHaveBeenCalled();
  });
  it('preserves machine-readable subscription conflicts', async () => {
    api.createOrder.mockRejectedValue(Object.assign(new Error('Manage existing coverage'), { code: 'SUBSCRIPTION_CONFLICT', status: 409 }));
    const c = callbacks(); await start(c);
    expect(c.onFailure).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ error_code: 'SUBSCRIPTION_CONFLICT', error_description: 'Manage existing coverage' }));
    expect(open).not.toHaveBeenCalled();
  });
});

it('suppresses unresolved verification after disposal', async () => {
  const pending = deferred<object>(); api.verifyPayment.mockReturnValue(pending.promise);
  const c = callbacks(); const checkout = await start(c); const verifying = options.handler(proof);
  checkout.dispose(); pending.reject(new Error('Unavailable')); await verifying;
  expect(c.onVerificationRequired).not.toHaveBeenCalled(); expect(c.onSuccess).not.toHaveBeenCalled(); expect(c.onFailure).not.toHaveBeenCalled();
});
it('does not redispatch when the recovery consumer throws', async () => {
  api.verifyPayment.mockRejectedValue(new Error('Unavailable'));
  const c = callbacks(); c.onVerificationRequired.mockImplementation(() => { throw new Error('consumer failed'); });
  await start(c); await expect(options.handler(proof)).rejects.toThrow('consumer failed');
  expect(c.onVerificationRequired).toHaveBeenCalledOnce(); expect(c.onSuccess).not.toHaveBeenCalled(); expect(c.onFailure).not.toHaveBeenCalled();
});
