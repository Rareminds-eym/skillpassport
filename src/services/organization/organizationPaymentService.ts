/**
 * Organization Payment Service
 *
 * Handles Razorpay integration for organization bulk purchases.
 * Creates orders, processes payments, and creates organization subscriptions.
 */

import { supabase } from '@/lib/supabaseClient';
import { getRazorpayKeyId, getRazorpayKeyMode } from '@/config/payment';

const WORKER_URL = import.meta.env.VITE_PAYMENTS_API_URL;

// ============================================================================
// Types
// ============================================================================

export interface OrganizationPurchaseData {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  planId: string;
  planName: string;
  seatCount: number;
  targetMemberType: 'educator' | 'student' | 'both';
  billingCycle: 'monthly' | 'annual';
  autoRenew: boolean;
  pricing: {
    basePrice: number;
    subtotal: number;
    discountPercentage: number;
    discountAmount: number;
    taxAmount: number;
    finalAmount: number;
  };
  assignmentMode: 'auto-all' | 'select-specific' | 'create-pool';
  selectedMemberIds: string[];
  poolName?: string;
  autoAssignNewMembers: boolean;
  billingEmail: string;
  billingName: string;
  gstNumber?: string;
}

export interface OrganizationOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Load Razorpay checkout script dynamically
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
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

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create Razorpay order for organization subscription
 */
export async function createOrganizationOrder(
  purchaseData: OrganizationPurchaseData
): Promise<OrganizationOrderResult> {
  try {
    console.log('[OrgPayment] Creating organization order:', purchaseData);

    const headers = await getAuthHeaders();

    // Create order via Worker
    const response = await fetch(`${WORKER_URL}/create-org-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: purchaseData.pricing.finalAmount * 100, // Convert to paise
        currency: 'INR',
        organizationId: purchaseData.organizationId,
        organizationType: purchaseData.organizationType,
        planId: purchaseData.planId,
        planName: purchaseData.planName,
        seatCount: purchaseData.seatCount,
        targetMemberType: purchaseData.targetMemberType,
        billingCycle: purchaseData.billingCycle,
        billingEmail: purchaseData.billingEmail,
        billingName: purchaseData.billingName,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create organization order');
    }

    const result = await response.json();
    console.log('[OrgPayment] Order created:', result.id);
    return result;
  } catch (error) {
    console.error('[OrgPayment] Error creating order:', error);
    throw error;
  }
}

/**
 * Verify organization payment and create subscription
 */
export async function verifyOrganizationPayment(paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  purchaseData: OrganizationPurchaseData;
}): Promise<{ success: boolean; subscription?: any; error?: string }> {
  try {
    console.log('[OrgPayment] Verifying payment:', paymentData.razorpay_payment_id);

    const headers = await getAuthHeaders();

    const response = await fetch(`${WORKER_URL}/verify-org-payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        purchaseData: paymentData.purchaseData,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Payment verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('[OrgPayment] Error verifying payment:', error);
    throw error;
  }
}

/**
 * Purchase organization subscription directly (without Razorpay - for testing)
 */
export async function purchaseOrganizationSubscription(
  purchaseData: OrganizationPurchaseData
): Promise<{ success: boolean; subscription?: any; error?: string }> {
  try {
    console.log('[OrgPayment] Purchasing subscription directly:', purchaseData);

    const headers = await getAuthHeaders();

    const response = await fetch(`${WORKER_URL}/org-subscriptions/purchase`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        organizationId: purchaseData.organizationId,
        organizationType: purchaseData.organizationType,
        planId: purchaseData.planId,
        seatCount: purchaseData.seatCount,
        targetMemberType: purchaseData.targetMemberType,
        billingCycle: purchaseData.billingCycle,
        autoRenew: purchaseData.autoRenew,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to purchase subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('[OrgPayment] Error purchasing subscription:', error);
    throw error;
  }
}

/**
 * Initiate Razorpay payment for organization subscription
 */
export async function initiateOrganizationPayment(params: {
  purchaseData: OrganizationPurchaseData;
  onSuccess: (result: any) => void;
  onFailure: (error: Error) => void;
}): Promise<void> {
  const { purchaseData, onSuccess, onFailure } = params;

  try {
    // Store purchase data in localStorage for success page
    localStorage.setItem('org_payment_purchase_data', JSON.stringify(purchaseData));

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    // Create order via Worker
    const orderData = await createOrganizationOrder(purchaseData);

    // Get current origin for redirect URLs
    const origin = window.location.origin;

    // Get base path from current location
    const pathname = window.location.pathname;
    let basePath = '/school-admin';
    if (pathname.includes('/college-admin')) basePath = '/college-admin';
    else if (pathname.includes('/university-admin')) basePath = '/university-admin';

    // Get Razorpay key
    const razorpayKeyId = getRazorpayKeyId();
    console.log(`[OrgPayment] Using ${getRazorpayKeyMode()} Razorpay key`);

    // Razorpay checkout options
    const options = {
      key: razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'RareMinds Skill Passport',
      description: `${purchaseData.planName} - ${purchaseData.seatCount} seats (${purchaseData.billingCycle})`,
      order_id: orderData.id,
      prefill: {
        name: purchaseData.billingName,
        email: purchaseData.billingEmail,
      },
      notes: {
        organization_id: purchaseData.organizationId,
        organization_type: purchaseData.organizationType,
        plan_id: purchaseData.planId,
        seat_count: purchaseData.seatCount.toString(),
        billing_cycle: purchaseData.billingCycle,
      },
      theme: {
        color: '#2563eb',
      },
      handler: async function (response: any) {
        try {
          // Verify payment and create subscription
          const verificationResult = await verifyOrganizationPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            purchaseData,
          });

          if (verificationResult.success) {
            onSuccess(verificationResult);
          } else {
            onFailure(new Error(verificationResult.error || 'Payment verification failed'));
          }
        } catch (error) {
          onFailure(error instanceof Error ? error : new Error('Payment verification failed'));
        }
      },
      modal: {
        ondismiss: function () {
          onFailure(new Error('Payment was cancelled by user'));
        },
      },
    };

    // Open Razorpay checkout
    const razorpay = new (window as any).Razorpay(options);

    // Handle payment failure
    razorpay.on('payment.failed', function (response: any) {
      onFailure(new Error(response.error?.description || 'Payment failed'));
    });

    razorpay.open();
  } catch (error) {
    console.error('[OrgPayment] Error initiating payment:', error);
    onFailure(error instanceof Error ? error : new Error('Failed to initiate payment'));
  }
}

// Export default object
export default {
  loadRazorpayScript,
  createOrganizationOrder,
  verifyOrganizationPayment,
  purchaseOrganizationSubscription,
  initiateOrganizationPayment,
};
