export { default as enrollmentService } from './enrollmentService';
export * from './progressService';
export { fileService } from './fileService';

// Legacy alias for backward compatibility
export { enrollmentService as courseEnrollmentService } from './enrollmentService';
export * from './courseEmbeddingManager';
export * from './courseEnrollmentService';
export * from './courseProgressService';
export * from './config';
export * from './courseRepository';
export * from './embeddingBatch';
export * from './embeddingService';
export * from './fieldDomainService';
export * from './profileBuilder';
export * from './recommendationService';
export * from './recommendationStorage';
export * from './roleBasedMatcher';
export { getCoursePerformance } from './coursePerformanceService';
export type { CoursePerformance } from './coursePerformanceService';
export * from './skillGapMatcher';
export * from './utils';
export * from './courseRecommendationService';
export * from './progressSyncManager';
export * from './streamRecommendationService';
export * from './lessonPlansService';
export * from './courseDetailsService';
