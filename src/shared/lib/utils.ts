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
