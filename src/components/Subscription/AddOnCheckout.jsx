/**
 * AddOnCheckout Component
 * 
 * Checkout flow for purchasing add-ons and bundles.
 * 
 * Features:
 * - Cart summary with selected add-ons/bundles
 * - Discount code input
 * - Billing period selection
 * - Total calculation with discounts
 * - Razorpay payment integration
 * 
 * @requirement REQ-5.5 - Add-On Checkout Component
 */

import {
    AlertCircle,
    CreditCard,
    Package,
    ShoppingCart,
    Sparkles,
    Tag,
    Trash2,
    X
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { clearFeatureAccessCache } from '../../hooks/useFeatureGate';
import addOnPaymentService from '../../services/addOnPaymentService';
import { loadRazorpayScript } from '../../services/Subscriptions/razorpayService';

/**
 * AddOnCheckout - Full checkout component
 * 
 * @param {Object} props
 * @param {Array} props.cartItems - Items in cart [{type: 'addon'|'bundle', item: Object}]
 * @param {Function} props.onRemoveItem - Handler for removing item from cart
 * @param {Function} props.onClearCart - Handler for clearing cart
 * @param {Function} props.onSuccess - Handler for successful purchase
 * @param {string} props.className - Additional CSS classes
 */
export function AddOnCheckout({
  cartItems = [],
  onRemoveItem,
  onClearCart,
  onSuccess,
  className = ''
}) {
  const { purchaseAddOn, purchaseBundle, isPurchasing, refreshAccess, fetchUserEntitlements, activeEntitlements } = useSubscriptionContext();
  
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountError, setDiscountError] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  // Helper to check if user already owns an add-on (including cancelled but not expired)
  const isAddOnOwned = useCallback((featureKey) => {
    if (!activeEntitlements) return false;
    const now = new Date();
    return activeEntitlements.some(ent => 
      ent.feature_key === featureKey && 
      (ent.status === 'active' || 
       ent.status === 'grace_period' ||
       (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now))
    );
  }, [activeEntitlements]);

  // Helper to check if user owns all features in a bundle
  const isBundleFullyOwned = useCallback((bundleFeatureKeys) => {
    if (!activeEntitlements || !bundleFeatureKeys?.length) return false;
    return bundleFeatureKeys.every(key => isAddOnOwned(key));
  }, [activeEntitlements, isAddOnOwned]);

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0;
    
    cartItems.forEach(({ type, item }) => {
      if (type === 'addon') {
        subtotal += billingPeriod === 'monthly' 
          ? item.addon_price_monthly 
          : item.addon_price_annual;
      } else if (type === 'bundle') {
        subtotal += billingPeriod === 'monthly' 
          ? item.monthly_price 
          : item.annual_price;
      }
    });

    const discount = appliedDiscount?.totalDiscount || 0;
    const total = Math.max(subtotal - discount, 0);

    return { subtotal, discount, total };
  }, [cartItems, billingPeriod, appliedDiscount]);

  // Apply discount code
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    setIsValidatingCode(true);
    setDiscountError(null);

    try {
      const items = cartItems.map(({ type, item }) => ({
        featureKey: type === 'addon' ? item.feature_key : `bundle_${item.id}`,
        price: billingPeriod === 'monthly'
          ? (type === 'addon' ? item.addon_price_monthly : item.monthly_price)
          : (type === 'addon' ? item.addon_price_annual : item.annual_price),
        billingPeriod
      }));

      const result = await addOnPaymentService.applyDiscountCode(discountCode, items);

      if (result.success) {
        setAppliedDiscount(result.data);
        setDiscountError(null);
      } else {
        setDiscountError(result.error);
        setAppliedDiscount(null);
      }
    } catch (error) {
      setDiscountError(error.message || 'Failed to apply discount code');
      setAppliedDiscount(null);
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Remove discount
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError(null);
  };

  // Process checkout with duplicate check
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setCheckoutError(null);

    try {
      // Check for duplicate purchases before proceeding
      const { type, item } = cartItems[0];
      
      if (type === 'addon') {
        if (isAddOnOwned(item.feature_key)) {
          setCheckoutError('You already own this add-on. Access is active until your subscription expires.');
          return;
        }
      } else if (type === 'bundle') {
        const bundleFeatureKeys = item.bundle_features?.map(bf => bf.feature_key) || [];
        if (isBundleFullyOwned(bundleFeatureKeys)) {
          setCheckoutError('You already own all features in this bundle.');
          return;
        }
      }
      
      // Load Razorpay script first
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setCheckoutError('Failed to load payment system. Please refresh and try again.');
        return;
      }
      
      // For simplicity, process first item (can be extended for multi-item cart)
      let orderData;

      if (type === 'addon') {
        orderData = await purchaseAddOn(item.feature_key, billingPeriod);
      } else {
        orderData = await purchaseBundle(item.id, billingPeriod);
      }

      if (orderData && window.Razorpay) {
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'SkillPassport',
          description: type === 'addon' 
            ? `${item.feature_name} (${billingPeriod})`
            : `${item.name} Bundle (${billingPeriod})`,
          order_id: orderData.orderId,
          handler: async function(response) {
            // Payment successful - verify and create entitlement
            console.log('[AddOnCheckout] Payment successful, verifying...', response);
            
            try {
              const verifyResult = await addOnPaymentService.verifyAddonPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );
              
              if (verifyResult.success) {
                console.log('[AddOnCheckout] Payment verified and entitlement created!');
                // Clear feature access cache to force re-check
                clearFeatureAccessCache();
                // Refresh entitlements in context instead of page reload
                await Promise.all([
                  refreshAccess(),
                  fetchUserEntitlements()
                ]);
                onSuccess?.();
                onClearCart?.();
              } else {
                setCheckoutError(`Payment verification failed: ${verifyResult.error}. Please contact support with Order ID: ${response.razorpay_order_id}`);
              }
            } catch (verifyError) {
              console.error('[AddOnCheckout] Verification error:', verifyError);
              setCheckoutError(`Payment completed but verification failed. Please contact support with Order ID: ${response.razorpay_order_id}`);
            }
          },
          theme: { color: '#4F46E5' },
          modal: {
            ondismiss: () => {
              console.log('[AddOnCheckout] Payment modal dismissed');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        
        // Handle payment failure
        rzp.on('payment.failed', (response) => {
          console.error('[AddOnCheckout] Payment failed:', response.error);
          setCheckoutError(`Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`);
        });
        
        rzp.open();
      }
    } catch (error) {
      setCheckoutError(error.message || 'Checkout failed');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-8 text-center ${className}`}>
        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Your cart is empty</h3>
        <p className="text-gray-500">Add some add-ons to get started</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Checkout ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})
        </h2>
        <button
          onClick={onClearCart}
          className="text-sm text-gray-500 hover:text-red-600"
        >
          Clear all
        </button>
      </div>

      {/* Billing Period */}
      <div className="p-4 border-b border-gray-200">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Billing Period
        </label>
        <div className="flex bg-gray-100 rounded-lg p-1">
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
      </div>

      {/* Cart Items */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        {cartItems.map(({ type, item }, index) => (
          <CartItem
            key={`${type}-${item.id || item.feature_key}`}
            type={type}
            item={item}
            billingPeriod={billingPeriod}
            onRemove={() => onRemoveItem?.(index)}
          />
        ))}
      </div>

      {/* Discount Code */}
      <div className="p-4 border-b border-gray-200">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Discount Code
        </label>
        
        {appliedDiscount ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-700">{appliedDiscount.code}</span>
              <span className="text-green-600">-₹{appliedDiscount.totalDiscount}</span>
            </div>
            <button
              onClick={handleRemoveDiscount}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleApplyDiscount}
              disabled={isValidatingCode || !discountCode.trim()}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isValidatingCode ? 'Checking...' : 'Apply'}
            </button>
          </div>
        )}

        {discountError && (
          <p className="text-sm text-red-600 mt-2">{discountError}</p>
        )}
      </div>

      {/* Totals */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">₹{totals.subtotal}</span>
        </div>
        
        {totals.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Discount</span>
            <span className="text-green-600">-₹{totals.discount}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-100">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">
            ₹{totals.total}
            <span className="text-sm font-normal text-gray-500">
              /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
            </span>
          </span>
        </div>
      </div>

      {/* Checkout Error */}
      {checkoutError && (
        <div className="p-4 border-b border-gray-200">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{checkoutError}</p>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <div className="p-4">
        <button
          onClick={handleCheckout}
          disabled={isPurchasing || cartItems.length === 0}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPurchasing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay ₹{totals.total}
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}

/**
 * CartItem - Single item in cart
 */
function CartItem({ type, item, billingPeriod, onRemove }) {
  const price = type === 'addon'
    ? (billingPeriod === 'monthly' ? item.addon_price_monthly : item.addon_price_annual)
    : (billingPeriod === 'monthly' ? item.monthly_price : item.annual_price);

  const name = type === 'addon' ? item.feature_name : item.name;
  const Icon = type === 'addon' ? Sparkles : Package;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{name}</h4>
          <p className="text-sm text-gray-500 capitalize">{type}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-medium text-gray-900">
          ₹{price}
        </span>
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * MiniCart - Compact cart for sidebar/header
 */
export function MiniCart({ cartItems = [], onViewCart, className = '' }) {
  const itemCount = cartItems.length;

  if (itemCount === 0) return null;

  return (
    <button
      onClick={onViewCart}
      className={`relative p-2 text-gray-600 hover:text-indigo-600 transition-colors ${className}`}
    >
      <ShoppingCart className="w-6 h-6" />
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
        {itemCount}
      </span>
    </button>
  );
}

export default AddOnCheckout;
