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
} from './utils/chart-download';

export {
  getValidationErrorMessage,
  validateFileSize,
  validateMultipleFiles
} from './utils/file-validation';

export type {
  FileValidationOptions,
  FileValidationResult
} from './utils/file-validation';

export {
  getBrowserFingerprint,
  getDeviceContext
} from './utils/fingerprint';

export { formatStreamId } from './utils/formatters';

export {
  convertISBN10to13,
  formatISBN,
  validateISBN
} from './utils/isbn-validator';

export { waitForElement } from './utils/dom-helpers';
