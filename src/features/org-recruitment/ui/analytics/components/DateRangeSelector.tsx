/**
 * Date Range Selector Component
 * Dropdown with presets and custom date range picker
 */

import { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { DateRange, DateRangePreset } from '../types';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  maxRange?: number; // maximum days allowed
}

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'year_to_date', label: 'Year to Date' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

export function DateRangeSelector({ value, onChange, maxRange = 730 }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from || '');
  const [customTo, setCustomTo] = useState(value.to || '');
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Get display label
  const getDisplayLabel = (): string => {
    const preset = PRESET_OPTIONS.find((p) => p.value === value.preset);
    if (value.preset === 'custom' && value.from && value.to) {
      return `${formatDate(value.from)} - ${formatDate(value.to)}`;
    }
    return preset?.label || 'Select Range';
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handle preset selection
  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      // Don't close dropdown for custom, show date pickers
      onChange({ preset, from: customFrom || null, to: customTo || null });
    } else {
      onChange({ preset, from: null, to: null });
      setIsOpen(false);
    }
    setError('');
  };

  // Validate custom date range
  const validateCustomRange = (from: string, to: string): string | null => {
    if (!from || !to) {
      return 'Please select both start and end dates';
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate > toDate) {
      return 'Start date must be before end date';
    }

    const daysDiff = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxRange) {
      return `Maximum range is ${maxRange} days`;
    }

    return null;
  };

  // Apply custom range
  const handleApplyCustom = () => {
    const validationError = validateCustomRange(customFrom, customTo);
    if (validationError) {
      setError(validationError);
      return;
    }

    onChange({
      preset: 'custom',
      from: customFrom,
      to: customTo,
    });
    setError('');
    setIsOpen(false);
  };

  // Clear custom dates
  const handleClearCustom = () => {
    setCustomFrom('');
    setCustomTo('');
    setError('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-4 py-2 
          bg-white border border-gray-300 rounded-lg
          text-sm font-medium text-gray-700
          hover:bg-gray-50 hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors
        "
      >
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <span>{getDisplayLabel()}</span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute top-full mt-2 right-0 z-50
            w-80 bg-white rounded-lg border border-gray-200 shadow-lg
            max-h-[500px] overflow-y-auto
          "
        >
          {/* Preset Options */}
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
              Quick Presets
            </div>
            {PRESET_OPTIONS.filter((p) => p.value !== 'custom').map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetSelect(preset.value)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm
                  transition-colors
                  ${value.preset === preset.value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Custom Range */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Custom Range
              </div>
              {(customFrom || customTo) && (
                <button
                  onClick={handleClearCustom}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <XMarkIcon className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* From Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setError('');
                  }}
                  max={customTo || undefined}
                  className="
                    w-full px-3 py-2 text-sm
                    border border-gray-300 rounded-md
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  "
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    setError('');
                  }}
                  min={customFrom || undefined}
                  max={new Date().toISOString().split('T')[0]}
                  className="
                    w-full px-3 py-2 text-sm
                    border border-gray-300 rounded-md
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  "
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              {/* Apply Button */}
              <button
                onClick={handleApplyCustom}
                disabled={!customFrom || !customTo}
                className="
                  w-full px-4 py-2 text-sm font-medium
                  bg-blue-600 text-white rounded-md
                  hover:bg-blue-700 
                  disabled:bg-gray-300 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                Apply Custom Range
              </button>
            </div>
          </div>

          {/* Info Text */}
          <div className="px-4 pb-3 text-xs text-gray-500">
            <p>Maximum range: {maxRange} days ({Math.floor(maxRange / 365)} years)</p>
          </div>
        </div>
      )}
    </div>
  );
}
