/**
 * Database Embedding Cache
 * Persistent caching using Supabase
 */

import { supabase } from '../../../lib/supabaseClient';

/**
 * Generate a stable hash for text (for database key)
 */
const generateHash = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36); // Base36 for shorter keys
};

/**
 * Get embedding from database cache
 * @param {string} text - Text to get embedding for
 * @param {string} type - Cache type (profile, skill, course)
 * @returns {Promise<number[]|null>} - Cached embedding or null
 */
export const getFromDatabase = async (text, type = 'profile') => {
  try {
    const hash = generateHash(text);

    const { data, error } = await supabase
      .from('embedding_cache')
      .select('embedding, created_at')
      .eq('text_hash', hash)
      .eq('cache_type', type)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

    // Handle table not existing gracefully
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn(
          '⚠️ embedding_cache table not found. Run setup-embedding-cache.sql to enable database caching.'
        );
        return null;
      }
      // Silently ignore other errors (like 406)
      return null;
    }

    if (!data) {
      return null;
    }

    // Check if cache is still valid (30 days)
    const cacheAge = Date.now() - new Date(data.created_at).getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

    if (cacheAge > maxAge) {
      // Cache expired, delete it
      await supabase.from('embedding_cache').delete().eq('text_hash', hash);
      return null;
    }

    return data.embedding;
  } catch (error) {
    console.warn('Database cache read error:', error.message);
    return null;
  }
};

/**
 * Save embedding to database cache
 * @param {string} text - Text that was embedded
 * @param {number[]} embedding - Embedding vector
 * @param {string} type - Cache type (profile, skill, course)
 * @returns {Promise<boolean>} - Success status
 */
export const saveToDatabase = async (text, embedding, type = 'profile') => {
  try {
    const hash = generateHash(text);

    const { error } = await supabase.from('embedding_cache').upsert(
      {
        text_hash: hash,
        cache_type: type,
        embedding: embedding,
        text_preview: text.substring(0, 200), // Store preview for debugging
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'text_hash,cache_type',
      }
    );

    if (error) {
      // Handle table not existing gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        // Silently skip - table will be created later
        return false;
      }
      console.warn('Database cache write error:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Database cache write error:', error.message);
    return false;
  }
};

/**
 * Clear old cache entries (older than 30 days)
 * @returns {Promise<number>} - Number of entries deleted
 */
export const cleanupOldCache = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('embedding_cache')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (error) {
      console.warn('Cache cleanup error:', error.message);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.warn('Cache cleanup error:', error.message);
    return 0;
  }
};

/**
 * Get cache statistics from database
 * @returns {Promise<Object>} - Cache stats
 */
export const getDatabaseCacheStats = async () => {
  try {
    const { count: totalCount } = await supabase
      .from('embedding_cache')
      .select('*', { count: 'exact', head: true });

    const { count: profileCount } = await supabase
      .from('embedding_cache')
      .select('*', { count: 'exact', head: true })
      .eq('cache_type', 'profile');

    const { count: skillCount } = await supabase
      .from('embedding_cache')
      .select('*', { count: 'exact', head: true })
      .eq('cache_type', 'skill');

    return {
      total: totalCount || 0,
      byType: {
        profile: profileCount || 0,
        skill: skillCount || 0,
        course: (totalCount || 0) - (profileCount || 0) - (skillCount || 0),
      },
    };
  } catch (error) {
    console.warn('Failed to get cache stats:', error.message);
    return { total: 0, byType: {} };
  }
};
