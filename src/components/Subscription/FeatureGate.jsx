/**
 * FeatureGate Component
 * 
 * A wrapper component that controls access to features based on user entitlements.
 * Renders children if user has access, otherwise shows fallback or upgrade prompt.
 * 
 * Features:
 * - Checks plan-based and add-on entitlement access
 * - Consistent locked UI pattern (lock icon, blur effect)
 * - Customizable fallback content
 * - Optional upgrade prompt display
 * 
 * @requirement REQ-5.1 - Feature Gate Component
 * @requirement REQ-6.2 - Display upgrade prompt for non-subscribers
 * @requirement REQ-6.5 - Consistent UI pattern for locked features
 */

import { ArrowRight, Lock, Sparkles, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { useFeatureGate } from '../../hooks/useFeatureGate';

/**
 * FeatureGate - Controls access to premium features
 * 
 * @param {Object} props
 * @param {string} props.featureKey - The feature_key to check access for
 * @param {React.ReactNode} props.children - Content to render if access granted
 * @param {React.ReactNode} props.fallback - Content to render if access denied (optional)
 * @param {boolean} props.showUpgradePrompt - Whether to show upgrade prompt (default: true)
 * @param {string} props.blurContent - Whether to blur the content instead of hiding (default: false)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onUpgradeClick - Custom handler for upgrade button click
 */
export function FeatureGate({
  featureKey,
  children,
  fallback,
  showUpgradePrompt = true,
  blurContent = false,
  className = '',
  onUpgradeClick
}) {
  const { hasAccess, isLoading, requiredAddOn, canUpgrade, upgradePrice } = useFeatureGate(featureKey);
  const { purchaseAddOn, isPurchasing } = useSubscriptionContext();
  const [showModal, setShowModal] = useState(false);

  const handleUpgradeClick = useCallback(() => {
    if (onUpgradeClick) {
      onUpgradeClick(featureKey, requiredAddOn);
    } else {
      setShowModal(true);
    }
  }, [onUpgradeClick, featureKey, requiredAddOn]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Access granted - render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied - render fallback or locked UI
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked UI with optional blur
  if (blurContent) {
    return (
      <div className={`relative ${className}`}>
        {/* Blurred content */}
        <div className="filter blur-sm pointer-events-none select-none">
          {children}
        </div>
        
        {/* Overlay with upgrade prompt */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <LockedFeatureCard
            featureKey={featureKey}
            addOn={requiredAddOn}
            upgradePrice={upgradePrice}
            showUpgradePrompt={showUpgradePrompt}
            onUpgradeClick={handleUpgradeClick}
          />
        </div>

        {/* Upgrade Modal */}
        {showModal && (
          <UpgradeModal
            addOn={requiredAddOn}
            upgradePrice={upgradePrice}
            onClose={() => setShowModal(false)}
            onPurchase={purchaseAddOn}
            isPurchasing={isPurchasing}
          />
        )}
      </div>
    );
  }

  // Standard locked UI
  return (
    <div className={className}>
      <LockedFeatureCard
        featureKey={featureKey}
        addOn={requiredAddOn}
        upgradePrice={upgradePrice}
        showUpgradePrompt={showUpgradePrompt}
        onUpgradeClick={handleUpgradeClick}
      />

      {/* Upgrade Modal */}
      {showModal && (
        <UpgradeModal
          addOn={requiredAddOn}
          upgradePrice={upgradePrice}
          onClose={() => setShowModal(false)}
          onPurchase={purchaseAddOn}
          isPurchasing={isPurchasing}
        />
      )}
    </div>
  );
}

/**
 * LockedFeatureCard - Displays locked feature UI
 */
function LockedFeatureCard({ featureKey, addOn, upgradePrice, showUpgradePrompt, onUpgradeClick }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 text-center max-w-md mx-auto">
      {/* Lock Icon */}
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
        <Lock className="w-8 h-8 text-white" />
      </div>

      {/* Feature Name */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {addOn?.feature_name || 'Premium Feature'}
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4">
        {addOn?.addon_description || 'This feature requires an add-on subscription.'}
      </p>

      {/* Pricing */}
      {upgradePrice && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl font-bold text-indigo-600">
            ₹{upgradePrice.monthly}
          </span>
          <span className="text-gray-500 text-sm">/month</span>
        </div>
      )}

      {/* Upgrade Button */}
      {showUpgradePrompt && (
        <button
          onClick={onUpgradeClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Unlock Feature
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * UpgradeModal - Modal for purchasing add-on
 */
function UpgradeModal({ addOn, upgradePrice, onClose, onPurchase, isPurchasing }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [error, setError] = useState(null);

  const handlePurchase = async () => {
    if (!addOn?.feature_key) return;
    
    try {
      setError(null);
      const orderData = await onPurchase(addOn.feature_key, billingPeriod);
      
      // Initialize Razorpay checkout
      if (orderData && window.Razorpay) {
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'SkillPassport',
          description: `${addOn.feature_name} - ${billingPeriod === 'monthly' ? 'Monthly' : 'Annual'}`,
          order_id: orderData.orderId,
          handler: function(response) {
            // Payment successful - will be handled by payment service
            onClose();
            window.location.reload(); // Refresh to update entitlements
          },
          prefill: {
            email: orderData.userEmail,
            name: orderData.userName
          },
          theme: {
            color: '#4F46E5'
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate purchase');
    }
  };

  const annualSavings = upgradePrice 
    ? Math.round((upgradePrice.monthly * 12 - upgradePrice.annual) / (upgradePrice.monthly * 12) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Unlock {addOn?.feature_name}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {addOn?.addon_description}
          </p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              billingPeriod === 'annual'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            {annualSavings > 0 && (
              <span className="ml-1 text-xs text-green-600">Save {annualSavings}%</span>
            )}
          </button>
        </div>

        {/* Price Display */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-gray-900">
              ₹{billingPeriod === 'monthly' ? upgradePrice?.monthly : upgradePrice?.annual}
            </span>
            <span className="text-gray-500">
              /{billingPeriod === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          {billingPeriod === 'annual' && upgradePrice && (
            <p className="text-sm text-green-600 mt-1">
              Save ₹{upgradePrice.monthly * 12 - upgradePrice.annual} per year
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPurchasing ? 'Processing...' : 'Subscribe Now'}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By subscribing, you agree to our Terms of Service and Privacy Policy.
          Cancel anytime.
        </p>
      </div>
    </div>
  );
}

/**
 * FeatureGateInline - Inline version for smaller UI elements
 */
export function FeatureGateInline({ featureKey, children, lockedText = 'Upgrade to unlock' }) {
  const { hasAccess, isLoading } = useFeatureGate(featureKey);

  if (isLoading) {
    return <span className="animate-pulse bg-gray-200 rounded px-2 py-1">...</span>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
      <Lock className="w-3 h-3" />
      {lockedText}
    </span>
  );
}

export default FeatureGate;
