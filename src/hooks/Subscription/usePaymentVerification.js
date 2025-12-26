/**
 * usePaymentVerification Hook
 * Custom hook for handling payment verification with state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  verifyPaymentSignature,
  validatePaymentParams,
  extractPaymentParams
} from '../../services/Subscriptions/paymentVerificationService';

/**
 * Custom hook for payment verification
 * @param {Object} params - Payment parameters
 * @param {string} params.paymentId - Razorpay payment ID
 * @param {string} params.orderId - Razorpay order ID
 * @param {string} params.signature - Razorpay signature
 * @param {boolean} params.autoVerify - Whether to verify automatically on mount
 * @returns {Object} Verification state and methods
 */
export const usePaymentVerification = ({
  paymentId,
  orderId,
  signature,
  autoVerify = true
}) => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'failure' | 'error'
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  
  const verificationStartTime = useRef(null);
  const timeoutRef = useRef(null);
  const hasVerified = useRef(false);

  /**
   * Verify payment with timeout handling
   */
  const verify = useCallback(async () => {
    // Prevent duplicate verifications
    if (hasVerified.current && status === 'success') {
      console.log('⚠️ Payment already verified, skipping duplicate verification');
      return;
    }

    setStatus('loading');
    setError(null);
    verificationStartTime.current = Date.now();
    setVerificationAttempts(prev => prev + 1);

    try {
      // Validate parameters first
      const validation = validatePaymentParams({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature
      });

      if (!validation.isValid) {
        setStatus('error');
        setError({
          message: validation.errors.join(', '),
          code: 'INVALID_PARAMETERS'
        });
        return;
      }

      // Set timeout for verification (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Verification timeout'));
        }, 10000);
      });

      // Get plan details from localStorage for subscription creation
      let plan = null;
      try {
        const stored = localStorage.getItem('payment_plan_details');
        if (stored) {
          const planDetails = JSON.parse(stored);
          plan = {
            name: planDetails.name,
            price: planDetails.price,
            duration: planDetails.duration,
          };
        }
      } catch (e) {
        console.warn('Could not parse plan details from localStorage');
      }

      // Verify payment - Worker now creates subscription too
      const verificationPromise = verifyPaymentSignature({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        plan, // Pass plan for subscription creation
      });

      const result = await Promise.race([verificationPromise, timeoutPromise]);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const verificationTime = Date.now() - verificationStartTime.current;
      console.log(`✅ Verification completed in ${verificationTime}ms`);

      if (result.success && result.verified) {
        setStatus('success');
        setTransactionDetails(result);
        hasVerified.current = true;
      } else {
        setStatus('failure');
        setError({
          message: result.error || 'Payment verification failed',
          code: result.errorCode || 'VERIFICATION_FAILED'
        });
      }

    } catch (err) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const verificationTime = Date.now() - verificationStartTime.current;

      if (err.message === 'Verification timeout') {
        console.error('❌ Verification timeout after', verificationTime, 'ms');
        setStatus('error');
        setError({
          message: 'Verification is taking longer than expected. Please try again.',
          code: 'TIMEOUT',
          canRetry: true
        });
      } else {
        console.error('❌ Verification error:', err);
        setStatus('error');
        setError({
          message: err.message || 'An error occurred during verification',
          code: 'VERIFICATION_ERROR',
          canRetry: true
        });
      }
    }
  }, [paymentId, orderId, signature, status]);

  /**
   * Retry verification
   */
  const retry = useCallback(() => {
    hasVerified.current = false;
    verify();
  }, [verify]);

  /**
   * Reset verification state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setTransactionDetails(null);
    setError(null);
    setVerificationAttempts(0);
    hasVerified.current = false;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Auto-verify on mount if enabled
  useEffect(() => {
    if (autoVerify && paymentId && orderId && signature && !hasVerified.current && status === 'idle') {
      verify();
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoVerify, paymentId, orderId, signature, verify, status]);

  return {
    status,
    transactionDetails,
    error,
    verificationAttempts,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isFailure: status === 'failure',
    isError: status === 'error',
    verify,
    retry,
    reset
  };
};

/**
 * Hook to extract and verify payment from URL parameters
 * @param {URLSearchParams} searchParams - URL search parameters
 * @param {boolean} autoVerify - Whether to verify automatically
 * @returns {Object} Verification state and payment params
 */
export const usePaymentVerificationFromURL = (searchParams, autoVerify = true) => {
  const params = extractPaymentParams(searchParams);
  
  const verification = usePaymentVerification({
    paymentId: params.razorpay_payment_id,
    orderId: params.razorpay_order_id,
    signature: params.razorpay_signature,
    autoVerify
  });

  return {
    ...verification,
    paymentParams: params
  };
};

export default usePaymentVerification;
