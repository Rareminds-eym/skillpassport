import type { Inbox, MailboxProvider, ReceivedEmail } from './mailbox';

// MailSlurp adapter. Uses the REST API directly (built-in fetch), so no extra package is needed.
const API = 'https://api.mailslurp.com';

function apiKey(): string {
  const key = process.env.MAILSLURP_API_KEY;
  if (!key) throw new Error('MAILSLURP_API_KEY is not set (put it in .env.e2e)');
  return key;
}

async function call<T>(method: string, pathAndQuery: string, body?: unknown, timeoutMs = 30_000): Promise<T> {
  const res = await fetch(API + pathAndQuery, {
    method,
    headers: { 'x-api-key': apiKey(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`MailSlurp ${method} ${pathAndQuery.split('?')[0]} failed: HTTP ${res.status} ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : undefined) as T;
}

export const mailslurpProvider: MailboxProvider = {
  async createInbox(name, tag) {
    const inbox = await call<{ id: string; emailAddress: string }>('POST', '/inboxes/withOptions', {
      name,
      tags: ['e2e', tag],
    });
    return { id: inbox.id, address: inbox.emailAddress };
  },

  async waitForEmail(inbox: Inbox, subjectContains: string, timeoutMs: number): Promise<ReceivedEmail> {
    const query = `inboxId=${inbox.id}&count=1&timeout=${timeoutMs}&unreadOnly=false`;
    const previews = await call<Array<{ id: string }>>(
      'POST',
      `/waitForMatchingEmails?${query}`,
      { matches: [{ field: 'SUBJECT', should: 'CONTAIN', value: subjectContains }] },
      timeoutMs + 15_000,
    );
    const email = await call<{ subject?: string; body?: string }>('GET', `/emails/${previews[0].id}`);
    return { subject: email.subject ?? '', body: email.body ?? '' };
  },

  async deleteInbox(inbox: Inbox) {
    await call('DELETE', `/inboxes/${inbox.id}`);
  },
};
