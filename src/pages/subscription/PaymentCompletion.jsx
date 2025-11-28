import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { initiateRazorpayPayment } from '../../services/Subscriptions/razorpayService';
import SubscriptionRouteGuard from '../../components/Subscription/SubscriptionRouteGuard';
import { useSubscription } from '../../hooks/Subscription/useSubscription';
import { isActiveOrPaused } from '../../utils/subscriptionHelpers';

function PaymentCompletion() {
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize location state to prevent unnecessary re-renders
  const { plan, studentType } = useMemo(
    () => location.state || {},
    [location.state]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const { subscriptionData, loading: subscriptionLoading } = useSubscription();

  // Check for active subscription and redirect if necessary
  useEffect(() => {
    if (!subscriptionLoading && subscriptionData) {
      const isActive = isActiveOrPaused(subscriptionData.status);
      const hasValidEndDate = subscriptionData.endDate ? new Date(subscriptionData.endDate) > new Date() : true;

      if (isActive && hasValidEndDate) {
        navigate('/subscription/manage', { replace: true });
      }
    }
  }, [subscriptionData, subscriptionLoading, navigate]);

  // If no plan data, redirect back
  useEffect(() => {
    if (!plan) {
      navigate('/subscription', { replace: true });
    }
  }, [plan, navigate]);

  // Memoize handlers to prevent recreation on every render
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Early return if already loading
    if (loading) return;

    setLoading(true);
    setError('');

    // Validate user details
    if (!userDetails.name.trim() || !userDetails.email.trim()) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      await initiateRazorpayPayment({
        plan,
        userDetails: {
          ...userDetails,
          studentType // Pass studentType from location state
        },
        onSuccess: (verificationResult) => {
          // Navigate based on student type
          const routes = {
            school: '/signin/school',
            university: '/signin/university',
            default: '/register',
          };

          const targetRoute = routes[studentType] || routes.default;

          navigate(targetRoute, {
            state: { paymentDetails: verificationResult },
            replace: true,
          });
        },
        onFailure: (err) => {
          setLoading(false);
          setError(err.message || 'Payment failed. Please try again.');
        },
      });
    } catch (err) {
      setError('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  }, [loading, userDetails, plan, studentType, navigate]);

  const handleBack = useCallback(() => {
    navigate('/subscription');
  }, [navigate]);

  // Early return with loading state instead of null
  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const paymentContent = (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Payment
            </h1>
          </div>

          {/* Plan Summary */}
          <div className="mb-8 bg-blue-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Plan Summary
            </h2>
            <p className="text-gray-700">
              {plan.name} - ₹{plan.price}/{plan.duration}
            </p>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-base font-medium text-gray-900 mb-2"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={userDetails.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-base font-medium text-gray-900 mb-2"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={userDetails.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone"
                className="block text-base font-medium text-gray-900 mb-2"
              >
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={userDetails.phone}
                onChange={handleInputChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                disabled={loading}
                autoComplete="tel"
              />
            </div>

            {/* Payment Method Info */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                Payment Method
              </h3>
              <p className="text-sm text-gray-600">
                Razorpay supports Card, UPI, Net Banking, Wallets, and more
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-3 px-6 text-base font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 text-base font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Pay with Razorpay'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <SubscriptionRouteGuard mode="payment">
      {paymentContent}
    </SubscriptionRouteGuard>
  );
}

export default memo(PaymentCompletion);

