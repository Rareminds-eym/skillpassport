#!/usr/bin/env node
/**
 * MailSlurp connectivity check (manual, standalone).
 *
 * Verifies this real flow:
 *   this script -> MailSlurp API (create inbox) -> LOCAL email worker -> AWS SES
 *   -> MailSlurp inbox -> this script reads the email and extracts the verify link -> inbox deleted
 *
 * Usage (from the skillpassport folder):
 *   1. Put MAILSLURP_API_KEY=<your key> in .env.e2e
 *   2. Start the local email worker in another terminal:  cd ../email-worker && npm run dev
 *   3. Run:  node scripts/check-mailslurp.mjs
 *
 * No npm install needed (uses Node's built-in fetch). Sends exactly ONE email, only to a
 * temporary MailSlurp address, and only through a LOCAL email worker (never production).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const MAILSLURP_API = 'https://api.mailslurp.com';
const WORKER_URL = process.env.EMAIL_WORKER_URL || 'http://127.0.0.1:9001';
const WORKER_DEV_VARS = process.env.EMAIL_WORKER_DEV_VARS || path.resolve(projectRoot, '../email-worker/.dev.vars');
const WAIT_MS = Number(process.env.E2E_EMAIL_TIMEOUT_MS || 90000);

function parseEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

let inboxId = null;
let apiKey = null;
let failed = false;

function fail(step, message) {
  console.log(`\nFAILED at step ${step}: ${message}`);
  failed = true;
}

async function slurp(method, urlPath, query) {
  const url = new URL(MAILSLURP_API + urlPath);
  for (const [k, v] of Object.entries(query || {})) url.searchParams.set(k, String(v));
  const res = await fetch(url, { method, headers: { 'x-api-key': apiKey }, signal: AbortSignal.timeout(WAIT_MS + 15000) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  return { ok: res.ok, status: res.status, json, text };
}

async function main() {
  // 1. Key
  const env = parseEnvFile(path.join(projectRoot, '.env.e2e'));
  apiKey = process.env.MAILSLURP_API_KEY || env.MAILSLURP_API_KEY;
  if (!apiKey) return fail(1, 'MAILSLURP_API_KEY not found (set it in .env.e2e or the shell).');
  console.log(`1. API key found (length ${apiKey.length}, value not shown)`);

  // 2. Local email worker reachable (and local only)
  const host = new URL(WORKER_URL).hostname;
  if (!['127.0.0.1', 'localhost'].includes(host)) return fail(2, `Refusing to send through a non-local email worker (${host}).`);
  try {
    const h = await fetch(WORKER_URL + '/health', { signal: AbortSignal.timeout(5000) });
    console.log(`2. Local email worker reachable at ${WORKER_URL} (health HTTP ${h.status})`);
  } catch {
    return fail(2, `Cannot reach the email worker at ${WORKER_URL}. Start it:  cd ../email-worker && npm run dev`);
  }
  const workerKey = parseEnvFile(WORKER_DEV_VARS).EMAIL_API_KEY;
  if (!workerKey) return fail(2, `EMAIL_API_KEY not found in ${WORKER_DEV_VARS}`);

  // 3. Create the MailSlurp inbox
  const created = await slurp('POST', '/inboxes');
  if (!created.ok || !created.json?.id) {
    return fail(3, `MailSlurp refused createInbox: HTTP ${created.status} ${created.text.slice(0, 200)} (wrong/expired key or no network).`);
  }
  inboxId = created.json.id;
  console.log('3. Inbox created');
  console.log(`   inboxId      : ${inboxId}`);
  console.log(`   emailAddress : ${created.json.emailAddress}`);

  // 4. Send ONE email through the existing local email worker (-> SES)
  const token = crypto.randomUUID();
  const verifyUrl = `http://localhost:8788/verify-email?token=${token}`;
  let sent;
  try {
    sent = await fetch(WORKER_URL + '/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Api-Key': workerKey },
      body: JSON.stringify({
        to: created.json.emailAddress,
        subject: 'E2E MailSlurp connectivity check',
        html: `<p>Check email. <a href="${verifyUrl}">Verify</a></p><p>Or copy this link:</p><p>${verifyUrl}</p>`,
        text: `Check email.\n${verifyUrl}`,
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    return fail(4, `Email worker request failed: ${e.cause?.code || e.message}`);
  }
  const sentBody = await sent.json().catch(() => ({}));
  if (!sent.ok) return fail(4, `Email worker/SES rejected the send: HTTP ${sent.status} ${JSON.stringify(sentBody).slice(0, 300)}`);
  console.log(`4. Email worker accepted the send; SES message id: ${sentBody.messageId || 'n/a'}`);

  // 5. Wait for the email in the MailSlurp inbox
  console.log(`5. Waiting up to ${WAIT_MS / 1000}s for the email in MailSlurp...`);
  const waited = await slurp('GET', '/waitForLatestEmail', { inboxId, timeout: WAIT_MS, unreadOnly: true });
  if (!waited.ok || !waited.json?.id) {
    return fail(5, `No email arrived in the MailSlurp inbox (HTTP ${waited.status}). SES accepted the send, so delivery to the MailSlurp address failed or is slow.`);
  }
  const email = waited.json;
  console.log('   Email RECEIVED');
  console.log(`   subject      : ${email.subject}`);
  console.log(`   body present : ${Boolean(email.body)}`);

  // 6. Extract the verify link (plain text first, then SES click-tracking fallback)
  const body = email.body || '';
  let found = null;
  let via = '';
  const plain = body.match(/\/verify-email\?token=([A-Za-z0-9-]+)/);
  if (plain) { found = plain; via = 'plain text in body'; }
  else {
    for (const h of body.matchAll(/href="([^"]+)"/g)) {
      const t = h[1].match(/\/L0\/(.+?)\/1\//);
      if (!t) continue;
      const dec = decodeURIComponent(t[1]).match(/\/verify-email\?token=([A-Za-z0-9-]+)/);
      if (dec) { found = dec; via = 'decoded SES click-tracking link'; break; }
    }
  }
  if (!found) return fail(6, 'Email received but no /verify-email?token= link could be extracted from the body.');
  console.log(`6. Link extracted via ${via}: ${found[0].slice(0, 40)}...`);
  console.log(`   token matches the one we sent: ${found[1] === token}`);
}

try {
  await main();
} catch (e) {
  fail('unexpected', e.stack || e.message);
} finally {
  if (inboxId) {
    const del = await slurp('DELETE', `/inboxes/${inboxId}`).catch(() => ({ ok: false, status: 'error' }));
    console.log(`7. Temporary inbox deleted: ${del.ok ? 'yes' : 'NO (HTTP ' + del.status + ') - delete it in the MailSlurp dashboard'}`);
  }
  console.log(failed ? '\nRESULT: FAILED (see the step above).' : '\nRESULT: SUCCESS - MailSlurp -> local email worker -> SES -> MailSlurp -> read OK.');
  process.exitCode = failed ? 1 : 0;
}
