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

// Shared infrastructure services
export * from './addOnAnalyticsService';
export * from './addOnCatalogService';
export * from './addOnPaymentService';
export * from './adminNotificationService';
export * from './alertsService';
export * from './analyticsService';
export * from './authenticatedMediaService';
export * from './dashboardService';
export * from './fileService';
// Note: fileUploadService.deleteFile conflicts with storageApiService.deleteFile
// Import directly from the specific service you need
export { uploadFile, validateFile, getFileUrl, uploadMultipleFiles, getDocumentUrl } from './fileUploadService';
export * from './migrationNotificationService';
export * from './migrationService';
export * from './notificationService';
export * from './optimizedQueryService';
export * from './realtimeService';
export * from './recentUpdatesService';
export * from './settingsService';
export * from './skillsAnalyticsService';
export * from './storageApiService';
export * from './storageService';
export * from './streakApiService';
export * from './studentNotificationService';
export * from './usageStatisticsService';
