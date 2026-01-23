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
  Check,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from '../../components/Footer';
import Header from '../../layouts/Header';
import paymentsApiService from '../../services/paymentsApiService';

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

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  const otpHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verify Your Email</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td style="padding:40px;text-align:center;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Verify Your Email</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Skill Passport Pre-Registration</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hi ${name || 'there'},</p>
              <p style="color:#374151;font-size:15px;margin:0 0 32px;line-height:1.6;">Use the verification code below to complete your pre-registration:</p>
              <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:12px;padding:24px;text-align:center;border:2px dashed #3b82f6;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
                <p style="margin:0;font-size:36px;font-weight:700;color:#1e40af;letter-spacing:8px;font-family:monospace;">${otp}</p>
              </div>
              <p style="margin:32px 0 0;color:#9ca3af;font-size:13px;text-align:center;">This code expires in 10 minutes</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const response = await fetch(EMAIL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      subject: `Your Verification Code: ${otp}`,
      html: otpHtml,
      fromName: 'Skill Passport',
    }),
  });

  if (!response.ok) throw new Error('Failed to send verification email');
  return true;
};

// Send confirmation emails
const sendConfirmationEmail = async (details) => {
  const { name, email, phone, amount, orderId, campaign } = details;

  const userHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Pre-Registration Confirmed</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td style="padding:48px 40px;text-align:center;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);">
              <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 20px;line-height:64px;">
                <span style="color:#fff;font-size:32px;">✓</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Pre-Registration Confirmed</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Welcome to Skill Passport</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hi ${name},</p>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Your payment has been received successfully. You're now pre-registered!</p>
              <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Order ID</td>
                  <td style="padding:16px 20px;color:#111827;font-size:14px;text-align:right;border-bottom:1px solid #e5e7eb;font-family:monospace;">${orderId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;font-size:14px;">Amount Paid</td>
                  <td style="padding:16px 20px;color:#1e40af;font-size:16px;text-align:right;font-weight:600;">₹${amount.toLocaleString()}</td>
                </tr>
              </table>
              
              <div style="margin-top:32px;padding:28px;background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border-radius:12px;text-align:center;border:1px solid #e2e8f0;">
                <p style="margin:0 0 20px;color:#334155;font-size:15px;font-weight:600;">Need assistance? We're here to help!</p>
                <table style="width:100%;border-collapse:separate;border-spacing:12px 0;">
                  <tr>
                    <td style="width:50%;">
                      <a href="mailto:marketing@rareminds.in" style="display:block;padding:14px 20px;background:#1e40af;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">✉️ Email Us</a>
                    </td>
                    <td style="width:50%;">
                      <a href="tel:+919562481100" style="display:block;padding:14px 20px;background:#ffffff;color:#1e40af;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;border:2px solid #1e40af;">📞 Call Us</a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Pre-Registration</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">New Pre-Registration</h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Campaign: ${campaign}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h3 style="margin:0 0 16px;color:#111827;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Contact Details</h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">Name</td>
                  <td style="padding:12px 0;color:#111827;font-size:14px;text-align:right;border-bottom:1px solid #f3f4f6;font-weight:500;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">Email</td>
                  <td style="padding:12px 0;color:#1e40af;font-size:14px;text-align:right;border-bottom:1px solid #f3f4f6;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;color:#6b7280;font-size:14px;">Phone</td>
                  <td style="padding:12px 0;color:#111827;font-size:14px;text-align:right;">${phone}</td>
                </tr>
              </table>
              
              <div style="margin-top:24px;padding:20px;background:#f9fafb;border-radius:8px;">
                <div style="display:flex;justify-content:space-between;">
                  <span style="color:#6b7280;font-size:14px;">Amount</span>
                  <span style="color:#1e40af;font-size:18px;font-weight:600;">₹${amount.toLocaleString()}</span>
                </div>
              </div>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">Order: ${orderId || 'N/A'} • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await Promise.all([
      fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Pre-Registration Confirmed - Skill Passport`,
          html: userHtml,
          fromName: 'Skill Passport',
        }),
      }),
      fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'naveen@rareminds.in',
          subject: `New Pre-Registration: ${name} (₹${amount.toLocaleString()})`,
          html: adminHtml,
          fromName: 'Skill Passport',
        }),
      }),
    ]);
  } catch (error) {
    console.error('Email error:', error);
  }
};

// Input Field Component with premium styling
const InputField = ({ label, icon: Icon, error, verified, disabled, rightElement, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} <span className="text-blue-500">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${verified ? 'text-emerald-500' : 'text-gray-400'} transition-colors`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input
        {...props}
        disabled={disabled}
        className={`
          w-full h-14 bg-white border-2 rounded-xl outline-none transition-all duration-200
          ${Icon ? 'pl-12' : 'pl-4'} ${rightElement ? 'pr-32' : 'pr-4'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
          ${verified
            ? 'border-emerald-300 bg-emerald-50/50'
            : error
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
          }
          text-gray-900 placeholder:text-gray-400 font-medium
        `}
      />
      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
      {verified && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
      )}
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 text-sm text-red-600 flex items-center gap-1"
      >
        <X className="w-4 h-4" /> {error}
      </motion.p>
    )}
  </motion.div>
);

// Terms Modal Component
const TermsModal = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
            <h3 className="text-lg font-semibold text-white">Terms & Conditions</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh] prose prose-sm">
            <h4 className="text-gray-900 font-semibold">Pre-Registration Agreement</h4>
            <p className="text-gray-600">By completing this pre-registration, you agree to the following terms:</p>
            <ul className="text-gray-600 space-y-2">
              <li>The registration fee of ₹{REGISTRATION_FEE} is non-refundable once payment is processed.</li>
              <li>Your personal information will be used solely for registration and communication purposes.</li>
              <li>You will receive email notifications regarding your registration status and upcoming events.</li>
              <li>Access to the platform and services will be provided upon successful verification.</li>
              <li>You agree to abide by our code of conduct and usage policies.</li>
            </ul>
            <h4 className="text-gray-900 font-semibold mt-4">Payment Terms</h4>
            <p className="text-gray-600">
              All payments are processed securely through Razorpay. Your payment information is encrypted
              and never stored on our servers. By proceeding with payment, you authorize the charge of
              ₹{REGISTRATION_FEE} to your chosen payment method.
            </p>
            <h4 className="text-gray-900 font-semibold mt-4">Privacy Policy</h4>
            <p className="text-gray-600">
              We are committed to protecting your privacy. Your data is handled in accordance with
              applicable data protection laws and will not be shared with third parties without your consent.
            </p>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              I Understand
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

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

  // Success View
  if (success && orderDetails) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
              {/* Success Header */}
              <div className="relative p-10 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30" />
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-white/30"
                  >
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-white"
                  >
                    Payment Successful!
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-emerald-100 mt-2"
                  >
                    Welcome to Skill Passport
                  </motion.p>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-500">Order ID</span>
                    <span className="font-mono text-sm text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{orderDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-500">Registered As</span>
                    <span className="text-gray-900 font-medium">{orderDetails.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      ₹{orderDetails.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-800">
                      Confirmation sent to <span className="font-semibold">{orderDetails.email}</span>
                    </p>
                  </div>
                </motion.div>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full h-14 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  Go to Homepage
                  <ChevronRight className="w-5 h-5" />
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-5 shadow-lg shadow-blue-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Pre-Registration
            </h1>
            <p className="text-gray-500 mt-3 max-w-sm mx-auto">
              Secure your access to Skill Passport today with our simple registration process
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10"
          >
            <div className="space-y-6">
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
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sendingOTP ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
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
                      className="mt-4 overflow-hidden"
                    >
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-800 mb-3">
                          We've sent a 6-digit code to <span className="font-semibold">{form.email}</span>
                        </p>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={otpValue}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setOtpValue(val);
                              setOtpError('');
                            }}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className="flex-1 h-12 px-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none font-mono text-lg tracking-widest text-center"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={otpValue.length !== 6 || verifyingOTP}
                            className="px-6 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {verifyingOTP ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              'Verify'
                            )}
                          </button>
                        </div>
                        {otpError && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <X className="w-4 h-4" /> {otpError}
                          </p>
                        )}
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
                      className="mt-3 flex items-center gap-2 text-emerald-600"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Email verified successfully</span>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Registration Fee</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ₹{REGISTRATION_FEE}
                </span>
              </div>
            </motion.div>

            {/* Payment Consent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => {
                      setConsentGiven(e.target.checked);
                      if (errors.consent) setErrors(prev => ({ ...prev, consent: null }));
                    }}
                    className="sr-only peer"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
                    ${consentGiven
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600'
                      : errors.consent
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}
                  >
                    {consentGiven && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-sm text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
                  >
                    Terms & Conditions
                  </button>
                  {' '}and consent to the payment of ₹{REGISTRATION_FEE} for pre-registration.
                </span>
              </label>
              {errors.consent && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> {errors.consent}
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
                  className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl"
                >
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <X className="w-5 h-5" />
                    {paymentError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handlePayment}
              disabled={loading || !emailVerified || !consentGiven}
              className="w-full h-16 mt-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-400 text-white font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 disabled:shadow-none disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Complete Pre-Registration</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex items-center justify-center gap-6"
            >
              <div className="flex items-center gap-2 text-gray-400">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm">SSL Secured</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Razorpay Protected</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Additional Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-sm text-gray-400 mt-8"
          >
            Need help?{' '}
            <a href="mailto:marketing@rareminds.in" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </a>
          </motion.p>
        </div>
      </main>

      <Footer />

      {/* Terms Modal */}
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}
