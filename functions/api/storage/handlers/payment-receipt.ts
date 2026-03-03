/**
 * Payment Receipt Handlers
 *
 * Handles payment receipt PDF uploads and downloads:
 * - POST /upload-payment-receipt - Upload base64 PDF receipt
 * - GET /payment-receipt - Get payment receipt file
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { corsHeaders } from '../../../../src/functions-lib/cors';
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
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  console.log('[UploadPaymentReceipt] ========== START ==========');

  try {
    let body: UploadReceiptRequestBody;
    try {
      body = (await request.json()) as UploadReceiptRequestBody;
    } catch (parseError) {
      console.error('[UploadPaymentReceipt] Failed to parse request body:', parseError);
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
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
      return jsonResponse({ error: 'pdfBase64, paymentId, and userId are required' }, 400);
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
      return jsonResponse({ error: 'Invalid base64 data' }, 400);
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

    return jsonResponse({
      success: true,
      url: fileUrl,
      fileKey,
      filename: finalFilename,
    });
  } catch (error) {
    console.error('[UploadPaymentReceipt] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to upload payment receipt',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
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
  const { request, env, user, supabaseAdmin } = context as any;

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
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
      return jsonResponse({ error: 'File key or URL is required' }, 400);
    }

    // Extract payment ID from file key
    const paymentId = extractPaymentIdFromKey(fileKey);
    
    if (!paymentId) {
      console.error('[GetPaymentReceipt] Could not extract payment ID from key:', fileKey);
      return jsonResponse({ error: 'Invalid payment receipt file key' }, 400);
    }

    console.log('[GetPaymentReceipt] Extracted payment ID:', paymentId);

    // Query database to get payment owner using the receipt field
    const { data: payment, error: dbError } = await supabaseAdmin
      .from('razorpay_orders')
      .select('user_id')
      .eq('receipt', paymentId)
      .single();

    if (dbError || !payment) {
      console.error('[GetPaymentReceipt] Payment not found:', { paymentId, error: dbError });
      return jsonResponse({ error: 'Payment not found' }, 404);
    }

    console.log('[GetPaymentReceipt] Payment owner:', payment.user_id);

    // Validate ownership
    if (payment.user_id !== user.id) {
      return createAuthorizationError(
        user.id,
        fileKey,
        'ownership_mismatch',
        'You do not have permission to access this payment receipt'
      );
    }

    console.log('[GetPaymentReceipt] Ownership validated successfully');

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Get object from R2
    const response = await r2Client.getObject(fileKey);

    if (!response.ok) {
      return jsonResponse(
        { error: 'Receipt not found or access denied', status: response.status },
        response.status
      );
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
    return jsonResponse(
      {
        error: 'Failed to get payment receipt',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get presigned URL for payment receipt download
 * Allows temporary access without JWT authentication
 */
export const handleGetPaymentReceiptPresigned: PagesFunction = async (context) => {
  const { request, env, user, supabaseAdmin } = context as any;

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
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
      return jsonResponse({ error: 'File key or URL is required' }, 400);
    }

    // Extract payment ID from file key
    const paymentId = extractPaymentIdFromKey(fileKey);

    if (!paymentId) {
      console.error('[GetPaymentReceiptPresigned] Could not extract payment ID from key:', fileKey);
      return jsonResponse({ error: 'Invalid payment receipt file key' }, 400);
    }

    console.log('[GetPaymentReceiptPresigned] Extracted payment ID:', paymentId);

    // Query database to get payment owner using the razorpay_payment_id field
    const { data: payment, error: dbError } = await supabaseAdmin
      .from('razorpay_orders')
      .select('user_id')
      .eq('razorpay_payment_id', paymentId)
      .single();

    if (dbError || !payment) {
      console.error('[GetPaymentReceiptPresigned] Payment not found:', { paymentId, error: dbError });
      return jsonResponse({ error: 'Payment not found' }, 404);
    }

    // Validate ownership
    if (payment.user_id !== user.id) {
      return createAuthorizationError(
        user.id,
        fileKey,
        'ownership_mismatch',
        'You do not have permission to access this payment receipt'
      );
    }

    console.log('[GetPaymentReceiptPresigned] Ownership validated, generating presigned URL');

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Generate presigned URL (max 7 days)
    const presignedUrl = await r2Client.generatePresignedGetUrl(fileKey, Math.min(expiresIn, 604800));

    console.log('[GetPaymentReceiptPresigned] Generated presigned URL for:', fileKey);

    return jsonResponse({
      success: true,
      presignedUrl,
      fileKey,
      expiresIn: Math.min(expiresIn, 604800),
    });
  } catch (error) {
    logErrorSafely('GetPaymentReceiptPresigned', error);
    return jsonResponse(
      {
        error: 'Failed to generate presigned URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
