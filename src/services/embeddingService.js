/**
 * Embedding Service
 * Generates vector embeddings using Google Gemini text-embedding-004 model
 * for semantic similarity search in course recommendations.
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
const INITIAL_BACKOFF_MS = 1000; // 1 second
const BACKOFF_MULTIPLIER = 2; // Exponential: 1s, 2s, 4s, 8s

/**
 * Sleep utility for rate limiting backoff
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get the Gemini API key from environment
 * @returns {string} API key
 * @throws {Error} If API key is not configured
 */
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }
  return apiKey;
};

/**
 * Check if an error is a rate limit error
 * @param {Response} response - Fetch response
 * @param {Object} errorData - Parsed error data
 * @returns {boolean}
 */
const isRateLimitError = (response, errorData) => {
  return response.status === 429 || 
         errorData?.error?.code === 429 ||
         errorData?.error?.status === 'RESOURCE_EXHAUSTED';
};

/**
 * Generate embedding for a single text using Gemini text-embedding-004
 * Implements exponential backoff for rate limiting (1s, 2s, 4s, 8s)
 * 
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - 768-dimensional embedding vector
 * @throws {Error} If embedding generation fails after all retries
 * 
 * Requirements: 1.2, 6.1
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }]
          }
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

      // Parse error response
      const errorData = await response.json().catch(() => ({}));
      
      // Check for rate limiting
      if (isRateLimitError(response, errorData) && attempt < MAX_RETRIES) {
        console.warn(`Rate limited on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
        backoffMs *= BACKOFF_MULTIPLIER;
        continue;
      }

      lastError = new Error(
        errorData?.error?.message || 
        `Embedding API error: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      if (error.message.includes('Rate limited') || error.message.includes('RESOURCE_EXHAUSTED')) {
        if (attempt < MAX_RETRIES) {
          console.warn(`Rate limit error on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`);
          await sleep(backoffMs);
          backoffMs *= BACKOFF_MULTIPLIER;
          continue;
        }
      }
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to generate embedding after all retries');
};

/**
 * Generate embeddings for multiple texts in batch
 * Implements exponential backoff for rate limiting
 * 
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]>} - Array of 768-dimensional embedding vectors
 * @throws {Error} If batch embedding generation fails
 * 
 * Requirements: 6.2
 */
export const generateBatchEmbeddings = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array');
  }

  // Validate all texts are non-empty strings
  for (let i = 0; i < texts.length; i++) {
    if (!texts[i] || typeof texts[i] !== 'string') {
      throw new Error(`Text at index ${i} must be a non-empty string`);
    }
  }

  const apiKey = getApiKey();
  let lastError = null;
  let backoffMs = INITIAL_BACKOFF_MS;

  // Prepare batch request
  const requests = texts.map(text => ({
    content: {
      parts: [{ text }]
    }
  }));

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${BATCH_EMBEDDING_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests })
      });

      if (response.ok) {
        const data = await response.json();
        const embeddings = data?.embeddings;
        
        if (!embeddings || !Array.isArray(embeddings)) {
          throw new Error('Invalid batch embedding response format');
        }
        
        // Extract embedding values from each response
        return embeddings.map(e => {
          if (!e?.values || !Array.isArray(e.values)) {
            throw new Error('Invalid embedding in batch response');
          }
          return e.values;
        });
      }

      // Parse error response
      const errorData = await response.json().catch(() => ({}));
      
      // Check for rate limiting
      if (isRateLimitError(response, errorData) && attempt < MAX_RETRIES) {
        console.warn(`Batch rate limited on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
        backoffMs *= BACKOFF_MULTIPLIER;
        continue;
      }

      lastError = new Error(
        errorData?.error?.message || 
        `Batch embedding API error: ${response.status} ${response.statusText}`
      );
    } catch (error) {
      if (error.message.includes('Rate limited') || error.message.includes('RESOURCE_EXHAUSTED')) {
        if (attempt < MAX_RETRIES) {
          console.warn(`Batch rate limit error on attempt ${attempt + 1}, retrying in ${backoffMs}ms...`);
          await sleep(backoffMs);
          backoffMs *= BACKOFF_MULTIPLIER;
          continue;
        }
      }
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to generate batch embeddings after all retries');
};

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns a value between -1 and 1, where 1 means identical direction
 * 
 * @param {number[]} embedding1 - First embedding vector
 * @param {number[]} embedding2 - Second embedding vector
 * @returns {number} - Cosine similarity score between -1 and 1
 * @throws {Error} If embeddings are invalid or have different dimensions
 */
export const cosineSimilarity = (embedding1, embedding2) => {
  if (!Array.isArray(embedding1) || !Array.isArray(embedding2)) {
    throw new Error('Both embeddings must be arrays');
  }
  
  if (embedding1.length !== embedding2.length) {
    throw new Error(`Embedding dimensions must match: ${embedding1.length} vs ${embedding2.length}`);
  }
  
  if (embedding1.length === 0) {
    throw new Error('Embeddings cannot be empty');
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

  // Handle zero vectors
  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
};

/**
 * Get the expected embedding dimension
 * @returns {number} - Expected dimension (768 for text-embedding-004)
 */
export const getEmbeddingDimension = () => EMBEDDING_DIMENSION;

/**
 * Get the embedding model name
 * @returns {string} - Model name
 */
export const getEmbeddingModel = () => EMBEDDING_MODEL;

// Default export for convenience
export default {
  generateEmbedding,
  generateBatchEmbeddings,
  cosineSimilarity,
  getEmbeddingDimension,
  getEmbeddingModel
};
