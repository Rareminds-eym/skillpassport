import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, ArrowRight, Mail, MailCheck, Loader2 } from 'lucide-react';
import { usePaymentVerificationFromURL } from '../../hooks/Subscription/usePaymentVerification';
import { activateSubscription } from '../../services/Subscriptions/subscriptionActivationService';
import { downloadReceipt } from '../../services/Subscriptions/pdfReceiptGenerator';
import useAuth from '../../hooks/useAuth';
import { SuccessHeader, ReceiptCard, SubscriptionDetails } from '../../components/Subscription';
import toast from 'react-hot-toast';

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
            
            // Only show confetti for new activations, not when subscription already exists
            if (!result.data.alreadyExists) {
              setShowConfetti(true);
              
              // Hide confetti after 3 seconds
              setTimeout(() => {
                setShowConfetti(false);
              }, 3000);
            }
            
            // Clear plan details from localStorage only on first activation
            if (!result.data.alreadyExists) {
              localStorage.removeItem('payment_plan_details');
            }

            // Simulate email sending (replace with actual email service)
            // Skip if subscription already existed
            if (!result.data.alreadyExists) {
              setTimeout(() => {
                setEmailStatus('sent');
              }, 2000);
            } else {
              setEmailStatus('sent'); // Already sent previously
            }
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

  const handleDownloadReceipt = async () => {
    try {
      // Prepare receipt data
      const receiptData = {
        transaction: {
          payment_id: paymentParams.razorpay_payment_id || 'N/A',
          order_id: paymentParams.razorpay_order_id || 'N/A',
          amount: planDetails?.price || transactionDetails?.amount || 0,
          currency: 'INR',
          payment_method: transactionDetails?.payment_method || 'Card',
          payment_timestamp: formatDate(new Date()),
          status: 'Success'
        },
        subscription: subscriptionData ? {
          plan_type: subscriptionData.plan_type,
          billing_cycle: subscriptionData.billing_cycle,
          subscription_start_date: formatDate(subscriptionData.subscription_start_date),
          subscription_end_date: formatDate(subscriptionData.subscription_end_date)
        } : null,
        user: {
          name: transactionDetails?.user_name || user?.user_metadata?.full_name || user?.email || 'User',
          email: transactionDetails?.user_email || user?.email || '',
          phone: user?.user_metadata?.phone || null
        },
        company: {
          name: 'RareMinds',
          address: 'Your Company Address Here',
          taxId: 'TAX123456789'
        },
        generatedAt: new Date().toLocaleString()
      };

      // Generate descriptive filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `RareMinds-Receipt-${paymentParams.razorpay_payment_id?.slice(-8) || 'payment'}-${timestamp}.pdf`;

      await downloadReceipt(receiptData, filename);
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt. Please try again.');
    }
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

  // Get role-based dashboard URL
  const getDashboardUrl = () => {
    const { role } = user?.user_metadata || {};
    const metaRole = user?.raw_user_meta_data?.role;
    const userRole = role || metaRole;

    switch (userRole) {
      case 'educator':
        return '/educator/dashboard';
      case 'recruiter':
        return '/recruiter/dashboard';
      case 'student':
        return '/student/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        // Default to student dashboard if role is not specified
        return '/student/dashboard';
    }
  };

  // Loading state
  if (verificationStatus === 'loading' || activationStatus === 'activating') {
    return (
      <div 
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4" 
        role="status" 
        aria-live="polite"
        aria-busy="true"
      >
        <div className="text-center">
          <Loader2 
            className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" 
            aria-hidden="true" 
            role="presentation"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {verificationStatus === 'loading' ? 'Verifying your payment...' : 'Activating your subscription...'}
          </h2>
          <p className="text-gray-600">This usually takes a few seconds</p>
          <span className="sr-only" aria-live="assertive" role="alert">
            {verificationStatus === 'loading' ? 'Verifying payment, please wait' : 'Activating subscription, please wait'}
          </span>
        </div>
      </div>
    );
  }

  // Verification error state
  if (verificationStatus === 'error' || verificationStatus === 'failure') {
    return (
      <div 
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div 
            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            role="img"
            aria-label="Error icon"
          >
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">
            {verificationError?.message || 'We couldn\'t verify your payment. Please try again.'}
          </p>
          <div className="space-y-3" role="navigation" aria-label="Error recovery options">
            <button
              onClick={retry}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2"
              aria-label="Retry payment verification"
            >
              Retry Verification
            </button>
            <button
              onClick={() => navigate('/subscription/plans')}
              className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-offset-2"
              aria-label="Go back to subscription plans"
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
      {/* Screen reader announcement for success */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {activationStatus === 'activated' && 'Payment successful. Your subscription has been activated.'}
      </div>

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
        {/* Receipt Card with integrated success header */}
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
            <SubscriptionDetails
              planType={subscriptionData.plan_type}
              billingCycle={subscriptionData.billing_cycle}
              startDate={formatDate(subscriptionData.subscription_start_date)}
              endDate={formatDate(subscriptionData.subscription_end_date)}
            />
          )}

          {/* Email Confirmation Status */}
          <div 
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-center gap-3">
              {emailStatus === 'sending' ? (
                <Loader2 
                  className="w-5 h-5 text-blue-600 animate-spin" 
                  aria-hidden="true"
                  role="presentation"
                />
              ) : emailStatus === 'sent' ? (
                <MailCheck 
                  className="w-5 h-5 text-green-600" 
                  aria-hidden="true"
                  role="img"
                  aria-label="Email sent successfully"
                />
              ) : (
                <Mail 
                  className="w-5 h-5 text-gray-400" 
                  aria-hidden="true"
                  role="img"
                  aria-label="Email status"
                />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {emailStatus === 'sending' ? 'Sending confirmation email...' : 
                   emailStatus === 'sent' ? 'Confirmation email sent' : 
                   'Email not sent'}
                </p>
                <p className="text-xs text-gray-600" aria-label={`Email address: ${user?.email}`}>
                  {user?.email}
                </p>
              </div>
            </div>
            {emailStatus === 'failed' && (
              <button
                onClick={handleResendEmail}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                aria-label="Resend confirmation email"
              >
                Resend
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6" role="navigation" aria-label="Post-payment actions">
            {/* Primary Action - Go to Dashboard */}
            <button
              onClick={() => navigate(getDashboardUrl())}
              className="w-full py-4 px-6 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2"
              aria-label="Go to your dashboard"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/subscription/manage')}
                className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label="Manage your subscription"
              >
                Manage Subscription
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label="Download payment receipt as PDF"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                Get PDF Receipt
              </button>
            </div>
          </div>
        </ReceiptCard>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need help? <a 
            href="/contact" 
            className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded underline"
            aria-label="Contact support for help"
          >Contact Support</a></p>
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
