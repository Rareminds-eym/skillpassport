/**
 * Embedding Service
 * Handles embedding generation via the career-api Cloudflare worker.
 */

import { EMBEDDING_API_URL } from './config';

/**
 * Generate embedding for text via the career-api Cloudflare worker.
 * 
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 * @throws {Error} - If text is too short or API fails
 */
export const generateEmbedding = async (text) => {
  if (!text || text.trim().length < 10) {
    throw new Error('Text too short for embedding generation');
  }

  if (!EMBEDDING_API_URL) {
    throw new Error('VITE_CAREER_API_URL environment variable not configured');
  }

  // For course recommendations, we don't need to store the embedding
  // Just generate it for comparison purposes
  // Use 'profiles' table (allowed by worker) with a valid UUID
  // Generate a valid UUID v4 format
  const generateTempUUID = () => {
    // Generate random hex strings for each UUID section
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-4${s4().substring(0, 3)}-${s4()}-${s4()}${s4()}${s4()}`;
  };
  
  const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text, 
      table: 'students',  // Use existing table
      id: generateTempUUID(),  // Valid UUID format
      returnEmbedding: true,
      skipDatabaseUpdate: true  // Don't actually update the database, just return embedding
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
 * 
 * @param {string} skillName - The skill name to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 */
export const generateSkillEmbedding = async (skillName) => {
  const skillText = `Skill: ${skillName}. Looking for courses that teach ${skillName} skills and competencies.`;
  return generateEmbedding(skillText);
};
