/** Explicit maintenance command; no deployment or automatic full-catalog rebuild.
 * npm run index:job-matching -- --embedding-url http://127.0.0.1:9004
 * Uses service-only DB contracts and the authenticated embedding worker. */
import { config } from 'dotenv';
config({ path: '.dev.vars', quiet: true });
const embeddingUrl = process.argv[process.argv.indexOf('--embedding-url') + 1];
if (!process.argv.includes('--embedding-url') || !embeddingUrl)
  throw new Error('--embedding-url is required');
const model = process.env.MATCHING_EMBEDDING_MODEL;
for (const key of [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'EMBEDDING_API_KEY',
  'MATCHING_EMBEDDING_MODEL',
])
  if (!process.env[key]) throw new Error(`${key} is required`);
const workerUrl = new URL('/embeddings/text', embeddingUrl);
if (
  workerUrl.protocol !== 'https:' &&
  !['localhost', '127.0.0.1', '[::1]'].includes(workerUrl.hostname)
)
  throw new Error(
    'The embedding worker must use HTTPS outside local development',
  );
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
let total = 0;
let nextStart = 0;
const embed = async (job) => {
  // Leave room in the worker's existing technical request-rate bucket.
  const wait = Math.max(0, nextStart - Date.now());
  nextStart = Math.max(Date.now(), nextStart) + 600;
  if (wait) await new Promise((r) => setTimeout(r, wait));
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: job.input_text }),
      signal: AbortSignal.timeout(120000),
    });
    if (r.status === 429) {
      await new Promise((done) =>
        setTimeout(
          done,
          Math.min(
            60000,
            Math.max(1000, Number(r.headers.get('Retry-After') || '60') * 1000),
          ),
        ),
      );
      continue;
    }
    if (!r.ok) throw new Error(`Embedding worker failed (${r.status})`);
    const output = await r.json();
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
}
