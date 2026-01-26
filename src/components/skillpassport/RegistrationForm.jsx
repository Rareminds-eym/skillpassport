/**
 * RegistrationForm - Embedded form component for Skill Passport
 * Extracted from SimpleEventRegistration - contains only the form logic
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  ChevronRight,
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
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import OTPInput from '../OTPInput';
import paymentsApiService from '../../services/paymentsApiService';
import { ShinyButton } from '../ui/shiny-button';

const REGISTRATION_FEE = 250;
const EMAIL_API_URL = 'https://email-api.dark-mode-d021.workers.dev';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Failed to load payment gateway'));
  document.body.appendChild(script);
});

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

const sendOTPEmail = async (email, otp, name) => {
  const response = await fetch(`${EMAIL_API_URL}/event-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, name }),
  });

  if (!response.ok) throw new Error('Failed to send verification email');
  return true;
};

const sendConfirmationEmail = async (details) => {
  const { name, email, phone, amount, orderId, campaign } = details;

  try {
    const response = await fetch(`${EMAIL_API_URL}/event-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, amount, orderId, campaign }),
    });

    if (!response.ok) {
      throw new Error('Failed to send confirmation emails');
    }
  } catch (error) {
    console.error('Email error:', error);
  }
};

const InputField = ({ label, icon: Icon, error, verified, disabled, rightElement, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
      {label} <span className="text-blue-600">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 ${verified ? 'text-emerald-600' : 'text-gray-400'} transition-colors`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )}
      <input
        {...props}
        disabled={disabled}
        className={`
          w-full h-11 sm:h-12 md:h-14 bg-white border-2 rounded-xl outline-none transition-all duration-200
          ${Icon ? 'pl-10 sm:pl-11 md:pl-12' : 'pl-3 sm:pl-4'} ${rightElement ? 'pr-24 sm:pr-32' : 'pr-3 sm:pr-4'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : ''}
          ${verified
            ? 'border-emerald-400 bg-emerald-50/30 shadow-sm shadow-emerald-100'
            : error
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 shadow-sm shadow-red-100'
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm hover:shadow-md'
          }
          text-gray-900 placeholder:text-gray-400 text-sm sm:text-base
        `}
      />
      {rightElement && (
        <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
      {verified && !rightElement && (
        <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      )}
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1 font-medium"
      >
        <X className="w-3 h-3" /> {error}
      </motion.p>
    )}
  </motion.div>
);

const TermsModal = ({ isOpen, onClose, onAccept }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useCallback((node) => {
    if (node) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = node;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          setHasScrolledToBottom(true);
        }
      };
      node.addEventListener('scroll', handleScroll);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
          >
            <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-blue-600">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Terms & Conditions</h3>
              <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div ref={scrollRef} className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[55vh] sm:max-h-[60vh] prose prose-sm max-w-none">
              <h4 className="text-gray-900 font-bold text-base sm:text-lg mb-2 sm:mb-3">Pre-Registration Terms</h4>
              <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">By signing up, you agree to the following:</p>
              <ul className="text-gray-600 text-sm sm:text-base space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <li>The pre-registration fee is ₹{REGISTRATION_FEE} and cannot be refunded once paid.</li>
                <li>Your personal details will be used only for registration and official communication.</li>
                <li>You will receive emails about your registration status and upcoming updates/events.</li>
                <li>Access to the platform will be provided after successful verification.</li>
                <li>You agree to follow our code of conduct and usage rules while using the platform.</li>
              </ul>
              <h4 className="text-gray-900 font-bold text-base sm:text-lg mb-2 sm:mb-3">Payment Information</h4>
              <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                Payments are processed securely through Razorpay. Your payment details are encrypted and never stored on our servers. By making the payment, you approve the ₹{REGISTRATION_FEE} charge.
              </p>
              <h4 className="text-gray-900 font-bold text-base sm:text-lg mb-2 sm:mb-3">Privacy</h4>
              <p className="text-gray-600 text-sm sm:text-base">
                We respect your privacy and protect your data. Your information will not be shared with third parties without your consent, unless required by law.
              </p>
              {!hasScrolledToBottom && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-xs sm:text-sm text-blue-700 font-medium">Please scroll down to read all terms</p>
                </div>
              )}
            </div>
            <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  if (hasScrolledToBottom) {
                    onAccept();
                    onClose();
                  }
                }}
                disabled={!hasScrolledToBottom}
                className={`w-full py-3 sm:py-4 text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl transition-all shadow-lg min-h-[44px] ${
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

export default function RegistrationForm({ campaign = 'skill-passport' }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpError, setOtpError] = useState('');

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

    if (field === 'email') {
      setEmailVerified(false);
      setOtpSent(false);
      setOtpValue('');
      setOtpError('');
    }
  }, [errors]);

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

  // Success View
  if (success && orderDetails) {
    // Scroll to top when success view is shown
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
      <section id="registration-form" className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="relative p-6 sm:p-8 md:p-10 lg:p-12 text-center overflow-hidden bg-emerald-600">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-20" />
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
                >
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-emerald-600" strokeWidth={3} />
                </motion.div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">Payment Successful!</h2>
                <p className="text-emerald-100 text-base sm:text-lg">Welcome to Skill Passport</p>
              </div>
            </div>

            <div className="p-5 sm:p-6 md:p-8 lg:p-10">
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 py-3 sm:py-4 border-b-2 border-gray-100">
                  <span className="text-sm sm:text-base text-gray-600 font-medium">Order ID</span>
                  <span className="font-mono text-xs sm:text-sm text-gray-900 bg-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold break-all">{orderDetails.orderId}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 py-3 sm:py-4 border-b-2 border-gray-100">
                  <span className="text-sm sm:text-base text-gray-600 font-medium">Registered As</span>
                  <span className="text-sm sm:text-base text-gray-900 font-bold break-words">{orderDetails.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 py-3 sm:py-4">
                  <span className="text-sm sm:text-base text-gray-600 font-medium">Amount Paid</span>
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600">
                    ₹{orderDetails.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border-2 border-blue-100">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <p className="text-xs sm:text-sm text-blue-900 font-medium break-words">
                    Confirmation sent to <span className="font-bold">{orderDetails.email}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // Registration Form
  return (
    <section id="registration-form" className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-300 rounded-full mb-3 sm:mb-4"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center">
              <div style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
                <DotLottieReact
                  src="https://lottie.host/1689bbd3-291d-4b13-9da5-2882f580c526/7rNvhtQCvu.lottie"
                  loop
                  autoplay
                  style={{ width: '32px', height: '32px' }}
                />
              </div>
            </div>
            <span className="text-gray-900 text-sm sm:text-base font-bold">For Students Only</span>
          </motion.div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 px-4">
            Pre-Registration
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto px-4">
            Secure your access to Skill Passport today
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-6 md:p-8 lg:p-10"
        >
          <div className="space-y-4 sm:space-y-5">
            <InputField
              label="Full Name"
              icon={User}
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter your full name"
              error={errors.name}
            />

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
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5 shadow-md hover:shadow-lg disabled:shadow-none min-h-[36px] sm:min-h-[40px]"
                    >
                      {sendingOTP ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="hidden sm:inline">Sending...</span>
                          <span className="sm:hidden">...</span>
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

              <AnimatePresence>
                {otpSent && !emailVerified && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 sm:mt-3 overflow-hidden"
                  >
                    <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border-2 border-blue-100 shadow-lg">
                      <OTPInput
                        length={6}
                        email={form.email}
                        expirySeconds={600}
                        onComplete={(code) => {
                          setOtpValue(code);
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

              <AnimatePresence>
                {emailVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-semibold">Email verified successfully</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-5 sm:mt-6"
          >
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white border border-grey-200 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-grey-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative p-4 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center"
                  >
                    <div style={{ transform: 'scale(1.5) sm:scale(1.8)', transformOrigin: 'center' }}>
                      <DotLottieReact
                        src="https://lottie.host/a780779d-eba6-4a45-a35d-fa077c411c67/A719VudDmU.lottie"
                        loop
                        autoplay
                        style={{ width: '48px', height: '48px' }}
                      />
                    </div>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Registration Fee</h3>
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 sm:gap-1.5 mt-0.5">
                      <Lock className="w-3 h-3" />
                      Secure payment via Razorpay
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-200 mb-3" />

                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">Total Amount</span>
                  <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-600">₹{REGISTRATION_FEE}</span>
                </div>
              </div>

              <div className="h-1 sm:h-1.5 bg-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 sm:mt-6"
          >
            <label className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 transition-all duration-200 bg-white ${
              hasReadTerms 
                ? 'cursor-pointer group hover:border-blue-300 hover:bg-blue-50/30' 
                : 'cursor-not-allowed opacity-60'
            }`}>
              <div className="relative mt-0.5 flex-shrink-0">
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
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 transition-all duration-200 flex items-center justify-center shadow-sm
                  ${!hasReadTerms
                    ? 'border-gray-300 bg-gray-100'
                    : consentGiven
                      ? 'bg-blue-600 border-blue-600 shadow-blue-200'
                      : errors.consent
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-300 bg-white group-hover:border-blue-400'
                  }`}
                >
                  {consentGiven && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 min-h-[44px] inline-flex items-center"
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
                className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1 font-medium"
              >
                <X className="w-3 h-3" /> {errors.consent}
              </motion.p>
            )}
          </motion.div>

          <AnimatePresence>
            {paymentError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 sm:mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl shadow-sm"
              >
                <p className="text-xs sm:text-sm text-red-700 flex items-center gap-2 font-medium">
                  <X className="w-4 h-4" />
                  {paymentError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-5 sm:mt-6"
          >
            <ShinyButton
              onClick={handlePayment}
              disabled={loading || !consentGiven}
              className="w-full py-3 sm:py-4 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] sm:min-h-[56px]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Pre-register Now</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </ShinyButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-gray-500"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">SSL Secured</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gray-300" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Razorpay Protected</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs sm:text-sm text-gray-500 mt-5 sm:mt-6 px-4"
        >
          Need help?{' '}
          <a href="https://rareminds.in/contact" className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2">
            Contact Support
          </a>
        </motion.p>
      </div>

      <TermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        onAccept={() => {
          setHasReadTerms(true);
          setConsentGiven(true);
          if (errors.consent) setErrors(prev => ({ ...prev, consent: null }));
        }}
      />
    </section>
  );
}
