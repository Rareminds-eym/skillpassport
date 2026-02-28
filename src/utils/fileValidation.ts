import { getFileSizeLimit, type UploadContext } from '../config/fileSizeLimits';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
  context?: UploadContext;
}

export interface FileValidationOptions {
  context: UploadContext | string;
  allowedTypes?: string[];
  customMaxSize?: number;  // Override config if needed
}

/**
 * Validates a file's size against the configured limit for the given upload context
 * @param file - The file to validate
 * @param options - Validation options including context and optional overrides
 * @returns FileValidationResult with validation status and error message if invalid
 */
export function validateFileSize(
  file: File,
  options: FileValidationOptions
): FileValidationResult {
  const config = getFileSizeLimit(options.context);
  const maxSize = options.customMaxSize || config.maxSize;
  
  if (file.size === 0) {
    return {
      valid: false,
      error: `File "${file.name}" is empty.`,
      file,
      context: options.context as UploadContext
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is ${config.displaySize}.`,
      file,
      context: options.context as UploadContext
    };
  }
  
  return {
    valid: true,
    file,
    context: options.context as UploadContext
  };
}

/**
 * Validates multiple files against the configured limit for the given upload context
 * @param files - Array of files to validate
 * @param options - Validation options including context and optional overrides
 * @returns Array of FileValidationResult for each file
 */
export function validateMultipleFiles(
  files: File[],
  options: FileValidationOptions
): FileValidationResult[] {
  return files.map(file => validateFileSize(file, options));
}

/**
 * Extracts a user-friendly error message from a validation result
 * @param result - The validation result to extract error message from
 * @returns Error message string, or empty string if validation passed
 */
export function getValidationErrorMessage(
  result: FileValidationResult
): string {
  if (result.valid) return '';
  return result.error || 'File validation failed';
}
