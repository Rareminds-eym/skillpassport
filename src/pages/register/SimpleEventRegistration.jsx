/**
 * SimpleEventRegistration - Industrial-Grade Pre-Registration Page
 * Route: /register?campaign=xxx
 * 
 * Features:
 * - Email verification with OTP
 * - Payment consent
 * - Premium styling with gradients and animations
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  User,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  formatRegistrationDate,
  isPreRegistrationActive,
  PRE_REGISTRATION_END_DATE
} from '../../config/registrationConfig';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Footer from '../../components/Footer';
import OTPInput from '../../components/OTPInput';
import Header from '../../layouts/Header';
import { supabase } from '../../lib/supabaseClient';
import paymentsApiService from '../../services/paymentsApiService';
import { ShinyButton } from '../../components/ui/shiny-button';

// Fixed registration fee
const REGISTRATION_FEE = 250;

// Email API URL - Use the email-api worker with SMTP secrets configured
const EMAIL_API_URL = 'https://email-api.dark-mode-d021.workers.dev';

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Load Razorpay script
const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Failed to load payment gateway'));
  document.body.appendChild(script);
});

// Form validation
const validateForm = (form, emailVerified, consentGiven) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  if (!form.name?.trim() || form.name.trim().length < 2) {
    errors.name = 'Please enter your full name';
  }
  if (!form.email?.trim() || !emailRegex.test(form.email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!emailVerified) {
    errors.email = 'Please verify your email address';
  }
  if (!form.phone?.trim() || !phoneRegex.test(form.phone.replace(/\D/g, ''))) {
    errors.phone = 'Please enter a valid 10-digit phone number';
  }
  if (!consentGiven) {
    errors.consent = 'Please agree to the terms and payment consent';
  }

  return errors;
};

// Send OTP email via worker
const sendOTPEmail = async (email, otp, name) => {
  const response = await fetch(`${EMAIL_API_URL}/event-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      otp,
      name,
    }),
  });

  if (!response.ok) throw new Error('Failed to send verification email');
  return true;
};

// Send confirmation emails via worker
const sendConfirmationEmail = async (details) => {
  const { name, email, phone, amount, orderId, campaign } = details;

  try {
    const response = await fetch(`${EMAIL_API_URL}/event-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        amount,
        orderId,
        campaign,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send confirmation emails');
    }
  } catch (error) {
    console.error('Email error:', error);
  }
};

// Input Field Component with compact styling
const InputField = ({ label, icon: Icon, error, verified, disabled, rightElement, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <label className="block text-sm font-semibold text-gray-800 mb-2">
      {label} <span className="text-blue-600">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${verified ? 'text-emerald-600' : 'text-gray-400'} transition-colors`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        {...props}
        disabled={disabled}
        className={`
          w-full h-12 bg-white border-2 rounded-xl outline-none transition-all duration-200
          ${Icon ? 'pl-11' : 'pl-4'} ${rightElement ? 'pr-32' : 'pr-4'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : ''}
          ${verified
            ? 'border-emerald-400 bg-emerald-50/30 shadow-sm shadow-emerald-100'
            : error
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 shadow-sm shadow-red-100'
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm hover:shadow-md'
          }
          text-gray-900 placeholder:text-gray-400 text-sm
        `}
      />
      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
      {verified && !rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
      )}
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium"
      >
        <X className="w-3 h-3" /> {error}
      </motion.p>
    )}
  </motion.div>
);

// Terms Modal Component
const TermsModal = ({ isOpen, onClose, onAccept }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useCallback((node) => {
    if (node) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = node;
        // Check if scrolled to bottom (with 10px threshold)
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          setHasScrolledToBottom(true);
        }
      };
      node.addEventListener('scroll', handleScroll);
      // Check initial state (in case content is short enough to not need scrolling)
      if (node.scrollHeight <= node.clientHeight) {
        setHasScrolledToBottom(true);
      }
      return () => node.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-blue-600">
              <h3 className="text-xl font-bold text-white">Terms & Conditions</h3>
              <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div ref={scrollRef} className="p-8 overflow-y-auto max-h-[60vh] prose prose-sm max-w-none">
              <h4 className="text-gray-900 font-bold text-lg mb-3">Pre-Registration Terms</h4>
              <p className="text-gray-600 mb-4">By signing up, you agree to the following:</p>
              <ul className="text-gray-600 space-y-3 mb-6">
                <li>The pre-registration fee is ₹{REGISTRATION_FEE} and cannot be refunded once paid.</li>
                <li>Your personal details will be used only for registration and official communication.</li>
                <li>You will receive emails about your registration status and upcoming updates/events.</li>
                <li>Access to the platform will be provided after successful verification.</li>
                <li>You agree to follow our code of conduct and usage rules while using the platform.</li>
              </ul>
              <h4 className="text-gray-900 font-bold text-lg mb-3">Payment Information</h4>
              <p className="text-gray-600 mb-6">
                Payments are processed securely through Razorpay. Your payment details are encrypted and never stored on our servers. By making the payment, you approve the ₹{REGISTRATION_FEE} charge.
              </p>
              <h4 className="text-gray-900 font-bold text-lg mb-3">Privacy</h4>
              <p className="text-gray-600">
                We respect your privacy and protect your data. Your information will not be shared with third parties without your consent, unless required by law.
              </p>
              {!hasScrolledToBottom && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-sm text-blue-700 font-medium">Please scroll down to read all terms</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  if (hasScrolledToBottom) {
                    onAccept();
                    onClose();
                  }
                }}
                disabled={!hasScrolledToBottom}
                className={`w-full py-4 font-bold rounded-2xl transition-all shadow-lg ${
                  hasScrolledToBottom
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {hasScrolledToBottom ? 'Accept' : 'Scroll to Accept'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function SimpleEventRegistration() {
  const [searchParams] = useSearchParams();
  const campaign = searchParams.get('campaign') || 'direct';

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  // Email verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Consent states
  const [consentGiven, setConsentGiven] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  useEffect(() => {
    loadRazorpay()
      .then(() => setRazorpayReady(true))
      .catch(() => setPaymentError('Payment gateway failed to load. Please refresh.'));
  }, []);

  const updateField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    setPaymentError(null);

    // Reset email verification if email changes
    if (field === 'email') {
      setEmailVerified(false);
      setOtpSent(false);
      setOtpValue('');
      setOtpError('');
    }
  }, [errors]);

  // Send OTP handler
  const handleSendOTP = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email?.trim() || !emailRegex.test(form.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    setSendingOTP(true);
    setOtpError('');

    try {
      const otp = generateOTP();
      setGeneratedOTP(otp);
      await sendOTPEmail(form.email.trim(), otp, form.name.trim());
      setOtpSent(true);
    } catch (error) {
      setOtpError('Failed to send verification code. Please try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOTP = () => {
    setVerifyingOTP(true);
    setOtpError('');

    setTimeout(() => {
      if (otpValue === generatedOTP) {
        setEmailVerified(true);
        setOtpSent(false);
      } else {
        setOtpError('Invalid verification code. Please try again.');
      }
      setVerifyingOTP(false);
    }, 500);
  };

  const handlePayment = async () => {
    const validationErrors = validateForm(form, emailVerified, consentGiven);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!razorpayReady || !window.Razorpay) {
      setPaymentError('Payment gateway is loading. Please wait.');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      // Worker handles everything: check duplicate, create/reuse registration, create order
      const orderData = await paymentsApiService.createEventOrder({
        amount: REGISTRATION_FEE * 100,
        currency: 'INR',
        planName: `Pre-Registration - ${campaign}`,
        userEmail: form.email.trim(),
        userName: form.name.trim(),
        userPhone: form.phone.replace(/\D/g, ''),
        campaign: campaign,
        origin: window.location.origin,
      }, null);

      // Worker returns registrationId (either existing or newly created)
      const registrationId = orderData.registrationId;

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Skill Passport',
        description: 'Pre-Registration Fee',
        order_id: orderData.id,
        prefill: {
          name: form.name.trim(),
          email: form.email.trim(),
          contact: form.phone.replace(/\D/g, ''),
        },
        theme: { color: '#1e40af' },
        handler: async (response) => {
          try {
            // Update payment status via worker (handles payment history)
            await paymentsApiService.updateEventPaymentStatus({
              registrationId: registrationId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              status: 'completed',
              planName: `Pre-Registration - ${campaign}`
            });

            await sendConfirmationEmail({
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.replace(/\D/g, ''),
              amount: REGISTRATION_FEE,
              orderId: response.razorpay_order_id,
              campaign,
            });

            setOrderDetails({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amount: REGISTRATION_FEE,
              email: form.email.trim(),
              name: form.name.trim(),
            });
            setSuccess(true);
          } catch (err) {
            console.error('Update error:', err);
            setOrderDetails({
              orderId: response.razorpay_order_id,
              amount: REGISTRATION_FEE,
              email: form.email.trim(),
              name: form.name.trim(),
            });
            setSuccess(true);
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', async (response) => {
        try {
          // Update payment status via worker (handles payment history)
          await paymentsApiService.updateEventPaymentStatus({
            registrationId: registrationId,
            orderId: orderData.id,
            status: 'failed',
            error: response.error?.description,
            planName: `Pre-Registration - ${campaign}`
          });
        } catch (err) {
          console.error('Failed to update payment failure:', err);
        }

        setPaymentError(response.error?.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Pre-Registration Closed View - Show when deadline has passed
  if (!isPreRegistrationActive()) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
              {/* Header */}
              <div className="relative p-10 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30" />
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-white/30"
                  >
                    <Clock className="w-10 h-10 text-white" strokeWidth={2} />
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white"
                  >
                    Pre-Registration Closed
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-amber-100 mt-2"
                  >
                    The pre-registration period has ended
                  </motion.p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    Pre-registration was available until
                  </p>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatRegistrationDate(PRE_REGISTRATION_END_DATE)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">11:59 PM IST</p>
                  </div>

                  <div className="pt-4">
                    <p className="text-gray-700 font-medium">
                      Full registration is now open!
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Create your account and get started with Skill Passport today.
                    </p>
                  </div>
                </div>

                <Link
                  to="/signup"
                  className="w-full h-14 mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  Proceed to Full Registration
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success View
  if (success && orderDetails) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              {/* Success Header */}
              <div className="relative p-12 text-center overflow-hidden bg-emerald-600">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-20" />
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                  >
                    <Check className="w-12 h-12 text-emerald-600" strokeWidth={3} />
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-white"
                  >
                    Payment Successful!
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-emerald-100 mt-3 text-lg"
                  >
                    Welcome to Skill Passport
                  </motion.p>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-10">
                <div className="space-y-5">
                  <div className="flex justify-between items-center py-4 border-b-2 border-gray-100">
                    <span className="text-gray-600 font-medium">Order ID</span>
                    <span className="font-mono text-sm text-gray-900 bg-gray-100 px-4 py-2 rounded-xl font-semibold">{orderDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b-2 border-gray-100">
                    <span className="text-gray-600 font-medium">Registered As</span>
                    <span className="text-gray-900 font-bold">{orderDetails.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="text-gray-600 font-medium">Amount Paid</span>
                    <span className="text-3xl font-bold text-emerald-600">
                      ₹{orderDetails.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 p-5 bg-blue-50 rounded-2xl border-2 border-blue-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-900 font-medium">
                      Confirmation sent to <span className="font-bold">{orderDetails.email}</span>
                    </p>
                  </div>
                </motion.div>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full h-16 mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-3"
                >
                  Go to Homepage
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            {/* Student Only Badge with Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-gray-300 rounded-full mb-4 overflow-visible"
            >
              {/* Lottie Animation - Inside pill with scale transform */}
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                <div style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
                  <DotLottieReact
                    src="https://lottie.host/1689bbd3-291d-4b13-9da5-2882f580c526/7rNvhtQCvu.lottie"
                    loop
                    autoplay
                    style={{ 
                      width: '32px', 
                      height: '32px',
                    }}
                  />
                </div>
              </div>
              
              {/* Text */}
              <span className="text-gray-900 text-base font-semibold">
                For Students Only
              </span>
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Pre-Registration
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
              Secure your access to Skill Passport today
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10"
          >
            <div className="space-y-4">
              {/* Name Field */}
              <InputField
                label="Full Name"
                icon={User}
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter your full name"
                error={errors.name}
              />

              {/* Email Field with Verification */}
              <div>
                <InputField
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.com"
                  error={errors.email}
                  verified={emailVerified}
                  disabled={emailVerified}
                  rightElement={
                    !emailVerified && (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={sendingOTP || !form.email}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:shadow-none"
                      >
                        {sendingOTP ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Sending...
                          </>
                        ) : otpSent ? (
                          'Resend'
                        ) : (
                          'Verify'
                        )}
                      </button>
                    )
                  }
                />

                {/* OTP Input */}
                <AnimatePresence>
                  {otpSent && !emailVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="p-4 bg-white rounded-xl border-2 border-blue-100 shadow-lg">
                        <OTPInput
                          length={6}
                          email={form.email}
                          expirySeconds={600}
                          onComplete={(code) => {
                            setOtpValue(code);
                            // Auto-verify when complete
                            setTimeout(() => {
                              if (code === generatedOTP) {
                                setEmailVerified(true);
                                setOtpSent(false);
                                setOtpError('');
                              } else {
                                setOtpError('Invalid verification code. Please try again.');
                              }
                            }, 500);
                          }}
                          onResend={handleSendOTP}
                          error={otpError}
                          isVerifying={verifyingOTP}
                          isSuccess={emailVerified}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Verified Badge */}
                <AnimatePresence>
                  {emailVerified && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-semibold">Email verified successfully</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Phone Field */}
              <InputField
                label="Phone Number"
                icon={Phone}
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                error={errors.phone}
              />
            </div>

            {/* Price Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-6"
            >
              <div className="relative overflow-hidden rounded-2xl bg-white border border-grey-200 shadow-md hover:shadow-lg transition-all duration-300 group">
                {/* Subtle blue overlay on hover */}
                <div className="absolute inset-0 bg-grey-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative p-5">
                  {/* Top Row: Icon + Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 flex-shrink-0 flex items-center justify-center"
                    >
                      <div style={{ transform: 'scale(1.8)', transformOrigin: 'center' }}>
                        <DotLottieReact
                          src="https://lottie.host/a780779d-eba6-4a45-a35d-fa077c411c67/A719VudDmU.lottie"
                          loop
                          autoplay
                          style={{ width: '48px', height: '48px' }}
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex-1"
                    >
                      <h3 className="text-lg font-bold text-gray-900">Registration Fee</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Lock className="w-3 h-3" />
                        Secure payment via Razorpay
                      </p>
                    </motion.div>
                  </div>

                  {/* Divider */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="h-px bg-gray-200 mb-3"
                  />

                  {/* Bottom Row: Price */}
                  <div className="flex items-center justify-between">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="text-sm font-semibold text-gray-700"
                    >
                      Total Amount
                    </motion.span>
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 150 }}
                      className="text-right"
                    >
                      <span className="text-4xl font-extrabold text-blue-600">
                        ₹{REGISTRATION_FEE}
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* Bottom accent bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="h-1.5 bg-blue-600"
                />
              </div>
            </motion.div>

            {/* Payment Consent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <label className={`flex items-start gap-3 p-4 rounded-xl border border-gray-200 transition-all duration-200 bg-white ${
                hasReadTerms 
                  ? 'cursor-pointer group hover:border-blue-300 hover:bg-blue-50/30' 
                  : 'cursor-not-allowed opacity-60'
              }`}>
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    disabled={!hasReadTerms}
                    onChange={(e) => {
                      if (hasReadTerms) {
                        setConsentGiven(e.target.checked);
                        if (errors.consent) setErrors(prev => ({ ...prev, consent: null }));
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center shadow-sm
                    ${!hasReadTerms
                      ? 'border-gray-300 bg-gray-100'
                      : consentGiven
                        ? 'bg-blue-600 border-blue-600 shadow-blue-200'
                        : errors.consent
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-300 bg-white group-hover:border-blue-400'
                    }`}
                  >
                    {consentGiven && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
                  >
                    Terms & Conditions
                  </button>
                  {' '}and consent to the payment of ₹{REGISTRATION_FEE} for pre-registration.
                  {!hasReadTerms && (
                    <span className="block mt-1 text-xs text-amber-600 font-medium">
                      Please read the Terms & Conditions first
                    </span>
                  )}
                </span>
              </label>
              {errors.consent && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs text-red-600 flex items-center gap-1 font-medium"
                >
                  <X className="w-3 h-3" /> {errors.consent}
                </motion.p>
              )}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {paymentError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm"
                >
                  <p className="text-xs text-red-700 flex items-center gap-2 font-medium">
                    <X className="w-4 h-4" />
                    {paymentError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pre-Registration Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-6 text-center"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                PRE-REGISTRATION DETAILS
              </h3>
              <p className="text-base font-semibold text-gray-800 mb-2">
                Early Access Pre-Registration
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Secure your early access to Skill Passport with a one-time pre-registration fee.
              </p>
              <div className="mb-2">
                <span className="text-sm text-gray-700">Registration Fee: </span>
                <span className="text-2xl font-bold text-blue
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Complete Pre-Registration</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </ShinyButton>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex items-center justify-center gap-6 text-gray-500"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-medium">SSL Secured</span>
              </div>
              <div className="w-px h-5 bg-gray-300" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Razorpay Protected</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Additional Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-gray-500 mt-6"
          >
            Need help?{' '}
            <a href="mailto:marketing@rareminds.in" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contact Support
            </a>
          </motion.p>
        </div>
      </main>

      <Footer />

      {/* Terms Modal */}
      <TermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        onAccept={() => {
          setHasReadTerms(true);
          setConsentGiven(true);
          if (errors.consent) setErrors(prev => ({ ...prev, consent: null }));
        }}
      />
    </div>
  );
}
