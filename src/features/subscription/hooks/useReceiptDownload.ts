/**
 * Receipt Download Hook
 * 
 * Custom hook for handling receipt downloads with loading states and error handling
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  downloadReceiptByOrderId, 
  downloadReceiptByPaymentId, 
  downloadReceiptById,
  getReceiptErrorMessage 
} from '../api/receiptService';
import type { ReceiptDownloadError } from '../types/receipt';
import { getLogger } from '@/shared/config';

const logger = getLogger('useReceiptDownload');

type ReceiptIdentifierType = 'order_id' | 'payment_id' | 'id';

interface UseReceiptDownloadOptions {
  onSuccess?: () => void;
  onError?: (error: ReceiptDownloadError) => void;
  showToast?: boolean;
}

interface UseReceiptDownloadReturn {
  isDownloading: boolean;
  downloadReceipt: (identifier: string, type: ReceiptIdentifierType) => Promise<void>;
  downloadByOrderId: (orderId: string) => Promise<void>;
  downloadByPaymentId: (paymentId: string) => Promise<void>;
  downloadById: (id: string) => Promise<void>;
  error: ReceiptDownloadError | null;
}

/**
 * Custom hook for receipt downloads with comprehensive error handling
 */
export function useReceiptDownload(options: UseReceiptDownloadOptions = {}): UseReceiptDownloadReturn {
  const { onSuccess, onError, showToast = true } = options;
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<ReceiptDownloadError | null>(null);

  const downloadReceipt = useCallback(async (identifier: string, type: ReceiptIdentifierType) => {
    // Use functional state update to avoid stale closure and prevent concurrent downloads
    let shouldProceed = false;
    setIsDownloading(prev => {
      if (prev) return prev; // Already downloading, don't proceed
      shouldProceed = true;
      return true; // Start downloading
    });
    
    if (!shouldProceed) {
      logger.warn('Download already in progress, skipping duplicate request', { identifier, type });
      return;
    }
    
    setError(null);

    try {
      logger.info('Starting receipt download', { identifier, type });

      let downloadFunction: (id: string) => Promise<void>;
      
      switch (type) {
        case 'order_id':
          downloadFunction = downloadReceiptByOrderId;
          break;
        case 'payment_id':
          downloadFunction = downloadReceiptByPaymentId;
          break;
        case 'id':
        default:
          downloadFunction = downloadReceiptById;
          break;
      }

      await downloadFunction(identifier);
      
      if (showToast) {
        toast.success('Receipt downloaded successfully!');
      }
      
      onSuccess?.();
      logger.info('Receipt download completed successfully', { identifier, type });
      
    } catch (err) {
      // Proper type narrowing with type guard
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      
      // Safely construct ReceiptDownloadError with proper type checking
      const receiptError: ReceiptDownloadError = Object.assign(
        errorInstance,
        { 
          code: (
            err instanceof Error && 
            'code' in err && 
            typeof (err as { code: unknown }).code === 'string' &&
            ['RECEIPT_NOT_FOUND', 'RECEIPT_GENERATING', 'NETWORK_ERROR', 'UNKNOWN_ERROR'].includes((err as { code: string }).code)
              ? (err as ReceiptDownloadError).code
              : 'UNKNOWN_ERROR'
          ) as ReceiptDownloadError['code']
        }
      );
      
      setError(receiptError);
      
      const errorMessage = getReceiptErrorMessage(receiptError);
      
      if (showToast) {
        if (receiptError.code === 'RECEIPT_GENERATING') {
          toast('Receipt is being prepared. Please try again in a moment.', { 
            icon: '⏳',
            duration: 4000 
          });
        } else {
          toast.error(errorMessage);
        }
      }
      
      onError?.(receiptError);
      logger.error('Receipt download failed', receiptError, { identifier, type });
    } finally {
      setIsDownloading(false);
    }
  }, [onSuccess, onError, showToast]); // Removed isDownloading to prevent infinite loop

  const downloadByOrderId = useCallback(
    (orderId: string) => downloadReceipt(orderId, 'order_id'),
    [downloadReceipt]
  );

  const downloadByPaymentId = useCallback(
    (paymentId: string) => downloadReceipt(paymentId, 'payment_id'),
    [downloadReceipt]
  );

  const downloadById = useCallback(
    (id: string) => downloadReceipt(id, 'id'),
    [downloadReceipt]
  );

  return {
    isDownloading,
    downloadReceipt,
    downloadByOrderId,
    downloadByPaymentId,
    downloadById,
    error
  };
}

/**
 * Hook specifically for payment success page
 */
export function usePaymentSuccessReceipt() {
  return useReceiptDownload({
    showToast: true,
    onSuccess: () => {
      logger.info('Payment success receipt downloaded');
    },
    onError: (error) => {
      logger.error('Payment success receipt download failed', error);
    }
  });
}

/**
 * Hook specifically for subscription dashboard
 */
export function useSubscriptionDashboardReceipt() {
  return useReceiptDownload({
    showToast: true,
    onSuccess: () => {
      logger.info('Dashboard receipt downloaded');
    },
    onError: (error) => {
      logger.error('Dashboard receipt download failed', error);
    }
  });
}