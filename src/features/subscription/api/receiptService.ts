/**
 * Receipt Service - Handles payment receipt generation and download
 * 
 * Connects frontend to backend receipt APIs and manages receipt downloads
 */

import { apiPost } from '@/shared/api/apiClient';
import { getPaymentReceiptPresignedUrl } from '@/shared/api';
import { downloadReceipt } from '@/features/subscription/api/pdfReceiptGenerator';
import { getLogger } from '@/shared/config';
import type { 
  ReceiptData, 
  ReceiptApiResponse, 
  ReceiptDownloadError,
  ReceiptCompanyInfo 
} from '../types/receipt';

const logger = getLogger('receiptService');

// Company information for receipts
const COMPANY_INFO: ReceiptCompanyInfo = {
  name: 'RareMinds',
  address: '231, 2nd Stage, 13th Cross Road\nIndiranagar, Bangalore, Karnataka 560038',
  phone: '+91 8050226031',
  email: 'marketing@rareminds.in',
  taxId: '29ABCDE1234L1Z5'
};

// Define the expected API response type from the backend
interface ReceiptBackendResponse {
  success: boolean;
  data: {
    id: string;
    razorpay_order_id: string;
    payment_id?: string;
    amount: number;
    status: string;
    created_at: string;
    plan_type?: string;
    billing_cycle?: string;
    user_name?: string;
    user_email?: string;
    user_phone?: string;
  } | null;
  error?: string;
}

/**
 * Fetches receipt data from the backend API
 */
export async function fetchReceiptData(identifier: string, type: 'order_id' | 'payment_id' | 'id'): Promise<ReceiptApiResponse> {
  try {
    let action: string;
    let payload: Record<string, string>;

    switch (type) {
      case 'order_id':
        action = 'get-receipt-by-order-id';
        payload = { orderId: identifier };
        break;
      case 'payment_id':
        action = 'get-receipt-by-payment-id';
        payload = { paymentId: identifier };
        break;
      case 'id':
      default:
        action = 'get-receipt-by-id';
        payload = { id: identifier };
        break;
    }

    logger.info('Fetching receipt data', { action, identifier });

    const response = await apiPost<ReceiptBackendResponse>('/receipts', {
      action,
      ...payload
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch receipt data');
    }

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    // Properly handle the unknown error type
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to fetch receipt data', errorInstance);
    
    // Handle specific error types
    const errorMessage = errorInstance.message;
    
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('no valid token')) {
      return {
        success: false,
        error: 'Authentication required. Please refresh the page and try again.'
      };
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('Receipt not found')) {
      return {
        success: false,
        error: 'Receipt not found. The receipt may still be processing.'
      };
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Transforms API response data to receipt format
 */
function transformToReceiptData(data: NonNullable<ReceiptApiResponse['data']>): ReceiptData {
  return {
    transaction: {
      payment_id: data.payment_id || data.id,
      payment_method: 'Card', // Default - could be enhanced with actual payment method
      payment_timestamp: data.created_at,
      amount: data.amount,
      currency: 'INR',
      status: data.status === 'active' || data.status === 'paid' ? 'Success' : data.status,
      razorpay_order_id: data.razorpay_order_id,
      razorpay_payment_id: data.payment_id
    },
    user: {
      name: data.user_name || 'N/A',
      email: data.user_email || 'N/A',
      phone: data.user_phone
    },
    company: COMPANY_INFO,
    subscription: data.plan_type ? {
      plan_type: data.plan_type,
      billing_cycle: data.billing_cycle || 'N/A',
      subscription_start_date: data.created_at,
      subscription_end_date: 'N/A' // Would need additional API data
    } : undefined,
    generatedAt: new Date().toLocaleString()
  };
}

/**
 * Downloads a receipt using order ID - primary method for success page
 */
export async function downloadReceiptByOrderId(orderId: string): Promise<void> {
  try {
    logger.info('Downloading receipt by order ID', { orderId });

    // First try to get the presigned URL directly if we have receipt key
    // Only attempt if the string looks like an R2 file key
    if (orderId.startsWith('payment_pdf/') || orderId.endsWith('.pdf')) {
      try {
        const presignedUrl = await getPaymentReceiptPresignedUrl(orderId, 3600);
        if (presignedUrl) {
          window.open(presignedUrl, '_blank');
          return;
        }
      } catch (presignedError) {
        const errorInstance = presignedError instanceof Error ? presignedError : new Error(String(presignedError));
        logger.warn('Presigned URL method failed, trying API generation', { error: errorInstance.message });
      }
    }

    // Fallback: fetch receipt data and generate PDF
    const receiptResponse = await fetchReceiptData(orderId, 'order_id');
    
    if (!receiptResponse.success || !receiptResponse.data) {
      const error = new Error(receiptResponse.error || 'Receipt not found') as ReceiptDownloadError;
      error.code = 'RECEIPT_NOT_FOUND';
      throw error;
    }

    const receiptData = transformToReceiptData(receiptResponse.data);
    const filename = `receipt-${orderId}-${Date.now()}.pdf`;
    
    await downloadReceipt(receiptData, filename);
    logger.info('Receipt downloaded successfully', { orderId, filename });
    
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to download receipt by order ID', errorInstance, { 
      orderId, 
      stack: errorInstance.stack 
    });
    
    const receiptError = new Error(
      errorInstance.message
    ) as ReceiptDownloadError;
    
    if (error instanceof Error && 'code' in error) {
      receiptError.code = error.code as ReceiptDownloadError['code'];
    } else {
      receiptError.code = 'UNKNOWN_ERROR';
    }
    
    throw receiptError;
  }
}

/**
 * Downloads a receipt using payment ID - alternative method
 */
export async function downloadReceiptByPaymentId(paymentId: string): Promise<void> {
  try {
    logger.info('Downloading receipt by payment ID', { paymentId });

    const receiptResponse = await fetchReceiptData(paymentId, 'payment_id');
    
    if (!receiptResponse.success || !receiptResponse.data) {
      const error = new Error(receiptResponse.error || 'Receipt not found') as ReceiptDownloadError;
      error.code = 'RECEIPT_NOT_FOUND';
      throw error;
    }

    const receiptData = transformToReceiptData(receiptResponse.data);
    const filename = `receipt-${paymentId}-${Date.now()}.pdf`;
    
    await downloadReceipt(receiptData, filename);
    logger.info('Receipt downloaded successfully', { paymentId, filename });
    
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to download receipt by payment ID', errorInstance, { 
      paymentId, 
      stack: errorInstance.stack 
    });
    
    const receiptError = new Error(
      errorInstance.message
    ) as ReceiptDownloadError;
    
    receiptError.code = 'UNKNOWN_ERROR';
    throw receiptError;
  }
}

/**
 * Downloads a receipt using receipt ID - for subscription dashboard
 */
export async function downloadReceiptById(receiptId: string): Promise<void> {
  try {
    logger.info('Downloading receipt by ID', { receiptId });

    const receiptResponse = await fetchReceiptData(receiptId, 'id');
    
    if (!receiptResponse.success || !receiptResponse.data) {
      const error = new Error(receiptResponse.error || 'Receipt not found') as ReceiptDownloadError;
      error.code = 'RECEIPT_NOT_FOUND';
      throw error;
    }

    const receiptData = transformToReceiptData(receiptResponse.data);
    const filename = `receipt-${receiptId}-${Date.now()}.pdf`;
    
    await downloadReceipt(receiptData, filename);
    logger.info('Receipt downloaded successfully', { receiptId, filename });
    
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to download receipt by ID', errorInstance, { 
      receiptId, 
      stack: errorInstance.stack 
    });
    
    const receiptError = new Error(
      errorInstance.message
    ) as ReceiptDownloadError;
    
    receiptError.code = 'UNKNOWN_ERROR';
    throw receiptError;
  }
}

/**
 * Get user-friendly error message for receipt download errors
 */
export function getReceiptErrorMessage(error: ReceiptDownloadError): string {
  switch (error.code) {
    case 'RECEIPT_NOT_FOUND':
      return 'Receipt not found. Please contact support if this issue persists.';
    case 'RECEIPT_GENERATING':
      return 'Receipt is being prepared. Please try again in a moment.';
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'Failed to download receipt. Please try again or contact support.';
  }
}