import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Uses only a fresh local fixture DB. Never connects to a Supabase project URL,
// reads a secret, clones source data, or applies SQL to the container's app DB.
const root = new URL('../../', import.meta.url);
const container = process.argv[2] || 'supabase_db_skillpassport';
if (!/^[a-zA-Z0-9_-]+$/.test(container)) throw new Error('Invalid local container name');
const database = `recommendation_context_test_${process.pid}_${Date.now()}`;
function docker(args, input) {
  const result = spawnSync('docker', ['exec', ...(input ? ['-i'] : []), container, ...args], { input, encoding: 'utf8', maxBuffer: 2_000_000 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || `Docker exited ${result.status}`);
  return `${result.stdout || ''}${result.stderr || ''}`;
}
const read = relative => readFileSync(new URL(relative, root), 'utf8');
let created = false;
try {
  docker(['createdb', '-U', 'postgres', '--template=template0', database]);
  created = true;
  const sql = [
    read('functions/__tests__/sql/recommendation-fixture.sql'),
    'CREATE TABLE public.education(id uuid PRIMARY KEY,learner_id uuid,enabled boolean);',
    'CREATE TABLE public.experience(id uuid PRIMARY KEY,learner_id uuid,enabled boolean);',
    "ALTER TABLE public.opportunities ADD COLUMN employment_type text DEFAULT 'full_time', ADD COLUMN location text, ADD COLUMN mode text;",
    'CREATE TABLE public.applied_jobs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),learner_id uuid,opportunity_id uuid);',
    'CREATE TABLE public.personal_assessment_results(id uuid PRIMARY KEY,learner_id uuid,status text,career_fit jsonb,created_at timestamptz);',
    'CREATE TABLE public.embeddings(entity_type text,entity_id uuid,embedding extensions.vector(1536),model_version text,input_hash text);',
    // Controlled job text for selection/publication tests; this does not test
    // the full production job text builder or recreate the entire app schema.
    "CREATE FUNCTION public.job_matching_text(o public.opportunities) RETURNS text LANGUAGE sql IMMUTABLE AS $$SELECT o.title$$;",
    read('supabase/migrations/20261015090000_recommendation_boundaries_and_revisions.sql'),
    read('supabase/migrations/20270122000000_recommendation_context_revisions.sql'),
    read('supabase/migrations/20270123000000_learner_career_preferences.sql'),
    read('supabase/migrations/20270124000000_recommendation_candidate_filters.sql'),
    read('supabase/migrations/20270125000000_recommendation_learning_dependency.sql'),
    read('supabase/migrations/20270126000000_recommendation_freshness.sql'),
    read('supabase/migrations/20270127000000_career_preferences_concurrency.sql'),
    read('functions/__tests__/sql/recommendation-context-revisions.sql'),
    read('functions/__tests__/sql/career-preferences.sql'),
    read('functions/__tests__/sql/recommendation-candidates.sql'),
    read('functions/__tests__/sql/lte-summary-fixture.sql'),
    read('../lte/supabase/migrations/20261022105000_recommendation_learning_summary.sql'),
    read('functions/__tests__/sql/lte-summary-selection.sql'),
  ].join('\n');
  const output = docker(['psql', '-X', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1'], sql);
  if (!output.includes('PASS: owned context')) throw new Error('SQL assertions did not finish');
  console.log(output.split('\n').filter(line => line.includes('PASS:')).join('\n'));
  console.log(`Verified ${fileURLToPath(new URL('supabase/migrations/20270122000000_recommendation_context_revisions.sql', root))}`);
} finally {
  if (created) docker(['dropdb', '-U', 'postgres', database]);
}
