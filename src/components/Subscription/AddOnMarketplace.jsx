/**
 * AddOnMarketplace Component
 *
 * Full marketplace view for browsing and purchasing add-ons and bundles.
 *
 * Features:
 * - Display add-ons in grid/list view
 * - Filter by category and role
 * - Show monthly/annual pricing toggle
 * - Indicate owned add-ons
 * - Bundle section with savings
 *
 * @requirement REQ-5.2 - Add-On Marketplace Component
 */

import { Filter, Grid, List, Package, Search, Sparkles, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { useAddOnCatalog } from '../../hooks/useAddOnCatalog';
import { clearFeatureAccessCache } from '../../hooks/useFeatureGate';
import addOnPaymentService from '../../services/addOnPaymentService';
import { loadRazorpayScript } from '../../services/Subscriptions/razorpayService';
import { AddOnCard } from './AddOnCard';
import { BundleCard } from './BundleCard';

/**
 * AddOnMarketplace - Full marketplace for add-ons and bundles
 *
 * @param {Object} props
 * @param {string} props.role - Filter by user role (optional)
 * @param {boolean} props.showBundles - Whether to show bundles section
 * @param {boolean} props.showHeader - Whether to show the header section (default: true)
 * @param {boolean} props.compact - Use compact layout without search/filters (default: false)
 * @param {string} props.className - Additional CSS classes
 */
export function AddOnMarketplace({
  role,
  showBundles = true,
  showHeader = true,
  compact = false,
  className = '',
}) {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { addOns, bundles, categories, addOnsByCategory, isLoading, searchAddOns } =
    useAddOnCatalog({ role });

  const {
    purchaseAddOn,
    purchaseBundle,
    isPurchasing,
    refreshAccess,
    fetchUserEntitlements,
    activeEntitlements,
  } = useSubscriptionContext();
  const [purchaseError, setPurchaseError] = useState(null);

  // Helper to check if user already owns an add-on (including cancelled but not expired)
  const isAddOnOwned = useCallback(
    (featureKey) => {
      if (!activeEntitlements) return false;
      const now = new Date();
      return activeEntitlements.some(
        (ent) =>
          ent.feature_key === featureKey &&
          (ent.status === 'active' ||
            ent.status === 'grace_period' ||
            (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now))
      );
    },
    [activeEntitlements]
  );

  // Helper to check if user owns all features in a bundle
  const isBundleFullyOwned = useCallback(
    (bundleFeatureKeys) => {
      if (!activeEntitlements || !bundleFeatureKeys?.length) return false;
      return bundleFeatureKeys.every((key) => isAddOnOwned(key));
    },
    [activeEntitlements, isAddOnOwned]
  );

  // Filter add-ons based on search and category
  const filteredAddOns = useMemo(() => {
    let result = searchTerm ? searchAddOns(searchTerm) : addOns;

    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory);
    }

    return result;
  }, [addOns, searchTerm, selectedCategory, searchAddOns]);

  // Handle add-on purchase with duplicate check
  const handlePurchaseAddOn = async (featureKey, period) => {
    try {
      setPurchaseError(null);

      // Frontend duplicate check
      if (isAddOnOwned(featureKey)) {
        setPurchaseError(
          'You already own this add-on. Access is active until your subscription expires.'
        );
        return;
      }

      // Load Razorpay script first
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPurchaseError('Failed to load payment system. Please refresh and try again.');
        return;
      }

      const orderData = await purchaseAddOn(featureKey, period);
      if (orderData && window.Razorpay) {
        initializeRazorpay(orderData, 'addon');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      // Handle specific error codes from backend
      if (
        error.message?.includes('already have') ||
        error.message?.includes('ENTITLEMENT_EXISTS')
      ) {
        setPurchaseError('You already own this add-on.');
      } else {
        setPurchaseError(error.message || 'Purchase failed');
      }
    }
  };

  // Handle bundle purchase with duplicate check
  const handlePurchaseBundle = async (bundleId, period) => {
    try {
      setPurchaseError(null);

      // Get bundle to check features
      const bundle = bundles.find((b) => b.id === bundleId);
      const bundleFeatureKeys = bundle?.bundle_features?.map((bf) => bf.feature_key) || [];

      // Frontend duplicate check
      if (isBundleFullyOwned(bundleFeatureKeys)) {
        setPurchaseError('You already own all features in this bundle.');
        return;
      }

      // Load Razorpay script first
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPurchaseError('Failed to load payment system. Please refresh and try again.');
        return;
      }

      const orderData = await purchaseBundle(bundleId, period);
      if (orderData && window.Razorpay) {
        initializeRazorpay(orderData, 'bundle');
      }
    } catch (error) {
      console.error('Bundle purchase failed:', error);
      // Handle specific error codes from backend
      if (error.message?.includes('already own') || error.message?.includes('BUNDLE_FULLY_OWNED')) {
        setPurchaseError('You already own all features in this bundle.');
      } else {
        setPurchaseError(error.message || 'Bundle purchase failed');
      }
    }
  };

  // Initialize Razorpay checkout with proper verification
  const initializeRazorpay = (orderData, type = 'addon') => {
    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'SkillPassport',
      description: orderData.addOnName || orderData.bundleName,
      order_id: orderData.orderId,
      handler: async function (response) {
        // Payment successful - verify and create entitlement
        console.log('[AddOnMarketplace] Payment successful, verifying...', response);

        try {
          let verifyResult;

          if (type === 'bundle') {
            // Use bundle verification endpoint
            verifyResult = await addOnPaymentService.verifyBundlePayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              orderData.bundleId,
              orderData.billingPeriod
            );
          } else {
            // Use addon verification endpoint
            verifyResult = await addOnPaymentService.verifyAddonPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          }

          console.log('[AddOnMarketplace] Verification result:', verifyResult);

          if (verifyResult.success) {
            console.log('[AddOnMarketplace] Payment verified and entitlement created!');
            // Clear feature access cache to force re-check
            clearFeatureAccessCache();
            // Refresh entitlements in context instead of page reload
            await Promise.all([refreshAccess(), fetchUserEntitlements()]);
          } else {
            setPurchaseError(
              `Payment verification failed: ${verifyResult.error}. Please contact support with Order ID: ${response.razorpay_order_id}`
            );
          }
        } catch (verifyError) {
          console.error('[AddOnMarketplace] Verification error:', verifyError);
          setPurchaseError(
            `Payment completed but verification failed. Please contact support with Order ID: ${response.razorpay_order_id}`
          );
        }
      },
      theme: { color: '#4F46E5' },
      modal: {
        ondismiss: () => {
          console.log('[AddOnMarketplace] Payment modal dismissed');
        },
      },
    };

    const rzp = new window.Razorpay(options);

    // Handle payment failure
    rzp.on('payment.failed', (response) => {
      console.error('[AddOnMarketplace] Payment failed:', response.error);
      setPurchaseError(
        `Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`
      );
    });

    rzp.open();
  };

  if (isLoading) {
    return <MarketplaceSkeleton />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Display */}
      {purchaseError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 text-sm">{purchaseError}</p>
            <button
              onClick={() => setPurchaseError(null)}
              className="text-red-600 text-sm underline mt-1 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header - conditionally rendered */}
      {showHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add-On Marketplace</h1>
            <p className="text-gray-600 mt-1">Enhance your experience with premium features</p>
          </div>

          {/* Billing Period Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-1 text-xs text-green-600">Save up to 20%</span>
            </button>
          </div>
        </div>
      )}

      {/* Compact mode: just billing toggle inline */}
      {!showHeader && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-1 text-xs text-green-600">Save up to 20%</span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters - hidden in compact mode */}
      {!compact && (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search add-ons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter & View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-lg flex items-center gap-2 transition-colors ${
                showFilters || selectedCategory
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {selectedCategory && (
                <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                  1
                </span>
              )}
            </button>

            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Filters - hidden in compact mode */}
      {!compact && showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Bundles Section */}
      {showBundles && bundles.length > 0 && !searchTerm && !selectedCategory && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Feature Bundles</h2>
            <span className="text-sm text-gray-500">Save more with bundles</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                isOwned={bundle.isOwned}
                isPartiallyOwned={bundle.isPartiallyOwned}
                ownedCount={bundle.ownedCount}
                billingPeriod={billingPeriod}
                onPurchase={handlePurchaseBundle}
                isPurchasing={isPurchasing}
              />
            ))}
          </div>
        </section>
      )}

      {/* Add-ons Section */}
      <section>
        {!compact && (
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedCategory ? `${selectedCategory.replace(/_/g, ' ')} Add-ons` : 'All Add-ons'}
            </h2>
            <span className="text-sm text-gray-500">{filteredAddOns.length} available</span>
          </div>
        )}

        {filteredAddOns.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No add-ons found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-indigo-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredAddOns.map((addOn) => (
              <AddOnCard
                key={addOn.feature_key}
                addOn={addOn}
                isOwned={addOn.isOwned}
                billingPeriod={billingPeriod}
                onPurchase={handlePurchaseAddOn}
                isPurchasing={isPurchasing}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAddOns.map((addOn) => (
              <AddOnCard
                key={addOn.feature_key}
                addOn={addOn}
                isOwned={addOn.isOwned}
                billingPeriod={billingPeriod}
                onPurchase={handlePurchaseAddOn}
                isPurchasing={isPurchasing}
                className="max-w-none"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Loading skeleton for marketplace
 */
function MarketplaceSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-48 bg-gray-200 rounded" />
      </div>

      <div className="h-12 bg-gray-200 rounded-lg" />

      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-xl" />
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default AddOnMarketplace;
