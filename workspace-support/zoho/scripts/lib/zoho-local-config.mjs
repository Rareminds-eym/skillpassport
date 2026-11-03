import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

/** Dotenv quotes are delimiters, not JSON string escapes. Preserve JSON and PEM
 * values literally rather than leaving backslashes before their inner quotes. */
export function serializeLocalVars(values) {
  return Object.entries(values).map(([key, value]) => {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || typeof value !== 'string') throw new Error('Invalid local variable');
    const delimiter = ["'", '`', '"'].find(quote => !value.includes(quote) && (quote !== '"' || !/[\\\r\n]/.test(value)));
    if (!delimiter) throw new Error('Local variable cannot be represented safely');
    return `${key}=${delimiter}${value}${delimiter}`;
  }).join('\n') + '\n';
}

export function isLocalDatabaseUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash;
  } catch { return false; }
}

/** Validate every input before any network probe or configuration write. */
export function planLocalEnable(configurations) {
  for (const [repo, env] of Object.entries(configurations)) {
    const urls = ['SUPABASE_URL', 'SKILLPASSPORT_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'].filter(key => env[key]);
    if ((repo !== 'auth-sync-consumer' && !urls.length) || urls.some(key => !isLocalDatabaseUrl(env[key])))
      throw new Error('Nonlocal database rejected: ' + repo);
    if (Object.keys(env).some(key => /^(EMAIL_|SMTP_|RESEND_|SENDGRID_)/.test(key)))
      throw new Error('Mail configuration is forbidden in this runtime');
  }
  const app = configurations.skillpassport, consumer = configurations['auth-sync-consumer'];
  if (!app?.INTERNAL_WEBHOOK_SECRET || app.INTERNAL_WEBHOOK_SECRET !== consumer?.SYNC_API_SECRET ||
      consumer.SKILLPASSPORT_SYNC_URL !== 'http://127.0.0.1:8898') throw new Error('Local sync wiring mismatch');
  return Object.fromEntries(['sp-dash', 'sso-worker', 'skillpassport'].map(repo => {
    if (!configurations[repo]) throw new Error('Missing local configuration: ' + repo);
    const env = { ...configurations[repo] };
    for (const key of Object.keys(env)) if (/^ZOHO_.*_ENABLED$/.test(key)) env[key] = 'true';
    if (repo === 'sp-dash' && (!env.ZOHO_CLIENT_ID || !env.ZOHO_CLIENT_SECRET)) env.ZOHO_DISCOVERY_ENABLED = 'false';
    return [repo, env];
  }));
}

/** Per-file atomic replacement, with rollback of earlier replacements on failure.
 * Runtimes must restart after a successful batch; this is not a multi-file FS transaction.
 */
export function replaceLocalFiles(files, io = { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync }) {
  const entries = files.map(({ path, contents }) => ({ path, contents, original: io.readFileSync(path),
    temporary: path + '.stage-' + randomUUID(), rollback: path + '.rollback-' + randomUUID() }));
  const committed = [];
  try {
    for (const entry of entries) io.writeFileSync(entry.temporary, entry.contents, { mode: 0o600, flag: 'wx' });
    for (const entry of entries) { io.renameSync(entry.temporary, entry.path); committed.push(entry); }
  } catch (error) {
    const failures = [];
    for (const entry of committed.reverse()) {
      try {
        io.writeFileSync(entry.rollback, entry.original, { mode: 0o600, flag: 'wx' });
        io.renameSync(entry.rollback, entry.path);
      } catch (failure) { failures.push(failure); }
    }
    if (failures.length) throw new AggregateError([error, ...failures], 'Local flag update failed and rollback is incomplete; stop runtimes and restore configuration.');
    throw error;
  } finally {
    for (const entry of entries) for (const path of [entry.temporary, entry.rollback]) {
      if (io.existsSync(path)) io.unlinkSync(path);
    }
  }
}

export function requireDashboardRuntime(root, exists = existsSync) {
  if (!exists(root + '/sp-dash/.wrangler/zoho-local/dashboard-runtime.mjs'))
    throw new Error('Local dashboard runtime missing. Run: node scripts/zoho-local-runtime.mjs build-dashboard');
}

export async function verifyLocalProjection(secret, { requireDelivery = false, fetchImpl = fetch } = {}) {
  if (!secret) throw new Error('Local projection credential missing');
  const response = await fetchImpl('http://127.0.0.1:8898/sync/zoho-candidate', {
    method: 'GET', headers: { Authorization: `Bearer ${secret}` }, redirect: 'manual',
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 200) throw new Error('Local projection dependencies unavailable');
  const result = await response.json();
  if (result?.version !== 1 || result.dependenciesReady !== true || result.readOnly !== true ||
      result.emailPolicy !== 'forbidden' || typeof result.deliveryEnabled !== 'boolean' ||
      (requireDelivery && result.deliveryEnabled !== true)) throw new Error('Local projection readiness not verified');
  return result;
}
