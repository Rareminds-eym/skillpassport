/**
 * Receipt Types for Payment Receipt System
 * 
 * Defines TypeScript interfaces for receipt-related data structures
 */

export interface ReceiptCompanyInfo {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

export interface ReceiptTransactionDetails {
  payment_id: string;
  payment_method: string;
  payment_timestamp: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}

export interface ReceiptUserDetails {
  name: string;
  email: string;
  phone?: string;
}

export interface ReceiptSubscriptionDetails {
  plan_type: string;
  billing_cycle: string;
  subscription_start_date: string;
  subscription_end_date: string;
}

export interface ReceiptData {
  transaction: ReceiptTransactionDetails;
  user: ReceiptUserDetails;
  company: ReceiptCompanyInfo;
  subscription?: ReceiptSubscriptionDetails;
  generatedAt?: string;
}

export interface ReceiptApiResponse {
  success: boolean;
  data?: {
    id: string;
    razorpay_order_id: string;
    payment_id?: string;
    payment_method?: string;
    amount: number;
    status: string;
    created_at: string;
    plan_type?: string;
    billing_cycle?: string;
    subscription_end_date?: string;
    user_name?: string;
    user_email?: string;
    user_phone?: string;
  } | null;
  error?: string;
}

export interface ReceiptDownloadError extends Error {
  code?: 'RECEIPT_NOT_FOUND' | 'RECEIPT_GENERATING' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
}