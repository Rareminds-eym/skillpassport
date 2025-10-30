import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '499',
    duration: 'month',
    features: [
      'Access to basic skill assessments',
      'Limited profile visibility',
      'Basic analytics',
      'Email support'
    ],
    color: 'bg-blue-600',
    recommended: false
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '999',
    duration: 'month',
    features: [
      'All Basic features',
      'Advanced skill assessments',
      'Priority profile visibility',
      'Detailed analytics',
      'Priority support',
      'Personalized recommendations'
    ],
    color: 'bg-blue-600',
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '1999',
    duration: 'month',
    features: [
      'All Professional features',
      'Custom skill assessments',
      'Premium profile visibility',
      'Advanced analytics',
      '24/7 Premium support',
      'Custom integrations',
      'Dedicated account manager'
    ],
    color: 'bg-blue-600',
    recommended: false
  }
];

const PaymentGateway = ({ plan, onBack }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Integrate with your payment gateway here
      // Example: Stripe, Razorpay, etc.
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated API call
      
      // After successful payment, redirect to the appropriate signup page
      if (studentType === 'school') {
        navigate('/signup/school');
      } else if (studentType === 'university') {
        navigate('/signup/university');
      } else {
        navigate('/signup/student');
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold">Plan Summary</h3>
        <p className="text-gray-600">{plan.name} - ₹{plan.price}/{plan.duration}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-radio text-blue-600"
              />
              <span>Credit/Debit Card</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={paymentMethod === 'upi'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-radio text-blue-600"
              />
              <span>UPI</span>
            </label>
          </div>
        </div>

        {paymentMethod === 'card' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </>
        )}

        {paymentMethod === 'upi' && (
          <div>
            <label className="block text-sm font-medium mb-2">UPI ID</label>
            <input
              type="text"
              placeholder="username@upi"
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

import { useSubscription } from '../../hooks/useSubscription';

export default function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const studentType = queryParams.get('type');
  const mode = queryParams.get('mode'); // 'purchase' or 'view'
  const { subscriptionData, loading: subscriptionLoading, error: subscriptionError } = useSubscription();

  const handleBack = () => {
    setSelectedPlan(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Only show current subscription if mode is 'view' and user has a subscription */}
        {mode === 'view' && subscriptionData && (
          <div className="mb-12 bg-white rounded-lg shadow-md p-6">
            <div className="border-b pb-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Current Subscription</h2>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscriptionData.status)}`}>
                  {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
                </span>
                <span className="text-gray-600">
                  {plans.find(p => p.id === subscriptionData.plan)?.name || 'Unknown'} Plan
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-500">Start Date</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatDate(subscriptionData.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">End Date</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatDate(subscriptionData.endDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Auto Renewal</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {subscriptionData.autoRenew ? 'Enabled' : 'Disabled'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Next Billing</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatDate(subscriptionData.nextBillingDate)}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Features</h3>
                <ul className="space-y-2">
                  {subscriptionData.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {!selectedPlan ? (
          <>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {mode === 'view' && subscriptionData 
                  ? 'Upgrade Your Plan' 
                  : 'Choose Your Plan'}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {mode === 'view' && subscriptionData 
                  ? 'Upgrade to a different plan to access more features'
                  : 'Select the plan that best suits your needs'
                }
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl bg-white p-8 shadow-lg flex flex-col ${
                    plan.recommended ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Recommended
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-4xl font-bold tracking-tight text-gray-900">
                        ₹{plan.price}
                      </span>
                      <span className="ml-1 text-xl font-semibold text-gray-600">
                        /{plan.duration}
                      </span>
                    </div>
                  </div>

                  <ul className="mb-8 space-y-4 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                        <span className="ml-3 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {subscriptionData && subscriptionData.plan === plan.id ? (
                    <div className="space-y-3">
                      <span className="block w-full py-3 px-6 rounded-lg font-medium bg-green-100 text-green-800 text-center">
                        Current Plan
                      </span>
                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className="w-full py-3 px-6 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Manage Plan
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-colors
                        ${
                          plan.recommended
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }
                      `}
                    >
                      {subscriptionData ? 'Upgrade to This Plan' : 'Select Plan'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <PaymentGateway plan={selectedPlan} onBack={handleBack} />
        )}
      </div>
    </div>
  );
}