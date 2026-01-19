/**
 * Embedding Cache Orchestrator
 * Coordinates memory and database caching for embeddings
 * 
 * Cache Strategy:
 * 1. Check memory cache (fast, session-based)
 * 2. Check database cache (persistent, cross-session)
 * 3. Generate new embedding via API
 * 4. Store in both caches
 */

import memoryCache from './memoryCache';
import { getFromDatabase, saveToDatabase } from './databaseCache';

/**
 * Get embedding with multi-layer caching
 * @param {string} text - Text to get embedding for
 * @param {string} type - Cache type (profile, skill, course)
 * @param {Function} generateFn - Function to generate embedding if not cached
 * @returns {Promise<number[]>} - Embedding vector
 */
export const getCachedEmbedding = async (text, type, generateFn) => {
  // Layer 1: Memory cache (fastest)
  const memoryResult = memoryCache.get(text);
  if (memoryResult) {
    console.log(`✅ Memory cache hit (${type})`);
    return memoryResult;
  }

  // Layer 2: Database cache (persistent)
  const dbResult = await getFromDatabase(text, type);
  if (dbResult) {
    console.log(`✅ Database cache hit (${type})`);
    // Store in memory for next time
    memoryCache.set(text, dbResult);
    return dbResult;
  }

  // Layer 3: Generate new embedding
  console.log(`🔄 Generating new embedding (${type})`);
  const embedding = await generateFn(text);

  // Store in both caches (fire and forget for database)
  memoryCache.set(text, embedding);
  saveToDatabase(text, embedding, type).catch(err => {
    console.warn('Failed to save to database cache:', err.message);
  });

  return embedding;
};

/**
 * Get multiple embeddings with parallel processing
 * @param {Array<{text: string, type: string}>} requests - Array of embedding requests
 * @param {Function} generateFn - Function to generate embedding
 * @returns {Promise<Array<number[]>>} - Array of embedding vectors
 */
export const getCachedEmbeddingsBatch = async (requests, generateFn) => {
  return Promise.all(
    requests.map(({ text, type }) => 
      getCachedEmbedding(text, type, generateFn)
    )
  );
};

/**
 * Clear all caches
 */
export const clearAllCaches = () => {
  memoryCache.clear();
  console.log('🗑️ All caches cleared');
};

/**
 * Get combined cache statistics
 * @returns {Promise<Object>} - Cache stats from both layers
 */
export const getCacheStats = async () => {
  const memoryStats = memoryCache.getStats();
  
  // Database stats are expensive, so we skip them in this simple version
  // You can uncomment if needed:
  // const dbStats = await getDatabaseCacheStats();
  
  return {
    memory: memoryStats,
    // database: dbStats
  };
};

export default {
  getCachedEmbedding,
  getCachedEmbeddingsBatch,
  clearAllCaches,
  getCacheStats
};
