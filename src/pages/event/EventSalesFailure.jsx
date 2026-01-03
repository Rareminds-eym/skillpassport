/**
 * Event Sales Failure Page
 * Shows error message when payment fails
 */

import { AlertTriangle, ArrowLeft, HelpCircle, RefreshCw, XCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../../layouts/Header';

export default function EventSalesFailure() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('error') || 'payment_failed';
  const planName = searchParams.get('plan');

  // Error messages based on error code
  const getErrorDetails = () => {
    switch (errorCode) {
      case 'cancelled':
        return {
          title: 'Payment Cancelled',
          message: 'You cancelled the payment. No amount has been deducted from your account.',
          icon: XCircle,
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
      case 'timeout':
        return {
          title: 'Payment Timeout',
          message: 'The payment session expired. Please try again.',
          icon: AlertTriangle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600'
        };
      case 'declined':
        return {
          title: 'Payment Declined',
          message: 'Your payment was declined by the bank. Please try a different payment method.',
          icon: XCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      default:
        return {
          title: 'Payment Failed',
          message: 'Something went wrong with your payment. Please try again.',
          icon: XCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
    }
  };

  const errorDetails = getErrorDetails();
  const Icon = errorDetails.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Failure Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Failure Icon */}
            <div className={`w-20 h-20 mx-auto mb-6 ${errorDetails.iconBg} rounded-full flex items-center justify-center`}>
              <Icon className={`w-12 h-12 ${errorDetails.iconColor}`} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorDetails.title}</h1>
            <p className="text-gray-600 mb-6">
              {errorDetails.message}
            </p>

            {/* Plan Info (if available) */}
            {planName && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected Plan</span>
                  <span className="font-medium text-gray-900">{planName}</span>
                </div>
              </div>
            )}

            {/* What to do next */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">What can you do?</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Try again with the same or different payment method</li>
                    <li>• Check if your card has sufficient balance</li>
                    <li>• Contact your bank if the issue persists</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to="/signup/plans"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Link>
              <Link
                to="/"
                className="w-full h-12 bg-gray-100 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Home
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
