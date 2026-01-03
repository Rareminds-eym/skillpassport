/**
 * UpgradePrompt Component
 * 
 * Modal or inline prompt for upgrading to premium features.
 * 
 * Features:
 * - Modal or inline display modes
 * - Display required add-on details
 * - Quick purchase button
 * - "Learn More" link to marketplace
 * 
 * @requirement REQ-5.7 - Upgrade Prompt Component
 */

import { ArrowRight, ExternalLink, Lock, Sparkles, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionContext } from '../../context/SubscriptionContext';

/**
 * UpgradePrompt - Modal prompt for upgrading
 * 
 * @param {Object} props
 * @param {Object} props.addOn - Add-on data to display
 * @param {string} props.featureKey - Feature key if addOn not provided
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Handler for closing modal
 * @param {string} props.variant - Display variant ('modal' | 'inline' | 'banner')
 * @param {string} props.className - Additional CSS classes
 */
export function UpgradePrompt({
  addOn,
  featureKey,
  isOpen = true,
  onClose,
  variant = 'modal',
  className = ''
}) {
  const navigate = useNavigate();
  const { purchaseAddOn, isPurchasing } = useSubscriptionContext();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [error, setError] = useState(null);

  if (!isOpen || (!addOn && !featureKey)) return null;

  const handlePurchase = async () => {
    const key = addOn?.feature_key || featureKey;
    if (!key) return;

    try {
      setError(null);
      const orderData = await purchaseAddOn(key, billingPeriod);
      
      if (orderData && window.Razorpay) {
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'SkillPassport',
          description: addOn?.feature_name || 'Premium Feature',
          order_id: orderData.orderId,
          handler: function(response) {
            onClose?.();
            window.location.reload();
          },
          theme: { color: '#4F46E5' }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate purchase');
    }
  };

  const handleLearnMore = () => {
    onClose?.();
    navigate('/subscription/add-ons');
  };

  // Render based on variant
  if (variant === 'inline') {
    return (
      <InlineUpgradePrompt
        addOn={addOn}
        onPurchase={handlePurchase}
        onLearnMore={handleLearnMore}
        isPurchasing={isPurchasing}
        className={className}
      />
    );
  }

  if (variant === 'banner') {
    return (
      <BannerUpgradePrompt
        addOn={addOn}
        onPurchase={handlePurchase}
        onClose={onClose}
        isPurchasing={isPurchasing}
        className={className}
      />
    );
  }

  // Modal variant (default)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden ${className}`}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Unlock Premium Feature</h2>
              <p className="text-white/80 text-sm">
                {addOn?.feature_name || 'Premium Feature'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <p className="text-gray-600 mb-6">
            {addOn?.addon_description || 
              'Get access to this premium feature and enhance your experience.'}
          </p>

          {/* Billing Toggle */}
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
              <span className="ml-1 text-xs text-green-600">Save 17%</span>
            </button>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-gray-900">
                ₹{billingPeriod === 'monthly' 
                  ? addOn?.addon_price_monthly 
                  : addOn?.addon_price_annual}
              </span>
              <span className="text-gray-500">
                /{billingPeriod === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPurchasing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Subscribe Now
                </>
              )}
            </button>

            <button
              onClick={handleLearnMore}
              className="w-full py-3 px-4 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View All Add-ons
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * InlineUpgradePrompt - Inline version for embedding in pages
 */
function InlineUpgradePrompt({ addOn, onPurchase, onLearnMore, isPurchasing, className }) {
  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Lock className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {addOn?.feature_name || 'Premium Feature'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {addOn?.addon_description || 'Unlock this feature to enhance your experience.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onPurchase}
              disabled={isPurchasing}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPurchasing ? 'Processing...' : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Unlock for ₹{addOn?.addon_price_monthly}/mo
                </>
              )}
            </button>

            <button
              onClick={onLearnMore}
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              Learn more
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * BannerUpgradePrompt - Banner version for top of pages
 */
function BannerUpgradePrompt({ addOn, onPurchase, onClose, isPurchasing, className }) {
  return (
    <div className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">
            Unlock {addOn?.feature_name || 'Premium Features'} starting at ₹{addOn?.addon_price_monthly}/mo
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPurchase}
            disabled={isPurchasing}
            className="px-4 py-1.5 bg-white text-indigo-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isPurchasing ? 'Processing...' : 'Upgrade Now'}
          </button>

          {onClose && (
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * useUpgradePrompt - Hook for managing upgrade prompt state
 */
export function useUpgradePrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [addOn, setAddOn] = useState(null);

  const showPrompt = (addOnData) => {
    setAddOn(addOnData);
    setIsOpen(true);
  };

  const hidePrompt = () => {
    setIsOpen(false);
    setAddOn(null);
  };

  return {
    isOpen,
    addOn,
    showPrompt,
    hidePrompt
  };
}

export default UpgradePrompt;
