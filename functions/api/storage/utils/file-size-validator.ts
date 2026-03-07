import { getFileSizeLimit, formatFileSize, type UploadContext } from '../config/fileSizeLimits';

export interface BackendValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

export interface BackendValidationOptions {
  context: UploadContext | string;
  userId?: string;
  filename?: string;
}

export function validateFileSizeBackend(
  fileSize: number,
  options: BackendValidationOptions
): BackendValidationResult {
  const config = getFileSizeLimit(options.context);
  
  if (fileSize <= 0) {
    console.error('🚨 [SECURITY] Empty file upload attempt:', {
      userId: options.userId,
      filename: options.filename,
      context: options.context,
      timestamp: new Date().toISOString()
    });
    
    return {
      valid: false,
      error: 'File is empty',
      statusCode: 400
    };
  }
  
  if (fileSize > config.maxSize) {
    console.error('🚨 [SECURITY] Oversized file upload attempt:', {
      userId: options.userId,
      filename: options.filename,
      context: options.context,
      fileSize,
      maxSize: config.maxSize,
      timestamp: new Date().toISOString()
    });
    
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${config.displaySize} for ${config.description}`,
      statusCode: 413  // Payload Too Large
    };
  }
  
  return {
    valid: true
  };
}

export function createFileSizeError(
  context: UploadContext | string,
  actualSize: number
): { error: string; maxSize: string; actualSize: string } {
  const config = getFileSizeLimit(context);
  return {
    error: `File size exceeds limit for ${config.description}`,
    maxSize: config.displaySize,
    actualSize: formatFileSize(actualSize)
  };
}
