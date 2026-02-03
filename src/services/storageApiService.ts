/**
 * Storage API Service
 * Connects to Cloudflare Pages Function for file storage API calls
 */

import { getPagesApiUrl, getAuthHeaders as getBaseAuthHeaders } from '../utils/pagesUrl';

const API_URL = getPagesApiUrl('storage');

const getAuthHeaders = (token?: string, isFormData = false): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

interface UploadOptions {
  folder?: string;
  filename?: string;
  contentType?: string;
}

/**
 * Upload a file to R2 storage
 */
export async function uploadFile(
  file: File,
  options: UploadOptions,
  token?: string
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  if (options.folder) formData.append('folder', options.folder);
  if (options.filename) formData.append('filename', options.filename);
  if (options.contentType) formData.append('contentType', options.contentType);

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(token, true),
      body: formData,
    });

    if (!response.ok) {
      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch (e) {
        errorDetails = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please refresh the page and log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You may not have permission to upload files.');
      } else if (response.status === 413) {
        throw new Error('File too large. Please choose a smaller file.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(errorDetails.error || `Upload failed with status ${response.status}`);
      }
    }

    return response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFile(fileUrl: string, token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/delete`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ url: fileUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to delete file');
  }

  return response.json();
}

/**
 * Extract content from a document (PDF, DOCX, etc.)
 */
export async function extractContent(fileUrl: string, token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/extract-content`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ fileUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to extract content');
  }

  return response.json();
}

interface PresignedUrlParams {
  filename: string;
  contentType: string;
  fileSize: number;
  courseId?: string;
  lessonId?: string;
}

/**
 * Get presigned URL for large file upload
 */
export async function getPresignedUrl(
  params: PresignedUrlParams,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/presigned`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get presigned URL');
  }

  return response.json();
}

interface ConfirmUploadParams {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

/**
 * Confirm upload after direct-to-R2 upload completes
 */
export async function confirmUpload(
  params: ConfirmUploadParams,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/confirm`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to confirm upload');
  }

  return response.json();
}

/**
 * Get file URL for a given file key
 */
export async function getFileUrl(fileKey: string, token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/get-url`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ fileKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get file URL');
  }

  return response.json();
}

/**
 * List files for a lesson
 */
export async function listFiles(
  courseId: string,
  lessonId: string,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/files/${courseId}/${lessonId}`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to list files');
  }

  return response.json();
}

/**
 * Upload a payment receipt PDF to R2 storage
 */
export async function uploadPaymentReceipt(
  pdfBase64: string,
  paymentId: string,
  userId: string,
  filename?: string,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/upload-payment-receipt`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ pdfBase64, paymentId, userId, filename }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to upload payment receipt');
  }

  return response.json();
}

/**
 * Get payment receipt download URL
 */
export function getPaymentReceiptUrl(fileKey: string, mode: 'download' | 'inline' = 'download'): string {
  return `${API_URL}/payment-receipt?key=${encodeURIComponent(fileKey)}&mode=${mode}`;
}

export default {
  uploadFile,
  deleteFile,
  extractContent,
  getPresignedUrl,
  confirmUpload,
  getFileUrl,
  listFiles,
  uploadPaymentReceipt,
  getPaymentReceiptUrl,
};
