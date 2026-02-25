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
  className = ''
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!addOn) return null;

  const monthlyPrice = addOn.addon_price_monthly || 0;
  const annualPrice = addOn.addon_price_annual || 0;
  const currentPrice = billingPeriod === 'monthly' ? monthlyPrice : annualPrice;
  
  // Calculate annual savings
  const annualSavings = monthlyPrice * 12 - annualPrice;
  const savingsPercentage = monthlyPrice > 0 
    ? Math.round((annualSavings / (monthlyPrice * 12)) * 100) 
    : 0;

  // Get category icon
  const CategoryIcon = getCategoryIcon(addOn.category);

  return (
    <div
      className={`
        relative bg-white rounded-3xl border-2 transition-all duration-300 shadow-lg hover:shadow-2xl
        ${isOwned 
          ? 'border-emerald-500 bg-emerald-50/30' 
          : isHovered 
            ? 'border-slate-900 shadow-slate-900/10 scale-105' 
            : 'border-slate-200 hover:border-slate-300'
        }
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Owned Badge */}
      {isOwned && (
        <div className="absolute -top-3 left-6 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-xl">
          <Check className="w-3.5 h-3.5" />
          Active
        </div>
      )}

      {/* Annual Savings Badge */}
      {!isOwned && billingPeriod === 'annual' && savingsPercentage > 0 && (
        <div className="absolute -top-3 right-6 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-xs font-bold rounded-full shadow-xl">
          Save {savingsPercentage}%
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
            ${isOwned 
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' 
              : 'bg-gradient-to-br from-slate-700 to-slate-800'
            }
          `}>
            <CategoryIcon className="w-6 h-6 text-white" />
          </div>

          {/* Title & Category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-light text-xl text-slate-900 mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              {addOn.feature_name}
            </h3>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              {addOn.category?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-6 line-clamp-2 leading-relaxed font-light">
          {addOn.addon_description || 'Enhance your experience with this premium feature.'}
        </p>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              ₹{currentPrice}
            </span>
            <span className="text-slate-500 text-sm font-light">
              /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
          
          {/* Show monthly equivalent for annual */}
          {billingPeriod === 'annual' && (
            <p className="text-xs text-slate-500 mt-2 font-medium">
              ₹{Math.round(annualPrice / 12)}/mo billed annually
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isOwned ? (
            <button
              disabled
              className="flex-1 py-3.5 px-4 bg-emerald-100 text-emerald-700 font-semibold rounded-2xl flex items-center justify-center gap-2 border-2 border-emerald-200"
            >
              <Check className="w-5 h-5" />
              Active
            </button>
          ) : (
            <>
              {showAddToCart && onAddToCart && (
                <button
                  onClick={() => onAddToCart(addOn)}
                  className="p-3.5 border-2 border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-lg"
                  title="Add to cart"
                >
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                </button>
              )}
              
              <button
                onClick={() => onPurchase?.(addOn.feature_key, billingPeriod)}
                disabled={isPurchasing}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-2xl hover:from-slate-900 hover:to-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
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
  className = ''
}) {
  if (!addOn) return null;

  const currentPrice = billingPeriod === 'monthly' 
    ? addOn.addon_price_monthly 
    : addOn.addon_price_annual;

  return (
    <div className={`
      flex items-center justify-between p-5 bg-white rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all
      ${isOwned ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}
      ${className}
    `}>
      <div className="flex items-center gap-4">
        {isOwned && (
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Check className="w-4 w-4 text-white" strokeWidth={3} />
          </div>
        )}
        <div>
          <h4 className="font-light text-lg text-slate-900" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>{addOn.feature_name}</h4>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            ₹{currentPrice}/{billingPeriod === 'monthly' ? 'mo' : 'yr'}
          </p>
        </div>
      </div>

      {!isOwned && (
        <button
          onClick={() => onPurchase?.(addOn.feature_key, billingPeriod)}
          className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
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
    support: Clock
  };

  return icons[category] || Sparkles;
}

export default AddOnCard;
