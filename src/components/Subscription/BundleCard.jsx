/**
 * BundleCard Component
 * 
 * Displays a bundle of add-ons with pricing and savings information.
 * 
 * Features:
 * - Display bundle name, included add-ons
 * - Show savings compared to individual purchase
 * - Expandable list of included features
 * 
 * @requirement REQ-5.4 - Bundle Card Component
 */

import { Check, ChevronDown, ChevronUp, Package, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import addOnCatalogService from '../../services/addOnCatalogService';

/**
 * BundleCard - Displays a bundle with included add-ons
 * 
 * @param {Object} props
 * @param {Object} props.bundle - Bundle data object
 * @param {boolean} props.isOwned - Whether user owns all features in bundle
 * @param {boolean} props.isPartiallyOwned - Whether user owns some features
 * @param {number} props.ownedCount - Number of owned features
 * @param {string} props.billingPeriod - Current billing period selection
 * @param {Function} props.onPurchase - Handler for purchase button click
 * @param {boolean} props.isPurchasing - Whether purchase is in progress
 * @param {string} props.className - Additional CSS classes
 */
export function BundleCard({
  bundle,
  isOwned = false,
  isPartiallyOwned = false,
  ownedCount = 0,
  billingPeriod = 'monthly',
  onPurchase,
  isPurchasing = false,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savings, setSavings] = useState(null);
  const [isLoadingSavings, setIsLoadingSavings] = useState(true);

  if (!bundle) return null;

  const monthlyPrice = bundle.monthly_price || 0;
  const annualPrice = bundle.annual_price || 0;
  const currentPrice = billingPeriod === 'monthly' ? monthlyPrice : annualPrice;
  const featureKeys = bundle.bundle_features?.map(bf => bf.feature_key) || [];
  const totalFeatures = featureKeys.length;

  // Calculate annual savings percentage
  const annualSavingsPercent = monthlyPrice > 0 
    ? Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100)
    : 0;

  // Fetch bundle savings
  useEffect(() => {
    const fetchSavings = async () => {
      setIsLoadingSavings(true);
      try {
        const result = await addOnCatalogService.calculateBundleSavings(bundle.id);
        if (result.success) {
          setSavings(result.data);
        }
      } catch (error) {
        console.error('Error fetching bundle savings:', error);
      } finally {
        setIsLoadingSavings(false);
      }
    };

    fetchSavings();
  }, [bundle.id]);

  return (
    <div className={`
      relative bg-white rounded-3xl border-2 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-2xl
      ${isOwned 
        ? 'border-emerald-500 bg-emerald-50/30' 
        : 'border-purple-300 hover:border-purple-500 hover:scale-105'
      }
      ${className}
    `}>
      {/* Popular/Recommended Badge */}
      {bundle.is_recommended && !isOwned && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-xs font-bold px-5 py-2 rounded-bl-2xl flex items-center gap-1.5 shadow-lg">
          <Star className="w-3.5 h-3.5" />
          Popular
        </div>
      )}

      {/* Owned Badge */}
      {isOwned && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-bl-2xl flex items-center gap-1.5 shadow-lg">
          <Check className="w-3.5 h-3.5" />
          Owned
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg
            ${isOwned 
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' 
              : 'bg-gradient-to-br from-purple-500 to-purple-600'
            }
          `}>
            <Package className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-2xl font-light text-slate-900 mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              {bundle.name}
            </h3>
            <p className="text-sm text-slate-600 font-light leading-relaxed">{bundle.description}</p>
          </div>
        </div>

        {/* Savings Highlight */}
        {!isOwned && savings && savings.savings > 0 && (
          <div className="mb-5 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700 font-semibold uppercase tracking-wider">Bundle Savings</span>
              <span className="text-xl font-light text-emerald-700" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
                Save ₹{Math.round(savings.savings)}/mo
              </span>
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              vs. ₹{Math.round(savings.totalIndividual)}/mo buying individually
            </p>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              ₹{currentPrice}
            </span>
            <span className="text-slate-500 font-light">
              /{billingPeriod === 'monthly' ? 'month' : 'year'}
            </span>
            {billingPeriod === 'annual' && annualSavingsPercent > 0 && (
              <span className="text-sm text-emerald-600 font-bold px-2 py-0.5 bg-emerald-100 rounded-full">
                {annualSavingsPercent}% off
              </span>
            )}
          </div>
          {billingPeriod === 'annual' && (
            <p className="text-sm text-slate-500 mt-2 font-medium">
              ₹{Math.round(annualPrice / 12)}/mo billed annually
            </p>
          )}
        </div>

        {/* Included Features Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between py-4 px-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl hover:from-slate-100 hover:to-slate-200 transition-all mb-5 border border-slate-200"
        >
          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            {totalFeatures} features included
            {isPartiallyOwned && ` (${ownedCount} owned)`}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Expanded Features List */}
        {isExpanded && (
          <div className="mb-5 space-y-3">
            {featureKeys.map((featureKey, index) => (
              <div
                key={featureKey}
                className="flex items-center gap-3 text-sm text-slate-700"
              >
                <div className="w-5 h-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="capitalize font-medium">
                  {featureKey.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        {isOwned ? (
          <button
            disabled
            className="w-full py-4 px-4 bg-emerald-100 text-emerald-700 font-semibold rounded-2xl flex items-center justify-center gap-2 border-2 border-emerald-200"
          >
            <Check className="w-5 h-5" />
            All Features Active
          </button>
        ) : (
          <button
            onClick={() => onPurchase?.(bundle.id, billingPeriod)}
            disabled={isPurchasing}
            className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
          >
            {isPurchasing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Get Bundle
              </>
            )}
          </button>
        )}

        {/* Partial Ownership Note */}
        {isPartiallyOwned && !isOwned && (
          <p className="text-xs text-amber-700 text-center mt-4 font-medium bg-amber-50 py-2 px-3 rounded-xl">
            You already own {ownedCount} of {totalFeatures} features. 
            Bundle price includes all features.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * BundleCardCompact - Compact version for sidebars
 */
export function BundleCardCompact({
  bundle,
  isOwned = false,
  billingPeriod = 'monthly',
  onPurchase,
  className = ''
}) {
  if (!bundle) return null;

  const currentPrice = billingPeriod === 'monthly' 
    ? bundle.monthly_price 
    : bundle.annual_price;
  const featureCount = bundle.bundle_features?.length || 0;

  return (
    <div className={`
      p-5 bg-white rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all
      ${isOwned ? 'border-emerald-500 bg-emerald-50/30' : 'border-purple-300 hover:border-purple-400'}
      ${className}
    `}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`
          w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
          ${isOwned ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' : 'bg-gradient-to-br from-purple-500 to-purple-600'}
        `}>
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-light text-lg text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>{bundle.name}</h4>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{featureCount} features</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-light text-2xl text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
          ₹{currentPrice}<span className="text-sm text-slate-500">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
        </span>
        
        {isOwned ? (
          <span className="text-sm text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-100 px-3 py-1.5 rounded-xl">
            <Check className="w-4 h-4" />
            Owned
          </span>
        ) : (
          <button
            onClick={() => onPurchase?.(bundle.id, billingPeriod)}
            className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Get Bundle
          </button>
        )}
      </div>
    </div>
  );
}

export default BundleCard;
