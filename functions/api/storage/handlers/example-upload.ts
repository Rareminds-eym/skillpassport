/**
 * Example Upload Handler
 * Demonstrates how to use the R2Client in a Pages Function
 * 
 * This is a reference implementation showing the pattern for using R2Client.
 * Actual handlers will be implemented in subsequent tasks.
 */

import type { PagesFunction } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';;
import { R2Client } from '../utils/r2-client';

/**
 * Example handler showing R2Client usage
 * This demonstrates the pattern that will be used in actual handlers
 */
export const handleExampleUpload: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    // Create R2 client instance
    const r2 = new R2Client(env);

    // Example: Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as unknown as File;
    const filename = formData.get('filename') as string;

    if (!file || !filename) {
      return apiError(400, 'VALIDATION_ERROR', 'File and filename are required', request);
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    const fileUrl = await r2.upload(
      filename,
      arrayBuffer,
      file.type,
      {
        'Content-Disposition': `attachment; filename="${file.name}"`,
      }
    );

    return apiSuccess({
      url: fileUrl,
      filename,
    }, request);
  } catch (error) {
    console.error('Upload error:', error);
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message || 'Upload failed', request);
  }
};

/**
 * Example handler for the deprecated direct R2 presigned upload flow.
 */
export const handleExamplePresigned: PagesFunction = async (context) => {
  const { request } = context;

  try {
    await request.json().catch(() => undefined);
    return apiError(
      410,
      'PRESIGNED_UPLOAD_DISABLED',
      'Direct R2 presigned uploads are disabled. Use POST /api/storage/upload.',
      request
    );
  } catch (error) {
    console.error('Presigned URL error:', error);
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message || 'Presigned upload is disabled', request);
  }
};

/**
 * Example handler showing file deletion
 */
export const handleExampleDelete: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    const r2 = new R2Client(env);

    const body = await request.json() as { url?: string; key?: string };
    const { url, key } = body;

    let fileKey = key;

    // Extract key from URL if not provided directly
    if (!fileKey && url) {
      fileKey = R2Client.extractKeyFromUrl(url) || undefined;
    }

    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'File key or URL is required', request);
    }

    // Delete from R2
    await r2.delete(fileKey);

    return apiSuccess({
      message: 'File deleted successfully',
      key: fileKey,
    }, request);
  } catch (error) {
    console.error('Delete error:', error);
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message || 'Delete failed', request);
  }
};

/**
 * Example handler showing file listing
 */
export const handleExampleList: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    const r2 = new R2Client(env);

    // List files with prefix
    const files = await r2.list('uploads/');

    // Transform to include public URLs
    const filesWithUrls = files.map(file => ({
      key: file.key,
      url: r2.getPublicUrl(file.key),
      size: file.size,
      lastModified: file.lastModified.toISOString(),
    }));

    return apiSuccess({
      files: filesWithUrls,
      count: filesWithUrls.length,
    }, request);
  } catch (error) {
    console.error('List error:', error);
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message || 'List failed', request);
  }
};
