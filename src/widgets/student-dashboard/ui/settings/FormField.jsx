import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable form field component with built-in validation and error display
 */
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  as = 'input',
  rows = 3,
  options = [],
  helpText = null,
  maxLength = null,
}) => {
  const hasError = error && error.trim() !== '';
  
  const baseInputClasses = `w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${inputClassName}`;

  const handleChange = (e) => {
    if (onChange) {
      onChange(name, e.target.value);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(name, e.target.value);
    }
  };

  const renderInput = () => {
    if (as === 'textarea') {
      return (
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={baseInputClasses}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
        />
      );
    }

    if (as === 'select') {
      return (
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={baseInputClasses}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={baseInputClasses}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
      />
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {renderInput()}
        
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>

      {hasError && (
        <p
          id={`${name}-error`}
          className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}

      {!hasError && helpText && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}

      {maxLength && (
        <p className="text-xs text-gray-400 text-right">
          {(value || '').length} / {maxLength}
        </p>
      )}
    </div>
  );
};

export default FormField;
