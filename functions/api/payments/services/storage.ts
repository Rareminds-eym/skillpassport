/**
 * Storage service for receipt uploads
 */

import type { Env } from '../types';
import { STORAGE_API_URL } from '../config';

/**
 * Upload receipt to R2 storage via storage-api
 */
export async function uploadReceiptToR2(
  env: Env,
  pdfBase64: string,
  paymentId: string,
  userId: string,
  filename: string,
  userName?: string,
  authToken?: string
): Promise<{ success: boolean; url?: string; fileKey?: string; error?: string }> {
  console.log(`[RECEIPT] Starting receipt upload for payment: ${paymentId}`);

  try {
    const requestBody = JSON.stringify({
      pdfBase64,
      paymentId,
      userId,
      userName,
      filename,
    });

    let response: Response;

    // Use Service Binding if available
    if (env.STORAGE_SERVICE) {
      console.log(`[RECEIPT] Using Service Binding to storage-api`);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      response = await env.STORAGE_SERVICE.fetch('https://storage-api/upload-payment-receipt', {
        method: 'POST',
        headers,
        body: requestBody,
      });
    } else {
      // Fallback to HTTP fetch
      const storageUrl = env.STORAGE_API_URL || STORAGE_API_URL;
      const uploadEndpoint = `${storageUrl}/upload-payment-receipt`;
      console.log(`[RECEIPT] Using HTTP fetch to: ${uploadEndpoint}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log(`[RECEIPT] Including auth token in request`);
      }

      response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers,
        body: requestBody,
      });
    }

    console.log(`[RECEIPT] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[RECEIPT] Upload failed: ${response.status} - ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = JSON.parse(await response.text()) as { success: boolean; url?: string; fileKey?: string };

    if (result.success && result.fileKey) {
      console.log(`[RECEIPT] Upload success - File Key: ${result.fileKey}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[RECEIPT] Upload error: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get receipt download URL from storage-api
 */
export function getReceiptDownloadUrl(env: Env, fileKey: string): string {
  const storageUrl = env.STORAGE_API_URL || STORAGE_API_URL;
  return `${storageUrl}/payment-receipt?key=${encodeURIComponent(fileKey)}&mode=download`;
}
