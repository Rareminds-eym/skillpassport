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
  env: Record<string, string>,
  taskType: string = EMBEDDING_TASK_TYPES.RETRIEVAL_DOCUMENT
): Promise<number[]> {
  // Validate input
  if (!text || text.trim().length < EMBEDDING_CONFIG.MIN_TEXT_LENGTH) {
    throw new EmbeddingError(
      `Text too short (minimum ${EMBEDDING_CONFIG.MIN_TEXT_LENGTH} characters)`,
      'INVALID_TEXT'
    );
  }

  // Get API configuration
  const embeddingApiUrl = env.EMBEDDING_API_URL || env.VITE_EMBEDDING_API_URL;
  const embeddingApiKey = env.EMBEDDING_API_KEY || env.VITE_EMBEDDING_API_KEY;

  if (!embeddingApiUrl) {
    throw new EmbeddingError(
      'EMBEDDING_API_URL or VITE_EMBEDDING_API_URL environment variable is required',
      'API_ERROR',
      { missingVar: 'EMBEDDING_API_URL' }
    );
  }

  // Truncate text if needed
  const truncatedText = text.length > EMBEDDING_CONFIG.MAX_TEXT_LENGTH 
    ? text.slice(0, EMBEDDING_CONFIG.MAX_TEXT_LENGTH) 
    : text;
  
  if (text.length > EMBEDDING_CONFIG.MAX_TEXT_LENGTH) {
    console.warn(`[EmbeddingClient] Text truncated from ${text.length} to ${EMBEDDING_CONFIG.MAX_TEXT_LENGTH} chars`);
  }

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (embeddingApiKey) {
    headers['Authorization'] = `Bearer ${embeddingApiKey}`;
  }
  
  try {
    // Call embedding worker
    const response = await fetch(`${embeddingApiUrl}/embeddings/text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input: truncatedText,
        task_type: taskType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new EmbeddingError(
        `Embedding worker returned ${response.status}: ${errorText}`,
        'API_ERROR',
        { status: response.status, body: errorText }
      );
    }

    const data = await response.json() as EmbeddingResponse;

    // Validate response
    if (!data.success || !data.embedding || !Array.isArray(data.embedding) || data.embedding.length === 0) {
      throw new EmbeddingError(
        'Invalid embedding response from worker',
        'INVALID_RESPONSE',
        { response: data }
      );
    }
    
    // Log success
    console.log(`[EmbeddingClient] Generated ${data.dimensions}-dim embedding using ${data.model || 'embedding worker'}`);
    
    return data.embedding;

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

/**
 * Get embedding API configuration from environment
 * Helper function for consistent config extraction
 */
export function getEmbeddingConfig(env: Record<string, string>): {
  apiUrl: string | undefined;
  apiKey: string | undefined;
} {
  return {
    apiUrl: env.EMBEDDING_API_URL || env.VITE_EMBEDDING_API_URL,
    apiKey: env.EMBEDDING_API_KEY || env.VITE_EMBEDDING_API_KEY,
  };
}
