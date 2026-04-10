// Auto-generated barrel export for shared API utilities
// This file exports common API utilities used across features

// HTTP client and utilities
export * from './httpClient';
export * from './apiUtils';
export * from './constants';
export * from './authUtils';

// Supabase client
export { supabase } from './supabaseClient';

// Common types
export type * from './types';

// Shared infrastructure services (truly generic, not domain-specific)
export * from './authenticatedMediaService';
// Note: fileUploadService.deleteFile conflicts with storageApiService.deleteFile
// Import directly from the specific service you need
export { uploadFile, validateFile, uploadMultipleFiles, getDocumentUrl } from './fileUploadService';
export { getFileUrl } from './storageApiService';
export * from './realtimeService';
export * from './settingsService';
export * from './storageApiService';
export * from './storageService';

// Domain-specific services have been moved to their respective features:
// - addOn* services -> @/features/subscription/api/
// - *Notification* services -> @/features/notifications/api/
// - analytics* services -> @/features/analytics/api/
// - dashboard* services -> @/features/analytics/api/
// - migration* services -> @/features/admin/api/
// - streak* services -> @/features/student-profile/api/
// Import them directly from their feature locations
