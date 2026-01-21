export interface SubscriptionAccessResponse {
  success: boolean;
  hasAccess: boolean;
  accessReason: 'active' | 'paused' | 'grace_period' | 'expired' | 'cancelled' | 'no_subscription';
  subscription: any | null;
  showWarning: boolean;
  warningType?: 'expiring_soon' | 'grace_period' | 'paused';
  warningMessage?: string;
  daysUntilExpiry?: number;
  expiresAt?: string;
}

export interface PaymentsApiService {
  createOrder(
    data: { amount: number; currency?: string; planId?: string; userId?: string; metadata?: any },
    token: string
  ): Promise<any>;
  verifyPayment(
    data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      orderId?: string;
    },
    token: string
  ): Promise<any>;
  createEventOrder(
    data: {
      amount: number;
      currency?: string;
      registrationId: string;
      planName: string;
      userEmail: string;
      userName: string;
      origin?: string;
    },
    token: string
  ): Promise<any>;
  getSubscription(token: string): Promise<any>;
  checkSubscriptionAccess(token: string): Promise<SubscriptionAccessResponse>;
  cancelSubscription(subscriptionId: string, token: string): Promise<any>;
  deactivateSubscription(
    subscriptionId: string,
    cancellationReason: string,
    token: string
  ): Promise<any>;
  pauseSubscription(subscriptionId: string, pauseMonths: number, token: string): Promise<any>;
  resumeSubscription(subscriptionId: string, token: string): Promise<any>;
  checkHealth(): Promise<any>;
  [key: string]: any;
}

export function checkSubscriptionAccess(token: string): Promise<SubscriptionAccessResponse>;

declare const paymentsApiService: PaymentsApiService;
export default paymentsApiService;
