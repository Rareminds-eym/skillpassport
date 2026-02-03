/**
 * Delete Handler
 * Handles file deletion from R2 storage
 * 
 * Endpoint: POST /api/storage/delete
 * 
 * Request: application/json
 * - url: string (optional) - Full URL of the file to delete
 * - key: string (optional) - File key in R2
 * 
 * At least one of url or key must be provided.
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - key: string (the deleted file key)
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { R2Client } from '../utils/r2-client';

/**
 * Handle file deletion
 */
export const handleDelete: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    // Parse request body
    const body = await request.json() as { url?: string; key?: string };
    const { url, key } = body;

    // Validate that at least one parameter is provided
    if (!url && !key) {
      return jsonResponse({ 
        error: 'Either url or key is required' 
      }, 400);
    }

    // Determine the file key
    let fileKey = key;

    // If URL is provided but key is not, extract key from URL
    if (!fileKey && url) {
      fileKey = R2Client.extractKeyFromUrl(url) || undefined;
      
      if (!fileKey) {
        return jsonResponse({ 
          error: 'Could not extract file key from URL. Please provide a valid R2 URL or file key.' 
        }, 400);
      }
    }

    // At this point, fileKey should be defined
    if (!fileKey) {
      return jsonResponse({ 
        error: 'Could not determine file key' 
      }, 400);
    }

    console.log('🗑️  Deleting file:', { originalUrl: url, fileKey });

    // Create R2 client
    const r2 = new R2Client(env);

    // Delete from R2
    await r2.delete(fileKey);

    console.log('✅ File deleted successfully from R2:', fileKey);

    return jsonResponse({
      success: true,
      message: 'File deleted successfully',
      key: fileKey,
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    return jsonResponse({
      error: (error as Error).message || 'Delete failed',
    }, 500);
  }
};
