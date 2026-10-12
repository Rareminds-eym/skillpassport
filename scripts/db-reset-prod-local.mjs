/**
 * Reset the LOCAL database with the production seed, minus the three auth.* INSERTs.
 *
 * GoTrue / Supabase Auth is disabled locally ([auth] enabled = false), so the auth.users,
 * auth.identities and auth.audit_log_entries tables do not have GoTrue's wide column set.
 * This script streams the production seed into a temporary filtered copy that drops ONLY
 * those three statements, then runs `supabase db reset --local --sql-paths <filtered>`.
 * The original seed files are never modified. public.users rows are kept.
 *
 * Local only: it refuses remote flags/URLs and never passes --linked or --db-url.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

export const REMOVED_TABLES = ['audit_log_entries', 'users', 'identities'];
const AUTH_INSERT_START = /^INSERT INTO "auth"\."(audit_log_entries|users|identities)"/;
const ANY_AUTH_INSERT = /^INSERT INTO "auth"\./;
const STATEMENT_START = /^(INSERT INTO|SELECT|UPDATE|DELETE|COPY|CREATE|ALTER|DROP|TRUNCATE) /i;
const STATEMENT_END = /\);\s*$/;

/**
 * Stream `input` to `output`, dropping the three auth.* INSERT statements.
 * Throws (fails loudly) unless each of the three statements is found and removed exactly once.
 */
export async function filterAuthInserts(input, output) {
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  const removedStatements = [];
  let removedLines = 0;
  let skipping = null;

  const write = async text => {
    if (!output.write(text)) await once(output, 'drain');
  };

  for await (const line of lines) {
    if (skipping) {
      // A statement must end with `);` before any other statement starts.
      if (STATEMENT_START.test(line)) {
        throw new Error(`Unterminated "auth"."${skipping}" INSERT: found a new statement before the closing ");"`);
      }
      removedLines++;
      if (STATEMENT_END.test(line)) skipping = null;
      continue;
    }

    const match = AUTH_INSERT_START.exec(line);
    if (match) {
      skipping = match[1];
      removedStatements.push(skipping);
      removedLines++;
      // Single-line statement (header and terminator on the same line).
      if (STATEMENT_END.test(line)) skipping = null;
      continue;
    }

    if (ANY_AUTH_INSERT.test(line)) {
      throw new Error(`Unexpected auth INSERT that this script does not know how to filter: ${line.slice(0, 80)}`);
    }
    await write(`${line}\n`);
  }

  if (skipping) throw new Error(`Unterminated "auth"."${skipping}" INSERT at end of file`);

  const sorted = [...removedStatements].sort();
  const expected = [...REMOVED_TABLES].sort();
  if (sorted.length !== expected.length || sorted.some((name, i) => name !== expected[i])) {
    throw new Error(
      `Expected to remove exactly one INSERT for each of ${expected.join(', ')} but removed: ${removedStatements.join(', ') || 'none'}`
    );
  }
  return { removedStatements, removedLines };
}

async function filterFile(source, destination) {
  const out = fs.createWriteStream(destination);
  const finished = once(out, 'finish');
  let result;
  try {
    result = await filterAuthInserts(fs.createReadStream(source, { encoding: 'utf8' }), out);
  } finally {
    out.end();
    await finished;
  }
  return result;
}

function containsAuthInsert(file) {
  // The two small seed files are read whole; the large one is detected by the stream filter below.
  return /^INSERT INTO "auth"\./m.test(fs.readFileSync(file, 'utf8'));
}

function refuseRemote(args, env) {
  const remote = [
    ...args.filter(arg => arg === '--linked' || arg === '--db-url' || /supabase\.co/i.test(arg)),
    ...['SUPABASE_DB_URL', 'DATABASE_URL'].filter(key => env[key] && /supabase\.co/i.test(env[key])),
  ];
  if (args.length > 0 || remote.length > 0) {
    throw new Error(`Refusing to run: this script is local-only and takes no arguments (${remote.join(', ') || args.join(' ')})`);
  }
}

async function main() {
  refuseRemote(process.argv.slice(2), process.env);
  const root = process.cwd();
  const seedDir = path.join(root, 'supabase', 'seed', 'production');
  if (!fs.existsSync(path.join(root, 'supabase', 'config.toml'))) {
    throw new Error('Run from the skillpassport project root (supabase/config.toml not found)');
  }
  const seedFiles = fs
    .readdirSync(seedDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.sql'))
    .map(entry => entry.name)
    .sort();
  if (seedFiles.length === 0) throw new Error(`No .sql files found in ${seedDir}`);

  const tempDir = path.join(root, 'supabase', '.temp', 'seed-prod-filtered');
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  let status = 1;
  try {
    let filtered = 0;
    for (const name of seedFiles) {
      const source = path.join(seedDir, name);
      const destination = path.join(tempDir, name);
      const isLarge = fs.statSync(source).size > 16 * 1024 * 1024;
      if (isLarge || containsAuthInsert(source)) {
        const { removedStatements, removedLines } = await filterFile(source, destination);
        filtered++;
        console.log(`Filtered ${name}: removed ${removedStatements.map(t => `auth.${t}`).join(', ')} (${removedLines} lines)`);
      } else {
        fs.copyFileSync(source, destination);
      }
    }
    if (filtered !== 1) throw new Error(`Expected exactly one seed file with auth INSERTs, filtered ${filtered}`);

    const result = spawnSync(
      'npx',
      ['supabase', 'db', 'reset', '--local', '--sql-paths', './.temp/seed-prod-filtered/*.sql'],
      { cwd: root, stdio: 'inherit' }
    );
    status = result.status ?? 1;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  process.exitCode = status;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`db-reset-prod-local: ${error.message}`);
    process.exitCode = 1;
  });
}
