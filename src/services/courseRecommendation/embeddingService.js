/**
 * Embedding Service
 * Handles embedding generation via the career-api Cloudflare worker.
 * Uses multi-layer caching (memory + database) for optimal performance.
 */

import { EMBEDDING_API_URL } from './config';
import { getCachedEmbedding } from './embeddingCache';

/**
 * Generate embedding for text via the career-api Cloudflare worker.
 * Uses multi-layer caching (memory + database) to reduce API calls.
 * 
 * @param {string} text - Text to generate embedding for
 * @param {boolean} skipCache - Skip cache and force fresh generation
 * @returns {Promise<number[]>} - Embedding vector
 * @throws {Error} - If text is too short or API fails
 */
export const generateEmbedding = async (text, skipCache = false) => {
  if (!text || text.trim().length < 10) {
    throw new Error('Text too short for embedding generation');
  }

  if (!EMBEDDING_API_URL) {
    throw new Error('VITE_CAREER_API_URL environment variable not configured');
  }

  // Skip cache if requested
  if (skipCache) {
    return await generateEmbeddingDirect(text);
  }

  // Use cached embedding with fallback to generation
  return await getCachedEmbedding(text, 'profile', generateEmbeddingDirect);
};

/**
 * Generate embedding directly from API (no caching)
 * Internal function used by cache orchestrator
 * 
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
const generateEmbeddingDirect = async (text) => {
  // Generate a simple hash for the ID
  const generateSimpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text, 
      id: generateSimpleHash(text),
      table: 'embedding_cache',
      returnEmbedding: true 
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  const result = await response.json();
  if (!result.embedding || !Array.isArray(result.embedding)) {
    throw new Error('Invalid embedding response');
  }

  return result.embedding;
};

/**
 * Generate embedding for a skill search query.
 * Wraps the skill name with context for better semantic matching.
 * Uses skill-specific caching.
 * 
 * @param {string} skillName - The skill name to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
export const generateSkillEmbedding = async (skillName) => {
  const skillText = `Skill: ${skillName}. Looking for courses that teach ${skillName} skills and competencies.`;
  return await getCachedEmbedding(skillText, 'skill', generateEmbeddingDirect);
};

/**
 * Clear all embedding caches (memory + database)
 * Useful for testing or when you want to force fresh embeddings
 */
export const clearEmbeddingCache = async () => {
  const { clearAllCaches } = await import('./embeddingCache');
  clearAllCaches();
  console.log('🗑️ All embedding caches cleared');
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} - Cache stats from all layers
 */
export const getCacheStats = async () => {
  const { getCacheStats: getStats } = await import('./embeddingCache');
  return await getStats();
};
