import { EmbeddingError } from '../types';
import { EMBEDDING_CONFIG } from '../config/constants';

/** Validate at the provider boundary as well as immediately before persistence. */
export function validateEmbeddingVector(value: unknown): asserts value is number[] {
  if (!Array.isArray(value) || value.length !== EMBEDDING_CONFIG.EXPECTED_DIMENSIONS ||
      Array.from(value).some(item => typeof item !== 'number' || !Number.isFinite(item) || !Number.isFinite(Math.fround(item))) ||
      !value.some(item => Math.fround(item) !== 0)) {
    throw new EmbeddingError('Invalid embedding vector', 'INVALID_RESPONSE', {
      expectedDimensions: EMBEDDING_CONFIG.EXPECTED_DIMENSIONS,
      actualDimensions: Array.isArray(value) ? value.length : null,
    });
  }
}
