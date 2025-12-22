export interface PaymentsApiService {
    createOrder(data: { amount: number; currency?: string; planId?: string; userId?: string; metadata?: any }, token: string): Promise<any>;
    verifyPayment(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; orderId?: string }, token: string): Promise<any>;
    createEventOrder(data: { amount: number; currency?: string; registrationId: string; planName: string; userEmail: string; userName: string; origin?: string }, token: string): Promise<any>;
    cancelSubscription(subscriptionId: string, token: string): Promise<any>;
    deactivateSubscription(subscriptionId: string, token: string): Promise<any>;
    // Add other methods as needed based on usage
    [key: string]: any;
}

declare const paymentsApiService: PaymentsApiService;
export default paymentsApiService;
