/**
 * SeatSelector Component
 *
 * Allows organization admins to select the number of seats for bulk subscription purchase.
 * Shows volume discount tiers and real-time price calculation.
 */

import { Minus, Plus, Users } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';

interface VolumeDiscountTier {
  minSeats: number;
  discount: number;
  label: string;
}

const VOLUME_DISCOUNT_TIERS: VolumeDiscountTier[] = [
  { minSeats: 500, discount: 30, label: '500+ seats' },
  { minSeats: 100, discount: 20, label: '100-499 seats' },
  { minSeats: 50, discount: 10, label: '50-99 seats' },
  { minSeats: 1, discount: 0, label: '1-49 seats' },
];

interface SeatSelectorProps {
  minSeats?: number;
  maxSeats?: number;
  initialSeats?: number;
  basePrice: number;
  onSeatCountChange: (seatCount: number, pricing: PricingBreakdown) => void;
  showVolumeDiscounts?: boolean;
  disabled?: boolean;
}

export interface PricingBreakdown {
  basePrice: number;
  seatCount: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  pricePerSeat: number;
}

function calculateVolumeDiscount(seatCount: number): number {
  if (seatCount >= 500) return 30;
  if (seatCount >= 100) return 20;
  if (seatCount >= 50) return 10;
  return 0;
}

function calculatePricing(basePrice: number, seatCount: number): PricingBreakdown {
  const subtotal = basePrice * seatCount;
  const discountPercentage = calculateVolumeDiscount(seatCount);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * 0.18; // 18% GST
  const finalAmount = afterDiscount + taxAmount;

  return {
    basePrice,
    seatCount,
    subtotal,
    discountPercentage,
    discountAmount,
    taxAmount,
    finalAmount,
    pricePerSeat: seatCount > 0 ? finalAmount / seatCount : 0,
  };
}

function SeatSelector({
  minSeats = 1,
  maxSeats = 10000,
  initialSeats = 10,
  basePrice,
  onSeatCountChange,
  showVolumeDiscounts = true,
  disabled = false,
}: SeatSelectorProps) {
  const [seatCount, setSeatCount] = useState(initialSeats);
  const [inputValue, setInputValue] = useState(String(initialSeats));

  // Calculate pricing whenever seat count changes
  useEffect(() => {
    const pricing = calculatePricing(basePrice, seatCount);
    onSeatCountChange(seatCount, pricing);
  }, [seatCount, basePrice, onSeatCountChange]);

  const handleIncrement = useCallback(() => {
    setSeatCount((prev) => {
      const newValue = Math.min(prev + 1, maxSeats);
      setInputValue(String(newValue));
      return newValue;
    });
  }, [maxSeats]);

  const handleDecrement = useCallback(() => {
    setSeatCount((prev) => {
      const newValue = Math.max(prev - 1, minSeats);
      setInputValue(String(newValue));
      return newValue;
    });
  }, [minSeats]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= minSeats && numValue <= maxSeats) {
        setSeatCount(numValue);
      }
    },
    [minSeats, maxSeats]
  );

  const handleInputBlur = useCallback(() => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < minSeats) {
      setSeatCount(minSeats);
      setInputValue(String(minSeats));
    } else if (numValue > maxSeats) {
      setSeatCount(maxSeats);
      setInputValue(String(maxSeats));
    }
  }, [inputValue, minSeats, maxSeats]);

  const handleQuickSelect = useCallback((seats: number) => {
    setSeatCount(seats);
    setInputValue(String(seats));
  }, []);

  const currentDiscount = calculateVolumeDiscount(seatCount);
  const currentTier = VOLUME_DISCOUNT_TIERS.find((tier) => seatCount >= tier.minSeats);

  return (
    <div className="space-y-4">
      {/* Seat Count Input */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || seatCount <= minSeats}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label="Decrease seats"
        >
          <Minus className="w-5 h-5 text-gray-600" />
        </button>

        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            min={minSeats}
            max={maxSeats}
            className="w-32 h-12 pl-10 pr-4 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100"
            aria-label="Number of seats"
          />
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || seatCount >= maxSeats}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label="Increase seats"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {[10, 25, 50, 100, 250, 500].map((seats) => (
          <button
            key={seats}
            type="button"
            onClick={() => handleQuickSelect(seats)}
            disabled={disabled || seats > maxSeats}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              seatCount === seats
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {seats}
          </button>
        ))}
      </div>

      {/* Volume Discount Indicator */}
      {showVolumeDiscounts && currentDiscount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <span className="text-green-700 font-medium">
            🎉 {currentDiscount}% volume discount applied!
          </span>
          <span className="text-green-600 text-sm ml-2">({currentTier?.label})</span>
        </div>
      )}

      {/* Volume Discount Tiers */}
      {showVolumeDiscounts && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">Volume Discounts</h4>
          <div className="grid grid-cols-4 gap-2">
            {VOLUME_DISCOUNT_TIERS.map((tier) => (
              <div
                key={tier.minSeats}
                className={`p-2 rounded-lg text-center text-xs ${
                  seatCount >= tier.minSeats &&
                  (tier.minSeats === 500 ||
                    seatCount <
                      (VOLUME_DISCOUNT_TIERS.find((t) => t.minSeats > tier.minSeats)?.minSeats ||
                        Infinity))
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="font-bold text-gray-900">
                  {tier.discount > 0 ? `${tier.discount}% off` : 'Standard'}
                </div>
                <div className="text-gray-500">{tier.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SeatSelector);
