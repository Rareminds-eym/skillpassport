import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export from utils directory
export { 
  copyChartToClipboard, 
  downloadChartAsPNG, 
  downloadChartDataAsCSV 
} from './utils/chartDownload';

export { 
  getValidationErrorMessage, 
  validateFileSize, 
  validateMultipleFiles 
} from './utils/fileValidation';

export type { 
  FileValidationOptions, 
  FileValidationResult 
} from './utils/fileValidation';

export { 
  getBrowserFingerprint, 
  getDeviceContext 
} from './utils/fingerprint';

export { formatStreamId } from './utils/formatters';

export { 
  convertISBN10to13, 
  formatISBN, 
  validateISBN 
} from './utils/isbnValidator';

export { waitForElement } from './utils/domHelpers';

// Type guards and validation utilities
export const isValidObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const hasProperty = <T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> => {
  return isValidObject(obj) && prop in obj;
};

// Salary range utilities
export interface SalaryRangeObject {
  min: number;
  max: number;
}

export const isSalaryRangeObject = (value: unknown): value is SalaryRangeObject => {
  if (!isValidObject(value)) {
    return false;
  }
  return (
    'min' in value &&
    'max' in value &&
    typeof value.min === 'number' &&
    typeof value.max === 'number'
  );
};

export const formatSalaryRange = (salaryRange: unknown): string => {
  if (isSalaryRangeObject(salaryRange)) {
    return `₹${salaryRange.min}L - ₹${salaryRange.max}L`;
  }
  if (typeof salaryRange === 'string' && salaryRange !== '') {
    return salaryRange;
  }
  return 'Competitive';
};

export const getSalaryObject = (salaryRange: unknown): SalaryRangeObject => {
  if (isSalaryRangeObject(salaryRange)) {
    return { min: salaryRange.min, max: salaryRange.max };
  }
  return { min: 3, max: 15 };
};

// Development logging utilities
export const devLog = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export const devWarn = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};

export const devError = (...args: unknown[]): void => {
  console.error(...args);
};
