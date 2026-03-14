/**
 * Storage API validation schemas for media endpoints
 */

import { z } from 'zod';
import { CommonSchemas } from '../common.js';

export const StorageSchemas = {
  // Get Authenticated URL
  getAuthenticatedUrl: z.object({
    fileUrl: CommonSchemas.url.optional(),
    fileKey: z.string().min(1).optional(),
    courseId: z.string().min(1), // Accept string IDs (UUIDs)
    lessonId: z.string().min(1).optional(), // Accept string IDs (UUIDs)
    fingerprint: z.string().optional(),
    sessionId: z.string().optional()
  }).refine(
    (data) => data.fileUrl || data.fileKey,
    {
      message: "Either fileUrl or fileKey must be provided",
      path: ["fileUrl"]
    }
  ),
  
  // Media Proxy Query Parameters
  mediaProxy: z.object({
    token: z.string().min(1)
  }),
  
  // File Upload
  fileUpload: z.object({
    fileName: z.string().min(1).max(255),
    fileType: z.string().min(1).max(100),
    fileSize: z.number().int().min(1).max(100 * 1024 * 1024), // Max 100MB
    courseId: z.string().min(1).optional(), // Accept string IDs (UUIDs)
    lessonId: z.string().min(1).optional(), // Accept string IDs (UUIDs)
    folder: z.string().max(100).optional()
  }),
  
  // Delete File
  deleteFile: z.object({
    url: CommonSchemas.url.optional(),
    key: z.string().min(1).optional()
  }).refine(
    (data) => data.url || data.key,
    {
      message: "Either url or key must be provided",
      path: ["url"]
    }
  ),
  
  // Get File URL (for public files)
  getFileUrl: z.object({
    fileKey: z.string().min(1)
  })
} as const;

// Export individual schemas
export const {
  getAuthenticatedUrl,
  mediaProxy,
  fileUpload,
  deleteFile,
  getFileUrl
} = StorageSchemas;