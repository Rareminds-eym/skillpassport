/**
 * Common validation schemas used across the application
 */

import { z } from 'zod';

export const CommonSchemas = {
  // Basic data types
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  uuid: z.string().uuid(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  url: z.string().url().max(2048),
  
  // Date and time
  dateString: z.string().datetime(),
  dateOnly: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  // Pagination
  paginationQuery: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).optional()
  }),
  
  // Common IDs
  id: z.coerce.number().int().positive(),
  stringId: z.string().min(1).max(50),
  
  // Text fields
  shortText: z.string().min(1).max(255),
  mediumText: z.string().min(1).max(1000),
  longText: z.string().min(1).max(10000),
  
  // Optional text fields
  optionalShortText: z.string().max(255).optional(),
  optionalMediumText: z.string().max(1000).optional(),
  optionalLongText: z.string().max(10000).optional(),
  
  // Boolean with coercion
  boolean: z.coerce.boolean(),
  
  // Arrays
  stringArray: z.array(z.string()),
  numberArray: z.array(z.number()),
  
  // File upload
  fileUpload: z.object({
    filename: z.string().min(1).max(255),
    mimetype: z.string().min(1).max(100),
    size: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
    data: z.any().optional() // Use z.any() instead of Buffer for Workers compatibility
  }),
  
  // Search and filtering
  searchQuery: z.object({
    q: z.string().max(500).optional(),
    sort: z.string().max(50).optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).optional()
  }),
  
  // Status fields
  status: z.enum(['active', 'inactive', 'pending', 'archived']),
  
  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional()
} as const;

// Export individual schemas for easier imports
export const {
  email,
  password,
  uuid,
  phoneNumber,
  url,
  dateString,
  dateOnly,
  paginationQuery,
  id,
  stringId,
  shortText,
  mediumText,
  longText,
  optionalShortText,
  optionalMediumText,
  optionalLongText,
  boolean,
  stringArray,
  numberArray,
  fileUpload,
  searchQuery,
  status,
  metadata
} = CommonSchemas;