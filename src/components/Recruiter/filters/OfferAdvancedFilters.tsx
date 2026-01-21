import React, { useState } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

export interface OfferFilters {
  status?: string[];
  candidateName?: string;
  jobTitle?: string;
  ctcBandMin?: number;
  ctcBandMax?: number;
  offeredCtcMin?: number;
  offeredCtcMax?: number;
  offerDateFrom?: string;
  offerDateTo?: string;
  expiryDateFrom?: string;
  expiryDateTo?: string;
  templates?: string[];
  sentVia?: string[];
  benefits?: string[];
}

export interface OfferSortOptions {
  field:
    | 'inserted_at'
    | 'updated_at'
    | 'offer_date'
    | 'expiry_date'
    | 'candidate_name'
    | 'job_title'
    | 'offered_ctc'
    | 'status'
    | 'template'
    | 'response_date';
  direction: 'asc' | 'desc';
  nullsPosition?: 'first' | 'last';
  secondarySort?: {
    field:
      | 'inserted_at'
      | 'updated_at'
      | 'offer_date'
      | 'expiry_date'
      | 'candidate_name'
      | 'job_title';
    direction: 'asc' | 'desc';
  };
}

interface OfferAdvancedFiltersProps {
  filters: OfferFilters;
  onFiltersChange: (filters: OfferFilters) => void;
  onReset: () => void;
  availableTemplates?: string[];
  availableSentVia?: string[];
  availableBenefits?: string[];
}

const STATUS_OPTIONS = ['pending', 'accepted', 'rejected', 'expired', 'withdrawn'];
const SENT_VIA_OPTIONS = ['email', 'portal', 'sms', 'whatsapp'];

const OfferAdvancedFilters: React.FC<OfferAdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  availableTemplates = [],
  availableSentVia = SENT_VIA_OPTIONS,
  availableBenefits = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active filters
  const activeFilterCount =
    (filters.status?.length || 0) +
    (filters.candidateName ? 1 : 0) +
    (filters.jobTitle ? 1 : 0) +
    (filters.ctcBandMin !== undefined ? 1 : 0) +
    (filters.ctcBandMax !== undefined ? 1 : 0) +
    (filters.offeredCtcMin !== undefined ? 1 : 0) +
    (filters.offeredCtcMax !== undefined ? 1 : 0) +
    (filters.offerDateFrom ? 1 : 0) +
    (filters.offerDateTo ? 1 : 0) +
    (filters.expiryDateFrom ? 1 : 0) +
    (filters.expiryDateTo ? 1 : 0) +
    (filters.templates?.length || 0) +
    (filters.sentVia?.length || 0) +
    (filters.benefits?.length || 0);

  const toggleArrayFilter = (key: keyof OfferFilters, value: string) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [key]: newValues,
    });
  };

  const updateFilter = (key: keyof OfferFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const FilterSection = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-200 last:border-b-0 px-6 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
          isExpanded || activeFilterCount > 0
            ? 'bg-primary-50 border-primary-300 text-primary-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Advanced Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Filter Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setIsExpanded(false)}
          />

          {/* Slide-in Panel from Right */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-6 w-6 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 font-medium">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                  </span>
                  <button
                    onClick={onReset}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <>
                {/* Status Filter */}
                <FilterSection title="Status" icon={CheckCircleIcon}>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => {
                      const isSelected = filters.status?.includes(status);
                      return (
                        <button
                          key={status}
                          onClick={() => toggleArrayFilter('status', status)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>

                {/* Candidate & Job Search */}
                <FilterSection title="Search" icon={UserIcon}>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Candidate name..."
                      value={filters.candidateName || ''}
                      onChange={(e) => updateFilter('candidateName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Job title..."
                      value={filters.jobTitle || ''}
                      onChange={(e) => updateFilter('jobTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </FilterSection>

                {/* CTC Range */}
                <FilterSection title="Offered CTC Range" icon={CurrencyDollarIcon}>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min (LPA)"
                      value={filters.offeredCtcMin || ''}
                      onChange={(e) =>
                        updateFilter(
                          'offeredCtcMin',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      placeholder="Max (LPA)"
                      value={filters.offeredCtcMax || ''}
                      onChange={(e) =>
                        updateFilter(
                          'offeredCtcMax',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </FilterSection>

                {/* Date Ranges */}
                <FilterSection title="Offer Date Range" icon={CalendarIcon}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">From</label>
                      <input
                        type="date"
                        value={filters.offerDateFrom || ''}
                        onChange={(e) => updateFilter('offerDateFrom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">To</label>
                      <input
                        type="date"
                        value={filters.offerDateTo || ''}
                        onChange={(e) => updateFilter('offerDateTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </FilterSection>

                <FilterSection title="Expiry Date Range" icon={ClockIcon}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">From</label>
                      <input
                        type="date"
                        value={filters.expiryDateFrom || ''}
                        onChange={(e) => updateFilter('expiryDateFrom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">To</label>
                      <input
                        type="date"
                        value={filters.expiryDateTo || ''}
                        onChange={(e) => updateFilter('expiryDateTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </FilterSection>

                {/* Templates */}
                {availableTemplates.length > 0 && (
                  <FilterSection title="Templates" icon={DocumentTextIcon}>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableTemplates.map((template) => {
                        const isSelected = filters.templates?.includes(template);
                        return (
                          <label
                            key={template}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleArrayFilter('templates', template)}
                              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{template}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FilterSection>
                )}

                {/* Sent Via */}
                <FilterSection title="Sent Via" icon={BriefcaseIcon}>
                  <div className="flex flex-wrap gap-2">
                    {availableSentVia.map((method) => {
                      const isSelected = filters.sentVia?.includes(method);
                      return (
                        <button
                          key={method}
                          onClick={() => toggleArrayFilter('sentVia', method)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>

                {/* Benefits */}
                {availableBenefits.length > 0 && (
                  <FilterSection title="Benefits" icon={CheckCircleIcon}>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableBenefits.map((benefit) => {
                        const isSelected = filters.benefits?.includes(benefit);
                        return (
                          <label
                            key={benefit}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleArrayFilter('benefits', benefit)}
                              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{benefit}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FilterSection>
                )}
              </>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
              <button
                onClick={onReset}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="absolute top-full left-0 mt-2 flex flex-wrap gap-2 max-w-4xl z-10">
          {filters.status?.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
            >
              {status}
              <button
                onClick={() => toggleArrayFilter('status', status)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.candidateName && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Candidate: {filters.candidateName}
              <button
                onClick={() => updateFilter('candidateName', '')}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.jobTitle && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              Job: {filters.jobTitle}
              <button
                onClick={() => updateFilter('jobTitle', '')}
                className="hover:bg-purple-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OfferAdvancedFilters;
