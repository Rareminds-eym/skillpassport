import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download,
  ArrowRight,
  MailCheck,
  Loader2,
  Check,
  Sparkles,
  Calendar,
  CreditCard,
  Clock,
} from 'lucide-react';
import { usePaymentVerificationFromURL } from '../../hooks/Subscription/usePaymentVerification';
import { downloadReceipt } from '../../services/Subscriptions/pdfReceiptGenerator';
import { clearPendingUserData } from '../../utils/authCleanup';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// Receipt Card with clean design
const ReceiptCard = ({ header, children }) => {
  return (
    <div className="relative pt-10">
      {/* Green checkmark circle - overlapping */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-0 z-20">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg border border-gray-100">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-inner">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Card container */}
      <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header section */}
        <div className="pt-14 pb-6 px-6 text-center bg-gradient-to-b from-gray-50 to-white">
          {header}
        </div>

        {/* Dashed divider */}
        <div className="mx-5 border-t-2 border-dashed border-gray-200" />

        {/* Content section */}
        <div className="px-5 pt-5 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [activationStatus, setActivationStatus] = useState('pending');
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [emailStatus, setEmailStatus] = useState('sending');
  const [showConfetti, setShowConfetti] = useState(false);

  const {
    status: verificationStatus,
    transactionDetails,
    error: verificationError,
    paymentParams,
    retry,
  } = usePaymentVerificationFromURL(searchParams, true);

  const planDetails = useMemo(() => {
    try {
      const stored = localStorage.getItem('payment_plan_details');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // Get amount from transaction details (database) - don't rely on localStorage
  const displayAmount = useMemo(() => {
    // transactionDetails.amount is in paise from Razorpay, convert to rupees
    if (transactionDetails?.amount) {
      return transactionDetails.amount / 100;
    }
    // Fallback to subscription plan_amount (already in rupees)
    if (subscriptionData?.plan_amount) {
      return subscriptionData.plan_amount;
    }
    // Last resort: localStorage (may be stale)
    return planDetails?.price || 0;
  }, [transactionDetails, subscriptionData, planDetails]);

  // Handle subscription activation from worker response
  useEffect(() => {
    if (verificationStatus === 'success' && transactionDetails && activationStatus === 'pending') {
      setActivationStatus('activating');
      
      // Worker now creates subscription - get it from transactionDetails
      const subscription = transactionDetails?.subscription;
      
      if (subscription) {
        setActivationStatus('activated');
        setSubscriptionData(subscription);
        
        if (!transactionDetails.already_processed) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 4000);
          clearPendingUserData();
          setTimeout(() => setEmailStatus('sent'), 2000);
        } else {
          // User already has an active subscription - show informative toast
          const message = transactionDetails.message || '';
          if (message.includes('already has an active subscription')) {
            toast.success('You already have an active subscription for this plan. Your existing subscription is still valid!', {
              duration: 5000,
              icon: '✅',
            });
          }
          clearPendingUserData();
          setEmailStatus('sent');
        }
      } else if (transactionDetails.subscription_error) {
        // Worker verified payment but failed to create subscription
        console.error('Subscription creation failed:', transactionDetails.subscription_error);
        setActivationStatus('failed');
      } else {
        // Fallback: payment verified but no subscription in response (shouldn't happen)
        setActivationStatus('activated');
        clearPendingUserData();
        setEmailStatus('sent');
      }
    }
  }, [verificationStatus, transactionDetails, activationStatus]);

  useEffect(() => {
    if (!paymentParams.razorpay_payment_id && verificationStatus !== 'loading') {
      navigate('/subscription/plans', { replace: true });
    }
  }, [paymentParams, verificationStatus, navigate]);

  useEffect(() => {
    if (verificationError?.code === 'NO_SESSION') {
      const timer = setTimeout(() => {
        if (!user) navigate(`/auth/login?redirect=${encodeURIComponent(window.location.href)}`, { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [verificationError, user, navigate]);

  const handleDownloadReceipt = async () => {
    try {
      const receiptData = {
        transaction: {
          payment_id: paymentParams.razorpay_payment_id || 'N/A',
          order_id: paymentParams.razorpay_order_id || 'N/A',
          amount: displayAmount,
          currency: 'INR',
          payment_method: transactionDetails?.payment_method || 'Card',
          payment_timestamp: formatDate(new Date()),
          status: 'Success',
        },
        subscription: subscriptionData
          ? {
              plan_type: subscriptionData.plan_type,
              billing_cycle: subscriptionData.billing_cycle,
              subscription_start_date: formatDate(subscriptionData.subscription_start_date),
              subscription_end_date: formatDate(subscriptionData.subscription_end_date),
            }
          : null,
        user: {
          name: transactionDetails?.user_name || user?.user_metadata?.full_name || 'User',
          email: transactionDetails?.user_email || user?.email || '',
          phone: user?.user_metadata?.phone || null,
        },
        company: { name: 'RareMinds', address: 'Your Company Address', taxId: 'TAX123456789' },
        generatedAt: new Date().toLocaleString(),
      };
      const filename = `Receipt-${paymentParams.razorpay_payment_id?.slice(-8) || 'payment'}-${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadReceipt(receiptData, filename);
      toast.success('Receipt downloaded!');
    } catch {
      toast.error('Failed to download receipt');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatAmount = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a);

  const getDashboardUrl = () => {
    const role = user?.user_metadata?.role || user?.raw_user_meta_data?.role;
    return { educator: '/educator/dashboard', recruiter: '/recruiter/dashboard', admin: '/admin/dashboard' }[role] || '/student/dashboard';
  };

  // Loading
  if (verificationStatus === 'loading' || activationStatus === 'activating') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-3 border-gray-200 border-t-[#2663EB] rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">{verificationStatus === 'loading' ? 'Verifying...' : 'Activating...'}</p>
        </div>
      </div>
    );
  }

  // Error
  if (verificationStatus === 'error' || verificationStatus === 'failure') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Verification Failed</h2>
          <p className="text-sm text-gray-500 mb-5">{verificationError?.message || 'Please try again'}</p>
          <button onClick={retry} className="w-full py-2.5 bg-[#2663EB] text-white rounded-lg font-medium text-sm hover:bg-[#1D4ED8]">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animation: `fall ${2 + Math.random() * 2}s ease-out forwards`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#2663EB', '#3B82F6', '#60A5FA'][Math.floor(Math.random() * 3)],
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-sm mx-auto space-y-5">
        {/* Combined Receipt Card with dark header */}
        <ReceiptCard
          header={
            <>
              <h1 className="text-xl font-medium text-gray-900 mb-3">Payment Success!</h1>
              <p className="text-3xl font-bold text-gray-900">
                {formatAmount(displayAmount)}
              </p>
            </>
          }
        >
          {/* Transaction Receipt Section */}
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[#2663EB]" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction Receipt</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span className="font-mono font-medium text-gray-900">{paymentParams.razorpay_payment_id?.slice(-10) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900">{transactionDetails?.payment_method || 'Card'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">{formatDate(new Date())}</span>
            </div>
          </div>

          {/* Subscription Section */}
          {subscriptionData && (
            <>
              <div className="my-5 border-t border-dashed border-gray-200" />
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#2663EB]" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subscription</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-semibold text-[#2663EB]">{subscriptionData.plan_type || planDetails?.name || 'Premium'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Cycle</span>
                  <span className="font-medium text-gray-900">{subscriptionData.billing_cycle || planDetails?.duration || 'Monthly'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Valid Until</span>
                  <span className="font-medium text-gray-900">{formatDate(subscriptionData.subscription_end_date)}</span>
                </div>
              </div>
            </>
          )}
        </ReceiptCard>

        {/* Email Status */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100">
          {emailStatus === 'sending' ? (
            <Loader2 className="w-5 h-5 text-[#2663EB] animate-spin" />
          ) : (
            <MailCheck className="w-5 h-5 text-emerald-500" />
          )}
          <span className="text-sm text-gray-600">
            {emailStatus === 'sending' ? 'Sending confirmation...' : 'Confirmation sent'}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => navigate(getDashboardUrl())}
            className="w-full py-3 bg-[#2663EB] text-white rounded-xl font-semibold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate('/subscription/manage')}
              className="py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Manage
            </button>
            <button
              onClick={handleDownloadReceipt}
              className="py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Receipt
            </button>
          </div>
        </div>

        {/* Help */}
        <p className="text-center text-xs text-gray-400 pt-2">
          Need help? <a href="/contact" className="text-[#2663EB] font-medium">Contact Support</a>
        </p>
      </div>

      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;
