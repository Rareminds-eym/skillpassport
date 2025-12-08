/**
 * Event Sales Success Page
 * Shows confirmation after successful payment
 */

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function EventSalesSuccess() {
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get('id');
  const planName = searchParams.get('plan');
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your Skill Passport subscription is now active.
          </p>

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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-gray-900">{registration.email}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium text-gray-900">{planName || registration?.plan_type || 'Professional'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-bold text-green-600">₹{registration?.plan_amount || '999'}</span>
              </div>
              {registration?.razorpay_payment_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-xs text-gray-500">{registration.razorpay_payment_id.slice(-12)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Check your email</p>
                <p className="text-xs text-blue-700 mt-1">
                  We've sent login credentials and activation instructions to your email address.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full h-12 bg-gradient-to-r from-[#2663EB] to-[#1D4ED8] text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:from-[#1D4ED8] hover:to-[#1E40AF] transition-all shadow-lg shadow-blue-500/20"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register/plans"
              className="w-full h-12 bg-gray-100 text-gray-700 font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
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
  );
}
