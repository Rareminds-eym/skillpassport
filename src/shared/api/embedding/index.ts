/**
 * Frontend Embedding API
 * 
 * Use these functions to generate embeddings from the browser.
 * All functions call the backend API which handles database operations.
 */

// Main client functions
export {
  generateEmbedding,
  generateEmbeddingsBatch,
  regenerateEmbeddingFromDatabase as regenerateStudentEmbedding,
  generateSkillEmbedding,
  generateSkillEmbeddingsBatch,
  generateProfileAndSkillEmbeddings,
} from './client';

// Auto-regeneration functions
export {
  queueEmbeddingRegeneration,
  forceEmbeddingRegeneration,
  cancelPendingRegeneration,
  clearAllPendingRegenerations,
} from './autoRegenerate';

// Types
export type { EmbeddingOptions, EmbeddingBatchOptions } from './client';
