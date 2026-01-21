/**
 * SimpleEventRegistration - Professional, minimalistic event registration
 * Route: /register?campaign=xxx
 *
 * Design: Clean, modern, professional
 * Colors: White, Blue (accent), Red (errors only)
 */

import { Check, Loader2, Mail, Minus, Phone, Plus, Shield, User, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from '../../components/Footer';
import Header from '../../layouts/Header';
import { supabase } from '../../lib/supabaseClient';
import paymentsApiService from '../../services/paymentsApiService';

// Fixed price per student
const PRICE_PER_STUDENT = 250;

// Email API URL
const EMAIL_API_URL =
  import.meta.env.VITE_EMAIL_API_URL || 'https://email-api.dark-mode-d021.workers.dev';

// Load Razorpay script
const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load payment gateway'));
    document.body.appendChild(script);
  });

// Form validation
const validateForm = (form) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  if (!form.name?.trim() || form.name.trim().length < 2) {
    errors.name = 'Please enter your full name';
  }
  if (!form.email?.trim() || !emailRegex.test(form.email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!form.phone?.trim() || !phoneRegex.test(form.phone.replace(/\D/g, ''))) {
    errors.phone = 'Please enter a valid 10-digit phone number';
  }
  if (!form.quantity || form.quantity < 1) {
    errors.quantity = 'Minimum 1 student required';
  }
  if (form.quantity > 100) {
    errors.quantity = 'Maximum 100 students per registration';
  }

  return errors;
};

// Send confirmation emails
const sendConfirmationEmail = async (details) => {
  const { name, email, phone, amount, students, orderId, campaign } = details;

  const userHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Registration Confirmed</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:48px 40px;text-align:center;border-bottom:1px solid #e5e7eb;">
              <div style="width:56px;height:56px;background:#2563eb;border-radius:50%;margin:0 auto 20px;line-height:56px;">
                <span style="color:#fff;font-size:24px;">✓</span>
              </div>
              <h1 style="margin:0;color:#111827;font-size:24px;font-weight:600;">Registration Confirmed</h1>
              <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Thank you for registering with us</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Hi ${name},</p>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">Your payment has been received successfully. Here are your registration details:</p>
              <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Order ID</td>
                  <td style="padding:16px 20px;color:#111827;font-size:14px;text-align:right;border-bottom:1px solid #e5e7eb;font-family:monospace;">${orderId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Students</td>
                  <td style="padding:16px 20px;color:#111827;font-size:14px;text-align:right;border-bottom:1px solid #e5e7eb;">${students}</td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;font-size:14px;">Amount Paid</td>
                  <td style="padding:16px 20px;color:#2563eb;font-size:14px;text-align:right;font-weight:600;">₹${amount.toLocaleString()}</td>
                </tr>
              </table>
              
              <!-- Contact Section -->
              <div style="margin-top:32px;padding:28px;background:#f8fafc;border-radius:12px;text-align:center;border:1px solid #e2e8f0;">
                <p style="margin:0 0 20px;color:#334155;font-size:15px;font-weight:600;">Need assistance? We're here to help!</p>
                <table style="width:100%;border-collapse:separate;border-spacing:12px 0;">
                  <tr>
                    <td style="width:50%;">
                      <a href="mailto:marketing@rareminds.in" style="display:block;padding:14px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;box-shadow:0 1px 2px rgba(37,99,235,0.2);">
                        <span style="display:block;font-size:18px;margin-bottom:4px;">✉️</span>
                        Email Us
                      </a>
                    </td>
                    <td style="width:50%;">
                      <a href="tel:+919562481100" style="display:block;padding:14px 20px;background:#ffffff;color:#2563eb;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;border:2px solid #2563eb;">
                        <span style="display:block;font-size:18px;margin-bottom:4px;">📞</span>
                        Call Us
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                  <strong style="color:#475569;">marketing@rareminds.in</strong><br>
                  <strong style="color:#475569;">+91 95624 81100</strong>
                </p>
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
<head><meta charset="utf-8"><title>New Registration</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table style="width:100%;max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:32px 40px;background:#2563eb;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">New Registration</h1>
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
                  <td style="padding:12px 0;color:#2563eb;font-size:14px;text-align:right;border-bottom:1px solid #f3f4f6;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;color:#6b7280;font-size:14px;">Phone</td>
                  <td style="padding:12px 0;color:#111827;font-size:14px;text-align:right;">${phone}</td>
                </tr>
              </table>
              
              <h3 style="margin:32px 0 16px;color:#111827;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Payment Details</h3>
              <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;font-size:14px;">Students</td>
                  <td style="padding:16px 20px;color:#111827;font-size:14px;text-align:right;font-weight:600;">${students}</td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;font-size:14px;border-top:1px solid #e5e7eb;">Amount</td>
                  <td style="padding:16px 20px;color:#2563eb;font-size:16px;text-align:right;font-weight:600;border-top:1px solid #e5e7eb;">₹${amount.toLocaleString()}</td>
                </tr>
              </table>
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
          subject: `Registration Confirmed - ${students} Student${students > 1 ? 's' : ''}`,
          html: userHtml,
          fromName: 'Skill Passport',
        }),
      }),
      fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'naveen@rareminds.in',
          subject: `New Registration: ${name} - ${students} Student${students > 1 ? 's' : ''} (₹${amount.toLocaleString()})`,
          html: adminHtml,
          fromName: 'Skill Passport',
        }),
      }),
    ]);
  } catch (error) {
    console.error('Email error:', error);
  }
};

// Input Field Component
const InputField = ({ label, icon: Icon, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input
        {...props}
        className={`
          w-full h-12 bg-white border rounded-lg outline-none transition-all
          ${Icon ? 'pl-12' : 'pl-4'} pr-4
          ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          }
          text-gray-900 placeholder:text-gray-400
        `}
      />
    </div>
    {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
  </div>
);

export default function SimpleEventRegistration() {
  const [searchParams] = useSearchParams();
  const campaign = searchParams.get('campaign') || 'direct';

  const [form, setForm] = useState({ name: '', email: '', phone: '', quantity: 1 });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    loadRazorpay()
      .then(() => setRazorpayReady(true))
      .catch(() => setPaymentError('Payment gateway failed to load. Please refresh.'));
  }, []);

  const totalPrice = form.quantity * PRICE_PER_STUDENT;

  const updateField = useCallback(
    (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
      setPaymentError(null);
    },
    [errors]
  );

  const handlePayment = async () => {
    const validationErrors = validateForm(form);
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
      const registrationData = {
        full_name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\D/g, ''),
        student_count: form.quantity,
        price_per_student: PRICE_PER_STUDENT,
        plan_amount: totalPrice,
        plan_type: 'Social Media Campaign',
        role_type: 'social_media_lead',
        event_name: campaign,
        payment_status: 'pending',
      };

      const { data: registration, error: insertError } = await supabase
        .from('event_registrations')
        .insert(registrationData)
        .select()
        .single();

      if (insertError) throw insertError;

      const orderData = await paymentsApiService.createEventOrder({
        amount: totalPrice * 100,
        currency: 'INR',
        registrationId: registration.id,
        planName: `Event Registration - ${campaign}`,
        userEmail: form.email.trim(),
        userName: form.name.trim(),
        origin: window.location.origin,
      });

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Skill Passport',
        description: `${form.quantity} Student${form.quantity > 1 ? 's' : ''} Registration`,
        order_id: orderData.id,
        prefill: {
          name: form.name.trim(),
          email: form.email.trim(),
          contact: form.phone.replace(/\D/g, ''),
        },
        theme: { color: '#2563EB' },
        handler: async (response) => {
          try {
            await supabase
              .from('event_registrations')
              .update({
                payment_status: 'completed',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              })
              .eq('id', registration.id);

            await sendConfirmationEmail({
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.replace(/\D/g, ''),
              amount: totalPrice,
              students: form.quantity,
              orderId: response.razorpay_order_id,
              campaign,
            });

            setOrderDetails({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amount: totalPrice,
              students: form.quantity,
              email: form.email.trim(),
            });
            setSuccess(true);
          } catch (err) {
            console.error('Update error:', err);
            setOrderDetails({
              orderId: response.razorpay_order_id,
              amount: totalPrice,
              students: form.quantity,
              email: form.email.trim(),
            });
            setSuccess(true);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
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
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 text-center border-b border-gray-100">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">Payment Successful</h1>
                <p className="text-gray-500 mt-2">Your registration is confirmed</p>
              </div>

              <div className="p-8">
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500">Order ID</span>
                    <span className="font-mono text-sm text-gray-900">{orderDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500">Students</span>
                    <span className="text-gray-900 font-medium">{orderDetails.students}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="text-blue-600 font-semibold">
                      ₹{orderDetails.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    Confirmation email sent to{' '}
                    <span className="font-medium">{orderDetails.email}</span>
                  </p>
                </div>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Event Registration</h1>
            <p className="text-gray-500 mt-2">Complete your registration in a few steps</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="space-y-6">
              <InputField
                label="Full Name"
                icon={User}
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter your full name"
                error={errors.name}
              />

              <InputField
                label="Email Address"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@example.com"
                error={errors.email}
              />

              <InputField
                label="Phone Number"
                icon={Phone}
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder="10-digit mobile number"
                error={errors.phone}
              />

              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Students <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => form.quantity > 1 && updateField('quantity', form.quantity - 1)}
                    disabled={form.quantity <= 1}
                    className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      updateField('quantity', Math.min(100, Math.max(1, val)));
                    }}
                    min="1"
                    max="100"
                    className="flex-1 h-12 text-center text-lg font-semibold rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      form.quantity < 100 && updateField('quantity', form.quantity + 1)
                    }
                    disabled={form.quantity >= 100}
                    className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {errors.quantity && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>
            </div>

            {/* Price Summary */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Price per student</span>
                <span className="text-gray-900">₹{PRICE_PER_STUDENT}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">Total Amount</span>
                <span className="text-2xl font-semibold text-blue-600">
                  ₹{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600">{paymentError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full h-14 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay ₹{totalPrice.toLocaleString()}</>
              )}
            </button>

            {/* Trust Badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Secured by Razorpay</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
