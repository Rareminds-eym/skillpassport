import React, { useState } from 'react';
import { CalendarIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  preset: '7d' | '30d' | '90d' | 'ytd' | 'custom';
  onRangeChange: (
    preset: '7d' | '30d' | '90d' | 'ytd' | 'custom',
    startDate?: string,
    endDate?: string
  ) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  preset,
  onRangeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const presetOptions = [
    { value: '7d', label: 'Last 7 days', days: 7 },
    { value: '30d', label: 'Last 30 days', days: 30 },
    { value: '90d', label: 'Last 90 days', days: 90 },
    { value: 'ytd', label: 'Year to date', days: null },
    { value: 'custom', label: 'Custom range', days: null },
  ];

  const getDateRangeText = () => {
    if (preset === 'custom' && startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return presetOptions.find((opt) => opt.value === preset)?.label || 'Select range';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getDateNDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const getYearToDateStart = () => {
    const date = new Date();
    date.setMonth(0, 1); // January 1st of current year
    return date.toISOString().split('T')[0];
  };

  const handlePresetClick = (value: '7d' | '30d' | '90d' | 'ytd' | 'custom') => {
    if (value === 'custom') {
      // Don't close dropdown for custom selection
      return;
    }

    let start = '';
    const end = getTodayString();

    if (value === 'ytd') {
      start = getYearToDateStart();
    } else {
      const days = presetOptions.find((opt) => opt.value === value)?.days || 30;
      start = getDateNDaysAgo(days);
    }

    onRangeChange(value, start, end);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onRangeChange('custom', customStart, customEnd);
      setIsOpen(false);
    }
  };

  const handleClearCustom = () => {
    setCustomStart('');
    setCustomEnd('');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
      >
        <CalendarIcon className="h-5 w-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{getDateRangeText()}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
            {/* Preset Options */}
            <div className="p-3 border-b border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Quick Select</h4>
              <div className="space-y-1">
                {presetOptions.slice(0, 4).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePresetClick(option.value as any)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      preset === option.value
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">Custom Range</h4>

              <div className="space-y-3">
                {/* Start Date */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    max={customEnd || getTodayString()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart}
                    max={getTodayString()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Date Range Info */}
                {customStart && customEnd && (
                  <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                    <span className="font-medium">
                      {Math.ceil(
                        (new Date(customEnd).getTime() - new Date(customStart).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1}{' '}
                      days
                    </span>{' '}
                    selected
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleClearCustom}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleCustomApply}
                    disabled={!customStart || !customEnd}
                    className={`flex-1 px-3 py-2 text-sm text-white rounded transition-colors font-medium ${
                      customStart && customEnd
                        ? 'bg-primary-600 hover:bg-primary-700'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;
