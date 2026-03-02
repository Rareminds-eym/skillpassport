import { useState, useCallback } from 'react';
import { validateField, validateFields } from '../utils/settingsErrorHandler';

/**
 * Reusable form validation hook
 * Provides real-time field validation and error display
 */
export const useFormValidation = (initialErrors = {}) => {
  const [errors, setErrors] = useState(initialErrors);
  const [touched, setTouched] = useState({});

  /**
   * Validate a single field
   */
  const validateSingleField = useCallback((fieldName, value) => {
    const result = validateField(fieldName, value);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: result.valid ? null : result.message,
    }));

    return result.valid;
  }, []);

  /**
   * Validate multiple fields at once
   */
  const validateMultipleFields = useCallback((data, fieldNames) => {
    const result = validateFields(data, fieldNames);
    
    setErrors(result.errors);
    
    return result.valid;
  }, []);

  /**
   * Mark a field as touched (for showing errors after user interaction)
   */
  const touchField = useCallback((fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true,
    }));
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: null,
    }));
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  /**
   * Get error message for a field (only if touched)
   */
  const getFieldError = useCallback((fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  }, [errors, touched]);

  /**
   * Check if form has any errors
   */
  const hasErrors = useCallback(() => {
    return Object.values(errors).some(error => error !== null && error !== undefined);
  }, [errors]);

  return {
    errors,
    touched,
    validateSingleField,
    validateMultipleFields,
    touchField,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    hasErrors,
  };
};

export default useFormValidation;
