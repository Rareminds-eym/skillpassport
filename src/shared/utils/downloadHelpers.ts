/**
 * Download Helper Utilities
 *
 * Provides robust file download functionality with:
 * - Memory leak prevention via proper cleanup
 * - Fallback mechanisms for CORS issues
 * - Timeout protection for network operations
 * - Error handling and logging
 */

import { DEFAULT_TIMEOUT } from '@/shared/api/httpClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('download-helpers');

/**
 * Get current date in YYYY-MM-DD format
 * Used for consistent date formatting in filenames
 */
export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Download a file from a URL with proper memory management
 *
 * Strategy:
 * 1. Try fetch + blob (better control, proper cleanup)
 * 2. Fallback to direct link if fetch fails (e.g., CORS issues)
 *
 * @param url - The URL to download from (typically a presigned URL)
 * @param filename - The filename to save as
 * @returns Promise that resolves when download completes
 * @throws Error if download fails completely
 */
export async function downloadFileFromUrl(url: string, filename?: string): Promise<void> {
  if (!url) {
    throw new Error('URL is required for download');
  }

  if (!filename) {
    filename = `download-${getDateString()}.pdf`;
  }

  // Use AbortController with explicit timeout management
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    // Primary strategy: fetch + blob for better control
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;

      try {
        link.click();
      } catch (clickError) {
        throw new Error(
          `File download click failed: ${
            clickError instanceof Error ? clickError.message : String(clickError)
          }`
        );
      }
    } finally {
      // Guaranteed cleanup - prevents memory leaks
      URL.revokeObjectURL(objectUrl);
    }
  } catch (fetchError) {
    // Fallback strategy: direct link (for CORS issues, etc.)
    const error = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
    logger.warn('Fetch failed, using direct link fallback', { error: error.message, stack: error.stack || 'No stack trace available' });

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank'; // Note: Direct link may fail if CORS prevents download attribute from working.

      try {
        link.click();
      } catch (clickError) {
        throw new Error(
          `File download click failed: ${
            clickError instanceof Error ? clickError.message : String(clickError)
          }`
        );
      }
    } catch (fallbackError) {
      const fallbackErr = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
      logger.error('Both fetch and direct link failed', fallbackErr);
      throw new Error(`Download failed: ${fallbackErr.message}`);
    }
  } finally {
    // Clear timeout to prevent memory leaks
    clearTimeout(timeoutId);
  }
}

/**
 * Generate a receipt filename with standardized format
 *
 * @param identifier - Optional identifier (e.g., payment ID)
 * @returns Formatted filename
 */
export function generateReceiptFilename(identifier?: string): string {
  const date = getDateString();
  if (identifier) {
    return `Receipt-${identifier}-${date}.pdf`;
  }
  return `Receipt-${date}.pdf`;
}
