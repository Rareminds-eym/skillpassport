/**
 * Vector Utilities
 * Pure utility functions for vector operations used in embedding-based features.
 * No API dependencies - these are local calculations only.
 */

/**
 * Calculate cosine similarity between two vectors
 * Used for local similarity calculations when embeddings are already available
 * 
 * @param {number[]} vecA - First embedding vector
 * @param {number[]} vecB - Second embedding vector
 * @returns {number} - Cosine similarity (-1 to 1)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Get the expected embedding dimension
 * OpenRouter text-embedding-3-small produces 1536 dimensions
 * 
 * @returns {number} - Embedding dimension
 */
export function getEmbeddingDimension() {
  return 1536;
}

export default {
  cosineSimilarity,
  getEmbeddingDimension
};
