import { z } from 'zod';
export const CATALOG_EMBEDDING_MODEL = 'google/gemini-embedding-2-preview';
// Persisted generation identifier retained for existing vectors and replay.
export const CATALOG_INDEX_VERSION = 'career-rag-v1';
export const VectorResult = z.object({
  embedding: z.array(z.number().finite()).length(1536), model: z.literal(CATALOG_EMBEDDING_MODEL),
  dimensions: z.literal(1536), task_type: z.literal('RETRIEVAL_QUERY'),
});
export const Hit = z.object({
  id: z.string().uuid(), kind: z.enum(['role', 'course']), title: z.string().min(1).max(500),
  description: z.string().max(2000), revision: z.string().regex(/^[a-f0-9]{64}$/),
  model: z.literal(CATALOG_EMBEDDING_MODEL), index_version: z.literal(CATALOG_INDEX_VERSION), indexed_at: z.string().datetime({ offset: true }),
  similarity: z.number().finite().min(-1).max(1), retrieval_score: z.number().finite(),
  requirements: z.string().max(400).optional(), degree_gate: z.string().nullable().optional(),
  activities: z.string().max(800).optional(), outcomes: z.string().nullable().optional(),
  category: z.string().nullable().optional(), duration: z.string().nullable().optional(),
  classification: z.string().nullable().optional(),
}).strict();
export const SearchResult = z.object({ status: z.enum(['matches', 'no_matches', 'index_unavailable']), items: z.array(Hit).max(3) }).strict();

