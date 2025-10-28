import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowsUpDownIcon,
  ChevronDownIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { PipelineSortOptions, PipelineSortField, SortDirection } from '../../../types/recruiter';

interface PipelineSortMenuProps {
  sortOptions: PipelineSortOptions;
  onSortChange: (options: PipelineSortOptions) => void;
}

interface SortOption {
  field: PipelineSortField;
  label: string;
  description: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: 'candidate_name', label: 'Name', description: 'Sort by candidate name' },
  { field: 'ai_score', label: 'AI Score', description: 'Sort by AI assessment score' },
  { field: 'added_at', label: 'Date Added', description: 'Sort by when added to pipeline' },
  { field: 'updated_at', label: 'Last Updated', description: 'Sort by last activity' },
  { field: 'next_action_date', label: 'Next Action Date', description: 'Sort by scheduled next action' },
  { field: 'stage_changed_at', label: 'Stage Changed', description: 'Sort by last stage change' },
  { field: 'source', label: 'Source', description: 'Sort by candidate source' },
  { field: 'department', label: 'Department', description: 'Sort by department' },
  { field: 'location', label: 'Location', description: 'Sort by location' }
];

const PipelineSortMenu: React.FC<PipelineSortMenuProps> = ({ sortOptions, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSortFieldChange = (field: PipelineSortField) => {
    onSortChange({ ...sortOptions, field });
    setIsOpen(false);
  };

  const toggleDirection = () => {
    const newDirection: SortDirection = sortOptions.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ ...sortOptions, direction: newDirection });
  };

  const currentSortOption = SORT_OPTIONS.find(opt => opt.field === sortOptions.field);
  const isDefaultSort = sortOptions.field === 'updated_at' && sortOptions.direction === 'desc';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Sort Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
          !isDefaultSort
            ? 'bg-primary-50 border-primary-300 text-primary-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ArrowsUpDownIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Sort</span>
        {!isDefaultSort && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
            {currentSortOption?.label}
            {sortOptions.direction === 'asc' ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            )}
          </span>
        )}
        <ChevronDownIcon 
          className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Sort By</span>
              <button
                onClick={toggleDirection}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded transition-colors"
              >
                {sortOptions.direction === 'asc' ? (
                  <>
                    <ArrowUpIcon className="h-3 w-3" />
                    Ascending
                  </>
                ) : (
                  <>
                    <ArrowDownIcon className="h-3 w-3" />
                    Descending
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="max-h-96 overflow-y-auto">
            {SORT_OPTIONS.map((option) => {
              const isSelected = sortOptions.field === option.field;
              
              return (
                <button
                  key={option.field}
                  onClick={() => handleSortFieldChange(option.field)}
                  className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <CheckIcon className="h-5 w-5 text-primary-600" />
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${
                      isSelected ? 'text-primary-900' : 'text-gray-900'
                    }`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {!isDefaultSort && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  onSortChange({ field: 'updated_at', direction: 'desc' });
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              >
                Reset to Default
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PipelineSortMenu;
