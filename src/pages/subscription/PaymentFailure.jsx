import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  XCircle, 
  RefreshCw, 
  HelpCircle, 
  ArrowLeft, 
  Phone, 
  Mail,
  AlertTriangle,
  CreditCard,
  Wifi,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { extractPaymentParams, logFailedTransaction } from '../../services/Subscriptions/paymentVerificationService';
import useAuth from '../../hooks/useAuth';

// Issue Card Component
const IssueCard = ({ icon: Icon, title, description, index }) => (
  <div className="flex gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all">
    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center">
      <Icon className="w-5 h-5 text-indigo-600" />
    </div>
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-0.5">{description}</p>
    </div>
  </div>
);

function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role } = useAuth();
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [showSupportModal, setShowSupportModal] = useState(false);

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

  const planDetails = useMemo(() => {
    try {
      const stored = localStorage.getItem('payment_plan_details');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }, []);

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
    if (planDetails) {
      navigate('/subscription/payment', {
        state: {
          plan: planDetails,
          studentType: planDetails.studentType || 'student',
          retryAttempt: retryAttempts + 1
        }
      });
    } else {
      // Include user role type for proper plan display
      const userType = role || planDetails?.studentType || 'student';
      navigate(`/subscription/plans?type=${userType}`);
    }
  };

  const commonIssues = [
    { icon: CreditCard, title: 'Insufficient Funds', description: 'Ensure your account has sufficient balance or credit limit.' },
    { icon: ShieldAlert, title: 'Card Details', description: 'Double-check your card number, expiry date, and CVV.' },
    { icon: Wifi, title: 'Network Issues', description: 'Check your internet connection and try again.' },
    { icon: Building2, title: 'Bank Restrictions', description: 'Some banks block online transactions. Contact your bank.' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Failure Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 p-8 text-center text-white">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <XCircle className="w-14 h-14 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Unsuccessful</h1>
            <p className="text-red-100">{getUserFriendlyMessage(errorCode)}</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Error Details */}
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">What Happened?</h3>
                  <p className="text-sm text-slate-600 mb-3">{failureReason}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Reference:</span>
                    <code className="px-2 py-1 bg-white rounded font-mono text-slate-700">{transactionReference.slice(-12)}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Retry Button */}
            <button
              onClick={handleRetry}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-3 text-lg"
            >
              <RefreshCw className="w-6 h-6" />
              Try Payment Again
            </button>

            {/* Alternative Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const userType = role || planDetails?.studentType || 'student';
                  navigate(`/subscription/plans?type=${userType}`);
                }}
                className="py-3 px-4 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                View Plans
              </button>
              <button
                onClick={() => setShowSupportModal(true)}
                className="py-3 px-4 border-2 border-indigo-200 text-indigo-700 rounded-xl font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                Get Help
              </button>
            </div>

            {/* Common Issues */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                Common Issues & Solutions
              </h3>
              <div className="grid gap-3">
                {commonIssues.map((issue, index) => (
                  <IssueCard key={index} {...issue} index={index} />
                ))}
              </div>
            </div>

            {/* Retry Warning */}
            {retryAttempts > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  You've attempted payment {retryAttempts} time{retryAttempts > 1 ? 's' : ''}. 
                  If issues persist, please contact support.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Having trouble? <button onClick={() => setShowSupportModal(true)} className="text-indigo-600 font-medium hover:text-indigo-700">Contact Support</button>
        </p>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Contact Support</h2>
              <p className="text-slate-500 mt-2">Our team is ready to help you</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <a 
                href="mailto:support@rareminds.com" 
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <Mail className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Email Support</p>
                  <p className="text-sm text-indigo-600">support@rareminds.com</p>
                </div>
              </a>
              
              <a 
                href="tel:+911234567890" 
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <Phone className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Phone Support</p>
                  <p className="text-sm text-indigo-600">+91 123 456 7890</p>
                </div>
              </a>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-indigo-700 font-medium mb-1">Transaction Reference</p>
              <code className="text-sm font-mono text-indigo-900 break-all">{transactionReference}</code>
              <p className="text-xs text-indigo-600 mt-2">Please share this when contacting support</p>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-4 px-6 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
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
