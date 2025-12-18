import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  debounceMs?: number; // NEW: Optional debounce delay
  onDebouncedChange?: (value: string) => void; // NEW: Callback for debounced value
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
  showClearButton = true,
  disabled = false,
  size = 'md',
  debounceMs = 0, // NEW: Default 0 = no debounce (backward compatible)
  onDebouncedChange // NEW: Optional debounced callback
}) => {
  const [internalValue, setInternalValue] = useState(value);

  // Sync internal value with prop value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounce effect - only runs if debounceMs > 0
  useEffect(() => {
    if (debounceMs > 0 && onDebouncedChange) {
      const timer = setTimeout(() => {
        onDebouncedChange(internalValue);
      }, debounceMs);
      
      return () => clearTimeout(timer);
    }
  }, [internalValue, debounceMs, onDebouncedChange]);
  const sizeClasses = {
    sm: 'py-1.5 pl-8 pr-8 text-sm',
    md: 'py-2 pl-10 pr-10 text-sm',
    lg: 'py-3 pl-12 pr-12 text-base'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const iconPositions = {
    sm: 'left-2.5',
    md: 'left-3',
    lg: 'left-4'
  };

  const clearButtonPositions = {
    sm: 'right-1.5',
    md: 'right-2',
    lg: 'right-3'
  };

  const handleInputChange = (newValue: string) => {
    setInternalValue(newValue);
    // Always call immediate onChange for controlled input
    onChange(newValue);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange('');
    onClear?.();
    // Also trigger debounced callback immediately on clear
    if (onDebouncedChange) {
      onDebouncedChange('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <MagnifyingGlassIcon 
        className={`${iconSizes[size]} text-gray-400 absolute ${iconPositions[size]} top-1/2 -translate-y-1/2 pointer-events-none`} 
      />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full ${sizeClasses[size]} border border-gray-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className}
        `}
      />
      {showClearButton && internalValue && !disabled && (
        <button
          onClick={handleClear}
          className={`absolute ${clearButtonPositions[size]} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
          aria-label="Clear search"
          type="button"
        >
          <XMarkIcon className={iconSizes[size]} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;