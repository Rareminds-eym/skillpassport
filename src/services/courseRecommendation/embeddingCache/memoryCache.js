/**
 * In-Memory Embedding Cache
 * Fast, session-based caching for embeddings
 */

class MemoryCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate cache key from text
   */
  _generateKey(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `emb_${hash}`;
  }

  /**
   * Get embedding from cache
   */
  get(text) {
    const key = this._generateKey(text);
    const value = this.cache.get(key);

    if (value) {
      this.hits++;
      return value;
    }

    this.misses++;
    return null;
  }

  /**
   * Set embedding in cache
   */
  set(text, embedding) {
    const key = this._generateKey(text);

    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, embedding);
  }

  /**
   * Check if embedding exists in cache
   */
  has(text) {
    const key = this._generateKey(text);
    return this.cache.has(key);
  }

  /**
   * Clear all cached embeddings
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      efficiency: hitRate >= 50 ? 'Good' : 'Low',
    };
  }
}

// Singleton instance
const memoryCache = new MemoryCache();

export default memoryCache;
