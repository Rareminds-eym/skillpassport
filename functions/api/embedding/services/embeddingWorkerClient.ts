/**
 * Embedding Client
 * Single source of truth for calling the embedding worker.
 *
 * This is the ONLY place that should call the embedding worker. All other code
 * should use this client.
 *
 * Transport: Cloudflare Service Binding RPC (env.EMBEDDING_SERVICE), not HTTP.
 * The binding routes worker-to-worker inside Cloudflare's network — zero added
 * latency, no Bearer token. See lib/embeddingBinding.ts.
 */

import { EmbeddingError } from '../types';
import { EMBEDDING_CONFIG, EMBEDDING_TASK_TYPES } from '../config/constants';
import { getEmbeddingWorker, type EmbeddingWorkerEnv } from '../lib/embeddingBinding';

/**
 * Call the embedding worker to generate an embedding from text.
 *
 * @param text - Text to generate an embedding for.
 * @param env - Pages Functions environment (must contain the EMBEDDING_SERVICE binding).
 * @param taskType - Type of embedding task (default: RETRIEVAL_DOCUMENT).
 * @returns Embedding vector.
 * @throws EmbeddingError on validation failure, RPC failure, or invalid response.
 */
export async function callEmbeddingWorker(
  text: string,
  env: Record<string, unknown>,
  taskType: string = EMBEDDING_TASK_TYPES.RETRIEVAL_DOCUMENT
): Promise<number[]> {
  // Validate input
  if (!text || text.trim().length < EMBEDDING_CONFIG.MIN_TEXT_LENGTH) {
    throw new EmbeddingError(
      `Text too short (minimum ${EMBEDDING_CONFIG.MIN_TEXT_LENGTH} characters)`,
      'INVALID_TEXT'
    );
  }

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

  try {
    // Resolve the typed RPC binding (throws if not configured).
    const worker = getEmbeddingWorker(env as EmbeddingWorkerEnv);

    // Call embedding worker via service binding RPC.
    const data = await worker.embedText(truncatedText, taskType);

    // Validate response
    if (!data || !Array.isArray(data.embedding) || data.embedding.length === 0) {
      throw new EmbeddingError(
        'Invalid embedding response from worker',
        'INVALID_RESPONSE',
        { response: embedding }
      );
    }

    return data.embedding;

  } catch (error) {
    // Re-throw EmbeddingError as-is
    if (error instanceof EmbeddingError) {
      logger.error('Embedding error', error, { code: error.code });
      throw error;
    }

    // RPC methods throw Errors prefixed with a stable "CODE: message" format.
    // Map the validation prefix back to our INVALID_TEXT code; everything else
    // is surfaced as a generic API error.
    const errorMessage = error instanceof Error ? error.message : String(error);
    const code = errorMessage.startsWith('INVALID_INPUT:') ? 'INVALID_TEXT' : 'API_ERROR';

    throw new EmbeddingError(
      `Failed to call embedding worker: ${errorMessage}`,
      code,
      { originalError: error }
    );
  }
}
