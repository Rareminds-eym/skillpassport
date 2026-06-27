import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { getApiUrl } from '@/shared/api/apiUtils';
/**
 * File Upload Service for Cloudflare R2 Storage
 * Handles document uploads for faculty onboarding
 */

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('file-upload');

const STORAGE_API_URL = getApiUrl('storage');

/**
 * Get authentication token from current session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const user = useAuthStore.getState().user; const error = null;

    if (error) {
      logger.error('Failed to get session', error instanceof Error ? error : new Error(String(error)));
      return null;
    }

    return ssoClient.getAccessToken() || null;
  } catch (error) {
    logger.error('Error retrieving auth token', error instanceof Error ? error : new Error(String(error)));
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

    // Upload to Cloudflare Worker
    const response = await ssoClient.fetch(`${STORAGE_API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle authentication errors
      if (response.status === 401) {
        throw new Error('Authentication failed. Please refresh the page and log in again.');
      }
      
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return {
      success: true,
      url: result.url,
      filename: result.filename,
    };
  } catch (error) {
    logger.error('File upload error', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
  files: File[],
  folder: string = 'documents',
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(
      file, 
      folder, 
      onProgress ? (progress) => onProgress(i, progress) : undefined
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


export const getProfileMediaUrl = async (urlOrKey: string): Promise<string | null> => {
  if (!urlOrKey) return null;

  try {
    const response = await ssoClient.fetch(`${STORAGE_API_URL}/profile-media-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlOrKey }),
    });

    if (!response.ok) {
      logger.error('Failed to get profile media URL', new Error(`HTTP ${response.status}`));
      return null;
    }

    const result = await response.json() as { data?: { url?: string } };
    return result?.data?.url ?? null;
  } catch (error) {
    logger.error('Error getting profile media URL', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    // Get authentication token
    const token = await getAuthToken();

    if (!token) {
      logger.error('Authentication required to delete file', new Error('No auth token available'));
      return false;
    }

    const response = await ssoClient.fetch(`${STORAGE_API_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify({ url: fileUrl }),
    });

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        logger.error('Authentication failed. Please refresh the page and log in again.', new Error('HTTP 401 Unauthorized'), { fileUrl });
        return false;
      }

      throw new Error(`Delete failed: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    logger.error('File delete error', error instanceof Error ? error : new Error(String(error)));
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