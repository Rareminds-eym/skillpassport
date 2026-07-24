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
import { createLogger } from '../../../lib/logger';
import { ssoGetUserTransactions, ssoGetUserSubscription } from '../../../lib/sso-client';

const logger = createLogger('payment-receipt');

// Receipt configuration constants
const RECEIPT_CONFIG = {
  PAYMENT_ID_SANITIZE_REGEX: /[^a-zA-Z0-9]/g,
  USER_ID_PREFIX_LENGTH: 8,
} as const;

// Date utility
const DateUtils = {
  getDateString: () => {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  },
};

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

  logger.info('Payment receipt upload started');

  try {
    let body: UploadReceiptRequestBody;
    try {
      body = (await request.json()) as UploadReceiptRequestBody;
    } catch (parseError) {
      logger.error('Failed to parse request body', parseError instanceof Error ? parseError : new Error(String(parseError)));
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
    }

    const { pdfBase64, paymentId, userId, userName, filename } = body;

    logger.info('Upload request params', {
      paymentId,
      userId,
      userName: userName || 'NOT PROVIDED',
      filename,
      pdfBase64Length: pdfBase64?.length || 0,
    });

    // Validate required fields
    if (!pdfBase64 || !paymentId || !userId) {
      logger.error('Missing required fields', new Error('Validation failed'));
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
      logger.info(`Decoded base64 to ${bytes.length} bytes`);
    } catch (decodeError) {
      logger.error('Failed to decode base64', decodeError instanceof Error ? decodeError : new Error(String(decodeError)));
      return apiError(400, 'VALIDATION_ERROR', 'Invalid base64 data', request);
    }

    // Generate unique filename with hybrid folder structure: {name}_{short_id}/
    const timestamp = Date.now();
    const sanitizedPaymentId = paymentId.replace(RECEIPT_CONFIG.PAYMENT_ID_SANITIZE_REGEX, '');

    // Create folder name: sanitized_name + short user_id (first 8 chars)
    const shortUserId = userId.substring(0, RECEIPT_CONFIG.USER_ID_PREFIX_LENGTH);
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
      `Receipt-${sanitizedPaymentId.slice(-8)}-${DateUtils.getDateString()}.pdf`;

    logger.info('File key and filename prepared', { fileKey, finalFilename });

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Upload to R2
    const startTime = Date.now();
    await r2Client.upload(fileKey, bytes.buffer as ArrayBuffer, 'application/pdf', {
      'Content-Disposition': `attachment; filename="${finalFilename}"`,
    });
    const duration = Date.now() - startTime;

    logger.info(`Upload completed in ${duration}ms`);

    // Generate public URL
    const fileUrl = r2Client.getPublicUrl(fileKey);

    logger.info('Upload successful', { fileUrl, fileKey });

    return apiSuccess({ url: fileUrl, fileKey, filename: finalFilename }, request);
  } catch (error) {
    logger.error('Upload failed', error instanceof Error ? error : new Error(String(error)));
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
    logger.error('Failed to extract payment ID', error instanceof Error ? error : new Error(String(error)));
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
      logger.error('Could not extract payment ID from key', new Error('Invalid file key'), { fileKey });
      return apiError(400, 'VALIDATION_ERROR', 'Invalid payment receipt file key', request);
    }

    logger.info('Extracted payment ID', { paymentId });

    // Validate ownership from the file key itself.
    // Key pattern: payment_pdf/user_{userId_prefix}/{paymentId}_{timestamp}.pdf
    const keyParts = fileKey.split('/');
    if (keyParts.length >= 2) {
      const folderName = keyParts[1];
      const userIdPrefix = user.id.substring(0, RECEIPT_CONFIG.USER_ID_PREFIX_LENGTH);
      if (!folderName.includes(userIdPrefix)) {
        return createAuthorizationError(
          user.id,
          fileKey,
          'ownership_mismatch',
          'You do not have permission to access this payment receipt'
        );
      }
    }

    logger.info('Ownership validated via key');

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

    logger.info('Received file key for presigned URL', { fileKey });

    // Initialize R2 client
    const r2Client = new R2Client(env);

    // Check if fileKey is a partial pattern (doesn't end with .pdf and has timestamp placeholder)
    // Pattern: payment_pdf/user_{userId}/{paymentId} (without timestamp)
    if (!fileKey.endsWith('.pdf')) {
      logger.info('Partial key detected, searching for matching file...');
      
      // Validate user ownership from partial key
      const keyParts = fileKey.split('/');
      if (keyParts.length >= 2) {
        const folderName = keyParts[1]; // e.g. "user_9a754938"
        const userIdPrefix = user.id.substring(0, RECEIPT_CONFIG.USER_ID_PREFIX_LENGTH);
        if (!folderName.includes(userIdPrefix)) {
          return createAuthorizationError(
            user.id,
            fileKey,
            'ownership_mismatch',
            'You do not have permission to access this payment receipt'
          );
        }
      }

      // Database lookup: find exact receipt path matching the payment ID
      const paymentId = keyParts.length >= 3 ? keyParts[keyParts.length - 1] : null;

      if (!paymentId) {
        logger.error('Could not extract payment ID from partial key', new Error('Invalid partial file key'), { fileKey });
        return apiError(400, 'VALIDATION_ERROR', 'Invalid payment receipt file key', request);
      }

      try {
        // Check transaction record first
        const transactions = await ssoGetUserTransactions(env, user.id);
        const matchedTx = transactions.find(
          (tx) =>
            tx.razorpay_payment_id === paymentId ||
            tx.razorpay_order_id === paymentId ||
            tx.subscription_id === paymentId ||
            tx.id === paymentId
        );

        if (
          matchedTx?.receipt_url &&
          typeof matchedTx.receipt_url === 'string' &&
          matchedTx.receipt_url.endsWith('.pdf')
        ) {
          fileKey = matchedTx.receipt_url;
          logger.info('Found exact receipt path from database transaction', { fileKey });
        } else {
          // Check subscription record
          const subData = await ssoGetUserSubscription(env, user.id);
          const sub = subData?.subscription;
          if (
            sub &&
            (sub.razorpay_payment_id === paymentId ||
              sub.razorpay_order_id === paymentId ||
              sub.razorpay_subscription_id === paymentId ||
              sub.id === paymentId) &&
            sub.receipt_url &&
            typeof sub.receipt_url === 'string' &&
            sub.receipt_url.endsWith('.pdf')
          ) {
            fileKey = sub.receipt_url;
            logger.info('Found exact receipt path from database subscription', { fileKey });
          } else {
            logger.error('Receipt not found in database for payment ID', new Error('Receipt not found'), {
              paymentId,
              userId: user.id,
            });
            return apiError(404, 'NOT_FOUND', 'Receipt not found. It may still be generating.', request);
          }
        }
      } catch (dbError) {
        logger.error('Failed to fetch receipt path from database', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
          paymentId,
          userId: user.id,
        });
        return apiError(404, 'NOT_FOUND', 'Receipt not found. It may still be generating.', request);
      }
    }

    // Extract payment ID from file key for additional validation
    const paymentId = extractPaymentIdFromKey(fileKey);

    if (!paymentId) {
      logger.error('Could not extract payment ID from key', new Error('Invalid file key'), { fileKey });
      return apiError(400, 'VALIDATION_ERROR', 'Invalid payment receipt file key', request);
    }

    logger.info('Extracted payment ID', { paymentId });

    // Validate ownership from the complete file key
    // Key pattern: payment_pdf/user_{userId_prefix}/{paymentId}_{timestamp}.pdf
    const keyParts = fileKey.split('/');
    if (keyParts.length >= 2) {
      const folderName = keyParts[1]; // e.g. "user_9a754938"
      const userIdPrefix = user.id.substring(0, RECEIPT_CONFIG.USER_ID_PREFIX_LENGTH);
      if (!folderName.includes(userIdPrefix)) {
        return createAuthorizationError(
          user.id,
          fileKey,
          'ownership_mismatch',
          'You do not have permission to access this payment receipt'
        );
      }
    }

    logger.info('Ownership validated, generating presigned URL');

    // Generate presigned URL (max 7 days)
    const presignedUrl = await r2Client.generatePresignedGetUrl(fileKey, Math.min(expiresIn, 604800));

    logger.info('Generated presigned URL', { fileKey });

    return apiSuccess({ presignedUrl, fileKey, expiresIn: Math.min(expiresIn, 604800) }, request);
  } catch (error) {
    logErrorSafely('GetPaymentReceiptPresigned', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to generate presigned URL', request);
  }
};
