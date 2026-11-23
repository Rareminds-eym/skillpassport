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

/**
 * Load Razorpay checkout script dynamically
 * @returns {Promise<boolean>} True if script loaded successfully
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as RazorpayWindow).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
interface PaymentProof { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
interface RazorpayOptions {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: { plan_id: string; plan_name: string }; theme: { color: string };
  handler: (response: PaymentProof) => Promise<void>;
  modal: { ondismiss: () => void };
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
