/**
 * /api/organization invitations: educator path retired, accepting user taken from the session,
 * email match enforced, double-accept claim (AC15-AC17, AC25; user-decisions 1 and 6).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from '../../../lib/__tests__/helpers/fake-supabase';

let fake: FakeSupabase;
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => fake }));
vi.mock('../../../lib/auth', () => ({
  getContextUser: (context: { data?: { user?: { sub: string; email?: string } } }) => {
    const user = context.data?.user;
    if (!user) throw new Error('no user');
    return { ...user, id: user.sub };
  },
}));

import { handleOrganizationPost } from '../handler';

const ORG = 'org-1';
const SESSION_USER: { sub: string; email?: string } = { sub: 'user-1', email: 'learner@example.com' };

function call(body: Record<string, unknown>, user: { sub: string; email?: string } = SESSION_USER) {
  return handleOrganizationPost({
    request: new Request('http://localhost:8788/api/organization', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }),
    data: { user },
    env: {},
  } as never);
}

const pending = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv-1', invitation_token: 'tok-1', status: 'pending', organization_id: ORG, organization_type: 'college',
  invitee_email: 'Learner@Example.com', invitee_role: 'learner', expires_at: '2099-01-01T00:00:00Z', ...overrides,
});

const INVITATIONS = 'organization_invitations';

beforeEach(() => {
  fake = new FakeSupabase();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('inviteMember (AC15)', () => {
  beforeEach(() => {
    fake.seed('organization_members', [{ user_id: SESSION_USER.sub, organization_id: ORG, role: 'admin', status: 'active' }]);
    fake.seed('users', [{ id: SESSION_USER.sub, role: 'college_admin' }]);
  });

  const invite = (memberType: unknown) => call({
    action: 'inviteMember', organizationId: ORG, organizationType: 'college', email: 'Edu@Example.com',
    memberType, autoAssignSubscription: false,
  });

  it('educator -> 400 and nothing is read or inserted', async () => {
    const res = await invite('educator');
    const body = (await res.json()) as any;

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('Educator invitations are sent through SSO');
    expect(fake.accesses).toEqual([]);
  });

  it.each([undefined, 'teacher', 'school_educator', 42])('non-learner memberType %j -> 400 and nothing inserted', async (memberType) => {
    const res = await invite(memberType);
    expect(res.status).toBe(400);
    expect(fake.writes()).toEqual([]);
  });

  it('learner still creates a learner invitation', async () => {
    const res = await invite('learner');

    expect(res.status).toBe(200);
    expect(fake.rows(INVITATIONS)).toEqual([expect.objectContaining({
      invitee_email: 'edu@example.com', invitee_role: 'learner', status: 'pending', organization_id: ORG,
    })]);
  });
});

describe('acceptInvitation (AC16, AC17)', () => {
  beforeEach(() => {
    fake.seed(INVITATIONS, [pending()]);
    fake.seed('users', [{ id: SESSION_USER.sub }]);
  });

  const accept = (extra: Record<string, unknown> = {}, user = SESSION_USER) =>
    call({ action: 'acceptInvitation', token: 'tok-1', ...extra }, user);

  it('ignores body.userId and uses the session user (case-insensitive email match)', async () => {
    const res = await accept({ userId: 'attacker-id' });

    expect(res.status).toBe(200);
    expect(fake.rows(INVITATIONS)[0]).toMatchObject({ status: 'accepted', accepted_by_user_id: 'user-1' });
    expect(fake.rows('organization_members')).toEqual([expect.objectContaining({ user_id: 'user-1', organization_id: ORG })]);
    expect(JSON.stringify(fake.writes())).not.toContain('attacker-id');
  });

  it('a different session email -> 403 FORBIDDEN in the apiError shape, no writes', async () => {
    const res = await accept({}, { sub: 'user-2', email: 'someone.else@example.com' });
    const body = (await res.json()) as any;

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toEqual({ code: 'FORBIDDEN', message: 'This invitation was sent to a different email address' });
    expect(JSON.stringify(body)).not.toContain('learner@example.com');
    expect(fake.writes()).toEqual([]);
    expect(fake.rows(INVITATIONS)[0].status).toBe('pending');
  });

  it('a session without an email -> 403', async () => {
    const res = await accept({}, { sub: 'user-3' });
    expect(res.status).toBe(403);
    expect(fake.writes()).toEqual([]);
  });

  it('an educator invitation -> 410 EDUCATOR_INVITE_RETIRED with no write, even for the matching email', async () => {
    fake.tables[INVITATIONS] = [pending({ invitee_role: 'college_educator' })];
    const res = await accept();
    const body = (await res.json()) as any;

    expect(res.status).toBe(410);
    expect(body.error.code).toBe('EDUCATOR_INVITE_RETIRED');
    expect(fake.writes()).toEqual([]);
    expect(fake.rows(INVITATIONS)[0].status).toBe('pending');
  });

  it('never touches school_educators or college_lecturers (no educator branch in linkUserToOrganization)', async () => {
    await accept();
    expect(fake.accessesTo('school_educators', 'college_lecturers')).toEqual([]);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['non-string', 123],
    ['too long', 'x'.repeat(129)],
  ])('%s token -> 400', async (_label, token) => {
    const res = await call({ action: 'acceptInvitation', token });
    expect(res.status).toBe(400);
    expect(fake.writes()).toEqual([]);
  });

  it('unknown token -> 404', async () => {
    const res = await call({ action: 'acceptInvitation', token: 'nope' });
    expect(res.status).toBe(404);
  });

  it('expired invitation -> 410 EXPIRED', async () => {
    fake.tables[INVITATIONS] = [pending({ expires_at: '2000-01-01T00:00:00Z' })];
    const res = await accept();
    expect(res.status).toBe(410);
    expect(((await res.json()) as any).error.code).toBe('EXPIRED');
  });
});

describe('double accept (AC25)', () => {
  it('when another request already claimed the row -> 409 ALREADY_ACCEPTED and no member or user write', async () => {
    fake.seed(INVITATIONS, [pending()]);
    fake.injected.push({ table: INVITATIONS, op: 'update', data: [] });

    const res = await call({ action: 'acceptInvitation', token: 'tok-1' });
    const body = (await res.json()) as any;

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('ALREADY_ACCEPTED');
    expect(fake.accessesTo('organization_members', 'users', 'learners')).toEqual([]);
  });

  it('the claim is conditional on status = pending', async () => {
    fake.seed(INVITATIONS, [pending()]);
    await call({ action: 'acceptInvitation', token: 'tok-1' });

    const claim = fake.writes().find((w) => w.table === INVITATIONS && w.op === 'update');
    expect(claim?.filters).toEqual(expect.arrayContaining([['id', 'inv-1'], ['status', 'pending']]));
  });
});

describe('resendInvitation', () => {
  it('refuses legacy educator invitations with 410 and mints no token', async () => {
    fake.seed(INVITATIONS, [pending({ invitee_role: 'school_educator' })]);
    const res = await call({ action: 'resendInvitation', invitationId: 'inv-1' });

    expect(res.status).toBe(410);
    expect(((await res.json()) as any).error.code).toBe('EDUCATOR_INVITE_RETIRED');
    expect(fake.writes()).toEqual([]);
    expect(fake.rows(INVITATIONS)[0].invitation_token).toBe('tok-1');
  });

  it('still resends learner invitations', async () => {
    fake.seed(INVITATIONS, [pending()]);
    const res = await call({ action: 'resendInvitation', invitationId: 'inv-1' });

    expect(res.status).toBe(200);
    expect(fake.rows(INVITATIONS)[0].invitation_token).not.toBe('tok-1');
  });
});
