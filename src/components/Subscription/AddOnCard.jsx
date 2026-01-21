/**
 * AddOnCard Component
 *
 * Displays a single add-on with pricing, description, and purchase options.
 *
 * Features:
 * - Display add-on name, description, price
 * - Show "Owned" badge if user has entitlement
 * - "Add to Cart" or "Buy Now" button
 * - Annual savings highlight
 *
 * @requirement REQ-5.3 - Add-On Card Component
 */

import { Check, Clock, ShoppingCart, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';

/**
 * AddOnCard - Displays a single add-on
 *
 * @param {Object} props
 * @param {Object} props.addOn - Add-on data object
 * @param {boolean} props.isOwned - Whether user owns this add-on
 * @param {string} props.billingPeriod - Current billing period selection ('monthly' | 'annual')
 * @param {Function} props.onPurchase - Handler for purchase button click
 * @param {Function} props.onAddToCart - Handler for add to cart button click
 * @param {boolean} props.showAddToCart - Whether to show add to cart button
 * @param {boolean} props.isPurchasing - Whether purchase is in progress
 * @param {string} props.className - Additional CSS classes
 */
export function AddOnCard({
  addOn,
  isOwned = false,
  billingPeriod = 'monthly',
  onPurchase,
  onAddToCart,
  showAddToCart = false,
  isPurchasing = false,
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!addOn) return null;

  const monthlyPrice = addOn.addon_price_monthly || 0;
  const annualPrice = addOn.addon_price_annual || 0;
  const currentPrice = billingPeriod === 'monthly' ? monthlyPrice : annualPrice;

  // Calculate annual savings
  const annualSavings = monthlyPrice * 12 - annualPrice;
  const savingsPercentage =
    monthlyPrice > 0 ? Math.round((annualSavings / (monthlyPrice * 12)) * 100) : 0;

  // Get category icon
  const CategoryIcon = getCategoryIcon(addOn.category);

  return (
    <div
      className={`
        relative bg-white rounded-xl border transition-all duration-300
        ${
          isOwned
            ? 'border-green-200 bg-green-50/30'
            : isHovered
              ? 'border-indigo-300 shadow-lg shadow-indigo-100'
              : 'border-gray-200 hover:border-indigo-200'
        }
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Owned Badge */}
      {isOwned && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
          <Check className="w-3 h-3" />
          Owned
        </div>
      )}

      {/* Annual Savings Badge */}
      {!isOwned && billingPeriod === 'annual' && savingsPercentage > 0 && (
        <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full">
          Save {savingsPercentage}%
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Icon */}
          <div
            className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${isOwned ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}
          `}
          >
            <CategoryIcon className="w-5 h-5" />
          </div>

          {/* Title & Category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{addOn.feature_name}</h3>
            <span className="text-xs text-gray-500 capitalize">
              {addOn.category?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {addOn.addon_description || 'Enhance your experience with this premium feature.'}
        </p>

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">₹{currentPrice}</span>
            <span className="text-gray-500 text-sm">
              /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>

          {/* Show monthly equivalent for annual */}
          {billingPeriod === 'annual' && (
            <p className="text-xs text-gray-500 mt-1">
              ₹{Math.round(annualPrice / 12)}/mo billed annually
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isOwned ? (
            <button
              disabled
              className="flex-1 py-2.5 px-4 bg-green-100 text-green-700 font-medium rounded-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Active
            </button>
          ) : (
            <>
              {showAddToCart && onAddToCart && (
                <button
                  onClick={() => onAddToCart(addOn)}
                  className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Add to cart"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                </button>
              )}

              <button
                onClick={() => onPurchase?.(addOn.feature_key, billingPeriod)}
                disabled={isPurchasing}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPurchasing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Subscribe
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AddOnCardCompact - Compact version for lists
 */
export function AddOnCardCompact({
  addOn,
  isOwned = false,
  billingPeriod = 'monthly',
  onPurchase,
  className = '',
}) {
  if (!addOn) return null;

  const currentPrice =
    billingPeriod === 'monthly' ? addOn.addon_price_monthly : addOn.addon_price_annual;

  return (
    <div
      className={`
      flex items-center justify-between p-4 bg-white rounded-lg border
      ${isOwned ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}
      ${className}
    `}
    >
      <div className="flex items-center gap-3">
        {isOwned && (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
        <div>
          <h4 className="font-medium text-gray-900">{addOn.feature_name}</h4>
          <p className="text-sm text-gray-500">
            ₹{currentPrice}/{billingPeriod === 'monthly' ? 'mo' : 'yr'}
          </p>
        </div>
      </div>

      {!isOwned && (
        <button
          onClick={() => onPurchase?.(addOn.feature_key, billingPeriod)}
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          Add
        </button>
      )}
    </div>
  );
}

/**
 * Get icon component based on category
 */
function getCategoryIcon(category) {
  const icons = {
    ai_features: Sparkles,
    analytics: Zap,
    integrations: Zap,
    management: Clock,
    assessments: Check,
    certificates: Check,
    support: Clock,
  };

  return icons[category] || Sparkles;
}

export default AddOnCard;
