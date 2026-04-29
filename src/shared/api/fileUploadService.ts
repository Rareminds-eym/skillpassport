/**
 * File Upload Service for Cloudflare R2 Storage
 * Handles document uploads for faculty onboarding
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('file-upload');

const STORAGE_API_URL = 'https://storage-api.dark-mode-d021.workers.dev';

interface ErrorWithCode {
  code: string | number;
}

interface ErrorWithMessage {
  message?: string;
  error?: string;
}

function isErrorWithCode(err: unknown): err is ErrorWithCode {
  if (typeof err !== 'object' || err === null || !('code' in err)) return false;
  const code = (err as Record<string, unknown>).code;
  return typeof code === 'string' || typeof code === 'number';
}

function isErrorWithMessage(err: unknown): err is ErrorWithMessage {
  if (typeof err !== 'object' || err === null) return false;
  const rec = err as Record<string, unknown>;
  const hasMessage = 'message' in rec && (typeof rec.message === 'string' || rec.message === undefined);
  const hasError = 'error' in rec && (typeof rec.error === 'string' || rec.error === undefined);
  return hasMessage || hasError;
}

function extractErrorCode(err: unknown): string | undefined {
  if (!isErrorWithCode(err)) return undefined;
  // err.code is guaranteed string | number by the type guard
  return typeof err.code === 'string' ? err.code : String(err.code);
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isErrorWithMessage(err)) {
    const msg = err.message ?? err.error;
    if (typeof msg === 'string') return msg;
  }
  if (typeof err === 'string') return err;
  // Last resort: safe serialization guarded against circular references
  try {
    return JSON.stringify(err) ?? 'Unknown error occurred';
  } catch {
    return 'Unknown error occurred';
  }
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
      const errorObj = ensureErrorObject(error);
      logger.error('Failed to get session', errorObj, { code: errorCode });
      return null;
    }
    return session?.access_token || null;
  } catch (error) {
    const errorMsg = extractErrorMessage(error);
    const errorObj = ensureErrorObject(error);
    logger.error('Error retrieving auth token', errorObj, { message: errorMsg });
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
 * @param file - The file to upload
 * @param folder - The destination folder in R2 (default: 'documents')
 * @param onProgress - Optional callback for upload progress tracking
 */
export const uploadFile = async (
  file: File,
  folder: string = 'documents',
  onProgress?: (progress: UploadProgress) => void
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

    // Use XHR when progress tracking is needed, fetch otherwise
    if (onProgress) {
      return await uploadFileWithProgress(formData, token, file, folder, onProgress);
    }

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
    const errorObj = ensureErrorObject(error);
    logger.error('File upload error', errorObj, { folder, fileName: file.name, message: errorMsg });
    return {
      success: false,
      error: errorMsg,
    };
  }
};

/**
 * Internal helper: upload using XMLHttpRequest to support progress tracking.
 *
 * Rejection vs resolution semantics mirror the fetch() path:
 *   - Network-level failures (no connectivity, DNS failure, CORS abort) → reject
 *   - HTTP-level failures (4xx/5xx) → resolve with { success: false }
 *   - Successful upload → resolve with { success: true }
 *
 * The outer uploadFile() try/catch converts any rejection into { success: false }
 * so callers always receive a well-typed UploadResult regardless of path.
 */
function uploadFileWithProgress(
  formData: FormData,
  token: string,
  file: File,
  folder: string,
  onProgress: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 401) {
        resolve({
          success: false,
          error: 'Authentication failed. Please refresh the page and log in again.',
        });
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        let errorMsg = `Upload failed: ${xhr.status}`;
        try {
          const errorData = JSON.parse(xhr.responseText) as unknown;
          const parsed = extractErrorMessage(errorData);
          if (parsed && parsed !== 'Unknown error occurred') errorMsg = parsed;
        } catch {
          // responseText is not JSON — keep the status-based message
        }
        resolve({ success: false, error: errorMsg });
        return;
      }

      try {
        const result = JSON.parse(xhr.responseText) as { success?: boolean; url?: string; filename?: string };
        if (!result.success) {
          const errorMsg = extractErrorMessage(result);
          resolve({ success: false, error: errorMsg });
          return;
        }
        resolve({ success: true, url: result.url, filename: result.filename });
      } catch {
        resolve({ success: false, error: 'Invalid response from server' });
      }
    });

    // 'error' fires on network-level failures (no response received at all).
    // Reject so the outer try/catch in uploadFile() logs and returns { success: false }.
    xhr.addEventListener('error', () => {
      const err = new Error('Network error during upload');
      logger.error('File upload network error', err, { folder, fileName: file.name });
      reject(err);
    });

    // 'abort' fires when xhr.abort() is called programmatically.
    // Reject so callers can distinguish an intentional abort from a successful upload.
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    xhr.open('POST', `${STORAGE_API_URL}/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Upload multiple files sequentially
 * @param files - Array of files to upload
 * @param folder - The destination folder in R2 (default: 'documents')
 * @param onProgress - Optional callback for per-file progress tracking.
 *                     Receives the zero-based file index and the current progress.
 */
export const uploadMultipleFiles = async (
  files: File[],
  folder: string = 'documents',
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileProgressCallback = onProgress
      ? (progress: UploadProgress) => onProgress(i, progress)
      : undefined;
    const result = await uploadFile(file, folder, fileProgressCallback);
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