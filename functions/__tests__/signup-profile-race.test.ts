// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { FakeSupabase } from '../lib/__tests__/helpers/fake-supabase';
let fake: FakeSupabase;
let syncWins: boolean;
vi.mock('../lib/supabase', () => ({ createSupabaseAdminClient: () => ({ from(table: string) {
  const query = fake.from(table);
  if (table !== 'users' || !syncWins) return query;
  return { ...query, insert(values: Record<string, unknown>) {
    syncWins = false;
    fake.seed('users', [{ id: values.id, email: values.email, role: values.role, organizationId: 'keep-org', metadata: { keep: true } }]);
    return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate users_email_key' } });
  } };
} }) }));
vi.mock('../api/user/utils/email', () => ({ sendWelcomeEmail: vi.fn() }));
import { handleUnifiedSignup } from '../api/user/handlers/unified';
const body = { userId: 'sso-user', email: 'person@example.test', firstName: 'Test', lastName: 'Person', role: 'school_admin' };
function signup(overrides = {}) {
  return handleUnifiedSignup(new Request('https://example.test/api/user/signup', { method: 'POST', body: JSON.stringify({ ...body, ...overrides }) }), {} as never, 'sso-user');
}
beforeEach(() => { fake = new FakeSupabase(); syncWins = false; });
it('reuses the same identity when sync wins between lookup and insert', async () => {
  syncWins = true;
  expect((await signup()).status).toBe(200);
  expect(fake.rows('users')).toHaveLength(1);
  expect(fake.rows('users')[0]).toMatchObject({ id: 'sso-user', organizationId: 'keep-org', metadata: { keep: true } });
  expect(fake.writes().some(write => write.op === 'delete')).toBe(false);
});
it('repairs the learner record when concurrent sync creates only the user profile', async () => {
  syncWins = true;
  expect((await signup({ role: 'learner' })).status).toBe(200);
  expect(fake.rows('learners')).toHaveLength(1);
  expect(fake.rows('users')[0].metadata).toEqual({ keep: true, subscription_selection_required: true });
  expect((await signup({ role: 'learner' })).status).toBe(200);
  expect(fake.rows('learners')).toHaveLength(1);
});
it('never reassigns or deletes another identity with the same email', async () => {
  fake.seed('users', [{ id: 'different-user', email: body.email, metadata: { keep: true } }]);
  fake.seed('learners', [{ user_id: 'different-user' }]);
  const response = await signup();
  expect(response.status).toBe(409);
  expect(await response.text()).toContain('PROFILE_IDENTITY_CONFLICT');
  expect(fake.writes()).toHaveLength(0);
  expect(fake.rows('learners')[0].user_id).toBe('different-user');
});
it('preserves the profile on role-save failure so retry can repair it', async () => {
  fake.injected.push({ table: 'learners', op: 'insert', error: { message: 'database unavailable' } });
  expect((await signup({ role: 'learner' })).status).toBe(500);
  expect(fake.rows('users')).toHaveLength(1);
  expect(fake.writes().some(write => write.op === 'delete')).toBe(false);
  fake.injected = [];
  expect((await signup({ role: 'learner' })).status).toBe(200);
  expect(fake.rows('learners')).toHaveLength(1);
});
it('does not overwrite a completed plan selection when a signup is retried', async () => {
  fake.seed('users', [{ id: 'sso-user', email: body.email, role: 'learner', metadata: { subscription_selection_required: false } }]);
  fake.seed('learners', [{ user_id: 'sso-user' }]);
  expect((await signup({ role: 'learner' })).status).toBe(200);
  expect(fake.rows('users')[0].metadata.subscription_selection_required).toBe(false);
});
