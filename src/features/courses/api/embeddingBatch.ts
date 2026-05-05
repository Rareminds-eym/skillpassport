/**
 * Embedding Batch Processing
 * Handles parallel generation of multiple embeddings via career-api handler.
 * 
 * NOTE: This service now uses the shared embedding client.
 * All duplicate code has been removed.
 */

import {
  generateEmbeddingsBatch as sharedGenerateEmbeddingsBatch,
  generateSkillEmbeddingsBatch as sharedGenerateSkillEmbeddingsBatch,
  generateProfileAndSkillEmbeddings as sharedGenerateProfileAndSkillEmbeddings,
} from '@/shared/api/embedding';

/**
 * Generate multiple embeddings in parallel
 * Much faster than sequential generation (3x speedup for 3 skills)
 * 
 * @param texts - Array of texts to generate embeddings for
 * @param maxConcurrent - Maximum concurrent requests (default 5)
 * @returns Array of embedding vectors (dimensions determined by worker)
 */
export const generateEmbeddingsBatch = sharedGenerateEmbeddingsBatch;

/**
 * Generate embeddings for multiple skills in parallel
 * Wraps each skill with context for better semantic matching
 * 
 * @param skillNames - Array of skill names
 * @returns Skills with embeddings
 */
export const generateSkillEmbeddingsBatch = sharedGenerateSkillEmbeddingsBatch;

/**
 * Generate embeddings for profile and multiple skills in one call
 * Most efficient approach for recommendation generation
 * 
 * @param profileText - Student profile text
 * @param skillNames - Array of skill names
 * @returns Profile and skill embeddings
 */
export const generateProfileAndSkillEmbeddings = sharedGenerateProfileAndSkillEmbeddings;

