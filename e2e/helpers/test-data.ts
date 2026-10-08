import fs from 'node:fs';
import path from 'node:path';

export interface TestUser {
  role: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** 10-digit Indian mobile number, accepted by the payment form's phone validation. */
  phone: string;
}

export function runId(): string {
  const id = process.env.E2E_RUN_ID;
  if (!id) throw new Error('E2E_RUN_ID is not set (it is created in playwright.config.ts)');
  return id;
}

/** Credentials for one user of this run. The email is the address of a mailbox created for that user. */
export function buildUser(role: string, email: string): TestUser {
  const password = process.env.E2E_PASSWORD;
  if (!password) throw new Error('E2E_PASSWORD is not set (it is created in playwright.config.ts)');
  const lastName = role.split(/[-_ ]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  const phone = `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;
  return { role, email, password, firstName: `E2E${runId()}`, lastName, phone };
}

/**
 * Records every email created in this run in test-results/e2e-run-<runId>.json so the cleanup
 * helper can find the run's data later. Passwords are never written.
 */
export function recordInManifest(user: Pick<TestUser, 'role' | 'email'>): void {
  const file = path.resolve('test-results', `e2e-run-${runId()}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const manifest: { runId: string; users: Array<{ role: string; email: string }> } = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8'))
    : { runId: runId(), users: [] };
  manifest.users.push({ role: user.role, email: user.email });
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
}
