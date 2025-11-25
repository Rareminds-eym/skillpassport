import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, ArrowRight, Mail, MailCheck, Loader2 } from 'lucide-react';
import { usePaymentVerificationFromURL } from '../../hooks/Subscription/usePaymentVerification';
import { activateSubscription } from '../../services/Subscriptions/subscriptionActivationService';
import useAuth from '../../hooks/useAuth';
import { SuccessHeader, ReceiptCard } from '../../components/Subscription';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [activationStatus, setActivationStatus] = useState('pending'); // 'pending' | 'activating' | 'activated' | 'failed'
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [emailStatus, setEmailStatus] = useState('sending'); // 'sending' | 'sent' | 'failed'
  const [showConfetti, setShowConfetti] = useState(false);

  // Verify payment from URL parameters
  const {
    status: verificationStatus,
    transactionDetails,
    error: verificationError,
    paymentParams,
    retry
  } = usePaymentVerificationFromURL(searchParams, true);

  // Get plan details from localStorage (set during payment initiation)
  const planDetails = useMemo(() => {
    try {
      const stored = localStorage.getItem('payment_plan_details');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing plan details:', error);
      return null;
    }
  }, []);

  // Activate subscription when verification succeeds
  useEffect(() => {
    const activateSubscriptionOnSuccess = async () => {
      if (verificationStatus === 'success' && transactionDetails && activationStatus === 'pending') {
        setActivationStatus('activating');

        try {
          const result = await activateSubscription({
            plan: planDetails,
            userDetails: {
              name: transactionDetails?.user_name || user?.user_metadata?.full_name || user?.email || 'User',
              email: transactionDetails?.user_email || user?.email || '',
              phone: user?.user_metadata?.phone || null,
              studentType: planDetails?.studentType || 'student'
            },
            paymentData: {
              razorpay_payment_id: paymentParams.razorpay_payment_id,
              razorpay_order_id: paymentParams.razorpay_order_id
            },
            transactionDetails
          });

          if (result.success) {
            setActivationStatus('activated');
            setSubscriptionData(result.data.subscription);
            setShowConfetti(true);
            
            // Clear plan details from localStorage
            localStorage.removeItem('payment_plan_details');

            // Simulate email sending (replace with actual email service)
            setTimeout(() => {
              setEmailStatus('sent');
            }, 2000);

            // Hide confetti after 3 seconds
            setTimeout(() => {
              setShowConfetti(false);
            }, 3000);
          } else {
            setActivationStatus('failed');
            console.error('Subscription activation failed:', result.error);
          }
        } catch (error) {
          setActivationStatus('failed');
          console.error('Error activating subscription:', error);
        }
      }
    };

    activateSubscriptionOnSuccess();
  }, [verificationStatus, transactionDetails, activationStatus, paymentParams, planDetails, user]);

  // Redirect if no payment parameters
  useEffect(() => {
    if (!paymentParams.razorpay_payment_id && verificationStatus !== 'loading') {
      navigate('/subscription/plans', { replace: true });
    }
  }, [paymentParams, verificationStatus, navigate]);

  // Redirect to login if not authenticated after verification attempts
  useEffect(() => {
    if (verificationError?.code === 'NO_SESSION') {
      // Give a moment for auth to load before redirecting
      const timer = setTimeout(() => {
        if (!user) {
          const currentUrl = window.location.href;
          navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [verificationError, user, navigate]);

  const handleResendEmail = async () => {
    setEmailStatus('sending');
    // TODO: Implement email resend logic
    setTimeout(() => {
      setEmailStatus('sent');
    }, 1500);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Loading state
  if (verificationStatus === 'loading' || activationStatus === 'activating') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {verificationStatus === 'loading' ? 'Verifying your payment...' : 'Activating your subscription...'}
          </h2>
          <p className="text-gray-600">This usually takes a few seconds</p>
          <span className="sr-only">
            {verificationStatus === 'loading' ? 'Verifying payment, please wait' : 'Activating subscription, please wait'}
          </span>
        </div>
      </div>
    );
  }

  // Verification error state
  if (verificationStatus === 'error' || verificationStatus === 'failure') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">
            {verificationError?.message || 'We couldn\'t verify your payment. Please try again.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={retry}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Retry Verification
            </button>
            <button
              onClick={() => navigate('/subscription/plans')}
              className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" role="main">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
          <div className="confetti-animation">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="mb-6">
          <SuccessHeader 
            title="Payment Success!" 
            subtitle="Your payment has been successfully done"
          />
        </div>

        {/* Receipt Card */}
        <ReceiptCard
          totalAmount={formatAmount(planDetails?.price || transactionDetails?.amount || 0)}
          transactionDetails={{
            referenceNumber: paymentParams.razorpay_payment_id || 'N/A',
            paymentTime: formatDate(new Date()),
            paymentMethod: transactionDetails?.payment_method || 'Card',
            senderName: transactionDetails?.user_name || user?.user_metadata?.full_name || user?.email || 'User'
          }}
        >
          {/* Subscription Details */}
          {subscriptionData && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Plan</dt>
                  <dd className="text-sm font-medium text-gray-900">{subscriptionData.plan_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Duration</dt>
                  <dd className="text-sm font-medium text-gray-900">{subscriptionData.billing_cycle}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Start Date</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatDate(subscriptionData.subscription_start_date)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">End Date</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatDate(subscriptionData.subscription_end_date)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Email Confirmation Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {emailStatus === 'sending' ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : emailStatus === 'sent' ? (
                <MailCheck className="w-5 h-5 text-green-600" />
              ) : (
                <Mail className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {emailStatus === 'sending' ? 'Sending confirmation email...' : 
                   emailStatus === 'sent' ? 'Confirmation email sent' : 
                   'Email not sent'}
                </p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
            </div>
            {emailStatus === 'failed' && (
              <button
                onClick={handleResendEmail}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Resend
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3" role="navigation" aria-label="Post-payment actions">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Go to your dashboard"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => navigate('/subscription/manage')}
                className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Manage your subscription"
              >
                Manage Subscription
              </button>
              <button
                onClick={() => window.print()}
                className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Download payment receipt"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                Download Receipt
              </button>
            </div>
        </ReceiptCard>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need help? <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support</a></p>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }

        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: confetti-fall 3s linear forwards;
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;
