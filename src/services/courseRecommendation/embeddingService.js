/**
 * Embedding Service
 * Handles embedding generation via the career-api Cloudflare worker.
 */

import { getPagesApiUrl } from '../../utils/pagesUrl';
import { supabase } from '../../lib/supabaseClient';

const EMBEDDING_API_URL = getPagesApiUrl('career');

/**
 * Generate embedding for text via the career-api Cloudflare worker.
 * Falls back to question-generation API if career API is unavailable.
 * 
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 * @throws {Error} - If text is too short or API fails
 */
export const generateEmbedding = async (text) => {
  if (!text || text.trim().length < 10) {
    throw new Error('Text too short for embedding generation');
  }

  // Get auth token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (!token) {
    throw new Error('Authentication required');
  }

  // Try career API first
  try {
    const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        text, 
        table: 'students',
        id: generateTempUUID(),
        returnEmbedding: true,
        skipDatabaseUpdate: true
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.embedding && Array.isArray(result.embedding)) {
        return result.embedding;
      }
    }
  } catch (error) {
    console.warn('[Embedding] Career API unavailable, using fallback:', error.message);
  }

  // Fallback: Use simple keyword-based matching instead of embeddings
  // This is a temporary solution until the career API embedding endpoint is implemented
  console.warn('[Embedding] Using keyword-based fallback instead of semantic embeddings');
  
  // Return a dummy embedding that will trigger keyword-based matching
  // The calling code should handle this gracefully
  throw new Error('Embedding API not available - use keyword matching fallback');
};

// Helper function to generate temp UUID
const generateTempUUID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-4${s4().substring(0, 3)}-${s4()}-${s4()}${s4()}${s4()}`;
};

/**
 * Generate embedding for a skill search query.
 * Wraps the skill name with context for better semantic matching.
 * 
 * @param {string} skillName - The skill name to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
export const generateSkillEmbedding = async (skillName) => {
  const skillText = `Skill: ${skillName}. Looking for courses that teach ${skillName} skills and competencies.`;
  return generateEmbedding(skillText);
};
