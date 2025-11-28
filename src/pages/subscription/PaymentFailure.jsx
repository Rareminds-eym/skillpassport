import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, HelpCircle, ArrowLeft, Phone, Mail } from 'lucide-react';
import { extractPaymentParams } from '../../services/Subscriptions/paymentVerificationService';
import { logFailedTransaction } from '../../services/Subscriptions/paymentVerificationService';

function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Extract payment parameters and error details
  const paymentParams = useMemo(() => extractPaymentParams(searchParams), [searchParams]);
  
  const failureReason = useMemo(() => {
    return paymentParams.error_description || 
           paymentParams.error_reason || 
           searchParams.get('reason') ||
           'Payment could not be completed';
  }, [paymentParams, searchParams]);

  const errorCode = useMemo(() => {
    return paymentParams.error_code || searchParams.get('error_code') || 'PAYMENT_FAILED';
  }, [paymentParams, searchParams]);

  const transactionReference = useMemo(() => {
    return paymentParams.razorpay_order_id || 
           paymentParams.razorpay_payment_id || 
           searchParams.get('reference') ||
           `REF-${Date.now()}`;
  }, [paymentParams, searchParams]);

  // Get plan details from localStorage
  const planDetails = useMemo(() => {
    try {
      const stored = localStorage.getItem('payment_plan_details');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing plan details:', error);
      return null;
    }
  }, []);

  // Log failed transaction on mount
  useEffect(() => {
    const logFailure = async () => {
      if (paymentParams.razorpay_payment_id || paymentParams.razorpay_order_id) {
        await logFailedTransaction({
          razorpay_payment_id: paymentParams.razorpay_payment_id,
          razorpay_order_id: paymentParams.razorpay_order_id,
          amount: planDetails?.price || 0,
          currency: 'INR',
          error: failureReason,
          error_description: paymentParams.error_description
        });
      }
    };

    logFailure();
  }, [paymentParams, planDetails, failureReason]);

  // Get user-friendly error message
  const getUserFriendlyMessage = (code) => {
    const messages = {
      'BAD_REQUEST_ERROR': 'There was an issue with the payment request. Please try again.',
      'GATEWAY_ERROR': 'Payment gateway is temporarily unavailable. Please try again later.',
      'SERVER_ERROR': 'Our servers encountered an error. Please try again.',
      'PAYMENT_CANCELLED': 'You cancelled the payment.',
      'PAYMENT_FAILED': 'Payment could not be processed.',
      'INSUFFICIENT_FUNDS': 'Insufficient funds in your account.',
      'CARD_DECLINED': 'Your card was declined. Please try a different payment method.',
      'INVALID_CARD': 'Invalid card details. Please check and try again.',
      'EXPIRED_CARD': 'Your card has expired. Please use a different card.',
      'NETWORK_ERROR': 'Network connection issue. Please check your internet and try again.'
    };

    return messages[code] || 'Payment could not be completed. Please try again.';
  };

  const handleRetry = () => {
    setRetryAttempts(prev => prev + 1);
    
    // Navigate back to payment page with plan details
    if (planDetails) {
      navigate('/subscription/payment', {
        state: {
          plan: planDetails,
          studentType: planDetails.studentType || 'student',
          retryAttempt: retryAttempts + 1
        }
      });
    } else {
      navigate('/subscription/plans');
    }
  };

  const handleViewPlans = () => {
    navigate('/subscription/plans');
  };

  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  const commonIssues = [
    {
      title: 'Insufficient Funds',
      description: 'Ensure your account has sufficient balance or credit limit.'
    },
    {
      title: 'Card Details',
      description: 'Double-check your card number, expiry date, and CVV.'
    },
    {
      title: 'Network Issues',
      description: 'Check your internet connection and try again.'
    },
    {
      title: 'Bank Restrictions',
      description: 'Some banks block online transactions. Contact your bank to enable.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" role="main">
      <div className="max-w-2xl mx-auto">
        {/* Failure Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" role="article" aria-labelledby="failure-heading">
          {/* Header with error icon */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-4" role="img" aria-label="Payment failed">
              <XCircle className="w-12 h-12 text-white" aria-hidden="true" />
            </div>
            <h1 id="failure-heading" className="text-3xl font-bold text-gray-900 mb-2">Payment Unsuccessful</h1>
            <p className="text-lg text-gray-600">{getUserFriendlyMessage(errorCode)}</p>
          </div>

          {/* Error Details */}
          <div className="p-8 space-y-6">
            {/* Failure Information */}
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">What Happened?</h2>
              <p className="text-sm text-gray-700 mb-4">{failureReason}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Transaction Reference:</span>
                <span className="font-mono font-medium text-gray-900">{transactionReference}</span>
              </div>
            </div>

            {/* Retry Button (Prominent) */}
            <button
              onClick={handleRetry}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Retry payment with same plan"
            >
              <RefreshCw className="w-6 h-6" aria-hidden="true" />
              Try Payment Again
            </button>

            {/* Alternative Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="navigation" aria-label="Alternative actions">
              <button
                onClick={handleViewPlans}
                className="py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="View other subscription plans"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                View Other Plans
              </button>
              <button
                onClick={handleContactSupport}
                className="py-3 px-6 border-2 border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Contact customer support"
              >
                <HelpCircle className="w-5 h-5" aria-hidden="true" />
                Contact Support
              </button>
            </div>

            {/* Common Issues Help Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Common Issues & Solutions
              </h2>
              <div className="space-y-4">
                {commonIssues.map((issue, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{issue.title}</h3>
                      <p className="text-sm text-gray-600">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Retry Attempts Info */}
            {retryAttempts > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You've attempted payment {retryAttempts} time{retryAttempts > 1 ? 's' : ''}. 
                  If you continue to face issues, please contact support.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Having trouble? We're here to help! 
            <button 
              onClick={handleContactSupport}
              className="text-blue-600 hover:text-blue-700 font-medium ml-1"
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 id="support-modal-title" className="text-2xl font-bold text-gray-900 mb-4">Contact Support</h2>
            <p className="text-gray-600 mb-6">
              Our support team is ready to help you complete your payment.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Support</p>
                  <a href="mailto:support@rareminds.com" className="text-sm text-blue-600 hover:text-blue-700">
                    support@rareminds.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone Support</p>
                  <a href="tel:+911234567890" className="text-sm text-blue-600 hover:text-blue-700">
                    +91 123 456 7890
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Transaction Reference:</strong><br />
                <span className="font-mono text-xs">{transactionReference}</span>
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Please provide this reference when contacting support.
              </p>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-3 px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
              aria-label="Close support modal"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentFailure;
