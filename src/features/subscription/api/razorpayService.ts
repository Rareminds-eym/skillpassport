/**
 * Razorpay Service
 * 
 * Handles Razorpay browser SDK integration for payment checkout.
 * This service MUST run in the browser (loads Razorpay script, opens checkout modal).
 * 
 * Authentication is handled automatically by paymentsApiService which uses
 * ssoClient.fetch() from @rareminds-eym/auth-client.
 * 
 * BROWSER-ONLY FUNCTIONS:
 * - loadRazorpayScript()      - Load Razorpay checkout.js
 * - initiateRazorpayPayment() - Open Razorpay checkout modal
 * 
 * API CALLS (via paymentsApiService → Pages Functions → Worker):
 * - createRazorpayOrder()     - Create order via Worker
 * - verifyPayment()           - Verify payment via Worker
 */

import { confirmedPaymentSubscription } from '../lib/paymentActivation';
import paymentsApiService from './paymentsApiService';
import { DEFAULT_TIMEOUT } from '@/shared/api/httpClient';

let sdkLoad: Promise<boolean> | undefined;

/**
 * Load Razorpay checkout script dynamically
 * @returns {Promise<boolean>} True if script loaded successfully
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  if (typeof (window as RazorpayWindow).Razorpay === 'function') return Promise.resolve(true);
  if (sdkLoad) return sdkLoad;
  sdkLoad = new Promise<boolean>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    const finish = (loaded: boolean, error?: Error) => {
      clearTimeout(timer);
      script.onload = null; script.onerror = null;
      if (!loaded) script.remove();
      if (error) reject(error); else resolve(loaded);
    };
    const timer = setTimeout(() => finish(false, new Error('Razorpay could not load in time. Check your connection and try again.')), DEFAULT_TIMEOUT);
    script.onload = () => finish(typeof (window as RazorpayWindow).Razorpay === 'function');
    script.onerror = () => finish(false);
    try { document.body.appendChild(script); }
    catch (error) { finish(false, error instanceof Error ? error : new Error('Razorpay script could not be requested.')); }
  }).finally(() => { sdkLoad = undefined; });
  return sdkLoad;
};

/** Validate the primary SDK before issuing an order; cancellation never creates a replacement. */
export async function prepareSubscriptionCheckout(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new DOMException('Checkout aborted.', 'AbortError');
  // VS Code's integrated browser blocks popup windows required by bank checkout.
  // Reject before a quote/order is issued rather than stranding a payment attempt.
  if (/\bCode\//.test(navigator.userAgent) && /\bElectron\//.test(navigator.userAgent)) {
    throw new Error('Payment checkout requires a full browser. Open SkillPassport in Chrome, Edge, Firefox or Safari. Keep any existing payment references and check their status before paying again.');
  }
  const loaded = await new Promise<boolean>((resolve, reject) => {
    const abort = () => { signal?.removeEventListener('abort', abort); reject(new DOMException('Checkout aborted.', 'AbortError')); };
    signal?.addEventListener('abort', abort, { once: true });
    void loadRazorpayScript().then(value => { signal?.removeEventListener('abort', abort); resolve(value); }, error => {
      signal?.removeEventListener('abort', abort); reject(error);
    });
    if (signal?.aborted) abort();
  });
  if (signal?.aborted) throw new DOMException('Checkout aborted.', 'AbortError');
  if (!loaded || typeof (window as RazorpayWindow).Razorpay !== 'function') throw new Error('Razorpay could not load. Check your connection and try again.');
}

/**
 * Create Razorpay order via Cloudflare Worker
 * Auth is handled automatically by paymentsApiService.
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} Order details from Razorpay
 */
export const createRazorpayOrder = async (orderData: Parameters<typeof paymentsApiService.createOrder>[0]) => {
  try {
    const result = await paymentsApiService.createOrder({
      amount: orderData.amount,
      currency: orderData.currency,
      planId: orderData.planId,
      planName: orderData.planName,
      userEmail: orderData.userEmail,
      userName: orderData.userName,
      isUpgrade: orderData.isUpgrade,
      referralCode: orderData.referralCode,
    });

    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already have an active subscription')) {
      throw Object.assign(new Error(error.message), { code: 'SUBSCRIPTION_EXISTS', isSubscriptionExists: true });
    }

    throw error;
  }
};

/**
 * Verify payment via Cloudflare Worker
 * Auth is handled automatically by paymentsApiService.
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} Verification result with subscription
 */
export const verifyPayment = async (paymentData: Parameters<typeof paymentsApiService.verifyPayment>[0]) => {
  return await paymentsApiService.verifyPayment({
    razorpay_order_id: paymentData.razorpay_order_id,
    razorpay_payment_id: paymentData.razorpay_payment_id,
    razorpay_signature: paymentData.razorpay_signature,
    plan: paymentData.plan,
  });
};

/** Browser checkout lifecycle. Failed attempts remain inside the SDK checkout. */
type PaymentPlan = Record<string, unknown> & { id: string; name: string; price: string | number; duration?: string };
export interface PaymentSuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  plan: Record<string, unknown>;
  verificationResult?: Record<string, unknown>;
}
export interface PaymentFailureResult {
  error_code: string;
  error_description: string;
  http_status?: number;
  error_reason?: string;
  error_source?: string;
  error_step?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}
export interface PaymentCheckout { dispose: () => void }
export interface InitiatePaymentParams {
  plan: PaymentPlan;
  userDetails: { name: string; email: string; phone?: string; learnerType?: string };
  isUpgrade?: boolean;
  referralCode?: string;
  signal?: AbortSignal;
  onSuccess: (result: PaymentSuccessResult) => void;
  onVerificationRequired: (result: Omit<PaymentSuccessResult, 'verificationResult'>) => void;
  onFailure: (result: PaymentFailureResult) => void;
  onCancel?: () => void;
}
export interface PaymentProof { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
interface RazorpayOptions {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  prefill?: { name: string; email: string; contact: string };
  notes?: { plan_id: string; plan_name: string }; theme?: { color: string };
  handler: (response: PaymentProof) => Promise<void>;
  modal: { ondismiss: () => void };
  timeout?: number;
}
interface RazorpayCheckout {
  open: () => void;
  close: () => void;
  on: (event: 'payment.failed', callback: (response: unknown) => void) => void;
}
type RazorpayWindow = Window & { Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout };
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function text(value: unknown): string | undefined { return typeof value === 'string' && value.length > 0 ? value : undefined; }

export const initiateRazorpayPayment = async ({
  plan, userDetails, isUpgrade, referralCode, signal, onSuccess, onVerificationRequired, onFailure, onCancel,
}: InitiatePaymentParams): Promise<PaymentCheckout> => {
  let state: 'initializing' | 'open' | 'verifying' | 'settled' | 'disposed' = 'initializing';
  let checkout: RazorpayCheckout | undefined;
  let lastFailure: PaymentFailureResult | undefined;
  const inactive = () => state === 'settled' || state === 'disposed';
  const isDisposed = () => state === 'disposed';
  const dispose = () => {
    if (state === 'disposed') return;
    const wasSettled = state === 'settled';
    state = 'disposed';
    signal?.removeEventListener('abort', dispose);
    if (!wasSettled) checkout?.close();
  };
  const handle = { dispose };
  const settle = (notify: () => void, close = false) => {
    if (inactive()) return;
    state = 'settled';
    signal?.removeEventListener('abort', dispose);
    // Mark settled before close: SDK close may synchronously invoke ondismiss.
    try { if (close) checkout?.close(); } finally { notify(); }
  };
  if (signal?.aborted) { dispose(); return handle; }
  signal?.addEventListener('abort', dispose, { once: true });

  try {
    const scriptLoaded = await loadRazorpayScript();
    if (inactive()) return handle;
    if (!scriptLoaded) throw new Error('Failed to load Razorpay SDK');
    const parsedPrice = parseFloat(String(plan.price));
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) throw new Error('Invalid plan price');
    const amountInPaise = Math.round(parsedPrice * 100);
    if (!Number.isSafeInteger(amountInPaise)) throw new Error('Invalid plan amount');
    const orderData: unknown = await createRazorpayOrder({
      amount: amountInPaise, currency: 'INR', planId: plan.id, planName: plan.name,
      userEmail: userDetails.email, userName: userDetails.name, isUpgrade, referralCode,
    });
    if (inactive()) return handle;
    if (!record(orderData) || orderData.success !== true || !record(orderData.data)) throw new Error('Invalid payment order response');
    const payload = orderData.data;
    if (payload.isFreemium === true) {
      if (!record(payload.data) || !text(payload.data.id) || payload.data.status !== 'active') throw new Error('Free subscription activation was not confirmed');
      settle(() => onSuccess({
        razorpay_payment_id: 'freemium_direct', razorpay_order_id: 'freemium_direct', razorpay_signature: 'freemium_direct',
        plan, verificationResult: payload,
      }));
      return handle;
    }
    // Preserve the existing backend key aliases; never manufacture a checkout key/order.
    const key = text(payload.razorpay_key_id) || text(payload.key);
    const orderId = text(payload.id);
    if (!key || !orderId || typeof payload.amount !== 'number' || !Number.isSafeInteger(payload.amount)
      || payload.amount <= 0 || payload.amount !== amountInPaise || payload.currency !== 'INR') throw new Error('Invalid payment order response');
    const Constructor = (window as RazorpayWindow).Razorpay;
    if (!Constructor) throw new Error('Razorpay SDK is unavailable');
    const verificationPlan = referralCode ? { ...plan, referralCode } : plan;
    const options: RazorpayOptions = {
      key, amount: payload.amount, currency: payload.currency, order_id: orderId,
      name: 'RareMinds Skill Passport', description: `${plan.name} Plan - ₹${plan.price}/${plan.duration ?? 'month'}`,
      prefill: { name: userDetails.name, email: userDetails.email, contact: userDetails.phone || '' },
      notes: { plan_id: plan.id, plan_name: plan.name }, theme: { color: '#2563eb' },
      handler: async response => {
        if (state !== 'open') return;
        state = 'verifying';
        lastFailure = undefined;
        let verificationResult: Record<string, unknown> | undefined;
        try {
          verificationResult = await verifyPayment({ ...response, plan: verificationPlan });
        } catch {
          // Gateway completion is not confirmation of subscription activation.
          // The caller presents explicit manual verification using this proof.
        }
        if (inactive()) return;
        // Consumer exceptions must not be caught as verification errors or dispatch again.
        if (!confirmedPaymentSubscription(verificationResult)) {
          settle(() => onVerificationRequired({ ...response, plan: verificationPlan }), true);
        } else {
          settle(() => onSuccess({ ...response, plan: verificationPlan, verificationResult }), true);
        }
      },
      modal: { ondismiss: () => {
        if (state !== 'open') return;
        if (lastFailure) {
          const failure = lastFailure;
          settle(() => onFailure(failure));
        } else if (onCancel) {
          settle(onCancel);
        } else {
          settle(() => onFailure({ error_code: 'PAYMENT_CANCELLED', error_description: 'Payment was cancelled by user', razorpay_order_id: orderId }));
        }
      } },
    };
    checkout = new Constructor(options);
    checkout.on('payment.failed', response => {
      if (state !== 'open') return;
      const error = record(response) && record(response.error) ? response.error : {};
      const metadata = record(error.metadata) ? error.metadata : {};
      lastFailure = {
        error_code: text(error.code) || 'PAYMENT_FAILED', error_description: text(error.description) || 'Payment failed',
        error_reason: text(error.reason), error_source: text(error.source), error_step: text(error.step),
        razorpay_order_id: orderId, razorpay_payment_id: text(metadata.payment_id),
      };
    });
    state = 'open';
    checkout.open();
  } catch (error: unknown) {
    if (inactive()) {
      // Do not turn a consumer/close exception after settlement into another outcome.
      if (!isDisposed()) throw error;
      return handle;
    }
    const code = record(error) ? text(error.code) : undefined;
    const description = error instanceof Error ? error.message : 'Failed to initialize payment';
    const status = record(error) && typeof error.status === 'number' ? error.status : undefined;
    settle(() => onFailure({ error_code: code || 'INITIALIZATION_ERROR', error_description: description, http_status: status }), true);
  }
  return handle;
};

export interface IssuedPaymentOrder { id: string; key_id: string; amount: number; currency: string }
/** Opens an already-issued canonical commerce order. Never creates or verifies a legacy order. */
export async function payIssuedSubscriptionOrder(order: IssuedPaymentOrder, description: string, signal: AbortSignal | undefined, validUntil: number): Promise<PaymentProof> {
  if (!/^order_[A-Za-z0-9]+$/.test(order.id) || !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(order.key_id)
    || !Number.isSafeInteger(order.amount) || order.amount <= 0 || !/^[A-Z]{3}$/.test(order.currency)) {
    throw new Error('Owner payment order is invalid or has no checkout key.');
  }
  if (!Number.isSafeInteger(validUntil) || validUntil <= Date.now()) throw new Error('This checkout has expired. Check its payment status before continuing.');
  await prepareSubscriptionCheckout(signal);
  const Constructor = (window as RazorpayWindow).Razorpay;
  if (!Constructor) throw new Error('Razorpay SDK is unavailable.');
  const remaining = validUntil - Date.now();
  // Browser timers use a signed 32-bit delay. Never wrap an invalid owner deadline.
  if (remaining <= 0 || remaining > 2 ** 31 - 1) throw new Error('Checkout validity is unavailable or expired. Check its payment status.');
  return new Promise((resolve, reject) => {
    let done = false;
    let checkout: RazorpayCheckout | undefined;
    const finish = (proof?: PaymentProof, error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      // close may synchronously dispatch dismissal. Finish first to avoid reentry.
      try { checkout?.close(); } finally { if (proof) resolve(proof); else reject(error); }
    };
    const abort = () => finish(undefined, new DOMException('Checkout aborted; reconcile the tracked order.', 'AbortError'));
    const timer = setTimeout(() => finish(undefined, new Error('This checkout has expired. Check its payment status before continuing.')), remaining);
    signal?.addEventListener('abort', abort, { once: true });
    try {
      checkout = new Constructor({ key: order.key_id, amount: order.amount, currency: order.currency,
        order_id: order.id, name: 'SkillPassport', description, timeout: Math.ceil(remaining / 1000),
        handler: async proof => {
          if (done) return;
          if (!record(proof) || proof.razorpay_order_id !== order.id
            || !/^pay_[A-Za-z0-9]+$/.test(proof.razorpay_payment_id)
            || typeof proof.razorpay_signature !== 'string' || !proof.razorpay_signature.trim()) {
            finish(undefined, new Error('Payment proof differs from the tracked owner order.'));
          } else finish(proof);
        },
        modal: { ondismiss: () => finish(undefined, new Error('Checkout dismissed. Reconcile the tracked order before another purchase.')) },
      });
      // A failed attempt is not a terminal outcome: the same SDK modal can still succeed.
      checkout.on('payment.failed', () => undefined);
      if (signal?.aborted) abort(); else checkout.open();
    } catch (error) { finish(undefined, error instanceof Error ? error : new Error('Checkout could not open.')); }
  });
}
