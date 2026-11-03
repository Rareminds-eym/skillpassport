// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { FakeSupabase } from '../lib/__tests__/helpers/fake-supabase';
let fake: FakeSupabase;
vi.mock('../lib/db', () => ({ createDb: () => fake }));
import { onRequestPost } from '../sync/user';
import { processSsoMessage } from '../../../auth-sync-consumer/src/handlers/event-processor';
const secret = 'test-sync-secret';
const calls: Array<{ action: string; data: unknown }> = [];
beforeEach(() => {
  fake = new FakeSupabase(); calls.length = 0;
  fake.seed('users', [{ id: 'user', email: 'learner@example.test', metadata: { referralCode: 'KEEP', subscription_selection_required: false } }]);
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    calls.push(JSON.parse(String(init.body)));
    return onRequestPost({ request: new Request(url, init), env: { INTERNAL_WEBHOOK_SECRET: secret } } as never);
  }));
});
afterEach(() => vi.unstubAllGlobals());
async function deliver(payload = { user_id: 'user' }) {
  const msg = { body: { type: 'user.email_verified', payload }, ack: vi.fn(), retry: vi.fn() };
  await processSsoMessage(msg as never, 'https://example.test', secret);
  return msg;
}
it('routes the actual producer payload to verification and preserves existing profile metadata', async () => {
  const msg = await deliver();
  expect(calls[0]).toEqual({ action: 'email_verified', data: { user_id: 'user' } });
  expect(fake.rows('users')[0]).toMatchObject({ email: 'learner@example.test', metadata: { referralCode: 'KEEP', subscription_selection_required: false, is_email_verified: true } });
  expect(msg.ack).toHaveBeenCalledOnce(); expect(msg.retry).not.toHaveBeenCalled();
});
it('retries when verification arrives before user creation, then succeeds on replay', async () => {
  fake.tables.users = [];
  const first = await deliver();
  expect(first.retry).toHaveBeenCalledOnce(); expect(first.ack).not.toHaveBeenCalled();
  fake.seed('users', [{ id: 'user', metadata: { keep: true } }]);
  const second = await deliver();
  expect(second.ack).toHaveBeenCalledOnce(); expect(fake.rows('users')[0].metadata).toEqual({ keep: true, is_email_verified: true });
});
it.each(['select', 'update'] as const)('retains the message on a %s database failure', async op => {
  fake.injected.push({ table: 'users', op, error: { message: 'database unavailable' } });
  const msg = await deliver();
  expect(msg.retry).toHaveBeenCalledOnce(); expect(msg.ack).not.toHaveBeenCalled();
  expect(fake.rows('users')[0].metadata.is_email_verified).toBeUndefined();
});
it('can replay successful verification without losing metadata', async () => {
  await deliver(); await deliver();
  expect(fake.rows('users')).toHaveLength(1);
  expect(fake.rows('users')[0].metadata).toEqual({ referralCode: 'KEEP', subscription_selection_required: false, is_email_verified: true });
});
it('keeps ordinary user updates on the generic update path', async () => {
  const msg = { body: { type: 'user.updated', payload: { id: 'user', user_metadata: { firstName: 'New' } } }, ack: vi.fn(), retry: vi.fn() };
  await processSsoMessage(msg as never, 'https://example.test', secret);
  expect(calls[0].action).toBe('updated'); expect(fake.rows('users')[0].firstName).toBe('New');
  expect(fake.rows('users')[0].metadata.is_email_verified).toBeUndefined();
});
