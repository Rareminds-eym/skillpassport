/**
 * FeatureGate Component - Premium locked feature UI
 */

import { ArrowLeft, ArrowRight, Check, Lock, Shield, Sparkles, X, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { useFeatureGate } from '../../hooks/useFeatureGate';

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
        <div className="filter blur-lg pointer-events-none select-none opacity-30">{children}</div>
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

function LockedCard({ featureKey, addOn, upgradePrice, showUpgradePrompt, onUpgradeClick }) {
  const monthlyPrice = upgradePrice?.monthly ? parseFloat(upgradePrice.monthly) : 0;
  const annualPrice = upgradePrice?.annual ? parseFloat(upgradePrice.annual) : 0;
  const savings = monthlyPrice > 0 && annualPrice > 0 ? Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100) : 0;

  const benefits = {
    career_ai: ['AI-powered career guidance', 'Personalized recommendations', 'Industry insights'],
    video_portfolio: ['Professional video showcase', 'Easy hosting & sharing', 'Portfolio builder'],
    skills_analytics: ['Track skill progress', 'Gap analysis', 'Learning recommendations'],
    educator_ai: ['AI teaching assistant', 'Content generation', 'Student insights'],
    recruiter_ai: ['AI candidate matching', 'Smart screening', 'Talent insights'],
    kpi_dashboard: ['Real-time metrics', 'Custom reports', 'Performance tracking'],
    curriculum_builder: ['Drag & drop builder', 'Template library', 'Standards alignment'],
    advanced_assessments: ['Comprehensive tests', 'Detailed reports', 'Progress tracking'],
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
  const [billing, setBilling] = useState('monthly');
  const [error, setError] = useState(null);

  const monthly = upgradePrice?.monthly ? parseFloat(upgradePrice.monthly) : 0;
  const annual = upgradePrice?.annual ? parseFloat(upgradePrice.annual) : 0;
  const price = billing === 'monthly' ? monthly : annual;
  const savings = monthly > 0 && annual > 0 ? Math.round(monthly * 12 - annual) : 0;
  const savingsPct = monthly > 0 && annual > 0 ? Math.round(((monthly * 12 - annual) / (monthly * 12)) * 100) : 0;

  const handlePurchase = async () => {
    if (!addOn?.feature_key) return;
    try {
      setError(null);
      const order = await onPurchase(addOn.feature_key, billing);
      if (order && window.Razorpay) {
        new window.Razorpay({
          key: order.razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          name: 'SkillPassport',
          description: `${addOn.feature_name} - ${billing === 'monthly' ? 'Monthly' : 'Annual'}`,
          order_id: order.orderId,
          handler: () => { onClose(); window.location.reload(); },
          prefill: { email: order.userEmail, name: order.userName },
          theme: { color: '#4f46e5' }
        }).open();
      }
    } catch (e) {
      setError(e.message || 'Purchase failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{addOn?.feature_name || 'Premium'}</h2>
              <p className="text-gray-500 text-xs">Choose your plan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {monthly === 0 && annual === 0 ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading pricing...</p>
            </div>
          ) : (
            <>
              {/* Billing options */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    billing === 'monthly' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-xs text-gray-500 mb-1">Monthly</p>
                  <p className="text-xl font-bold text-gray-900">₹{monthly}</p>
                  <p className="text-xs text-gray-400">/month</p>
                  {billing === 'monthly' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setBilling('annual')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    billing === 'annual' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {savingsPct > 0 && (
                    <span className="absolute -top-2 right-3 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                      SAVE {savingsPct}%
                    </span>
                  )}
                  <p className="text-xs text-gray-500 mb-1">Annual</p>
                  <p className="text-xl font-bold text-gray-900">₹{annual}</p>
                  <p className="text-xs text-gray-400">/year</p>
                  {billing === 'annual' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-xl mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-gray-900">₹{price}</span>
                </div>
                {billing === 'annual' && savings > 0 && (
                  <p className="text-emerald-600 text-sm mt-1">You save ₹{savings} per year</p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>
              )}

              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isPurchasing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing...</>
                ) : (
                  <>Subscribe Now <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Cancel anytime • Secure payment
              </p>
            </>
          )}
        </div>
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
