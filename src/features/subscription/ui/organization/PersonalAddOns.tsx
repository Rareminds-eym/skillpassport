/**
 * PersonalAddOns Component
 * 
 * Displays self-purchased add-ons and available add-ons for purchase.
 * Provides clear separation from organization-provided features.
 * 
 * Requirements: 5.1, 5.2, 5.5
 */

import {
    Calendar,
    Check,
    ChevronRight,
    Clock,
    Package,
    Plus,
    Sparkles,
    Star
} from 'lucide-react';
import { memo, useMemo, useState } from 'react';

interface PurchasedAddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  purchaseDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  features: string[];
}

interface AvailableAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'annual' | 'one-time';
  features: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

interface PersonalAddOnsProps {
  purchasedAddOns: PurchasedAddOn[];
  availableAddOns: AvailableAddOn[];
  onPurchase: (addOnId: string) => void;
  onManage: (addOnId: string) => void;
  className?: string;
}

function PersonalAddOns({
  purchasedAddOns,
  availableAddOns,
  onPurchase,
  onManage,
  className = '',
}: PersonalAddOnsProps) {
  const [showAllAvailable, setShowAllAvailable] = useState(false);

  // Filter out already purchased add-ons from available
  const filteredAvailable = useMemo(() => {
    const purchasedIds = new Set(purchasedAddOns.map((a) => a.id));
    return availableAddOns.filter((a) => !purchasedIds.has(a.id));
  }, [purchasedAddOns, availableAddOns]);

  const displayedAvailable = showAllAvailable
    ? filteredAvailable
    : filteredAvailable.slice(0, 3);

  const activeAddOns = purchasedAddOns.filter((a) => a.isActive);
  const expiredAddOns = purchasedAddOns.filter((a) => !a.isActive);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Personal Add-Ons</h3>
            <p className="text-sm text-gray-500">
              Enhance your experience with additional features
            </p>
          </div>
        </div>
      </div>

      {/* Purchased Add-Ons */}
      {purchasedAddOns.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h4 className="font-medium text-gray-900">
              Your Add-Ons ({activeAddOns.length} active)
            </h4>
          </div>
          <div className="divide-y divide-gray-100">
            {activeAddOns.map((addOn) => (
              <PurchasedAddOnCard
                key={addOn.id}
                addOn={addOn}
                onManage={() => onManage(addOn.id)}
              />
            ))}
            {expiredAddOns.length > 0 && (
              <div className="px-6 py-3 bg-gray-50">
                <p className="text-sm text-gray-500">
                  {expiredAddOns.length} expired add-on{expiredAddOns.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available Add-Ons */}
      {filteredAvailable.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Available Add-Ons</h4>
              </div>
              <span className="text-sm text-purple-600">
                {filteredAvailable.length} available
              </span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedAvailable.map((addOn) => (
              <AvailableAddOnCard
                key={addOn.id}
                addOn={addOn}
                onPurchase={() => onPurchase(addOn.id)}
              />
            ))}
          </div>
          {filteredAvailable.length > 3 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowAllAvailable(!showAllAvailable)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                {showAllAvailable ? 'Show less' : `View all ${filteredAvailable.length} add-ons`}
                <ChevronRight className={`w-4 h-4 transition-transform ${showAllAvailable ? 'rotate-90' : ''}`} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {purchasedAddOns.length === 0 && filteredAvailable.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Add-Ons Available
          </h4>
          <p className="text-sm text-gray-500">
            Check back later for new add-ons to enhance your experience.
          </p>
        </div>
      )}
    </div>
  );
}

// Purchased Add-On Card Component
interface PurchasedAddOnCardProps {
  addOn: PurchasedAddOn;
  onManage: () => void;
}

function PurchasedAddOnCard({ addOn, onManage }: PurchasedAddOnCardProps) {
  const daysUntilExpiry = useMemo(() => {
    if (!addOn.expiryDate) return null;
    const now = new Date();
    const expiry = new Date(addOn.expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [addOn.expiryDate]);

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-medium text-gray-900">{addOn.name}</h5>
            {addOn.isActive ? (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                Expired
              </span>
            )}
          </div>
          {addOn.description && (
            <p className="text-sm text-gray-500 mb-2">{addOn.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Purchased {new Date(addOn.purchaseDate).toLocaleDateString()}
            </span>
            {addOn.expiryDate && (
              <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-amber-600' : ''}`}>
                <Clock className="w-3 h-3" />
                {isExpiringSoon
                  ? `Expires in ${daysUntilExpiry} days`
                  : `Expires ${new Date(addOn.expiryDate).toLocaleDateString()}`}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onManage}
          className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          Manage
        </button>
      </div>
      {addOn.features.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {addOn.features.slice(0, 3).map((feature, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              <Check className="w-3 h-3" />
              {feature}
            </span>
          ))}
          {addOn.features.length > 3 && (
            <span className="text-xs text-gray-500">
              +{addOn.features.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Available Add-On Card Component
interface AvailableAddOnCardProps {
  addOn: AvailableAddOn;
  onPurchase: () => void;
}

function AvailableAddOnCard({ addOn, onPurchase }: AvailableAddOnCardProps) {
  const billingLabel = {
    monthly: '/month',
    annual: '/year',
    'one-time': ' one-time',
  }[addOn.billingCycle];

  return (
    <div className="relative p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all">
      {/* Badges */}
      <div className="absolute -top-2 -right-2 flex gap-1">
        {addOn.isPopular && (
          <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-medium rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" />
            Popular
          </span>
        )}
        {addOn.isNew && (
          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
            New
          </span>
        )}
      </div>

      <h5 className="font-medium text-gray-900 mb-1">{addOn.name}</h5>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{addOn.description}</p>

      <div className="mb-3">
        <span className="text-xl font-bold text-gray-900">₹{addOn.price}</span>
        <span className="text-sm text-gray-500">{billingLabel}</span>
      </div>

      <ul className="space-y-1 mb-4">
        {addOn.features.slice(0, 3).map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
            <Check className="w-3 h-3 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={onPurchase}
        className="w-full py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add to Cart
      </button>
    </div>
  );
}

export default memo(PersonalAddOns);
