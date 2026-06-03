/**
 * Upload Context Configuration
 * 
 * Central configuration for valid upload contexts.
 * All uploads now require authentication.
 */

/**
 * All valid upload contexts
 * 
 * SECURITY NOTE: All uploads require JWT authentication.
 * All uploads are subject to:
 * - File size validation
 * - MIME type validation
 * - Extension validation
 * - Malware scanning
 * - Magic number validation
 */
export const VALID_UPLOAD_CONTEXTS: ReadonlyArray<string> = [
  'assignment',
  'course_video',
  'course_resource',
  'document',
  'certificate',
  'resume',
  'message_attachment',
  'profile_photo',
  'default'
] as const;

