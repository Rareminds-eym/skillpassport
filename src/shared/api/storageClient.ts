/**
 * Storage Client
 *
 * Wraps file upload/download operations via authenticated Pages Function endpoints.
 * Files are uploaded directly to signed URLs (no auth header needed for the upload itself).
 *
 * Usage:
 *   const url = await getUploadUrl('profile-images', `${userId}/avatar.jpg`);
 *   await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
 */
import { apiPost } from './apiClient';

interface UploadUrlResponse {
  signedUrl: string;
  path: string;
  token: string;
}

interface DownloadUrlResponse {
  signedUrl: string;
  expiresIn: number;
}

/**
 * Get a signed upload URL for a file.
 * The returned URL can be used with a PUT request to upload the file directly.
 */
export async function getUploadUrl(
  bucket: string,
  path: string,
  contentType?: string,
): Promise<UploadUrlResponse> {
  return apiPost<UploadUrlResponse>('/storage/upload-url', {
    bucket,
    path,
    contentType,
  });
}

/**
 * Get a signed download URL for a private file.
 * @param expiresIn - URL validity in seconds (default: 3600, max: 86400)
 */
export async function getDownloadUrl(
  bucket: string,
  path: string,
  expiresIn?: number,
): Promise<DownloadUrlResponse> {
  return apiPost<DownloadUrlResponse>('/storage/download-url', {
    bucket,
    path,
    expiresIn,
  });
}

/**
 * Upload a file to Supabase Storage via signed URL.
 * Handles the full flow: get signed URL → upload file.
 *
 * @returns The storage path of the uploaded file.
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
): Promise<string> {
  const { signedUrl } = await getUploadUrl(bucket, path, file.type);

  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
  }

  return path;
}

/**
 * Get a public URL for a file in a public bucket.
 * No authentication needed — these are directly accessible.
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
