/**
 * FeatureGate Component - Premium locked feature UI
 */

import { ArrowLeft, ArrowRight, Check, Lock, Shield, Sparkles, X, Zap } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { clearFeatureAccessCache, useFeatureGate } from '../../hooks/useFeatureGate';
import addOnPaymentService from '../../services/addOnPaymentService';
import { loadRazorpayScript } from '../../services/Subscriptions/razorpayService';
import DemoModal from '../common/DemoModal';

export function FeatureGate({
  featureKey,
  children,
  fallback,
  showUpgradePrompt = true,
  blurContent = false,
  className = '',
  onUpgradeClick
}) {
  const { hasAccess, isLoading, requiredAddOn, upgradePrice } = useFeatureGate(featureKey);
  const { purchaseAddOn, isPurchasing } = useSubscriptionContext();
  const [showModal, setShowModal] = useState(false);

  const handleUpgradeClick = useCallback(() => {
    if (onUpgradeClick) {
      onUpgradeClick(featureKey, requiredAddOn);
    } else {
      setShowModal(true);
    }
  }, [onUpgradeClick, featureKey, requiredAddOn]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[300px] ${className}`}>
        <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  if (blurContent) {
    return (
      <div className={`relative ${className}`}>
        {/* Render a static placeholder instead of actual children to prevent effects from running */}
        <div className="filter blur-lg pointer-events-none select-none opacity-30">
          <LockedContentPlaceholder />
        </div>
        <div className="absolute inset-0 flex flex-col bg-white/80">
          <div className="p-4">
            <BackButton />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <LockedCard featureKey={featureKey} addOn={requiredAddOn} upgradePrice={upgradePrice} showUpgradePrompt={showUpgradePrompt} onUpgradeClick={handleUpgradeClick} />
          </div>
        </div>
        {showModal && <PurchaseModal addOn={requiredAddOn} upgradePrice={upgradePrice} onClose={() => setShowModal(false)} onPurchase={purchaseAddOn} isPurchasing={isPurchasing} />}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full min-h-[calc(100vh-200px)] p-8 ${className}`}>
      {/* Back button */}
      <div className="mb-4">
        <BackButton />
      </div>
      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center">
        <LockedCard featureKey={featureKey} addOn={requiredAddOn} upgradePrice={upgradePrice} showUpgradePrompt={showUpgradePrompt} onUpgradeClick={handleUpgradeClick} />
      </div>
      {showModal && <PurchaseModal addOn={requiredAddOn} upgradePrice={upgradePrice} onClose={() => setShowModal(false)} onPurchase={purchaseAddOn} isPurchasing={isPurchasing} />}
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}

/**
 * Static placeholder for locked content - prevents actual feature from rendering/executing
 */
function LockedContentPlaceholder() {
  return (
    <div className="min-h-[400px] p-8">
      {/* Fake content blocks to simulate blurred content */}
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3 mt-6">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

function LockedCard({ featureKey, addOn, upgradePrice, showUpgradePrompt, onUpgradeClick }) {
  const monthlyPrice = upgradePrice?.monthly ? parseFloat(upgradePrice.monthly) : 0;
  const annualPrice = upgradePrice?.annual ? parseFloat(upgradePrice.annual) : 0;
  const savings = monthlyPrice > 0 && annualPrice > 0 ? Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100) : 0;

  const benefits = {
    career_ai: ['AI-powered career guidance', 'Personalized recommendations', 'Industry insights'],
    video_portfolio: ['Professional video showcase', 'Easy hosting & sharing', 'Portfolio builder'],
    educator_ai: ['AI teaching assistant', 'Content generation', 'Student insights'],
    recruiter_ai: ['AI candidate matching', 'Smart screening', 'Talent insights'],
    kpi_dashboard: ['Real-time metrics', 'Custom reports', 'Performance tracking'],
    curriculum_builder: ['Drag & drop builder', 'Template library', 'Standards alignment'],
    mentor_notes: ['Private student notes', 'Progress tracking', 'Intervention alerts'],
    ai_job_matching: ['Smart job matching', 'Skill-based recommendations', 'Application tracking'],
    talent_pool_access: ['Verified candidates', 'Advanced filters', 'Direct messaging'],
    pipeline_management: ['Visual pipelines', 'Stage tracking', 'Team collaboration'],
    project_hiring: ['Project-based hiring', 'Milestone tracking', 'Contract management'],
  }[featureKey] || ['Premium features', 'Priority support', 'Regular updates'];

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header with gradient accent */}
        <div className="relative px-8 pt-8 pb-6">
          {/* Pro badge */}
          <div className="absolute top-6 right-6">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Pro</span>
            </div>
          </div>

          {/* Lock icon */}
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5">
            <Lock className="w-7 h-7 text-indigo-600" />
          </div>

          {/* Title & description */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {addOn?.feature_name || 'Premium Feature'}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            {addOn?.addon_description || 'Unlock this feature to enhance your experience.'}
          </p>
        </div>

        {/* Benefits */}
        <div className="px-8 py-5 bg-gray-50 border-y border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">What you'll get</p>
          <div className="space-y-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                </div>
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="px-8 py-6">
          {monthlyPrice > 0 ? (
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">₹{monthlyPrice}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                {savings > 0 && (
                  <p className="text-emerald-600 text-xs font-medium mt-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Save {savings}% with annual
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Billed monthly</p>
                <p className="text-xs text-gray-400">Cancel anytime</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-5">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="text-gray-400 text-sm">Loading pricing...</span>
            </div>
          )}

          {showUpgradePrompt && (
            <button
              onClick={onUpgradeClick}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Upgrade to Pro
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> Secure checkout powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}

function PurchaseModal({ addOn, upgradePrice, onClose, onPurchase, isPurchasing }) {
  const [billing, setBilling] = useState('annual'); // Default to annual for better value
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const { refreshAccess, fetchUserEntitlements, activeEntitlements } = useSubscriptionContext();

  // Check if user already owns this add-on (including cancelled but not expired)
  const isAlreadyOwned = useMemo(() => {
    if (!addOn?.feature_key || !activeEntitlements) return false;
    const now = new Date();
    return activeEntitlements.some(ent => 
      ent.feature_key === addOn.feature_key && 
      (ent.status === 'active' || 
       ent.status === 'grace_period' ||
       (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now))
    );
  }, [addOn?.feature_key, activeEntitlements]);

  const monthly = upgradePrice?.monthly ? parseFloat(upgradePrice.monthly) : 0;
  const annual = upgradePrice?.annual ? parseFloat(upgradePrice.annual) : 0;
  const price = billing === 'monthly' ? monthly : annual;
  const monthlyEquivalent = billing === 'annual' ? Math.round(annual / 12) : monthly;
  const savings = monthly > 0 && annual > 0 ? Math.round(monthly * 12 - annual) : 0;
  const savingsPct = monthly > 0 && annual > 0 ? Math.round(((monthly * 12 - annual) / (monthly * 12)) * 100) : 0;

  const handlePurchase = async () => {
    if (!addOn?.feature_key) {
      console.error('[PurchaseModal] No feature_key found in addOn:', addOn);
      setError('Unable to process purchase - missing feature information');
      return;
    }
    
    // Check for duplicate purchase
    if (isAlreadyOwned) {
      setError('You already own this add-on. Access is active until your subscription expires.');
      return;
    }
    
    try {
      setError(null);
      console.log('[PurchaseModal] Starting purchase for:', addOn.feature_key, billing);
      
      // Load Razorpay script first
      console.log('[PurchaseModal] Loading Razorpay script...');
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment system. Please check your internet connection and try again.');
        return;
      }
      console.log('[PurchaseModal] Razorpay script loaded successfully');
      
      const order = await onPurchase(addOn.feature_key, billing);
      console.log('[PurchaseModal] Order received:', order);
      
      if (!order) {
        setError('Failed to create order - no response received');
        return;
      }
      
      if (!window.Razorpay) {
        setError('Payment system not loaded. Please refresh the page.');
        return;
      }
      
      console.log('[PurchaseModal] Opening Razorpay with:', {
        key: order.razorpayKeyId,
        amount: order.amount,
        order_id: order.orderId
      });
      
      const razorpay = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillPassport',
        description: `${addOn.feature_name || addOn.name} - ${billing === 'monthly' ? 'Monthly' : 'Annual'}`,
        order_id: order.orderId,
        handler: async (response) => {
          // Payment successful - now verify and create entitlement
          console.log('[PurchaseModal] Payment successful, verifying...', response);
          setIsVerifying(true);
          
          try {
            const verifyResult = await addOnPaymentService.verifyAddonPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            
            console.log('[PurchaseModal] Verification result:', verifyResult);
            
            if (verifyResult.success) {
              console.log('[PurchaseModal] Payment verified and entitlement created!');
              // Clear feature access cache to force re-check
              clearFeatureAccessCache();
              // Refresh entitlements in context instead of page reload
              await Promise.all([
                refreshAccess(),
                fetchUserEntitlements()
              ]);
              onClose();
            } else {
              setError(`Payment verification failed: ${verifyResult.error}. Please contact support with Order ID: ${response.razorpay_order_id}`);
              setIsVerifying(false);
            }
          } catch (verifyError) {
            console.error('[PurchaseModal] Verification error:', verifyError);
            setError(`Payment completed but verification failed. Please contact support with Order ID: ${response.razorpay_order_id}`);
            setIsVerifying(false);
          }
        },
        prefill: { email: order.userEmail, name: order.userName },
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => {
            console.log('[PurchaseModal] Payment modal dismissed');
          }
        }
      });
      
      // Handle payment failure
      razorpay.on('payment.failed', (response) => {
        console.error('[PurchaseModal] Payment failed:', response.error);
        setError(`Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`);
      });
      
      razorpay.open();
    } catch (e) {
      console.error('[PurchaseModal] Purchase error:', e);
      setError(e.message || 'Purchase failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-[420px] w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 pt-6 pb-8">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{addOn?.feature_name || 'Premium Feature'}</h2>
              <p className="text-indigo-200 text-sm">Unlock full access</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 -mt-4">
          {monthly === 0 && annual === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading pricing...</p>
            </div>
          ) : (
            <>
              {/* Billing Toggle */}
              <div className="bg-gray-100 p-1 rounded-xl flex mb-5">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    billing === 'monthly' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('annual')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all relative ${
                    billing === 'annual' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Annual
                  {savingsPct > 0 && (
                    <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                      -{savingsPct}%
                    </span>
                  )}
                </button>
              </div>

              {/* Pricing Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 mb-5 border border-gray-100">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">₹{price}</span>
                    <span className="text-gray-400 text-sm">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  {billing === 'annual' && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">₹{monthlyEquivalent}/mo</p>
                    </div>
                  )}
                </div>
                
                {billing === 'annual' && savings > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
                    </div>
                    <span className="text-emerald-600 text-sm font-medium">Save ₹{savings} per year</span>
                  </div>
                )}
              </div>

              {/* Features included */}
              <div className="space-y-2.5 mb-6">
                {['Full feature access', 'Priority support', 'Cancel anytime'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-indigo-600" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-red-500" />
                  </div>
                  {error}
                </div>
              )}

              <button
              // onClick={handlePurchase}
                onClick={() => setShowDemoModal(true)}
                disabled={isPurchasing || isVerifying}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-400 disabled:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying payment...
                  </>
                ) : isPurchasing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Purchase
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Secure checkout
                </span>
                <span>•</span>
                <span>Powered by Razorpay</span>
              </div>
            </>
          )}
        </div>

        {/* Demo Modal */}
        <DemoModal
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
          message="This feature is available in the full version. You are currently viewing the demo. Please contact us to get complete access."
        />
      </div>
    </div>
  );
}

export function FeatureGateInline({ featureKey, children, lockedText = 'Pro' }) {
  const { hasAccess, isLoading } = useFeatureGate(featureKey);
  if (isLoading) return <span className="text-gray-400">...</span>;
  if (hasAccess) return <>{children}</>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
      <Lock className="w-3 h-3" /> {lockedText}
    </span>
  );
}

export default FeatureGate;
