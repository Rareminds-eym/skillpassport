import { runId } from './test-data';

/**
 * Provider-independent test mailbox. Specs only use createUserInbox, getEmailLink and deleteInbox.
 * The mailbox service that receives the real emails is chosen with E2E_MAILBOX_PROVIDER and lives in
 * its own file (mailbox-<provider>.ts), so changing provider never touches a spec.
 */

export type EmailKind = 'verify' | 'invite';

export interface Inbox {
  id: string;
  address: string;
}

export interface ReceivedEmail {
  subject: string;
  /** Full email body as delivered (HTML and/or text). */
  body: string;
}

/** What a provider file must implement. */
export interface MailboxProvider {
  /** Creates a new inbox for one test user. `tag` identifies the run (used to find leftovers). */
  createInbox(name: string, tag: string): Promise<Inbox>;
  /** Waits for the email whose subject contains `subjectContains` and returns it. */
  waitForEmail(inbox: Inbox, subjectContains: string, timeoutMs: number): Promise<ReceivedEmail>;
  deleteInbox(inbox: Inbox): Promise<void>;
}

const EMAILS: Record<EmailKind, { subject: string; link: RegExp }> = {
  // A signup sends two emails (welcome and verification), so the subject is matched.
  verify: { subject: 'Verify your email', link: /\/verify-email\?token=[A-Za-z0-9-]+/ },
  invite: { subject: 'invited', link: /\/invite\/accept\?token=[A-Za-z0-9-]+/ },
};

let provider: MailboxProvider | undefined;

async function getProvider(): Promise<MailboxProvider> {
  if (provider) return provider;
  const name = process.env.E2E_MAILBOX_PROVIDER;
  switch (name) {
    case 'mailslurp':
      provider = (await import('./mailbox-mailslurp')).mailslurpProvider;
      return provider;
    default:
      throw new Error(
        `E2E_MAILBOX_PROVIDER is "${name ?? ''}". Set it in .env.e2e. Supported: mailslurp (mailosaur is not implemented yet).`,
      );
  }
}

/** Link extraction works on the email body, so it is the same for every provider. */
export function extractLink(body: string, pattern: RegExp): string | undefined {
  // 1. The plain URL (text part or the printed URL in the HTML).
  const plain = body.match(pattern);
  if (plain) return plain[0];
  // 2. SES click tracking rewrites HTML links to .../L0/<url-encoded real URL>/1/...; decode and match.
  for (const m of body.matchAll(/href="([^"]+)"/g)) {
    const tracked = m[1].match(/\/L0\/(.+?)\/1\//);
    if (!tracked) continue;
    const decoded = decodeURIComponent(tracked[1]).match(pattern);
    if (decoded) return decoded[0];
  }
  return undefined;
}

/** Creates a mailbox for one test user. Use its address in the signup or invitation form. */
export async function createUserInbox(label: string): Promise<Inbox> {
  const id = runId();
  const inbox = await (await getProvider()).createInbox(`e2e-${id}-${label}`, id);
  console.log(`[e2e] mailbox for ${label}: ${inbox.address}`);
  return inbox;
}

/**
 * Waits for the real email and returns the path+query of its link (/verify-email?token=...
 * or /invite/accept?token=...). page.goto resolves it against the baseURL.
 */
export async function getEmailLink(inbox: Inbox, kind: EmailKind, timeoutMs?: number): Promise<string> {
  const wait = timeoutMs ?? Number(process.env.E2E_EMAIL_TIMEOUT_MS ?? 90_000);
  const { subject, link } = EMAILS[kind];
  const email = await (await getProvider()).waitForEmail(inbox, subject, wait);
  const found = extractLink(email.body, link);
  if (!found) throw new Error(`Email "${email.subject}" received but no ${kind} link was found in it`);
  return found;
}

/**
 * Never throws: a failed delete must not hide the test result.
 * Set E2E_KEEP_INBOXES=1 to keep the inbox and its emails (to look at them in the provider's dashboard).
 */
export async function deleteInbox(inbox: Inbox): Promise<void> {
  if (process.env.E2E_KEEP_INBOXES === '1') {
    console.log(`[e2e] keeping mailbox ${inbox.address} (E2E_KEEP_INBOXES=1)`);
    return;
  }
  try {
    await (await getProvider()).deleteInbox(inbox);
  } catch {
    // The run's leftover inboxes are removed by the cleanup helper.
  }
}
