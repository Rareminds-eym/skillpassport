/**
 * Embedding Configuration
 * Centralized constants for embedding system
 */

export const EMBEDDING_CONFIG = {
  // Text processing
  MAX_TEXT_LENGTH: 10000,
  MIN_TEXT_LENGTH: 10,
  
  // Batch processing
  BATCH_SIZE: 10,
  BATCH_DELAY_MS: 2000,
  MAX_CONCURRENT: 5,
  
  // Embedding dimensions (controlled by worker)
  EXPECTED_DIMENSIONS: 1536,
  
  // Database limits
  MAX_SKILLS: 15,
  MAX_CERTIFICATES: 10,
  MAX_PROJECTS: 5,
  MAX_TRAININGS: 5,
  MAX_COURSES: 5,
  
  // Text truncation
  DESCRIPTION_MAX_LENGTH: 1000,
  PROJECT_DESC_MAX_LENGTH: 200,
  TRAINING_DESC_MAX_LENGTH: 150,
} as const;

export const ALLOWED_TABLES = [
  'opportunities', 
  'students', 
  'profiles', 
  'courses', 
  'skills',
  'projects',
  'certificates',
  'trainings'
] as const;
export type AllowedTable = typeof ALLOWED_TABLES[number];

export const EMBEDDING_TASK_TYPES = {
  RETRIEVAL_DOCUMENT: 'RETRIEVAL_DOCUMENT',
  RETRIEVAL_QUERY: 'RETRIEVAL_QUERY',
  SEMANTIC_SIMILARITY: 'SEMANTIC_SIMILARITY',
} as const;
