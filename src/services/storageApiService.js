/**
 * Storage API Service
 * Connects to Cloudflare Worker for file storage API calls
 */

const WORKER_URL = import.meta.env.VITE_STORAGE_API_URL;

if (!WORKER_URL) {
  console.warn('⚠️ VITE_STORAGE_API_URL not configured. Storage API calls will fail.');
}

const getBaseUrl = () => {
  if (!WORKER_URL) {
    throw new Error('VITE_STORAGE_API_URL environment variable is required');
  }
  return WORKER_URL;
};

const getAuthHeaders = (token, isFormData = false) => {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Upload a file to R2 storage
 */
export async function uploadFile(file, { folder = 'uploads', filename, contentType }, token) {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);
  if (filename) formData.append('filename', filename);
  if (contentType) formData.append('contentType', contentType);

  try {
    const response = await fetch(`${getBaseUrl()}/upload`, {
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

      // Provide more specific error messages
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

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFile(fileUrl, token) {
  const response = await fetch(`${getBaseUrl()}/delete`, {
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
export async function extractContent(fileUrl, token) {
  const response = await fetch(`${getBaseUrl()}/extract-content`, {
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

/**
 * Get presigned URL for large file upload
 */
export async function getPresignedUrl(
  { filename, contentType, fileSize, courseId, lessonId },
  token
) {
  const response = await fetch(`${getBaseUrl()}/presigned`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ filename, contentType, fileSize, courseId, lessonId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get presigned URL');
  }

  return response.json();
}

/**
 * Confirm upload after direct-to-R2 upload completes
 */
export async function confirmUpload({ fileKey, fileName, fileSize, fileType }, token) {
  const response = await fetch(`${getBaseUrl()}/confirm`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ fileKey, fileName, fileSize, fileType }),
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
export async function getFileUrl(fileKey, token) {
  const response = await fetch(`${getBaseUrl()}/get-url`, {
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
export async function listFiles(courseId, lessonId, token) {
  const response = await fetch(`${getBaseUrl()}/files/${courseId}/${lessonId}`, {
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
 * @param {string} pdfBase64 - Base64 encoded PDF content
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} userId - User ID
 * @param {string} filename - Optional custom filename
 * @param {string} token - Auth token (optional)
 */
export async function uploadPaymentReceipt(pdfBase64, paymentId, userId, filename, token) {
  const response = await fetch(`${getBaseUrl()}/upload-payment-receipt`, {
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
 * @param {string} fileKey - The R2 file key for the receipt
 * @param {string} mode - 'download' or 'inline'
 */
export function getPaymentReceiptUrl(fileKey, mode = 'download') {
  return `${getBaseUrl()}/payment-receipt?key=${encodeURIComponent(fileKey)}&mode=${mode}`;
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
