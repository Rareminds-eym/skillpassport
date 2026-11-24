import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { experimental_readRawConfig } from 'wrangler';

const root = fileURLToPath(new URL('../', import.meta.url));
const configurations = {
  dev: { file: 'wrangler.dev.toml', branch: 'dev', mode: 'development' },
  qa: { file: 'wrangler.qa.toml', branch: 'qa-environment', mode: 'qa' },
  production: { file: 'wrangler.toml', branch: 'production', mode: 'production' },
};

export function pagesBuildSettings(target, env = process.env) {
  if (!Object.hasOwn(configurations, target)) throw new Error('Choose dev, qa, or production explicitly.');
  const selected = configurations[target];
  // QA configuration also serves feature-branch Pages previews.
  if (target !== 'qa' && env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH !== selected.branch) {
    throw new Error(`The ${target} build requires branch ${selected.branch}.`);
  }
  if (env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Remove VITE_SUPABASE_SERVICE_ROLE_KEY: service credentials must never be frontend variables.');
  }
  const { rawConfig } = experimental_readRawConfig({ config: join(root, selected.file) });
  const publicKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!publicKey) throw new Error('Set VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY for this Pages project.');
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_URL !== rawConfig.vars.SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL does not match the selected deployment database.');
  }
  // Legacy JWT anon keys must not be mistaken for service-role credentials or
  // copied from a different Supabase project. Publishable keys are opaque.
  if (publicKey.split('.').length === 3) {
    let payload;
    try { payload = JSON.parse(Buffer.from(publicKey.split('.')[1], 'base64url').toString()); }
    catch { throw new Error('The Supabase public key is malformed.'); }
    const project = new URL(rawConfig.vars.SUPABASE_URL).hostname.split('.')[0];
    if (payload.role !== 'anon' || (payload.ref && payload.ref !== project)) {
      throw new Error('Use the selected Supabase project’s public anon key.');
    }
  }
  return {
    ...selected,
    env: {
      ...env,
      ENVIRONMENT: rawConfig.vars.ENVIRONMENT,
      VITE_SUPABASE_URL: rawConfig.vars.SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: publicKey,
    },
  };
}

export function selectPagesConfiguration(directory, filename) {
  // Wrangler Pages supports this adapter redirect, rather than --config or --env qa.
  // Paths are relative to .wrangler/deploy/config.json; the tracked TOML stays intact.
  const redirect = join(directory, '.wrangler/deploy/config.json');
  mkdirSync(dirname(redirect), { recursive: true });
  writeFileSync(redirect, JSON.stringify({ configPath: `../../${filename}` }) + '\n');
}

export function resetPagesConfiguration(directory) {
  rmSync(join(directory, '.wrangler/deploy/config.json'), { force: true });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--local') {
      resetPagesConfiguration(root);
      process.exit(0);
    }
    const settings = pagesBuildSettings(process.argv[2]);
    const result = spawnSync(process.execPath, ['--max-old-space-size=4096', join(root, 'node_modules/vite/bin/vite.js'), 'build', '--mode', settings.mode], {
      cwd: root, env: settings.env, stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
    selectPagesConfiguration(root, settings.file);
    console.log(`Pages deployment configuration: ${settings.file}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
