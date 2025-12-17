/**
 * Embedding Service
 * Generates vector embeddings using Google Gemini text-embedding-004 model
 * for semantic similarity search in course recommendations.
 * 
 * Note: Uses Gemini for embeddings only. All chat/completion uses Claude.
 * 
 * Feature: rag-course-recommendations
 * Requirements: 1.2, 6.1, 6.2
 */

// Gemini Embedding API configuration
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768;
const EMBEDDING_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;
const BATCH_EMBEDDING_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`;

// Rate limiting configuration
const MAX_RETRIES = 4;
const INITIAL_BACKOFF_MS = 1000;
const BACKOFF_MULTIPLIER = 2;

/**
 * Sleep utility for rate limiting backoff
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get the Gemini API key from environment
 */
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file for embeddings.');
  }
  return apiKey;
};

/**
 * Check if embedding service is configured
 */
export const isEmbeddingConfigured = () => {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
};

/**
 * Check if an error is a rate limit error
 */
const isRateLimitError = (response, errorData) => {
  return response.status === 429 || 
         errorData?.error?.code === 429 ||
         errorData?.error?.status === 'RESOURCE_EXHAUSTED';
};

/**
 * Generate embedding for a single text using Gemini text-embedding-004
 * 
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - 768-dimensional embedding vector
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  const apiKey = getApiKey();
  let lastError = null;
  let backoffMs = INITIAL_BACKOFF_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${EMBEDDING_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const embedding = data?.embedding?.values;
        
        if (!embedding || !Array.isArray(embedding)) {
          throw new Error('Invalid embedding response format');
        }
        
        return embedding;
      }

      const errorData = await response.json().catch(() => ({}));
      
      if (isRateLimitError(response, errorData) && attempt < MAX_RETRIES) {
        console.warn(`Embedding rate limited, retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
        backoffMs *= BACKOFF_MULTIPLIER;
        continue;
      }

      lastError = new Error(errorData?.error?.message || `Embedding API error: ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(backoffMs);
        backoffMs *= BACKOFF_MULTIPLIER;
      }
    }
  }

  throw lastError || new Error('Failed to generate embedding after all retries');
};

/**
 * Generate embeddings for multiple texts in batch
 * 
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export const generateBatchEmbeddings = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array');
  }

  const apiKey = getApiKey();
  let lastError = null;
  let backoffMs = INITIAL_BACKOFF_MS;

  const requests = texts.map(text => ({
    content: { parts: [{ text }] }
  }));

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${BATCH_EMBEDDING_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
      });

      if (response.ok) {
        const data = await response.json();
        const embeddings = data?.embeddings;
        
        if (!embeddings || !Array.isArray(embeddings)) {
          throw new Error('Invalid batch embedding response format');
        }
        
        return embeddings.map(e => {
          if (!e?.values || !Array.isArray(e.values)) {
            throw new Error('Invalid embedding in batch response');
          }
          return e.values;
        });
      }

      const errorData = await response.json().catch(() => ({}));
      
      if (isRateLimitError(response, errorData) && attempt < MAX_RETRIES) {
        console.warn(`Batch embedding rate limited, retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
        backoffMs *= BACKOFF_MULTIPLIER;
        continue;
      }

      lastError = new Error(errorData?.error?.message || `Batch embedding API error: ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(backoffMs);
        backoffMs *= BACKOFF_MULTIPLIER;
      }
    }
  }

  throw lastError || new Error('Failed to generate batch embeddings after all retries');
};

/**
 * Calculate cosine similarity between two embedding vectors
 * 
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} - Cosine similarity score between -1 and 1
 */
export const cosineSimilarity = (embedding1, embedding2) => {
  if (!Array.isArray(embedding1) || !Array.isArray(embedding2)) {
    throw new Error('Both embeddings must be arrays');
  }
  
  if (embedding1.length !== embedding2.length) {
    throw new Error(`Embedding dimensions must match: ${embedding1.length} vs ${embedding2.length}`);
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
};

export default {
  generateEmbedding,
  generateBatchEmbeddings,
  cosineSimilarity,
  isEmbeddingConfigured,
  EMBEDDING_DIMENSION
};
