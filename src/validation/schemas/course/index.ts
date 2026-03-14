/**
 * Course domain validation schemas - main export
 */

export * from './content.js';
export * from './assessment.js';
export * from './ai-tutor.js';

// Re-export commonly used schemas
export { CourseSchemas, CoursePathParams } from './content.js';
export { AiTutorSchemas, AiTutorPathParams } from './ai-tutor.js';