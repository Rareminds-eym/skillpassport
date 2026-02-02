/**
 * Upload Handler
 * Handles file uploads to R2 storage
 * 
 * Endpoint: POST /api/storage/upload
 * 
 * Request: multipart/form-data
 * - file: File (required)
 * - filename: string (required)
 * 
 * Response:
 * - success: boolean
 * - url: string (public URL of uploaded file)
 * - filename: string
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { R2Client } from '../utils/r2-client';

/**
 * File size limits (in bytes)
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MIN_FILE_SIZE = 1; // 1 byte

/**
 * Allowed file types (MIME types)
 * Add more as needed
 */
const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Videos
  'video/mp4',
  'video/webm',
  'video/ogg',
  
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  
  // Other
  'application/json',
  'application/xml',
];

/**
 * Validate file size
 */
function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size < MIN_FILE_SIZE) {
    return { valid: false, error: 'File is empty' };
  }
  
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }
  
  return { valid: true };
}

/**
 * Validate file type
 */
function validateFileType(type: string): { valid: boolean; error?: string } {
  if (!type) {
    return { valid: false, error: 'File type is required' };
  }
  
  if (!ALLOWED_FILE_TYPES.includes(type)) {
    return { 
      valid: false, 
      error: `File type '${type}' is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Generate unique file key
 * Format: uploads/{timestamp}-{uuid}.{extension}
 */
function generateUniqueKey(filename: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const extension = filename.substring(filename.lastIndexOf('.'));
  return `uploads/${timestamp}-${randomString}${extension}`;
}

/**
 * Handle file upload
 */
export const handleUpload: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    // Validate required fields
    if (!file) {
      return jsonResponse({ error: 'File is required' }, 400);
    }

    if (!filename) {
      return jsonResponse({ error: 'Filename is required' }, 400);
    }

    // Validate file size
    const sizeValidation = validateFileSize(file.size);
    if (!sizeValidation.valid) {
      return jsonResponse({ error: sizeValidation.error }, 400);
    }

    // Validate file type
    const typeValidation = validateFileType(file.type);
    if (!typeValidation.valid) {
      return jsonResponse({ error: typeValidation.error }, 400);
    }

    // Create R2 client
    const r2 = new R2Client(env);

    // Generate unique file key
    const fileKey = generateUniqueKey(filename);

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    const fileUrl = await r2.upload(
      fileKey,
      arrayBuffer,
      file.type,
      {
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    );

    console.log('✅ File uploaded successfully:', { fileKey, filename, size: file.size, type: file.type });

    return jsonResponse({
      success: true,
      url: fileUrl,
      filename,
      key: fileKey,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return jsonResponse({
      error: (error as Error).message || 'Upload failed',
    }, 500);
  }
};
