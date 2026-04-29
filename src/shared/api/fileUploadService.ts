/**
 * File Upload Service for Cloudflare R2 Storage
 * Handles document uploads for faculty onboarding
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('file-upload');

const STORAGE_API_URL = 'https://storage-api.dark-mode-d021.workers.dev';

/** Fallback message used when no structured error information can be extracted. */
const UNKNOWN_ERROR_MESSAGE = 'Unknown error occurred';

/**
 * Single consolidated error extraction utility
 * Safely extracts message and code from any error type
 * Returns: { message: string, code?: string }
 * Never throws, always has valid message
 */
function extractErrorInfo(err: unknown): { message: string; code?: string } {
  // Fast path: Error instance
  if (err instanceof Error) {
    const message = err.message || UNKNOWN_ERROR_MESSAGE;
    const code = (err as any).code ? String((err as any).code) : undefined;
    return { message, code };
  }

  // String errors
  if (typeof err === 'string' && err.trim().length > 0) {
    return { message: err.trim() };
  }

  // Null/undefined
  if (err === null || err === undefined) {
    return { message: UNKNOWN_ERROR_MESSAGE };
  }

  // Object with message or error property
  if (typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const message = (
      (typeof obj.message === 'string' ? obj.message : undefined) ||
      (typeof obj.error === 'string' ? obj.error : undefined) ||
      ''
    ).trim();
    const code = (
      (typeof obj.code === 'string' ? obj.code : undefined) ||
      (typeof obj.code === 'number' ? String(obj.code) : undefined)
    );
    if (message || code) {
      return { message: message || UNKNOWN_ERROR_MESSAGE, code };
    }
  }

  // Last resort: safe JSON serialization
  try {
    const serialized = JSON.stringify(err);
    return { message: (serialized && serialized.length > 2) ? serialized : UNKNOWN_ERROR_MESSAGE };
  } catch {
    return { message: UNKNOWN_ERROR_MESSAGE };
  }
}

function extractErrorCode(err: unknown): string | undefined {
  return extractErrorInfo(err).code;
}

function extractErrorMessage(err: unknown): string {
  return extractErrorInfo(err).message;
}

function ensureErrorObject(err: unknown): Error {
  const { message } = extractErrorInfo(err);
  return new Error(message);
}

/**
 * Get authentication token from current session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    // Supabase returns a typed AuthError object when the session call fails.
    // We only enter this branch when error is a truthy AuthError, so
    // ensureErrorObject always receives a real object — never undefined.
    if (error != null) {
      const errorCode = extractErrorCode(error);
      const errorObj = ensureErrorObject(error);
      logger.error('Failed to get session', errorObj, { code: errorCode });
      return null;
    }
    return session?.access_token ?? null;
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
 * IMPORTANT: This function is only ever called from inside uploadFile()'s top-level
 * try/catch, which converts any rejection into { success: false }. Do not call this
 * function directly from outside this module.
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
          if (parsed && parsed !== UNKNOWN_ERROR_MESSAGE) errorMsg = parsed;
        } catch {
          // responseText is not JSON — keep the status-based message
        }
        resolve({ success: false, error: errorMsg });
        return;
      }

      // Parse and validate the success response shape at runtime before
      // accessing any properties — JSON.parse returns `any` and the server
      // response is untrusted input.
      let parsed: unknown;
      try {
        parsed = JSON.parse(xhr.responseText) as unknown;
      } catch {
        resolve({ success: false, error: 'Invalid response from server' });
        return;
      }

      if (
        parsed === null ||
        typeof parsed !== 'object' ||
        !('success' in parsed)
      ) {
        resolve({ success: false, error: 'Unexpected response shape from server' });
        return;
      }

      const result = parsed as Record<string, unknown>;

      if (!result.success) {
        const errorMsg = extractErrorMessage(result);
        resolve({ success: false, error: errorMsg });
        return;
      }

      resolve({
        success: true,
        url: typeof result.url === 'string' ? result.url : undefined,
        filename: typeof result.filename === 'string' ? result.filename : undefined,
      });
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

    // 'timeout' fires when the request exceeds the timeout threshold.
    // Reject so the outer try/catch in uploadFile() logs and returns { success: false }.
    xhr.addEventListener('timeout', () => {
      const err = new Error('Upload request timeout');
      logger.error('File upload timeout', err, { folder, fileName: file.name });
      reject(err);
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
    // Bind the current index into the progress callback so each file reports
    // its own slot. When onProgress is omitted the upload runs without tracking.
    const result = await uploadFile(
      files[i],
      folder,
      onProgress ? (progress) => onProgress(i, progress) : undefined,
    );
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