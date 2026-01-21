import React, { useState } from 'react';
import {
  ArrowsUpDownIcon,
  XMarkIcon,
  ChevronDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { OfferSortOptions } from './OfferAdvancedFilters';

interface OfferSortButtonProps {
  sort: OfferSortOptions;
  onSortChange: (sort: OfferSortOptions) => void;
  onReset: () => void;
}

const OfferSortButton: React.FC<OfferSortButtonProps> = ({ sort, onSortChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortFieldLabels: Record<string, string> = {
    inserted_at: 'Created Date',
    updated_at: 'Last Updated',
    offer_date: 'Offer Date',
    expiry_date: 'Expiry Date',
    response_date: 'Response Date',
    candidate_name: 'Candidate Name',
    job_title: 'Job Title',
    offered_ctc: 'Offered CTC',
    status: 'Status',
    template: 'Template',
  };

  const isCustomSort =
    sort.field !== 'inserted_at' ||
    sort.direction !== 'desc' ||
    sort.secondarySort ||
    sort.nullsPosition;

  const getSortLabel = () => {
    const field = sortFieldLabels[sort.field] || sort.field;
    const direction = sort.direction === 'asc' ? '↑' : '↓';
    return `${direction} ${field}`;
  };

  return (
    <div className="relative">
      {/* Sort Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
          isOpen || isCustomSort
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ArrowsUpDownIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Sort</span>
        {isCustomSort && (
          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
            •
          </span>
        )}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowsUpDownIcon className="h-5 w-5 text-gray-700" />
                <h3 className="text-sm font-semibold text-gray-900">Sort Options</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Current Sort Display */}
            {isCustomSort && (
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                      Current:
                    </span>
                    <span className="text-sm text-blue-700 font-medium">{getSortLabel()}</span>
                  </div>
                  <button
                    onClick={() => {
                      onReset();
                      setIsOpen(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-100 rounded transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Common Sorts */}
            <div className="p-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-900 mb-3">Common Sorts</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onSortChange({
                      field: 'expiry_date',
                      direction: 'asc',
                      nullsPosition: 'last',
                    });
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all border-2 ${
                    sort.field === 'expiry_date' && sort.direction === 'asc'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ClockIcon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Expiring Soon</div>
                    <div className="text-xs text-gray-500">Urgent first</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSortChange({
                      field: 'inserted_at',
                      direction: 'desc',
                      nullsPosition: 'last',
                    });
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all border-2 ${
                    sort.field === 'inserted_at' && sort.direction === 'desc'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">🆕</span>
                  <div className="text-left">
                    <div className="text-sm font-medium">Newest First</div>
                    <div className="text-xs text-gray-500">Latest offers</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSortChange({
                      field: 'candidate_name',
                      direction: 'asc',
                      nullsPosition: 'last',
                    });
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all border-2 ${
                    sort.field === 'candidate_name' && sort.direction === 'asc'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">🔤</span>
                  <div className="text-left">
                    <div className="text-sm font-medium">A to Z</div>
                    <div className="text-xs text-gray-500">By name</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSortChange({
                      field: 'offered_ctc',
                      direction: 'desc',
                      nullsPosition: 'last',
                    });
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all border-2 ${
                    sort.field === 'offered_ctc' && sort.direction === 'desc'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CurrencyDollarIcon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Highest CTC</div>
                    <div className="text-xs text-gray-500">Top offers</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Sort */}
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-900 mb-3">Custom Sort</label>

              {/* Combined Field + Direction Selection */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sort by</label>
                  <select
                    value={sort.field}
                    onChange={(e) => onSortChange({ ...sort, field: e.target.value as any })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <optgroup label="📅 Dates">
                      <option value="inserted_at">Created Date</option>
                      <option value="updated_at">Last Updated</option>
                      <option value="offer_date">Offer Date</option>
                      <option value="expiry_date">Expiry Date</option>
                      <option value="response_date">Response Date</option>
                    </optgroup>
                    <optgroup label="👤 Candidate & Job">
                      <option value="candidate_name">Candidate Name</option>
                      <option value="job_title">Job Title</option>
                    </optgroup>
                    <optgroup label="💼 Offer Details">
                      <option value="offered_ctc">Offered CTC</option>
                      <option value="status">Status</option>
                      <option value="template">Template</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Order</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSortChange({ ...sort, direction: 'asc' })}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border-2 ${
                        sort.direction === 'asc'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>↑</span>
                        <span>Ascending</span>
                      </div>
                    </button>
                    <button
                      onClick={() => onSortChange({ ...sort, direction: 'desc' })}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border-2 ${
                        sort.direction === 'desc'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>↓</span>
                        <span>Descending</span>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {sort.direction === 'asc' ? 'A→Z, 1→9, Old→New' : 'Z→A, 9→1, New→Old'}
                  </p>
                </div>
              </div>

              {/* Advanced Options - Collapsible */}
              <details className="mt-4 group">
                <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
                  Advanced options
                </summary>
                <div className="mt-3 space-y-3 pl-1">
                  {/* Empty Values */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Empty values position
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSortChange({ ...sort, nullsPosition: 'first' })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                          sort.nullsPosition === 'first'
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        First
                      </button>
                      <button
                        onClick={() => onSortChange({ ...sort, nullsPosition: 'last' })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                          sort.nullsPosition === 'last' || !sort.nullsPosition
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Last
                      </button>
                    </div>
                  </div>

                  {/* Secondary Sort */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-gray-600">Then sort by (optional)</label>
                      {sort.secondarySort && (
                        <button
                          onClick={() => onSortChange({ ...sort, secondarySort: undefined })}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <select
                      value={sort.secondarySort?.field || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          onSortChange({
                            ...sort,
                            secondarySort: {
                              field: e.target.value as any,
                              direction: sort.secondarySort?.direction || 'desc',
                            },
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">None</option>
                      <option value="inserted_at">Created Date</option>
                      <option value="updated_at">Last Updated</option>
                      <option value="offer_date">Offer Date</option>
                      <option value="expiry_date">Expiry Date</option>
                      <option value="candidate_name">Candidate Name</option>
                      <option value="job_title">Job Title</option>
                    </select>
                    {sort.secondarySort && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            onSortChange({
                              ...sort,
                              secondarySort: { ...sort.secondarySort!, direction: 'asc' },
                            })
                          }
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            sort.secondarySort.direction === 'asc'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          ↑ Asc
                        </button>
                        <button
                          onClick={() =>
                            onSortChange({
                              ...sort,
                              secondarySort: { ...sort.secondarySort!, direction: 'desc' },
                            })
                          }
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            sort.secondarySort.direction === 'desc'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          ↓ Desc
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OfferSortButton;
