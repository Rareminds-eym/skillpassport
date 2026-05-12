// ✅ Runtime values
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
// ✅ Type-only — erased at compile time, safe under isolatedModules
import type { KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: string | boolean;
  className?: string;
  inputClassName?: string;
  allowOnlyNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const OtpInput = React.memo<OtpInputProps>(({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  error = false,
  className = '',
  inputClassName = '',
  allowOnlyNumbers = true,
  size = 'md',
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Holds the OTP value that should trigger verification after the
  // parent state update has flushed. null = no pending verification.
  const pendingVerification = useRef<string | null>(null);

  // Normalize value to match length
  const normalizedValue = useMemo(() => {
    return value.slice(0, length).padEnd(length, '');
  }, [value, length]);

  // Check if OTP is complete
  const isOtpComplete = useCallback((otpValue: string): boolean => {
    return otpValue.length === length && /^\d+$/.test(otpValue);
  }, [length]);

  // Focus management
  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  }, [length]);

  // Validate character input
  const isValidChar = useCallback((char: string): boolean => {
    if (allowOnlyNumbers) {
      return /^\d$/.test(char);
    }
    return /^[a-zA-Z0-9]$/.test(char);
  }, [allowOnlyNumbers]);

  // Trigger verification with the exact OTP value
  const triggerVerification = useCallback((otpValue: string) => {
    // Parent's disabled state will prevent duplicate calls
    if (!onComplete || disabled) {
      return;
    }

    if (isOtpComplete(otpValue)) {
      // Call onComplete with the exact OTP value
      onComplete(otpValue);
    }
  }, [onComplete, disabled, isOtpComplete]);

  // Deferred verification: fires AFTER React commits the onChange update
  // This ensures the parent's state has caught up before onComplete is called
  useEffect(() => {
    // value prop here reflects the parent's committed state after onChange
    if (pendingVerification.current !== null &&
        value === pendingVerification.current   // confirm parent caught up
    ) {
      const otpToVerify = pendingVerification.current;
      pendingVerification.current = null;     // clear before calling to prevent
                                              // double-fire if effect re-runs
      triggerVerification(otpToVerify);
    }
  }, [value, triggerVerification]);

  // Handle single character input
  const handleChange = useCallback((index: number, e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const inputValue = e.target.value;
    const lastChar = inputValue.slice(-1);

    if (!lastChar || !isValidChar(lastChar)) {
      return;
    }

    const newValueArray = normalizedValue.split('');
    newValueArray[index] = lastChar;
    const newValue = newValueArray.join('').replace(/\s/g, '');

    onChange(newValue);

    // Auto-focus next input
    if (index < length - 1) {
      focusInput(index + 1);
    }

    // Stage verification to fire after parent state update
    // CRITICAL: Pass the exact newValue, not state
    if (isOtpComplete(newValue)) {
      pendingVerification.current = newValue;
    }
  }, [normalizedValue, length, onChange, focusInput, isValidChar, disabled, isOtpComplete]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        if (normalizedValue[index]) {
          // Clear current digit
          const newValueArray = normalizedValue.split('');
          newValueArray[index] = '';
          onChange(newValueArray.join('').replace(/\s/g, ''));
        } else if (index > 0) {
          // Move to previous input and clear it
          focusInput(index - 1);
          const newValueArray = normalizedValue.split('');
          newValueArray[index - 1] = '';
          onChange(newValueArray.join('').replace(/\s/g, ''));
        }
        break;

      case 'Delete':
        e.preventDefault();
        if (normalizedValue[index]) {
          const newValueArray = normalizedValue.split('');
          newValueArray[index] = '';
          onChange(newValueArray.join('').replace(/\s/g, ''));
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          focusInput(index - 1);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (index < length - 1) {
          focusInput(index + 1);
        }
        break;

      case 'Home':
        e.preventDefault();
        focusInput(0);
        break;

      case 'End':
        e.preventDefault();
        focusInput(length - 1);
        break;

      default:
        // Prevent non-numeric input if allowOnlyNumbers is true
        if (allowOnlyNumbers && !/^\d$/.test(e.key) && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
        }
        break;
    }
  }, [normalizedValue, length, onChange, focusInput, allowOnlyNumbers, disabled]);

  // Handle paste
  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Filter valid characters
    const validChars = pastedData
      .split('')
      .filter(isValidChar)
      .slice(0, length)
      .join('');

    if (validChars) {
      onChange(validChars);

      // Focus the next empty input or the last input
      const nextIndex = Math.min(validChars.length, length - 1);
      focusInput(nextIndex);

      // Stage verification to fire after parent state update
      if (isOtpComplete(validChars)) {
        pendingVerification.current = validChars;
      }
    }
  }, [length, onChange, focusInput, isValidChar, disabled, isOtpComplete]);

  // Handle focus - select all text
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (!disabled) {
      e.target.select();
    }
  }, [disabled]);

  // Handle click - select all text
  const handleClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    if (!disabled) {
      (e.target as HTMLInputElement).select();
    }
  }, [disabled]);

  // Size classes
  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'w-10 h-12 text-lg';
      case 'lg':
        return 'w-16 h-20 text-3xl';
      case 'md':
      default:
        return 'w-14 h-14 text-2xl';
    }
  }, [size]);

  // Stable callback ref factory: handles both mount (el = HTMLInputElement)
  // and unmount (el = null) correctly without causing re-renders
  const setInputRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex gap-3 ${className}`} role="group" aria-label="OTP input">
        {Array.from({ length }, (_, index) => {
          const digit = normalizedValue[index] || '';
          const isError = Boolean(error);

          return (
            <input
              key={index}
              ref={setInputRef(index)}
              type="text"
              inputMode={allowOnlyNumbers ? 'numeric' : 'text'}
              pattern={allowOnlyNumbers ? '[0-9]*' : '[a-zA-Z0-9]*'}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={handleFocus}
              onClick={handleClick}
              disabled={disabled}
              autoFocus={autoFocus && index === 0}
              aria-label={`Digit ${index + 1} of ${length}`}
              aria-invalid={isError}
              className={`
                ${sizeClasses}
                text-center font-semibold rounded-xl
                border-2 transition-all duration-200 outline-none
                ${isError 
                  ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-100 animate-shake' 
                  : digit 
                    ? 'border-blue-500 bg-blue-50 text-blue-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-text hover:border-gray-300'}
                ${inputClassName}
              `}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          );
        })}
      </div>
      {typeof error === 'string' && error && (
        <div className="text-sm text-red-600 text-center mt-1" role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  );
});

OtpInput.displayName = 'OtpInput';

export default OtpInput;
