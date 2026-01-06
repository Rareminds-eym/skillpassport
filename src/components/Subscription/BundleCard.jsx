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
      relative bg-white rounded-xl border-2 overflow-hidden transition-all duration-300
      ${isOwned 
        ? 'border-green-300 bg-green-50/30' 
        : 'border-indigo-200 hover:border-indigo-400 hover:shadow-xl'
      }
      ${className}
    `}>
      {/* Popular/Recommended Badge */}
      {bundle.is_recommended && !isOwned && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg flex items-center gap-1">
          <Star className="w-3 h-3" />
          Popular
        </div>
      )}

      {/* Owned Badge */}
      {isOwned && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg flex items-center gap-1">
          <Check className="w-3 h-3" />
          Owned
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center
            ${isOwned 
              ? 'bg-green-100 text-green-600' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            }
          `}>
            <Package className="w-7 h-7" />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{bundle.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
          </div>
        </div>

        {/* Savings Highlight */}
        {!isOwned && savings && savings.savings > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700 font-medium">Bundle Savings</span>
              <span className="text-lg font-bold text-green-600">
                Save ₹{Math.round(savings.savings)}/mo
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              vs. ₹{Math.round(savings.totalIndividual)}/mo buying individually
            </p>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              ₹{currentPrice}
            </span>
            <span className="text-gray-500">
              /{billingPeriod === 'monthly' ? 'month' : 'year'}
            </span>
            {billingPeriod === 'annual' && annualSavingsPercent > 0 && (
              <span className="text-sm text-green-600 font-medium">
                ({annualSavingsPercent}% off)
              </span>
            )}
          </div>
          {billingPeriod === 'annual' && (
            <p className="text-sm text-gray-500 mt-1">
              ₹{Math.round(annualPrice / 12)}/mo billed annually
            </p>
          )}
        </div>

        {/* Included Features Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-4"
        >
          <span className="text-sm font-medium text-gray-700">
            {totalFeatures} features included
            {isPartiallyOwned && ` (${ownedCount} owned)`}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {/* Expanded Features List */}
        {isExpanded && (
          <div className="mb-4 space-y-2">
            {featureKeys.map((featureKey, index) => (
              <div
                key={featureKey}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="capitalize">
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
            className="w-full py-3 px-4 bg-green-100 text-green-700 font-medium rounded-lg flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            All Features Active
          </button>
        ) : (
          <button
            onClick={() => onPurchase?.(bundle.id, billingPeriod)}
            disabled={isPurchasing}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <p className="text-xs text-amber-600 text-center mt-3">
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
      p-4 bg-white rounded-lg border
      ${isOwned ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}
      ${className}
    `}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${isOwned ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}
        `}>
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
          <p className="text-xs text-gray-500">{featureCount} features</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-900">
          ₹{currentPrice}/{billingPeriod === 'monthly' ? 'mo' : 'yr'}
        </span>
        
        {isOwned ? (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <Check className="w-4 h-4" />
            Owned
          </span>
        ) : (
          <button
            onClick={() => onPurchase?.(bundle.id, billingPeriod)}
            className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Get Bundle
          </button>
        )}
      </div>
    </div>
  );
}

export default BundleCard;
