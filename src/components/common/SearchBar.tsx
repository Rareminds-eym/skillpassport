import React from 'react';
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
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
  showClearButton = true,
  disabled = false,
  size = 'md'
}) => {
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

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className={`relative ${className}`}>
      <MagnifyingGlassIcon 
        className={`${iconSizes[size]} text-gray-400 absolute ${iconPositions[size]} top-1/2 -translate-y-1/2 pointer-events-none`} 
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full ${sizeClasses[size]} border border-gray-300 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className}
        `}
      />
      {showClearButton && value && !disabled && (
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