/**
 * Receipt Download Hook
 * 
 * Custom hook for handling receipt downloads with loading states and error handling
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  downloadReceiptByOrderId, 
  downloadReceiptByPaymentId, 
  downloadReceiptById,
  getReceiptErrorMessage 
} from '../api/receiptService';
import { ReceiptDownloadError, type ReceiptDownloadErrorCode } from '../types/receipt';
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
  
  // Use a ref to track in-flight requests to prevent race conditions
  const inFlightRef = useRef(false);

  // Cleanup effect to reset state on unmount
  useEffect(() => {
    return () => {
      // Reset both ref and state on unmount to prevent stale state
      inFlightRef.current = false;
      setIsDownloading(false);
    };
  }, []);

  const downloadReceipt = useCallback(async (identifier: string, type: ReceiptIdentifierType) => {
    // Check if a download is already in progress using ref
    if (inFlightRef.current) {
      logger.warn('Download already in progress, skipping duplicate request', { identifier, type });
      return;
    }
    
    // Mark as in-flight
    inFlightRef.current = true;
    setIsDownloading(true);
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
      // Extract error code from caught error if available
      let errorCode: ReceiptDownloadErrorCode = 'UNKNOWN_ERROR';

      if (err instanceof Error && 'code' in err) {
        const code = (err as { code: unknown }).code;
        if (typeof code === 'string' && ['RECEIPT_NOT_FOUND', 'RECEIPT_GENERATING', 'NETWORK_ERROR', 'UNKNOWN_ERROR'].includes(code)) {
          errorCode = code as ReceiptDownloadErrorCode;
        }
      }

      // Create proper ReceiptDownloadError instance
      const rawErrorMessage = err instanceof Error ? err.message : String(err);
      const receiptError = new ReceiptDownloadError(rawErrorMessage, errorCode);

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
      // Always reset both ref and state
      inFlightRef.current = false;
      setIsDownloading(false);
    }
  }, [onSuccess, onError, showToast]);

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
  const options = useMemo(() => ({
    showToast: true,
    onSuccess: () => {
      logger.info('Payment success receipt downloaded');
    },
    onError: (error: ReceiptDownloadError) => {
      logger.error('Payment success receipt download failed', error);
    }
  }), []);
  
  return useReceiptDownload(options);
}

/**
 * Hook specifically for subscription dashboard
 */
export function useSubscriptionDashboardReceipt() {
  const options = useMemo(() => ({
    showToast: true,
    onSuccess: () => {
      logger.info('Dashboard receipt downloaded');
    },
    onError: (error: ReceiptDownloadError) => {
      logger.error('Dashboard receipt download failed', error);
    }
  }), []);
  
  return useReceiptDownload(options);
}