/**
 * Example Upload Handler
 * Demonstrates how to use the R2Client in a Pages Function
 * 
 * This is a reference implementation showing the pattern for using R2Client.
 * Actual handlers will be implemented in subsequent tasks.
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
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
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!file || !filename) {
      return jsonResponse({ error: 'File and filename are required' }, 400);
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

    return jsonResponse({
      success: true,
      url: fileUrl,
      filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse({
      error: (error as Error).message || 'Upload failed',
    }, 500);
  }
};

/**
 * Example handler showing presigned URL generation
 */
export const handleExamplePresigned: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    const r2 = new R2Client(env);

    const body = await request.json() as {
      filename: string;
      contentType: string;
    };

    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return jsonResponse({
        error: 'filename and contentType are required',
      }, 400);
    }

    // Generate unique file key
    const timestamp = Date.now();
    const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const extension = filename.substring(filename.lastIndexOf('.'));
    const fileKey = `uploads/${timestamp}-${randomString}${extension}`;

    // Generate presigned URL
    const { url, headers } = await r2.generatePresignedUrl(
      fileKey,
      contentType,
      3600 // 1 hour expiration
    );

    return jsonResponse({
      success: true,
      uploadUrl: url,
      fileKey,
      headers,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return jsonResponse({
      error: (error as Error).message || 'Failed to generate presigned URL',
    }, 500);
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
      return jsonResponse({
        error: 'File key or URL is required',
      }, 400);
    }

    // Delete from R2
    await r2.delete(fileKey);

    return jsonResponse({
      success: true,
      message: 'File deleted successfully',
      key: fileKey,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return jsonResponse({
      error: (error as Error).message || 'Delete failed',
    }, 500);
  }
};

/**
 * Example handler showing file listing
 */
export const handleExampleList: PagesFunction = async (context) => {
  const { env } = context;

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

    return jsonResponse({
      success: true,
      files: filesWithUrls,
      count: filesWithUrls.length,
    });
  } catch (error) {
    console.error('List error:', error);
    return jsonResponse({
      error: (error as Error).message || 'List failed',
    }, 500);
  }
};
