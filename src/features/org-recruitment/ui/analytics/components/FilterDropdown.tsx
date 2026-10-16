/**
 * Filter Dropdown Component
 * Reusable multi-select dropdown with search functionality
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import type { FilterOption } from '../types';

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  showSelectAll?: boolean;
  multiSelect?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  searchable = true,
  showSelectAll = true,
  multiSelect = true,
  loading = false,
  icon,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Check if all options are selected
  const allSelected = useMemo(() => {
    if (options.length === 0) return false;
    return options.every((option) => selected.includes(option.value) || option.disabled);
  }, [options, selected]);

  // Handle option toggle
  const handleToggle = (value: string) => {
    if (!multiSelect) {
      onChange([value]);
      setIsOpen(false);
      return;
    }

    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      const availableValues = options
        .filter((option) => !option.disabled)
        .map((option) => option.value);
      onChange(availableValues);
    }
  };

  // Handle clear
  const handleClear = () => {
    onChange([]);
  };

  // Get display text
  const getDisplayText = (): string => {
    if (selected.length === 0) return `All ${label}`;
    if (selected.length === 1) {
      const option = options.find((o) => o.value === selected[0]);
      return option?.label || label;
    }
    return `${options.find((o) => o.value === selected[0])?.label || label} +${selected.length - 1}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 
          bg-white border rounded-lg text-sm font-medium
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-colors
          ${selected.length > 0
            ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
            : 'border-gray-300 text-gray-700'
          }
        `}
      >
        {icon}
        <span className="whitespace-nowrap">{getDisplayText()}</span>
        {selected.length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute top-full mt-2 right-0 z-50
            w-80 bg-white rounded-lg border border-gray-200 shadow-lg
            max-h-96 flex flex-col
          "
        >
          {/* Search Bar */}
          {searchable && (
            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="
                    w-full pl-9 pr-3 py-2 text-sm
                    border border-gray-300 rounded-md
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  "
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {multiSelect && (showSelectAll || selected.length > 0) && (
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              {showSelectAll && (
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
              {selected.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium ml-auto"
                >
                  Clear ({selected.length})
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No options found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2">
                {filteredOptions.map((option) => {
                  const isSelected = selected.includes(option.value);
                  const isDisabled = option.disabled;

                  return (
                    <button
                      key={option.value}
                      onClick={() => !isDisabled && handleToggle(option.value)}
                      disabled={isDisabled}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                        transition-colors text-left
                        ${isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50 cursor-pointer'
                        }
                        ${isSelected ? 'bg-blue-50' : ''}
                      `}
                    >
                      {/* Checkbox */}
                      {multiSelect && (
                        <div
                          className={`
                            w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                            ${isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300'
                            }
                          `}
                        >
                          {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                        </div>
                      )}

                      {/* Icon (if provided) */}
                      {option.icon && (
                        <span className="text-lg flex-shrink-0">{option.icon}</span>
                      )}

                      {/* Label & Count */}
                      <div className="flex-1 min-w-0">
                        <span className={`${isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                          {option.label}
                        </span>
                        {option.count !== undefined && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({option.count})
                          </span>
                        )}
                      </div>

                      {/* Single select indicator */}
                      {!multiSelect && isSelected && (
                        <CheckIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {!loading && filteredOptions.length > 0 && selected.length > 0 && multiSelect && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              {selected.length} of {options.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}
