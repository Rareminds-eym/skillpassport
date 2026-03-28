/**
 * OrganizationPurchasePanel Component
 * 
 * A panel that appears when organization mode is active on the subscription plans page.
 * Allows admins to configure seat count, member type, and see pricing before purchase.
 */

import { Building2, ShoppingCart, X } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import MemberTypeSelector, { MemberType } from './MemberTypeSelector';
import PricingBreakdown, { PricingBreakdownData } from './PricingBreakdown';
import SeatSelector from './SeatSelector';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
}

interface OrganizationPurchasePanelProps {
  plan: Plan;
  organizationType: 'school' | 'college' | 'university';
  onPurchase: (config: OrganizationPurchaseConfig) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface OrganizationPurchaseConfig {
  planId: string;
  seatCount: number;
  memberType: MemberType;
  pricing: PricingBreakdownData;
  billingCycle: 'monthly' | 'annual';
}

function OrganizationPurchasePanel({
  plan,
  organizationType,
  onPurchase,
  onCancel,
  isLoading = false,
}: OrganizationPurchasePanelProps) {
  const [seatCount, setSeatCount] = useState(10);
  const [memberType, setMemberType] = useState<MemberType>('both');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [pricing, setPricing] = useState<PricingBreakdownData | null>(null);

  const handleSeatCountChange = useCallback(
    (count: number, newPricing: PricingBreakdownData) => {
      setSeatCount(count);
      setPricing(newPricing);
    },
    []
  );

  const handlePurchase = useCallback(() => {
    if (!pricing) return;
    
    onPurchase({
      planId: plan.id,
      seatCount,
      memberType,
      pricing,
      billingCycle,
    });
  }, [plan.id, seatCount, memberType, pricing, billingCycle, onPurchase]);

  const organizationLabel = {
    school: 'School',
    college: 'College',
    university: 'University',
  }[organizationType];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {organizationLabel} Subscription
              </h2>
              <p className="text-sm text-gray-500">{plan.name} Plan</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Billing Cycle Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Billing Cycle
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors relative ${
                  billingCycle === 'annual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Seat Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Number of Seats
            </label>
            <SeatSelector
              basePrice={plan.price}
              initialSeats={seatCount}
              onSeatCountChange={handleSeatCountChange}
              showVolumeDiscounts={true}
            />
          </div>

          {/* Member Type Selector */}
          <MemberTypeSelector
            value={memberType}
            onChange={setMemberType}
            showDescription={true}
            layout="horizontal"
          />

          {/* Pricing Breakdown */}
          {pricing && (
            <PricingBreakdown
              pricing={pricing}
              billingCycle={billingCycle}
              showPerSeatPrice={true}
            />
          )}

          {/* Plan Features */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Included Features
            </h4>
            <ul className="grid grid-cols-2 gap-2">
              {plan.features.slice(0, 6).map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={isLoading || !pricing}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Proceed to Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(OrganizationPurchasePanel);
