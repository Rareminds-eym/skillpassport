/**
 * Event Sales Success Page
 * Shows confirmation after successful payment with login credentials
 */

import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, ArrowRight, ArrowLeft, Sparkles, Key, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Header from '../../layouts/Header';

export default function EventSalesSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get('id');
  const planName = searchParams.get('plan');
  const tempPassword = searchParams.get('tp');
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchRegistration = async () => {
      if (!registrationId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (!error && data) {
        setRegistration(data);
      }
      setLoading(false);
    };

    fetchRegistration();
  }, [registrationId]);

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your Skill Passport account has been created successfully.
            </p>

            {/* Login Credentials Box */}
            {tempPassword && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Your Login Credentials</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
                    <p className="font-medium text-gray-900">{registration?.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Temporary Password</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm">
                        {showPassword ? tempPassword : '••••••••••'}
                      </div>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={copyPassword}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy password"
                      >
                        {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mt-3">
                  ⚠️ Please save this password. You'll need to change it after your first login.
                </p>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Details</h3>
              <div className="space-y-3">
                {registration && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium text-gray-900">{registration.full_name}</span>
                    </div>
                    {registration.institution_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Institution</span>
                        <span className="font-medium text-gray-900">{registration.institution_name}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium text-gray-900">{planName || registration?.plan_type || 'Professional'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-bold text-green-600">₹{registration?.plan_amount?.toLocaleString() || '999'}</span>
                </div>
                {registration?.razorpay_payment_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-xs text-gray-500">{registration.razorpay_payment_id.slice(-12)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Email Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Check your email</p>
                  <p className="text-xs text-blue-700 mt-1">
                    We've also sent your login credentials to {registration?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to="/login"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20"
              >
                Go to Login
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register/plans"
                className="w-full h-12 bg-gray-100 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Register Another
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Need help? Contact us at{' '}
            <a href="mailto:support@rareminds.in" className="text-blue-600 hover:underline">
              support@rareminds.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
