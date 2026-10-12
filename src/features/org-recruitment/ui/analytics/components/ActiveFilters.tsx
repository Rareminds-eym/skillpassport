/**
 * Active Filters Component
 * Displays active filter chips with remove functionality
 */

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters';
import type { FilterState } from '../types';

const PRESET_LABELS: Record<string, string> = {
  last_7_days: 'Last 7 Days',
  last_30_days: 'Last 30 Days',
  last_90_days: 'Last 90 Days',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  last_quarter: 'Last Quarter',
  this_year: 'This Year',
  year_to_date: 'Year to Date',
  all_time: 'All Time',
  custom: 'Custom Range',
};

interface FilterChip {
  key: keyof FilterState;
  label: string;
  value: string;
  icon?: string;
}

export function ActiveFilters() {
  const { filters, clearFilter, resetFilters, activeFilterCount, hasActiveFilters } = useAnalyticsFilters();

  // Build list of active filter chips
  const getActiveChips = (): FilterChip[] => {
    const chips: FilterChip[] = [];

    // Date range chip
    if (filters.dateRange.preset !== 'last_30_days') {
      const label = PRESET_LABELS[filters.dateRange.preset] || 'Date Range';
      let displayValue = label;
      
      if (filters.dateRange.preset === 'custom' && filters.dateRange.from && filters.dateRange.to) {
        const formatDate = (dateStr: string) => {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
        displayValue = `${formatDate(filters.dateRange.from)} - ${formatDate(filters.dateRange.to)}`;
      }
      
      chips.push({
        key: 'dateRange',
        label: '📅',
        value: displayValue,
      });
    }

    // Department chips
    filters.departments.forEach((dept) => {
      chips.push({
        key: 'departments',
        label: '🏢',
        value: dept,
      });
    });

    // Location chips
    filters.locations.forEach((loc) => {
      chips.push({
        key: 'locations',
        label: '📍',
        value: loc,
      });
    });

    // Job type chips
    filters.jobTypes.forEach((type) => {
      chips.push({
        key: 'jobTypes',
        label: '💼',
        value: type,
      });
    });

    // Recruiter chips
    filters.recruiters.forEach((recruiter) => {
      chips.push({
        key: 'recruiters',
        label: '👤',
        value: recruiter,
      });
    });

    // Status chips
    filters.status?.forEach((status) => {
      chips.push({
        key: 'status',
        label: '📊',
        value: status,
      });
    });

    // Priority chips
    filters.priority?.forEach((priority) => {
      chips.push({
        key: 'priority',
        label: '⭐',
        value: priority,
      });
    });

    return chips;
  };

  const activeChips = getActiveChips();

  // Don't render if no active filters
  if (!hasActiveFilters) {
    return null;
  }

  // Handle chip removal
  const handleRemoveChip = (chip: FilterChip) => {
    if (chip.key === 'dateRange') {
      clearFilter('dateRange');
    } else if (chip.key === 'departments') {
      const updated = filters.departments.filter((d) => d !== chip.value);
      clearFilter('departments');
      // Re-apply remaining values
      if (updated.length > 0) {
        setTimeout(() => {
          // This is a workaround - ideally we'd have updateDepartments in context
          const event = new CustomEvent('updateFilter', { 
            detail: { key: 'departments', value: updated } 
          });
          window.dispatchEvent(event);
        }, 0);
      }
    } else if (chip.key === 'locations') {
      const updated = filters.locations.filter((l) => l !== chip.value);
      clearFilter('locations');
      if (updated.length > 0) {
        setTimeout(() => {
          const event = new CustomEvent('updateFilter', { 
            detail: { key: 'locations', value: updated } 
          });
          window.dispatchEvent(event);
        }, 0);
      }
    } else if (chip.key === 'jobTypes') {
      const updated = filters.jobTypes.filter((t) => t !== chip.value);
      clearFilter('jobTypes');
      if (updated.length > 0) {
        setTimeout(() => {
          const event = new CustomEvent('updateFilter', { 
            detail: { key: 'jobTypes', value: updated } 
          });
          window.dispatchEvent(event);
        }, 0);
      }
    } else if (chip.key === 'recruiters') {
      const updated = filters.recruiters.filter((r) => r !== chip.value);
      clearFilter('recruiters');
      if (updated.length > 0) {
        setTimeout(() => {
          const event = new CustomEvent('updateFilter', { 
            detail: { key: 'recruiters', value: updated } 
          });
          window.dispatchEvent(event);
        }, 0);
      }
    } else {
      clearFilter(chip.key);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap px-6 py-3 bg-blue-50 border-b border-blue-100">
      {/* Label */}
      <span className="text-sm font-medium text-blue-900">
        Active Filters ({activeFilterCount}):
      </span>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {activeChips.map((chip, index) => (
          <div
            key={`${chip.key}-${chip.value}-${index}`}
            className="
              inline-flex items-center gap-2 px-3 py-1.5
              bg-white border border-blue-200 rounded-full
              text-sm font-medium text-blue-700
              shadow-sm
              animate-in fade-in slide-in-from-top-2
              duration-200
            "
          >
            <span>{chip.label}</span>
            <span className="max-w-[150px] truncate">{chip.value}</span>
            <button
              onClick={() => handleRemoveChip(chip)}
              className="
                p-0.5 rounded-full
                hover:bg-blue-100
                transition-colors
              "
              aria-label={`Remove ${chip.value} filter`}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Clear All Button */}
      <button
        onClick={resetFilters}
        className="
          px-4 py-1.5 text-sm font-medium
          text-blue-700 bg-white border border-blue-200 rounded-full
          hover:bg-blue-50 hover:border-blue-300
          transition-colors
          whitespace-nowrap
        "
      >
        Clear All
      </button>
    </div>
  );
}
