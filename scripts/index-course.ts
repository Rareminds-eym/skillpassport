import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { callDocProvider, callTextProvider, GEMINI_MODEL_ID, GEMINI_DIMENSIONS } from '../../embedding-worker/src/providers';
import { enqueueCourseIndex, processCourseIndexBatch, validateCourseEmbedding, type CourseEmbeddingService, type CourseIndexEnv } from '../functions/api/ai-tutor/utils/course-index';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseOptions(args: string[]) {
  let courseId = '', envFile = '.env.course-index', force = false, help = false, localText = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') help = true;
    else if (arg === '--force') force = true;
    else if (arg === '--local-text') localText = true;
    else if (arg === '--course-id' || arg === '--env-file') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      if (arg === '--course-id') courseId = value; else envFile = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (!help && !UUID.test(courseId)) throw new Error('Provide --course-id with a valid course UUID.');
  return { courseId, envFile, force, help, localText };
}

/** Reuse the existing embedding-worker provider, without starting a Worker server. */
export function localEmbeddingService(key: string): CourseEmbeddingService {
  return {
    async embedText(input, task = 'RETRIEVAL_DOCUMENT') {
      if (typeof input !== 'string') throw new Error('Expected one text chunk');
      const result = await callTextProvider(input, key, 'local-course-index', 'http://localhost', task);
      const vector = { ...result, model: GEMINI_MODEL_ID, dimensions: GEMINI_DIMENSIONS };
      validateCourseEmbedding(vector);
      return vector;
    },
    async embedTexts(input) {
      if (input.length < 1 || input.length > 20 || input.some(text => !text.trim() || text.length > 6000)) throw new Error('Invalid chunk batch');
      const result = await callDocProvider(input, key, 'local-course-index', 'http://localhost');
      const embeddings = result.embeddings.map(item => ({ ...item, dimensions: GEMINI_DIMENSIONS }));
      for (const item of embeddings) validateCourseEmbedding({ ...item, model: GEMINI_MODEL_ID });
      return { embeddings, model: GEMINI_MODEL_ID, dimensions: GEMINI_DIMENSIONS };
    },
  };
}

export async function indexCourse(db: SupabaseClient, env: CourseIndexEnv, courseId: string, force: boolean, log: (message: string) => void = console.log, localText = false) {
  if (!UUID.test(courseId)) throw new Error('Invalid course UUID');
  const course = await db.from('courses').select('course_id').eq('course_id', courseId).is('deleted_at', null).maybeSingle();
  if (course.error || !course.data) throw new Error('Course not found or unavailable.');
  // This CLI owns the service-role key. Null is the SQL RPC's backend-only import identity.
  const queued = await enqueueCourseIndex(db, null, courseId, force);
  log(`Course ${courseId}: discovered ${queued.sources} sources.`);
  let completed = 0;
  for (let batch = 0; batch < 10000; batch++) {
    const result = await processCourseIndexBatch(db, env, 1, courseId, localText);
    completed += result.processed;
    if (!result.claimed) break;
    log(`Completed ${completed} sources in this run.`);
  }
  const latest = new Map<string, { version: number; status: string; is_current: boolean }>();
  for (let offset = 0; ; offset += 500) {
    const rows = await db.from('course_resource_analysis').select('lesson_id,resource_id,version,status,is_current').eq('course_id', courseId).order('id').range(offset, offset + 499);
    if (rows.error) throw new Error('Unable to read indexing results.');
    for (const row of rows.data || []) {
      const key = row.resource_id ? `resource:${row.resource_id}` : `lesson:${row.lesson_id}`;
      if (!latest.has(key) || latest.get(key)!.version < row.version) latest.set(key, row);
    }
    if ((rows.data?.length || 0) < 500) break;
  }
  const pending = [...latest.values()].filter(row => row.status !== 'ready' || !row.is_current).length;
  log(`Finished: ${latest.size - pending}/${latest.size} current sources ready; ${pending} failed or incomplete.`);
  if (pending) throw new Error('Some sources are incomplete. Check formats/access, allow active leases to expire, and rerun with --force for failed sources.');
  return { sources: latest.size, completed };
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log('npm run course:index -- --course-id <UUID> [--env-file .env.course-index] [--force] [--local-text]');
    return;
  }
  config({ path: resolve(options.envFile), quiet: true });
  for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENROUTER_API_KEY']) {
    if (!process.env[key]) throw new Error(`Missing ${key}; configure the local environment file.`);
  }
  if (options.localText && !['localhost', '127.0.0.1'].includes(new URL(process.env.SUPABASE_URL!).hostname)) throw new Error('Local text mode requires a local Supabase database.');
  const env: CourseIndexEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    AI_RESOURCE_ALLOWED_HOSTS: process.env.AI_RESOURCE_ALLOWED_HOSTS,
    CLOUDFLARE_R2_PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL,
    EMBEDDING_SERVICE: localEmbeddingService(process.env.OPENROUTER_API_KEY!),
  };
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  await indexCourse(db, env, options.courseId, options.force, console.log, options.localText);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    // Do not print upstream bodies, credentials, document text or raw provider exceptions.
    const message = error instanceof Error ? error.message : '';
    const safe = /^(Provide --course-id|Missing (?:value for --|SUPABASE_|OPENROUTER_)|Invalid course UUID|Course not found|Some sources are incomplete|Unable to read indexing results)/.test(message);
    console.error(safe ? message : 'Course indexing failed. Verify environment, migrations, source access and provider availability.');
    process.exitCode = 1;
  });
}
