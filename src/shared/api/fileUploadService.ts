/**
 * File Upload Service for Cloudflare R2 Storage
 * Handles document uploads for faculty onboarding
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('file-upload');

const STORAGE_API_URL = 'https://storage-api.dark-mode-d021.workers.dev';

interface ErrorWithCode {
  code?: unknown;
}

interface ErrorWithMessage {
  message?: unknown;
  error?: unknown;
}

function isErrorWithCode(err: unknown): err is ErrorWithCode {
  return typeof err === 'object' && err !== null && 'code' in err;
}

function isErrorWithMessage(err: unknown): err is ErrorWithMessage {
  return typeof err === 'object' && err !== null && ('message' in err || 'error' in err);
}

function extractErrorCode(err: unknown): string | undefined {
  if (!isErrorWithCode(err)) return undefined;
  const code = err.code;
  if (typeof code === 'string') return code;
  if (typeof code === 'number') return String(code);
  return undefined;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isErrorWithMessage(err)) {
    const msg = err.message || err.error;
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object' && msg !== null) return JSON.stringify(msg);
  }
  if (typeof err === 'string') return err;
  return 'Unknown error occurred';
}

function ensureErrorObject(err: unknown): Error {
  if (err instanceof Error) return err;
  const msg = extractErrorMessage(err);
  return new Error(msg);
}

/**
 * Get authentication token from current session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      const errorCode = extractErrorCode(error);
      logger.error('Failed to get session', ensureErrorObject(error), { code: errorCode });
      return null;
    }
    return session?.access_token || null;
  } catch (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('Error retrieving auth token', ensureErrorObject(error), { message: errorMsg });
    return null;
  }
}

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload a single file to R2 storage
 */
export const uploadFile = async (
  file: File,
  folder: string = 'documents'
): Promise<UploadResult> => {
  try {
    // Get authentication token
    const token = await getAuthToken();
    
    if (!token) {
      return {
        success: false,
        error: 'Authentication required. Please log in.',
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const filename = `${folder}/${timestamp}_${randomString}.${fileExtension}`;

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);

    // Upload to Cloudflare Worker
    const response = await fetch(`${STORAGE_API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error('Authentication failed. Please refresh the page and log in again.');
      }

      const errorMsg = extractErrorMessage(errorData);
      throw new Error(errorMsg || `Upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      const errorMsg = extractErrorMessage(result);
      throw new Error(errorMsg || 'Upload failed');
    }

    return {
      success: true,
      url: result.url,
      filename: result.filename,
    };
  } catch (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('File upload error', ensureErrorObject(error), { folder, fileName: file.name, message: errorMsg });
    return {
      success: false,
      error: errorMsg,
    };
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
  files: File[],
  folder: string = 'documents'
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(file, folder);
    results.push(result);
  }

  return results;
};

/**
 * Get document access URL (for viewing)
 */
export const getDocumentUrl = (fileUrl: string, mode: 'inline' | 'download' = 'inline'): string => {
  const encodedUrl = encodeURIComponent(fileUrl);
  return `${STORAGE_API_URL}/document-access?url=${encodedUrl}&mode=${mode}`;
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      logger.error('Authentication required to delete file', new Error('No auth token'), { fileUrl });
      return false;
    }

    const response = await fetch(`${STORAGE_API_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url: fileUrl }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please refresh the page and log in again.');
      }
      throw new Error(`Delete failed: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    const errorMsg = extractErrorMessage(error);
    logger.error('File delete error', ensureErrorObject(error), { fileUrl, message: errorMsg });
    return false;
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (file: File, options?: {
  maxSize?: number; // in MB
  allowedTypes?: string[];
}): { valid: boolean; error?: string } => {
  const maxSize = options?.maxSize || 10; // 10MB default
  const allowedTypes = options?.allowedTypes || ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  
  // Check file size
  if (file.size > maxSize * 1024 * 1024) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize}MB`,
    };
  }
  
  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
};