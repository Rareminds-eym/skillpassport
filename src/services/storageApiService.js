/**
 * Storage API Service
 * Connects to Cloudflare Worker for file storage API calls
 * Falls back to Supabase edge functions if worker URL not configured
 */

const WORKER_URL = import.meta.env.VITE_STORAGE_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getBaseUrl = () => WORKER_URL || `${SUPABASE_URL}/functions/v1`;
const isUsingWorker = () => !!WORKER_URL;

const getAuthHeaders = (token, isFormData = false) => {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isUsingWorker() && SUPABASE_ANON_KEY) headers['apikey'] = SUPABASE_ANON_KEY;
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

  const response = await fetch(`${getBaseUrl()}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(token, true),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFile(fileKey, token) {
  const response = await fetch(`${getBaseUrl()}/delete`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ fileKey }),
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

export default {
  uploadFile,
  deleteFile,
  extractContent,
  isUsingWorker,
};
