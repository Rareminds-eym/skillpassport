/** Explicit maintenance command; no deployment or automatic full-catalog rebuild.
 * npm run index:job-matching -- --binding  (running multi-worker stack)
 * npm run index:job-matching -- --embedding-url http://127.0.0.1:9004
 * Uses service-only DB contracts and the authenticated embedding worker. */
import { config } from 'dotenv';
import { createJobIndexTransport } from './lib/job-index-transport.mjs';
config({ path: '.dev.vars', quiet: true });
const binding = process.argv.includes('--binding');
const embeddingUrl = process.argv.includes('--embedding-url') ? process.argv[process.argv.indexOf('--embedding-url') + 1] : undefined;
if (!binding && !embeddingUrl || binding && embeddingUrl) throw new Error('Choose exactly one of --binding or --embedding-url');
const model = process.env.MATCHING_EMBEDDING_MODEL;
for (const key of [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'MATCHING_EMBEDDING_MODEL',
])
  if (!process.env[key]) throw new Error(`${key} is required`);
const rpc = async (name, args) => {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) {
    const error = await r.json().catch(() => ({}));
    throw new Error(
      `Database ${name} failed (${r.status}): ${error.code || 'UNKNOWN'} ${error.message || ''}`,
    );
  }
  return r.json();
};
let transport;
let total = 0;
let nextStart = 0;
const embed = async (job) => {
  // Leave room in the worker's existing technical request-rate bucket.
  const wait = Math.max(0, nextStart - Date.now());
  nextStart = Math.max(Date.now(), nextStart) + 600;
  if (wait) await new Promise((r) => setTimeout(r, wait));
  for (let attempt = 0; attempt < 4; attempt++) {
    let output;
    try { output = await transport.embed(job.input_text); }
    catch (error) {
      if (error.code !== 'RATE_LIMIT_EXCEEDED') throw error;
      await new Promise(done => setTimeout(done, Math.min(60000, Math.max(1000, error.retryAfterSeconds * 1000))));
      continue;
    }
    if (
      output.model !== model ||
      !Array.isArray(output.embedding) ||
      output.embedding.length !== 1536 ||
      !output.embedding.every(Number.isFinite) ||
      !output.embedding.some((v) => v !== 0)
    )
      throw new Error('Embedding worker returned an incompatible vector');
    const saved = await rpc('publish_job_matching_vector', {
      p_id: job.id,
      p_model: model,
      p_input_hash: job.input_hash,
      p_embedding: output.embedding,
    });
    if (saved) total++;
    return;
  }
  throw new Error('Embedding worker remained rate-limited; rerun to resume');
};
try {
  transport = await createJobIndexTransport({binding,embeddingUrl});
  for (;;) {
    const jobs = await rpc('get_job_matching_index_batch', {
      p_model: model,
      p_limit: 30,
    });
    if (!jobs.length) break;
    for (let i = 0; i < jobs.length; i += 8)
      await Promise.all(jobs.slice(i, i + 8).map(embed));
    console.log(
      JSON.stringify({
        indexed: total,
        ...(await rpc('job_matching_index_status', { p_model: model })),
      }),
    );
  }
  console.log(
    JSON.stringify({
      complete: true,
      indexed: total,
      ...(await rpc('job_matching_index_status', { p_model: model })),
    }),
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await transport?.dispose();
}
