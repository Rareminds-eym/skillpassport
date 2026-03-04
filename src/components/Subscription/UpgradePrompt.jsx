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
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { clearFeatureAccessCache } from '../../hooks/useFeatureGate';
import addOnPaymentService from '../../services/addOnPaymentService';
import { loadRazorpayScript } from '../../services/Subscriptions/razorpayService';

/**
 * Get the base path for subscription routes based on current location
 */
function getSubscriptionBasePath(pathname) {
  if (pathname.startsWith('/student')) return '/student';
  if (pathname.startsWith('/recruitment')) return '/recruitment';
  if (pathname.startsWith('/educator')) return '/educator';
  if (pathname.startsWith('/college-admin')) return '/college-admin';
  if (pathname.startsWith('/school-admin')) return '/school-admin';
  if (pathname.startsWith('/university-admin')) return '/university-admin';
  return ''; // fallback to root
}

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
  const location = useLocation();
  const { purchaseAddOn, isPurchasing, refreshAccess, fetchUserEntitlements, activeEntitlements } = useSubscriptionContext();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [error, setError] = useState(null);
  
  const basePath = getSubscriptionBasePath(location.pathname);

  // Check if user already owns this add-on (including cancelled but not expired)
  const isAlreadyOwned = useMemo(() => {
    const key = addOn?.feature_key || featureKey;
    if (!key || !activeEntitlements) return false;
    const now = new Date();
    return activeEntitlements.some(ent => 
      ent.feature_key === key && 
      (ent.status === 'active' || 
       ent.status === 'grace_period' ||
       (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now))
    );
  }, [addOn?.feature_key, featureKey, activeEntitlements]);

  if (!isOpen || (!addOn && !featureKey)) return null;

  // If already owned, show a different message
  if (isAlreadyOwned) {
    onClose?.();
    return null;
  }

  const handlePurchase = async () => {
    const key = addOn?.feature_key || featureKey;
    if (!key) return;

    // Double-check ownership before purchase
    if (isAlreadyOwned) {
      setError('You already own this add-on.');
      return;
    }

    try {
      setError(null);
      
      // Load Razorpay script first
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment system. Please refresh and try again.');
        return;
      }
      
      const orderData = await purchaseAddOn(key, billingPeriod);
      
      if (orderData && window.Razorpay) {
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'SkillPassport',
          description: addOn?.feature_name || 'Premium Feature',
          order_id: orderData.orderId,
          handler: async function(response) {
            // Payment successful - verify and create entitlement
            console.log('[UpgradePrompt] Payment successful, verifying...', response);
            
            try {
              const verifyResult = await addOnPaymentService.verifyAddonPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );
              
              if (verifyResult.success) {
                console.log('[UpgradePrompt] Payment verified and entitlement created!');
                // Clear feature access cache to force re-check
                clearFeatureAccessCache();
                // Refresh entitlements in context instead of page reload
                await Promise.all([
                  refreshAccess(),
                  fetchUserEntitlements()
                ]);
                onClose?.();
              } else {
                setError(`Payment verification failed: ${verifyResult.error}. Please contact support with Order ID: ${response.razorpay_order_id}`);
              }
            } catch (verifyError) {
              console.error('[UpgradePrompt] Verification error:', verifyError);
              setError(`Payment completed but verification failed. Please contact support with Order ID: ${response.razorpay_order_id}`);
            }
          },
          theme: { color: '#4F46E5' },
          modal: {
            ondismiss: () => {
              console.log('[UpgradePrompt] Payment modal dismissed');
            }
          }
        };
        
        const rzp = new window.Razorpay(options);
        
        // Handle payment failure
        rzp.on('payment.failed', (response) => {
          console.error('[UpgradePrompt] Payment failed:', response.error);
          setError(`Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`);
        });
        
        rzp.open();
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate purchase');
    }
  };

  const handleLearnMore = () => {
    onClose?.();
    navigate(`${basePath}/subscription/add-ons`);
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
      <div className={`bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-slate-200 ${className}`}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white relative">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 36px)`
          }}></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400"></div>
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-light" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Unlock Premium Feature</h2>
              <p className="text-white/70 text-sm font-medium">
                {addOn?.feature_name || 'Premium Feature'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Description */}
          <p className="text-slate-600 mb-6 font-light leading-relaxed">
            {addOn?.addon_description || 
              'Get access to this premium feature and enhance your experience.'}
          </p>

          {/* Billing Toggle */}
          <div className="flex bg-slate-100 rounded-2xl p-1.5 mb-6 border-2 border-slate-200">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual
              <span className="ml-1 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Save 17%</span>
            </button>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                ₹{billingPeriod === 'monthly' 
                  ? addOn?.addon_price_monthly 
                  : addOn?.addon_price_annual}
              </span>
              <span className="text-slate-500 font-medium">
                /{billingPeriod === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full py-4 px-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-2xl hover:from-slate-900 hover:to-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
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
              className="w-full py-4 px-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
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
    <div className={`bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-3xl p-6 shadow-lg ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Lock className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-light text-xl text-slate-900 mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
            {addOn?.feature_name || 'Premium Feature'}
          </h3>
          <p className="text-sm text-slate-600 mb-4 font-light leading-relaxed">
            {addOn?.addon_description || 'Unlock this feature to enhance your experience.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onPurchase}
              disabled={isPurchasing}
              className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm font-semibold rounded-2xl hover:from-slate-900 hover:to-black transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:scale-105"
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
              className="text-sm text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 transition-colors"
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
    <div className={`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-3 border-b-2 border-amber-400 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">
            Unlock {addOn?.feature_name || 'Premium Features'} starting at ₹{addOn?.addon_price_monthly}/mo
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPurchase}
            disabled={isPurchasing}
            className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-sm font-bold rounded-2xl hover:from-amber-500 hover:to-amber-600 transition-all disabled:opacity-50 shadow-lg hover:scale-105"
          >
            {isPurchasing ? 'Processing...' : 'Upgrade Now'}
          </button>

          {onClose && (
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
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
