/**
 * Embedding Client
 * Single source of truth for calling the embedding worker
 *
 * This is the ONLY place that should make HTTP calls to the embedding worker.
 * All other code should use this client.
 */

import { EmbeddingResponse, EmbeddingError } from '../types';
import { EMBEDDING_CONFIG, EMBEDDING_TASK_TYPES } from '../config/constants';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('embedding-client');

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

  // Get API configuration - only use backend environment variables
  const embeddingApiUrl = env.EMBEDDING_API_URL;
  const embeddingApiKey = env.EMBEDDING_API_KEY;

  if (!embeddingApiUrl) {
    logger.error('Missing EMBEDDING_API_URL environment variable - embeddings cannot be generated');
    throw new EmbeddingError(
      'EMBEDDING_SERVICE binding is required',
      'API_ERROR',
      { missingVar: 'EMBEDDING_SERVICE' }
    );
  }

  if (!embeddingApiKey) {
    logger.warn('Missing EMBEDDING_API_KEY - embedding requests may fail if authentication is required');
  }

  logger.debug('Calling embedding worker', {
    textLength: text.length,
    taskType,
    apiUrl: embeddingApiUrl,
  });

  // Truncate text if needed
  const truncatedText = text.length > EMBEDDING_CONFIG.MAX_TEXT_LENGTH
    ? text.slice(0, EMBEDDING_CONFIG.MAX_TEXT_LENGTH)
    : text;

  if (text.length > EMBEDDING_CONFIG.MAX_TEXT_LENGTH) {
    logger.warn('Text truncated for embedding', {
      originalLength: text.length,
      truncatedLength: EMBEDDING_CONFIG.MAX_TEXT_LENGTH,
    });
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
      let errorText: string;
      try {
        errorText = await response.text();
      } catch (textError) {
        const textErrorMsg = textError instanceof Error ? textError.message : 'Unknown read error';
        errorText = `[Response body unreadable: ${textErrorMsg}]`;
        logger.error('Failed to read embedding worker error response', textError instanceof Error ? textError : new Error(String(textError)), {
          status: response.status,
        });
      }

      logger.error('Embedding worker returned error', new Error(`HTTP ${response.status}`), {
        status: response.status,
        body: errorText.substring(0, 200),
        apiUrl: embeddingApiUrl,
      });

      throw new EmbeddingError(
        `Embedding worker returned ${response.status}: ${errorText}`,
        'API_ERROR',
        { status: response.status, body: errorText }
      );
    }

    const data = await response.json() as EmbeddingResponse;

    // Validate response
    if (!data.success || !data.embedding || !Array.isArray(data.embedding) || data.embedding.length === 0) {
      logger.error('Invalid embedding response from worker', new Error('Invalid response structure'), {
        success: data.success,
        hasEmbedding: !!data.embedding,
        isArray: Array.isArray(data.embedding),
        length: data.embedding?.length,
      });

      throw new EmbeddingError(
        'Invalid embedding response from worker',
        'INVALID_RESPONSE',
        { response: embedding }
      );
    }

    logger.info('Embedding generated successfully', {
      dimensions: data.dimensions,
      model: data.model || 'embedding-worker',
      taskType,
    });
    
    return embedding;

  } catch (error) {
    // Re-throw EmbeddingError as-is
    if (error instanceof EmbeddingError) {
      logger.error('Embedding error', error, { code: error.code });
      throw error;
    }

    // Wrap other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Unexpected error calling embedding worker', error instanceof Error ? error : new Error(errorMessage), {
      apiUrl: embeddingApiUrl,
    });

    throw new EmbeddingError(
      `Failed to call embedding worker: ${errorMessage}`,
      'API_ERROR',
      { originalError: error }
    );
  }

}
