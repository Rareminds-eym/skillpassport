/**
 * Embedding Service (Thin Client)
 * 
 * This service acts as a thin client to the Cloudflare embedding-api worker.
 * All embedding generation, text building, and database operations happen server-side.
 * 
 * The frontend only needs to:
 * 1. Request embedding generation for a record (by ID)
 * 2. Use utility functions like cosineSimilarity for local calculations
 */

import { supabase } from '../lib/supabaseClient';

const EMBEDDING_API_URL = import.meta.env.VITE_EMBEDDING_API_URL || 
  import.meta.env.VITE_CAREER_API_URL;

const regenerationDebounce = new Map();
const DEBOUNCE_MS = 5000;

// ==================== UTILITY FUNCTIONS ====================

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

// ==================== API CLIENT FUNCTIONS ====================

/**
 * Generate embedding for arbitrary text via the backend API
 * Returns the embedding vector for local use (e.g., similarity calculations)
 * 
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateEmbedding(text) {
  if (!text || text.trim().length < 10) {
    throw new Error('Text too short for embedding generation');
  }

  const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, returnEmbedding: true })
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
}

/**
 * Generate embeddings for multiple texts in a batch
 * 
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function generateBatchEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts array is required');
  }

  const results = [];
  for (const text of texts) {
    try {
      const embedding = await generateEmbedding(text);
      results.push(embedding);
    } catch (error) {
      console.error('Batch embedding failed for text:', error.message);
      results.push(null);
    }
  }

  return results;
}

/**
 * Generate embedding for a student record
 * The backend fetches student data and builds the embedding text
 * 
 * @param {string} studentId - Student ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function generateStudentEmbedding(studentId) {
  if (!studentId) {
    return { success: false, error: 'Student ID is required' };
  }

  try {
    const response = await fetch(`${EMBEDDING_API_URL}/regenerate?table=students&id=${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return { success: true, ...(await response.json()) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate embedding for an opportunity record
 * The backend fetches opportunity data and builds the embedding text
 * 
 * @param {string} opportunityId - Opportunity ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function generateOpportunityEmbedding(opportunityId) {
  if (!opportunityId) {
    return { success: false, error: 'Opportunity ID is required' };
  }

  try {
    const response = await fetch(`${EMBEDDING_API_URL}/regenerate?table=opportunities&id=${opportunityId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return { success: true, ...(await response.json()) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Ensure a student has an embedding, generating one if missing
 * 
 * @param {string} studentId - Student ID
 * @returns {Promise<{success: boolean, existed?: boolean, error?: string}>}
 */
export async function ensureStudentEmbedding(studentId) {
  if (!studentId) {
    return { success: false, error: 'Student ID is required' };
  }

  try {
    // Check if student already has an embedding
    const { data: student, error } = await supabase
      .from('students')
      .select('id, embedding')
      .eq('id', studentId)
      .single();

    if (error) {
      throw new Error(`Failed to check student: ${error.message}`);
    }

    if (student.embedding) {
      return { success: true, existed: true };
    }

    // Generate embedding via backend
    return await generateStudentEmbedding(studentId);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get embedding statistics from the backend
 * 
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export async function getEmbeddingStats() {
  try {
    const response = await fetch(`${EMBEDDING_API_URL}/stats`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, stats: result.stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Process the embedding queue via the backend
 * 
 * @param {number} batchSize - Number of items to process (default: 10)
 * @returns {Promise<{success: boolean, processed?: number, error?: string}>}
 */
export async function processEmbeddingQueue(batchSize = 10) {
  try {
    const response = await fetch(`${EMBEDDING_API_URL}/process-queue?batch=${batchSize}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return { success: true, ...(await response.json()) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Backfill missing embeddings for a table via the backend
 * 
 * @param {string} table - Table name ('students' or 'opportunities')
 * @param {number} limit - Maximum records to process (default: 50)
 * @returns {Promise<{success: boolean, processed?: number, error?: string}>}
 */
export async function backfillMissingEmbeddings(table = 'students', limit = 50) {
  try {
    const response = await fetch(`${EMBEDDING_API_URL}/backfill?table=${table}&limit=${limit}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return { success: true, ...(await response.json()) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Regenerate embedding for a student (with debouncing)
 * 
 * @param {string} studentId - Student ID
 * @returns {Promise<{success: boolean, debounced?: boolean, error?: string}>}
 */
export async function regenerateStudentEmbedding(studentId) {
  if (!studentId) {
    return { success: false, error: 'Student ID is required' };
  }

  // Debounce rapid regeneration requests
  const lastRegen = regenerationDebounce.get(studentId);
  if (lastRegen && Date.now() - lastRegen < DEBOUNCE_MS) {
    return { success: true, debounced: true };
  }
  regenerationDebounce.set(studentId, Date.now());

  return await generateStudentEmbedding(studentId);
}

/**
 * Schedule embedding regeneration for a student (async, fire-and-forget)
 * 
 * @param {string} studentId - Student ID
 */
export function scheduleEmbeddingRegeneration(studentId) {
  if (!studentId) return;
  setTimeout(() => {
    regenerateStudentEmbedding(studentId).catch(() => {});
  }, 1000);
}

// ==================== EXPORTS ====================

export default {
  // Utility functions
  cosineSimilarity,
  getEmbeddingDimension,
  
  // Embedding generation
  generateEmbedding,
  generateBatchEmbeddings,
  generateStudentEmbedding,
  generateOpportunityEmbedding,
  
  // Convenience functions
  ensureStudentEmbedding,
  regenerateStudentEmbedding,
  scheduleEmbeddingRegeneration,
  
  // Admin/batch operations
  getEmbeddingStats,
  processEmbeddingQueue,
  backfillMissingEmbeddings
};
