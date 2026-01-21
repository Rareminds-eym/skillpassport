/**
 * PricingBreakdown Component
 *
 * Displays a detailed breakdown of organization subscription pricing including:
 * - Base price per seat
 * - Subtotal
 * - Volume discount
 * - Tax (GST)
 * - Final amount
 */

import { BadgePercent, Calculator, Receipt, Tag } from 'lucide-react';
import { memo, useMemo } from 'react';

export interface PricingBreakdownData {
  basePrice: number;
  seatCount: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  pricePerSeat: number;
}

interface PricingBreakdownProps {
  pricing: PricingBreakdownData;
  billingCycle?: 'monthly' | 'annual';
  showPerSeatPrice?: boolean;
  compact?: boolean;
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function PricingBreakdown({
  pricing,
  billingCycle = 'monthly',
  showPerSeatPrice = true,
  compact = false,
  className = '',
}: PricingBreakdownProps) {
  const hasDiscount = pricing.discountPercentage > 0;

  const annualSavings = useMemo(() => {
    if (billingCycle === 'annual') {
      // Assume 2 months free for annual billing
      return (pricing.subtotal * 2) / 12;
    }
    return 0;
  }, [billingCycle, pricing.subtotal]);

  if (compact) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">
            {pricing.seatCount} seat{pricing.seatCount !== 1 ? 's' : ''}
          </span>
          <span className="font-bold text-gray-900">{formatCurrency(pricing.finalAmount)}</span>
        </div>
        {hasDiscount && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <BadgePercent className="w-4 h-4" />
            <span>{pricing.discountPercentage}% volume discount applied</span>
          </div>
        )}
        {showPerSeatPrice && (
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(pricing.pricePerSeat)}/seat/
            {billingCycle === 'annual' ? 'year' : 'month'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Pricing Summary</h3>
        </div>
      </div>

      {/* Breakdown */}
      <div className="p-5 space-y-3">
        {/* Base price */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Tag className="w-4 h-4" />
            <span>Base price × {pricing.seatCount} seats</span>
          </div>
          <span className="text-gray-900">
            {formatCurrency(pricing.basePrice)} × {pricing.seatCount}
          </span>
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatCurrency(pricing.subtotal)}</span>
        </div>

        {/* Volume discount */}
        {hasDiscount && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <BadgePercent className="w-4 h-4" />
              <span>Volume discount ({pricing.discountPercentage}%)</span>
            </div>
            <span className="text-green-600 font-medium">
              -{formatCurrency(pricing.discountAmount)}
            </span>
          </div>
        )}

        {/* Annual savings */}
        {billingCycle === 'annual' && annualSavings > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <Receipt className="w-4 h-4" />
              <span>Annual billing savings</span>
            </div>
            <span className="text-green-600 font-medium">
              ~{formatCurrency(annualSavings)}/year
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 my-2" />

        {/* After discount */}
        {hasDiscount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">After discount</span>
            <span className="text-gray-900">
              {formatCurrency(pricing.subtotal - pricing.discountAmount)}
            </span>
          </div>
        )}

        {/* Tax */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">GST (18%)</span>
          <span className="text-gray-900">{formatCurrency(pricing.taxAmount)}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-2" />

        {/* Final amount */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(pricing.finalAmount)}
            </span>
            <span className="text-gray-500 text-sm ml-1">
              /{billingCycle === 'annual' ? 'year' : 'month'}
            </span>
          </div>
        </div>

        {/* Per seat price */}
        {showPerSeatPrice && (
          <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
            Effective price: {formatCurrency(pricing.pricePerSeat)}/seat/
            {billingCycle === 'annual' ? 'year' : 'month'}
          </div>
        )}
      </div>

      {/* Discount badge */}
      {hasDiscount && (
        <div className="bg-green-50 px-5 py-3 border-t border-green-100">
          <div className="flex items-center justify-center gap-2 text-green-700 text-sm font-medium">
            <BadgePercent className="w-4 h-4" />
            <span>
              You're saving {formatCurrency(pricing.discountAmount)} with volume discount!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PricingBreakdown);
