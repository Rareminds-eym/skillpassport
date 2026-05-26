import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { getApiUrl } from '@/shared/api/apiUtils';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const EMBEDDING_API_URL = getApiUrl('career');
const logger = getLogger('embedding-service');

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRateLimited = async (response: any): Promise<boolean> => {
  if (response.status === 429) {
    return true;
  }
  try {
    const clone = response.clone();
    const body = await clone.json();
    if (body?.error?.status === 'RESOURCE_EXHAUSTED' || 
        body?.error?.message?.toLowerCase().includes('rate limit') ||
        body?.message?.toLowerCase().includes('rate limit')) {
      return true;
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return false;
};

/**
 * Generate embedding for text via the career-api Cloudflare worker.
 * 
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - Embedding vector
 * @throws {Error} - If text is too short or API fails
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!text || text.trim().length < 10) {
    throw new Error('Text too short for embedding generation');
  }

  const token = ssoClient.getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  let attempt = 0;
  const maxRetries = 4; // 5 total attempts (initial + 4 retries)

  while (attempt <= maxRetries) {
    try {
      const response = await ssoClient.fetch(`${EMBEDDING_API_URL}/generate-embedding?model=text-embedding-004`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          table: 'learners',
          id: generateTempUUID(),
          returnEmbedding: true,
          skipDatabaseUpdate: true
        })
      });

      const rateLimited = await isRateLimited(response);
      if (rateLimited) {
        if (attempt === maxRetries) {
          throw new Error('Rate limit exceeded after max retries');
        }
        attempt++;
        await sleep(Math.min(1000, 10 * Math.pow(2, attempt)));
        continue;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.embedding && Array.isArray(result.embedding)) {
          return result.embedding;
        }
        if (result.embedding && result.embedding.values && Array.isArray(result.embedding.values)) {
          return result.embedding.values;
        }
      }
      
      // If not ok and not rate limited, break to go to fallback/error
      break;
    } catch (error: any) {
      if (error.message && error.message.toLowerCase().includes('rate limit')) {
        throw error;
      }
      logger.warn(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) {
        break;
      }
      attempt++;
      await sleep(Math.min(1000, 10 * Math.pow(2, attempt)));
    }
  }

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
export const generateSkillEmbedding = async (skillName: string): Promise<number[]> => {
  const skillText = `Skill: ${skillName}. Looking for courses that teach ${skillName} skills and competencies.`;
  return generateEmbedding(skillText);
};

/**
 * Generate embeddings for a batch of texts.
 * 
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export const generateBatchEmbeddings = async (texts: string[]): Promise<number[][]> => {
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  for (const text of texts) {
    if (!text || text.trim().length < 10) {
      throw new Error('Text too short for embedding generation');
    }
  }

  const token = ssoClient.getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  let attempt = 0;
  const maxRetries = 4;

  while (attempt <= maxRetries) {
    try {
      const response = await ssoClient.fetch(`${EMBEDDING_API_URL}/generate-embedding?model=text-embedding-004`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: texts.map(text => ({
            content: { parts: [{ text }] }
          }))
        })
      });

      const rateLimited = await isRateLimited(response);
      if (rateLimited) {
        if (attempt === maxRetries) {
          throw new Error('Rate limit exceeded after max retries');
        }
        attempt++;
        await sleep(Math.min(1000, 10 * Math.pow(2, attempt)));
        continue;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.embeddings && Array.isArray(result.embeddings)) {
          return result.embeddings.map((emb: any) => {
            if (Array.isArray(emb)) return emb;
            if (emb && Array.isArray(emb.values)) return emb.values;
            return emb;
          });
        }
      }
      break;
    } catch (error: any) {
      if (error.message && error.message.toLowerCase().includes('rate limit')) {
        throw error;
      }
      if (attempt === maxRetries) {
        break;
      }
      attempt++;
      await sleep(Math.min(1000, 10 * Math.pow(2, attempt)));
    }
  }

  // Fallback to calling generateEmbedding individually if batch fails or behaves unexpectedly
  return Promise.all(texts.map(text => generateEmbedding(text)));
};

export { cosineSimilarity } from '@/shared/lib/vectorUtils';
export const getEmbeddingDimension = () => 768;
