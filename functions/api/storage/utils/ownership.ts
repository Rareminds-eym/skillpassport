/**
 * Ownership Validation Utilities
 * 
 * Provides functions to validate file ownership and access permissions
 * based on file path patterns and database records.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface OwnershipValidationResult {
  isOwner: boolean;
  reason?: string;
}

/**
 * Extract user ID from file path patterns
 * 
 * Supported patterns:
 * - certificates/{studentId}/...
 * - payment_pdf/{name}_{userId}/...
 * - uploads/{userId}/...
 * 
 * @param fileKey - The file key/path in R2 storage
 * @returns The extracted user ID or null if not found
 */
export function extractUserIdFromPath(fileKey: string): string | null {
  if (!fileKey) return null;

  // Pattern 1: certificates/{studentId}/...
  const certificateMatch = fileKey.match(/^certificates\/([^\/]+)\//);
  if (certificateMatch) {
    return certificateMatch[1];
  }

  // Pattern 2: payment_pdf/{name}_{userId}/...
  const paymentMatch = fileKey.match(/^payment_pdf\/[^_]+_([^\/]+)\//);
  if (paymentMatch) {
    return paymentMatch[1];
  }

  // Pattern 3: uploads/{userId}/...
  const uploadMatch = fileKey.match(/^uploads\/([^\/]+)\//);
  if (uploadMatch) {
    return uploadMatch[1];
  }

  return null;
}

/**
 * Validate certificate ownership
 * 
 * Certificates follow the pattern: certificates/{studentId}/...
 * Only the student who owns the certificate can delete it.
 * 
 * @param fileKey - The file key/path in R2 storage
 * @param userId - The authenticated user's ID
 * @returns Validation result with ownership status and reason
 */
export function validateCertificateOwnership(
  fileKey: string,
  userId: string
): OwnershipValidationResult {
  const extractedUserId = extractUserIdFromPath(fileKey);

  if (!extractedUserId) {
    return {
      isOwner: false,
      reason: 'Could not extract student ID from certificate path',
    };
  }

  if (extractedUserId !== userId) {
    return {
      isOwner: false,
      reason: 'User ID does not match certificate owner',
    };
  }

  return { isOwner: true };
}

/**
 * Validate payment receipt ownership
 * 
 * Payment receipts follow the pattern: payment_pdf/{name}_{userId}/...
 * Only the user who made the payment can access their receipt.
 * 
 * @param fileKey - The file key/path in R2 storage
 * @param userId - The authenticated user's ID
 * @returns Validation result with ownership status and reason
 */
export function validatePaymentReceiptOwnership(
  fileKey: string,
  userId: string
): OwnershipValidationResult {
  const extractedUserId = extractUserIdFromPath(fileKey);

  if (!extractedUserId) {
    return {
      isOwner: false,
      reason: 'Could not extract user ID from payment receipt path',
    };
  }

  if (extractedUserId !== userId) {
    return {
      isOwner: false,
      reason: 'User ID does not match payment receipt owner',
    };
  }

  return { isOwner: true };
}

/**
 * Validate upload ownership
 * 
 * User uploads follow the pattern: uploads/{userId}/...
 * Only the user who uploaded the file can delete it.
 * 
 * @param fileKey - The file key/path in R2 storage
 * @param userId - The authenticated user's ID
 * @returns Validation result with ownership status and reason
 */
export function validateUploadOwnership(
  fileKey: string,
  userId: string
): OwnershipValidationResult {
  const extractedUserId = extractUserIdFromPath(fileKey);

  if (!extractedUserId) {
    return {
      isOwner: false,
      reason: 'Could not extract user ID from upload path',
    };
  }

  if (extractedUserId !== userId) {
    return {
      isOwner: false,
      reason: 'User ID does not match upload owner',
    };
  }

  return { isOwner: true };
}

/**
 * Check if a user has educator role
 * 
 * Checks the school_educators table to determine if the user is an educator.
 * Educators have special permissions to manage course materials.
 * 
 * @param userId - The user's ID to check
 * @param supabase - Supabase client instance (should be admin client for reliable checks)
 * @returns True if the user is an educator, false otherwise
 */
export async function isEducator(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('school_educators')
      .select('id')
      .eq('user_id', userId)
      .eq('account_status', 'active')
      .single();

    if (error) {
      // If no record found, user is not an educator
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking educator status:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Exception checking educator status:', err);
    return false;
  }
}
