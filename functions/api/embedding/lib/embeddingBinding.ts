/**
 * Embedding Worker Binding Helper
 *
 * Provides typed access to the embedding-worker (deployed as `embedding-api`)
 * via Cloudflare Service Binding RPC. Replaces the old HTTP fetch + Bearer-token
 * path (EMBEDDING_API_URL / EMBEDDING_API_KEY).
 *
 * Usage:
 *   const worker = getEmbeddingWorker(env);
 *   const { embedding } = await worker.embedText('Senior React engineer');
 */

// ─── RPC Result Types ───────────────────────────────────────────────────────────
// These mirror the types exported from embedding-worker/src/entrypoint.ts.
// Defined locally to avoid cross-project import issues (no shared package needed).

export interface EmbeddingItem {
  index: number;
  embedding: number[];
  dimensions: number;
}

export interface EmbedTextResult {
  embedding: number[];
  model: string;
  dimensions: number;
  task_type: string;
}

export interface EmbedImageResult {
  embeddings: EmbeddingItem[];
  model: string;
}

export interface DocMetadata {
  filename: string;
  mimeType: string;
  type: string;
  chunks: number;
  total_chars?: number;
  chunk_size?: number;
  chunk_overlap?: number;
  pages_detected?: number;
  pages_processed?: number;
}

export interface EmbedDocResult {
  embeddings: EmbeddingItem[];
  model: string;
  document: DocMetadata;
}

export interface DocInput {
  mimeType: string;
  /** Base64-encoded document bytes. */
  data: string;
  filename?: string;
}

/**
 * Typed interface for the EmbeddingService RPC binding.
 * Mirrors the EmbeddingService WorkerEntrypoint methods.
 */
export interface EmbeddingWorkerBinding {
  embedText(input: unknown, taskType?: string): Promise<EmbedTextResult>;
  embedImage(input: unknown): Promise<EmbedImageResult>;
  embedDoc(input: DocInput, maxPages?: number): Promise<EmbedDocResult>;
}

// ─── Environment Interface ──────────────────────────────────────────────────────

/**
 * Environment interface for Pages Functions that need the embedding worker binding.
 */
export interface EmbeddingWorkerEnv {
  /** Service binding to the embedding-worker (embedding-api). */
  EMBEDDING_SERVICE: EmbeddingWorkerBinding;

  /** Allow additional env vars. */
  [key: string]: unknown;
}

// ─── Helper Functions ───────────────────────────────────────────────────────────

/**
 * Get the typed embedding worker binding from the environment.
 *
 * @param env - Pages Functions environment object.
 * @returns Typed EmbeddingWorkerBinding stub for RPC calls.
 * @throws Error if the EMBEDDING_SERVICE binding is not configured.
 *
 * @example
 * ```ts
 * const worker = getEmbeddingWorker(env);
 * const { embedding } = await worker.embedText('Senior React engineer');
 * ```
 */
export function getEmbeddingWorker(env: EmbeddingWorkerEnv): EmbeddingWorkerBinding {
  if (!env.EMBEDDING_SERVICE) {
    throw new Error(
      'EMBEDDING_SERVICE binding is not configured. ' +
      'Add [[services]] to wrangler.toml or use --service EMBEDDING_SERVICE=embedding-api in local dev.'
    );
  }

  return env.EMBEDDING_SERVICE;
}

/**
 * Map an RPC error message to an HTTP status code.
 * EmbeddingService methods throw errors with format: "CODE: message".
 *
 * @param error - Error thrown by an EmbeddingService RPC method.
 * @returns HTTP status code based on the error prefix.
 */
export function rpcErrorToHttpStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);

  if (message.startsWith('INVALID_INPUT:')) return 400;
  if (message.startsWith('UNAUTHORIZED:')) return 401;
  if (message.startsWith('RATE_LIMIT_EXCEEDED:')) return 429;
  if (message.startsWith('PROVIDER_ERROR:')) return 502;
  if (message.startsWith('INTERNAL_ERROR:')) return 500;

  // Binding not configured or unknown error.
  if (message.includes('binding is not configured')) return 503;

  return 500;
}
