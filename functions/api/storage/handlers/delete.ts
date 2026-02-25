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
import type { AuthenticatedContext } from '../[[path]]';
import {
  validateCertificateOwnership,
  validatePaymentReceiptOwnership,
  validateUploadOwnership,
  isEducator,
  type OwnershipValidationResult,
} from '../utils/ownership';

/**
 * Validate ownership of a file based on its path pattern
 */
async function validateOwnership(
  fileKey: string,
  userId: string,
  supabaseAdmin: any
): Promise<OwnershipValidationResult> {
  // Check for certificate ownership
  if (fileKey.startsWith('certificates/')) {
    return validateCertificateOwnership(fileKey, userId);
  }

  // Check for payment receipt ownership
  if (fileKey.startsWith('payment_pdf/')) {
    return validatePaymentReceiptOwnership(fileKey, userId);
  }

  // Check for upload ownership
  if (fileKey.startsWith('uploads/')) {
    return validateUploadOwnership(fileKey, userId);
  }

  // Check for course materials (educators only)
  if (fileKey.startsWith('courses/')) {
    const isEducatorUser = await isEducator(userId, supabaseAdmin);
    if (!isEducatorUser) {
      return {
        isOwner: false,
        reason: 'Only educators can delete course materials',
      };
    }
    return { isOwner: true };
  }

  // For other paths, allow deletion (legacy behavior)
  // This can be tightened in the future
  return { isOwner: true };
}

/**
 * Handle file deletion
 */
export const handleDelete: PagesFunction = async (context: AuthenticatedContext) => {
  const { request, env, user, supabaseAdmin } = context;

  // Require authentication
  if (!user) {
    return jsonResponse({ 
      error: 'Authentication required',
      message: 'Please provide a valid JWT token in the Authorization header'
    }, 401);
  }

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

    console.log('🗑️  Deleting file:', { originalUrl: url, fileKey, userId: user.id });

    // Validate ownership
    const ownership = await validateOwnership(fileKey, user.id, supabaseAdmin);
    if (!ownership.isOwner) {
      console.warn('🚫 Ownership validation failed:', {
        userId: user.id,
        fileKey,
        reason: ownership.reason,
      });
      return jsonResponse({ 
        error: 'Access denied',
        message: ownership.reason || 'You do not have permission to delete this file'
      }, 403);
    }

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
