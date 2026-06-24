/**
 * Embedding Client
 * Single source of truth for calling the embedding worker
 * 
 * This is the ONLY place that should make HTTP calls to the embedding worker.
 * All other code should use this client.
 */

import { EmbeddingResponse, EmbeddingError } from '../types';
import { EMBEDDING_CONFIG, EMBEDDING_TASK_TYPES } from '../config/constants';

/**
 * Call the embedding worker to generate embedding from text
 * 
 * @param text - Text to generate embedding for
 * @param env - Environment variables (must contain EMBEDDING_API_URL)
 * @param taskType - Type of embedding task (default: RETRIEVAL_DOCUMENT)
 * @returns Embedding vector
 * @throws EmbeddingError on failure
 */
export async function callEmbeddingWorker(
  text: string,
  env: any,
  taskType: string = EMBEDDING_TASK_TYPES.RETRIEVAL_DOCUMENT
): Promise<number[]> {
  // Validate input
  if (!text || text.trim().length < EMBEDDING_CONFIG.MIN_TEXT_LENGTH) {
    throw new EmbeddingError(
      `Text too short (minimum ${EMBEDDING_CONFIG.MIN_TEXT_LENGTH} characters)`,
      'INVALID_TEXT'
    );
  }

  if (!env.EMBEDDING_SERVICE) {
    throw new EmbeddingError(
      'EMBEDDING_SERVICE binding is required',
      'API_ERROR',
      { missingVar: 'EMBEDDING_SERVICE' }
    );
  }

  // Truncate text if needed
  const truncatedText = text.length > EMBEDDING_CONFIG.MAX_TEXT_LENGTH 
    ? text.slice(0, EMBEDDING_CONFIG.MAX_TEXT_LENGTH) 
    : text;
  
  if (text.length > EMBEDDING_CONFIG.MAX_TEXT_LENGTH) {
    console.warn(`[EmbeddingClient] Text truncated from ${text.length} to ${EMBEDDING_CONFIG.MAX_TEXT_LENGTH} chars`);
  }

  try {
    // Call embedding worker via True RPC
    const embedding = await env.EMBEDDING_SERVICE.getEmbedding(truncatedText, taskType);

    // Validate response
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new EmbeddingError(
        'Invalid embedding response from worker',
        'INVALID_RESPONSE',
        { response: embedding }
      );
    }

    // Log success
    console.log(`[EmbeddingClient] Generated ${embedding.length}-dim embedding using worker RPC`);
    
    return embedding;

  } catch (error) {
    // Re-throw EmbeddingError as-is
    if (error instanceof EmbeddingError) {
      throw error;
    }

    // Wrap other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new EmbeddingError(
      `Failed to call embedding worker: ${errorMessage}`,
      'API_ERROR',
      { originalError: error }
    );
  }

}
