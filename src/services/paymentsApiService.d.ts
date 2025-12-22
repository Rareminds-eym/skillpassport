export interface PaymentsApiService {
    createRazorpayOrder(amount: number, currency: string, receipt: string, notes: any, token: string): Promise<any>;
    verifyPayment(paymentData: any, token: string): Promise<any>;
    createEventOrder(amount: number, currency: string, receipt: string, notes: any, token: string): Promise<any>;
    // Add other methods as needed based on usage
    [key: string]: any;
}

declare const paymentsApiService: PaymentsApiService;
export default paymentsApiService;
