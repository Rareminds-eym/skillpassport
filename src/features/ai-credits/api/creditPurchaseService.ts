/**
 * Credit Purchase Service
 *
 * Full Razorpay checkout flow for direct AI credit top-ups.
 *
 * Flow:
 *   1. POST /api/payments/create-credit-order  → Razorpay order + key_id
 *   2. Open Razorpay checkout (script loaded on demand)
 *   3. On payment success → POST /api/payments/verify-credit-payment
 *   4. Credits added via add_ai_credits(type='purchase')
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { extractErrorMessage } from '@/features/subscription/api/paymentsApiService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreditPackage {
  id: string;
  credits: number;
  price_inr: number;
  label: string;
}

export interface CreditPurchaseResult {
  success: boolean;
  verified: boolean;
  credits_added: number;
  balance_after: number;
  transaction_id: string;
  idempotent: boolean;
  package: CreditPackage;
}

export interface InitiateCreditPurchaseParams {
  pkg:       CreditPackage;
  userName:  string;
  userEmail: string;
  onSuccess: (result: CreditPurchaseResult) => void;
  onFailure: (error: Error) => void;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface RazorpayInstance {
  open(): void;
  on(event: string, cb: (r: unknown) => void): void;
}

interface RazorpayWindow extends Window {
  Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
}

// ─── Razorpay script loader ───────────────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('Razorpay' in window) { resolve(true); return; }
    const script = document.createElement('script');
    script.src     = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── API calls ────────────────────────────────────────────────────────────────

const getBaseUrl = () => `${window.location.origin}/api/payments`;

async function createCreditOrder(pkg: CreditPackage) {
  const res = await ssoClient.fetch(`${getBaseUrl()}/create-credit-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId: pkg.id, amount: Math.round(pkg.price_inr * 100) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err) || 'Failed to create credit order');
  }
  return res.json() as Promise<{ id: string; amount: number; currency: string; razorpay_key_id: string }>;
}

async function verifyCreditPayment(params: {
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
  pkg:                 CreditPackage;
}): Promise<CreditPurchaseResult> {
  const res = await ssoClient.fetch(`${getBaseUrl()}/verify-credit-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id:   params.razorpay_order_id,
      razorpay_payment_id: params.razorpay_payment_id,
      razorpay_signature:  params.razorpay_signature,
      packageId:           params.pkg.id,
      amount:              Math.round(params.pkg.price_inr * 100),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err) || 'Credit payment verification failed');
  }
  return res.json() as Promise<CreditPurchaseResult>;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function initiateCreditPurchase(params: InitiateCreditPurchaseParams): Promise<void> {
  const { pkg, userName, userEmail, onSuccess, onFailure } = params;

  try {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error('Failed to load Razorpay SDK. Please check your connection and try again.');
    }

    const order = await createCreditOrder(pkg);

    const options: Record<string, unknown> = {
      key:         order.razorpay_key_id,
      amount:      order.amount,
      currency:    order.currency,
      name:        'RareMinds Skill Passport',
      description: `${pkg.label} — AI Credits`,
      order_id:    order.id,
      prefill:     { name: userName, email: userEmail },
      notes:       { order_type: 'credit_purchase', package_id: pkg.id, credits: String(pkg.credits) },
      theme:       { color: '#2563eb' },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const result = await verifyCreditPayment({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            pkg,
          });
          result.success
            ? onSuccess(result)
            : onFailure(new Error('Credit verification failed. Please contact support.'));
        } catch (err) {
          onFailure(err instanceof Error ? err : new Error('Credit verification failed'));
        }
      },
      modal: {
        ondismiss: () => onFailure(new Error('Payment was cancelled.')),
      },
    };

    const rzp = new (window as unknown as RazorpayWindow).Razorpay(options);

    rzp.on('payment.failed', (response: unknown) => {
      const desc = (response as { error?: { description?: string } })?.error?.description;
      onFailure(new Error(desc || 'Payment failed'));
    });

    rzp.open();
  } catch (err) {
    onFailure(err instanceof Error ? err : new Error('Failed to initiate payment'));
  }
}
