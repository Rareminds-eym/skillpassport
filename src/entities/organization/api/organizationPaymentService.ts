import { extractErrorMessage } from '@/features/subscription/api/paymentsApiService';
import { ssoClient } from '@/shared/api/ssoClient';
import { getRazorpayKeyId, getRazorpayKeyMode } from '@/shared/config';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organizationPayment');

const getBaseUrl = () => {
  const origin = window.location.origin;
  return `${origin}/api/payments`;
};

export interface OrganizationPurchaseData {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  planId: string;
  planName: string;
  seatCount: number;
  targetMemberType: 'educator' | 'learner' | 'both';
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
  key: string;
  status: string;
}

const getAuthHeaders = async () => ({ 'Content-Type': 'application/json' });

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export async function createOrganizationOrder(purchaseData: OrganizationPurchaseData): Promise<OrganizationOrderResult> {
  try {
    const headers = await getAuthHeaders();
    const response = await ssoClient.fetch(`${getBaseUrl()}/create-org-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: purchaseData.pricing.finalAmount * 100,
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
      throw new Error(extractErrorMessage(error) || 'Failed to create organization order');
    }
    return await response.json();
  } catch (error) {
    logger.error('Error creating order', error as Error);
    throw error;
  }
}

export async function verifyOrganizationPayment(paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  purchaseData: OrganizationPurchaseData;
}): Promise<{ success: boolean; subscription?: any; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await ssoClient.fetch(`${getBaseUrl()}/verify-org-payment`, {
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
      throw new Error(extractErrorMessage(error) || 'Payment verification failed');
    }
    return await response.json();
  } catch (error) {
    logger.error('Error verifying payment', error as Error);
    throw error;
  }
}

export async function purchaseOrganizationSubscription(
  purchaseData: OrganizationPurchaseData
): Promise<{ success: boolean; subscription?: any; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await ssoClient.fetch(`${getBaseUrl()}/org-subscriptions/purchase`, {
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
      throw new Error(extractErrorMessage(error) || 'Failed to purchase subscription');
    }
    return await response.json();
  } catch (error) {
    logger.error('Error purchasing subscription', error as Error);
    throw error;
  }
}

export async function initiateOrganizationPayment(params: {
  purchaseData: OrganizationPurchaseData;
  onSuccess: (result: any) => void;
  onFailure: (error: Error) => void;
}): Promise<void> {
  const { purchaseData, onSuccess, onFailure } = params;
  try {
    localStorage.setItem('org_payment_purchase_data', JSON.stringify(purchaseData));
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) throw new Error('Failed to load Razorpay SDK');
    const orderData = await createOrganizationOrder(purchaseData);
    // apiSuccess wraps payload at { success, data: { ... } }
    const orderPayload = orderData.data;
    const razorpayKeyId = orderPayload?.razorpay_key_id || orderPayload?.key;

    const options = {
      key: razorpayKeyId,
      amount: orderPayload?.amount,
      currency: orderPayload?.currency,
      name: 'RareMinds Skill Passport',
      description: `${purchaseData.planName} - ${purchaseData.seatCount} seats (${purchaseData.billingCycle})`,
      order_id: orderPayload?.id,
      prefill: { name: purchaseData.billingName, email: purchaseData.billingEmail },
      notes: {
        organization_id: purchaseData.organizationId,
        organization_type: purchaseData.organizationType,
        plan_id: purchaseData.planId,
        seat_count: purchaseData.seatCount.toString(),
        billing_cycle: purchaseData.billingCycle,
      },
      theme: { color: '#2563eb' },
      handler: async function (response: any) {
        try {
          const verificationResult = await verifyOrganizationPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            purchaseData,
          });
          // Pass the inner payload so callers can read result.subscription, etc.
          if (verificationResult.success) onSuccess(verificationResult.data || verificationResult);
          else onFailure(new Error(verificationResult.error || 'Payment verification failed'));
        } catch (error) {
          onFailure(error instanceof Error ? error : new Error('Payment verification failed'));
        }
      },
      modal: { ondismiss: function () { onFailure(new Error('Payment was cancelled by user')); } },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.on('payment.failed', function (response: any) {
      onFailure(new Error(response.error?.description || 'Payment failed'));
    });
    razorpay.open();
  } catch (error) {
    logger.error('Error initiating payment', error as Error);
    onFailure(error instanceof Error ? error : new Error('Failed to initiate payment'));
  }
}

export default {
  loadRazorpayScript, createOrganizationOrder, verifyOrganizationPayment,
  purchaseOrganizationSubscription, initiateOrganizationPayment,
};
