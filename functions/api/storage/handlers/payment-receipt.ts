/**
 * Payment Receipt Handlers
 *
 * Handles payment receipt PDF uploads and downloads:
 * - POST /upload-payment-receipt - Upload base64 PDF receipt
 * - GET /payment-receipt - Get payment receipt file
 */

import type { PagesFunction } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';;
import { corsHeaders } from '../../../lib/cors';
import { R2Client } from '../utils/r2-client';
import {
  createAuthenticationError,
  createAuthorizationError,
  logErrorSafely,
} from '../utils/error-handling';

interface UploadReceiptRequestBody {
  pdfBase64: string;
  paymentId: string;
  userId: string;
  userName?: string;
  filename?: string;
}

/**
 * Upload payment receipt PDF (base64 encoded)
 */
export const handleUploadPaymentReceipt: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  console.log('[UploadPaymentReceipt] ========== START ==========');

  try {
    let body: UploadReceiptRequestBody;
    try {
      body = (await request.json()) as UploadReceiptRequestBody;
    } catch (parseError) {
      console.error('[UploadPaymentReceipt] Failed to parse request body:', parseError);
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
    }

    const { pdfBase64, paymentId, userId, userName, filename } = body;

    console.log('[UploadPaymentReceipt] Request params:', {
      paymentId,
      userId,
      userName: userName || 'NOT PROVIDED',
      filename,
      pdfBase64Length: pdfBase64?.length || 0,
    });

    // Validate required fields
    if (!pdfBase64 || !paymentId || !userId) {
      console.error('[UploadPaymentReceipt] Missing required fields');
      return apiError(400, 'VALIDATION_ERROR', 'pdfBase64, paymentId, and userId are required', request);
    }

    // Decode base64 to binary
    let bytes: Uint8Array;
    try {
      const binaryString = atob(pdfBase64);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log(`[UploadPaymentReceipt] Decoded base64 to ${bytes.length} bytes`);
    } catch (decodeError) {
      console.error('[UploadPaymentReceipt] Failed to decode base64:', decodeError);
      return apiError(400, 'VALIDATION_ERROR', 'Invalid base64 data', request);
    }

    // Generate unique filename with hybrid folder structure: {name}_{short_id}/
    const timestamp = Date.now();
    const sanitizedPaymentId = paymentId.replace(/[^a-zA-Z0-9_-]/g, '');

    // Create folder name: sanitized_name + short user_id (first 8 chars)
    const shortUserId = userId.substring(0, 8);
    const sanitizedName = userName
      ? userName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '') // Remove leading/trailing underscores
          .substring(0, 20)
      : 'user';
    const folderName = `${sanitizedName}_${shortUserId}`;

    const fileKey = `payment_pdf/${folderName}/${sanitizedPaymentId}_${timestamp}.pdf`;
    const finalFilename =
      filename ||
      `Receipt-${sanitizedPaymentId.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;

    console.log('[UploadPaymentReceipt] File key:', fileKey);
    console.log('[UploadPaymentReceipt] Final filename:', finalFilename);

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Upload to R2
    const startTime = Date.now();
    await r2Client.upload(fileKey, bytes.buffer as ArrayBuffer, 'application/pdf', {
      'Content-Disposition': `attachment; filename="${finalFilename}"`,
    });
    const duration = Date.now() - startTime;

    console.log(`[UploadPaymentReceipt] Upload completed in ${duration}ms`);

    // Generate public URL
    const fileUrl = r2Client.getPublicUrl(fileKey);

    console.log('[UploadPaymentReceipt] ========== SUCCESS ==========');
    console.log('[UploadPaymentReceipt] File URL:', fileUrl);
    console.log('[UploadPaymentReceipt] File Key:', fileKey);

    return apiSuccess({ url: fileUrl, fileKey, filename: finalFilename }, request);
  } catch (error) {
    console.error('[UploadPaymentReceipt] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to upload payment receipt', request);
  }
};

/**
 * Extract payment ID from file key
 * Pattern: payment_pdf/{name}_{userId}/{paymentId}_{timestamp}.pdf
 */
function extractPaymentIdFromKey(fileKey: string): string | null {
  try {
    // Extract filename from the key
    const parts = fileKey.split('/');
    if (parts.length < 3 || parts[0] !== 'payment_pdf') {
      return null;
    }

    // Get the filename (last part)
    const filename = parts[parts.length - 1];
    
    // Extract payment ID from filename pattern: {paymentId}_{timestamp}.pdf
    const match = filename.match(/^(.+)_\d+\.pdf$/);
    if (!match) {
      return null;
    }

    return match[1]; // Return the payment ID part
  } catch (error) {
    console.error('[ExtractPaymentId] Error:', error);
    return null;
  }
}

/**
 * Get payment receipt file
 */
export const handleGetPaymentReceipt: PagesFunction = async (context) => {
  const { request, env, user } = context as any;

  if (request.method !== 'GET') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  // Require authentication
  if (!user) {
    return createAuthenticationError('/payment-receipt', 'missing_token');
  }

  try {
    const url = new URL(request.url);
    let fileKey = url.searchParams.get('key');
    const mode = url.searchParams.get('mode') || 'download'; // 'inline' for viewing, 'download' for downloading

    // Also support extracting key from full URL
    const fileUrl = url.searchParams.get('url');
    if (!fileKey && fileUrl) {
      fileKey = R2Client.extractKeyFromUrl(fileUrl);

      // If extraction failed, try payment_pdf specific pattern
      if (!fileKey) {
        const pathMatch = fileUrl.match(/\/payment_pdf\/(.+)$/);
        if (pathMatch) {
          fileKey = `payment_pdf/${pathMatch[1]}`;
        }
      }
    }

    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'File key or URL is required', request);
    }

    // Extract payment ID from file key
    const paymentId = extractPaymentIdFromKey(fileKey);
    
    if (!paymentId) {
      console.error('[GetPaymentReceipt] Could not extract payment ID from key:', fileKey);
      return apiError(400, 'VALIDATION_ERROR', 'Invalid payment receipt file key', request);
    }

    console.log('[GetPaymentReceipt] Extracted payment ID:', paymentId);

    // Validate ownership from the file key itself.
    // Key pattern: payment_pdf/user_{userId_prefix}/{paymentId}_{timestamp}.pdf
    const keyParts = fileKey.split('/');
    if (keyParts.length >= 2) {
      const folderName = keyParts[1];
      const userIdPrefix = user.id.substring(0, 8);
      if (!folderName.includes(userIdPrefix)) {
        return createAuthorizationError(
          user.id,
          fileKey,
          'ownership_mismatch',
          'You do not have permission to access this payment receipt'
        );
      }
    }

    console.log('[GetPaymentReceipt] Ownership validated via key');

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Get object from R2
    const response = await r2Client.getObject(fileKey);

    if (!response.ok) {
      return apiError(response.status, 'NOT_FOUND', 'Receipt not found or access denied', request);
    }

    // Get file content
    const fileContent = await response.arrayBuffer();

    // Extract filename from key
    const filename = fileKey.split('/').pop() || 'receipt.pdf';

    // Set Content-Disposition based on mode
    const contentDisposition =
      mode === 'download'
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`;

    return new Response(fileContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
        'Content-Length': fileContent.byteLength.toString(),
      },
    });
  } catch (error) {
    logErrorSafely('GetPaymentReceipt', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to get payment receipt', request);
  }
};

/**
 * Get presigned URL for payment receipt download
 * Allows temporary access without JWT authentication
 */
export const handleGetPaymentReceiptPresigned: PagesFunction = async (context) => {
  const { request, env, user } = context as any;

  if (request.method !== 'GET') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  // Require authentication to generate presigned URL
  if (!user) {
    return createAuthenticationError('/payment-receipt/presigned', 'missing_token');
  }

  try {
    const url = new URL(request.url);
    let fileKey = url.searchParams.get('key');
    const expiresIn = parseInt(url.searchParams.get('expires') || '3600', 10); // Default 1 hour

    // Also support extracting key from full URL
    const fileUrl = url.searchParams.get('url');
    if (!fileKey && fileUrl) {
      fileKey = R2Client.extractKeyFromUrl(fileUrl);

      // If extraction failed, try payment_pdf specific pattern
      if (!fileKey) {
        const pathMatch = fileUrl.match(/\/payment_pdf\/(.+)$/);
        if (pathMatch) {
          fileKey = `payment_pdf/${pathMatch[1]}`;
        }
      }
    }

    if (!fileKey) {
      return apiError(400, 'VALIDATION_ERROR', 'File key or URL is required', request);
    }

    // Extract payment ID from file key
    const paymentId = extractPaymentIdFromKey(fileKey);

    if (!paymentId) {
      console.error('[GetPaymentReceiptPresigned] Could not extract payment ID from key:', fileKey);
      return apiError(400, 'VALIDATION_ERROR', 'Invalid payment receipt file key', request);
    }

    console.log('[GetPaymentReceiptPresigned] Extracted payment ID:', paymentId);

    // Validate ownership from the file key itself.
    // Key pattern: payment_pdf/user_{userId_prefix}/{paymentId}_{timestamp}.pdf
    // The userId prefix in the key is the first 8 chars of the authenticated user's ID.
    // This avoids a DB lookup and works even when razorpay_orders table doesn't exist locally.
    const keyParts = fileKey.split('/');
    if (keyParts.length >= 2) {
      const folderName = keyParts[1]; // e.g. "user_9a754938" or "user_9a754938_john"
      const userIdPrefix = user.id.substring(0, 8);
      if (!folderName.includes(userIdPrefix)) {
        return createAuthorizationError(
          user.id,
          fileKey,
          'ownership_mismatch',
          'You do not have permission to access this payment receipt'
        );
      }
    }

    console.log('[GetPaymentReceiptPresigned] Ownership validated via key, generating presigned URL');

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Generate presigned URL (max 7 days)
    const presignedUrl = await r2Client.generatePresignedGetUrl(fileKey, Math.min(expiresIn, 604800));

    console.log('[GetPaymentReceiptPresigned] Generated presigned URL for:', fileKey);

    return apiSuccess({ presignedUrl, fileKey, expiresIn: Math.min(expiresIn, 604800) }, request);
  } catch (error) {
    logErrorSafely('GetPaymentReceiptPresigned', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to generate presigned URL', request);
  }
};
