import type { SupabaseClient } from '@supabase/supabase-js';
import { callEmbeddingWorker } from '../../embedding/services/embeddingWorkerClient';

/** Repairs a small changed-job backlog on demand. Bulk indexing uses the same
 * DB input/publication contract through scripts/index-job-matching.mjs. */
export async function refreshJobMatchingIndex(
  db: SupabaseClient,
  env: Record<string, unknown>,
  model: string,
): Promise<void> {
  const { data, error } = await db.rpc('get_job_matching_index_batch', {
    p_model: model,
    p_limit: 3,
  });
  if (error || !Array.isArray(data))
    throw new Error('MATCHING_INDEX_UNAVAILABLE');
  await Promise.all(
    data.map(
      async (job: { id: string; input_text: string; input_hash: string }) => {
        const embedding = await callEmbeddingWorker(job.input_text, env);
        const { error: publishError } = await db.rpc(
          'publish_job_matching_vector',
          {
            p_id: job.id,
            p_model: model,
            p_input_hash: job.input_hash,
            p_embedding: embedding,
          },
        );
        // A source changing during generation is harmless; readiness is checked
        // again by the caller. A DB outage must never be treated as a ready index.
        if (publishError) throw new Error('MATCHING_INDEX_PUBLICATION_FAILED');
      },
    ),
  );
}
