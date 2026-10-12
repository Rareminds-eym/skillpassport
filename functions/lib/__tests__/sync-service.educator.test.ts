/**
 * SyncService.syncMembership: invite-sourced educator profiles.
 *
 * Covers design AC5-AC10, AC22, AC23, AC26 (user-decisions 4): a profile row is created
 * ONLY when the event carries `source === 'invite'`; every other producer behaves as before.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from './helpers/fake-supabase';

let fake: FakeSupabase;
vi.mock('../db', () => ({ createDb: () => fake }));

import { SyncService } from '../sync-service';

const USER = 'user-edu-1';
const COLLEGE = 'org-college-1';
const SCHOOL = 'org-school-1';
const OTHER_COLLEGE = 'org-college-2';
const EDUCATOR_TABLES = ['college_lecturers', 'school_educators'];

// Real producer payload literals, copied from
// sso-worker/src/__tests__/fixtures/membership-created-payloads.json (not imported across packages).
const PRODUCER_PAYLOADS = {
  login: { user_id: 'user-login-1', organization_id: COLLEGE, roles: ['college_educator'], status: 'active' },
  userSync: { user_id: 'user-sync-1', organization_id: COLLEGE, roles: ['college_educator'], status: 'active' },
  signupMember: { user_id: 'user-signup-1', organization_id: COLLEGE, roles: ['college_educator'], status: 'active' },
  bulkImport: { user_id: 'user-bulk-1', organization_id: COLLEGE, roles: ['college_educator'], status: 'active' },
};

const invite = (overrides: Record<string, unknown> = {}) => ({
  user_id: USER, organization_id: COLLEGE, roles: ['college_educator'], status: 'active', source: 'invite', ...overrides,
});

function seedBase(f: FakeSupabase) {
  f.seed('users', [{ id: USER, email: 'Test.Educator@Example.com', firstName: 'Tess', lastName: 'Educator' }]);
  f.seed('organizations', [
    { id: COLLEGE, organization_type: 'college' },
    { id: OTHER_COLLEGE, organization_type: 'college' },
    { id: SCHOOL, organization_type: 'school' },
  ]);
}

const service = () => new SyncService({} as never);

beforeEach(() => {
  fake = new FakeSupabase();
  seedBase(fake);
  vi.restoreAllMocks();
});

describe('invite-sourced educator profiles (AC5, AC6)', () => {
  it('creates exactly one college_lecturers row with the columns the review picker reads', async () => {
    const result = await service().syncMembership(invite());

    expect(result).toEqual({ success: true });
    expect(fake.rows('college_lecturers')).toEqual([expect.objectContaining({
      user_id: USER, collegeId: COLLEGE, accountStatus: 'active',
      first_name: 'Tess', last_name: 'Educator', email: 'test.educator@example.com',
      metadata: { source: 'sso_invite' },
    })]);
    expect(fake.rows('organization_members')).toHaveLength(1);
    expect(fake.rows('users')[0].organizationId).toBe(COLLEGE);
  });

  it('creates a school_educators row with explicit role and onboarding status', async () => {
    const result = await service().syncMembership(invite({ organization_id: SCHOOL, roles: ['school_educator'] }));

    expect(result).toEqual({ success: true });
    expect(fake.rows('school_educators')).toEqual([expect.objectContaining({
      user_id: USER, school_id: SCHOOL, account_status: 'active', role: 'subject_teacher',
      onboarding_status: 'active', first_name: 'Tess', last_name: 'Educator',
      email: 'test.educator@example.com', metadata: { source: 'sso_invite' },
    })]);
  });

  it('is idempotent: replaying the event makes no further insert', async () => {
    await service().syncMembership(invite());
    const inserts = () => fake.writes().filter((w) => w.op === 'insert' && w.table === 'college_lecturers').length;
    expect(inserts()).toBe(1);

    await service().syncMembership(invite());
    expect(inserts()).toBe(1);
    expect(fake.rows('college_lecturers')).toHaveLength(1);
  });

  it('stores null names when the users row has none, and the email is still set', async () => {
    fake.tables.users = [{ id: USER, email: 'x@example.com', firstName: null, lastName: '' }];
    await service().syncMembership(invite());
    expect(fake.rows('college_lecturers')[0]).toEqual(expect.objectContaining({
      first_name: null, last_name: null, email: 'x@example.com',
    }));
  });

  it('backfills null names/email on an existing same-org row without overwriting', async () => {
    fake.seed('college_lecturers', [{ id: 'cl-1', user_id: USER, collegeId: COLLEGE, accountStatus: 'active',
      first_name: 'Keep', last_name: null, email: null }]);
    await service().syncMembership(invite());

    expect(fake.rows('college_lecturers')).toHaveLength(1);
    expect(fake.rows('college_lecturers')[0]).toEqual(expect.objectContaining({
      first_name: 'Keep', last_name: 'Educator', email: 'test.educator@example.com',
    }));
  });
});

describe('missing dependencies (AC7)', () => {
  it('missing users row: retryable NOT_FOUND before any write', async () => {
    fake.tables.users = [];
    const result = await service().syncMembership(invite());
    expect(result).toMatchObject({ success: false, errorCode: 'NOT_FOUND', retryable: true });
    expect(fake.writes()).toEqual([]);
  });

  it('missing organizations row: retryable NOT_FOUND before any write', async () => {
    fake.tables.organizations = [];
    const result = await service().syncMembership(invite());
    expect(result).toMatchObject({ success: false, errorCode: 'NOT_FOUND', retryable: true });
    expect(fake.writes()).toEqual([]);
  });

  it('a read error in the preflight throws (500, retried) and writes nothing', async () => {
    fake.injected.push({ table: 'users', op: 'select', error: { code: '08006', message: 'down' } });
    await expect(service().syncMembership(invite())).rejects.toThrow();
    expect(fake.writes()).toEqual([]);
  });
});

describe('role / org type mismatch (AC8)', () => {
  it.each([
    ['college_educator in a school org', { organization_id: SCHOOL, roles: ['college_educator'] }, 'school'],
    ['school_educator in a college org', { organization_id: COLLEGE, roles: ['school_educator'] }, 'college'],
  ])('%s: no profile, success, error log with ids only', async (_label, overrides, orgType) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await service().syncMembership(invite(overrides));

    expect(result).toEqual({ success: true });
    expect(fake.writesTo(...EDUCATOR_TABLES)).toEqual([]);
    expect(error).toHaveBeenCalledWith('[sync] educator role/org type mismatch', {
      user_id: USER, organization_id: overrides.organization_id, roles: overrides.roles, orgType,
    });
    expect(JSON.stringify(error.mock.calls)).not.toContain('example.com');
  });

  it('org type comes from the database, not the payload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await service().syncMembership(invite({ organization_type: 'college', organization_id: SCHOOL }));
    expect(result).toEqual({ success: true });
    expect(fake.rows('college_lecturers')).toEqual([]);
  });
});

describe('profile in another organization (AC9)', () => {
  it('college: PROFILE_CONFLICT with NO write at all', async () => {
    fake.seed('college_lecturers', [{ id: 'cl-1', user_id: USER, collegeId: OTHER_COLLEGE, accountStatus: 'active' }]);
    const result = await service().syncMembership(invite());

    expect(result).toMatchObject({ success: false, errorCode: 'PROFILE_CONFLICT', retryable: false });
    expect(fake.writes()).toEqual([]);
  });

  it('school: PROFILE_CONFLICT with NO write at all', async () => {
    fake.seed('organizations', [{ id: 'org-school-2', organization_type: 'school' }]);
    fake.seed('school_educators', [{ id: 'se-1', user_id: USER, school_id: 'org-school-2', account_status: 'active' }]);
    const result = await service().syncMembership(invite({ organization_id: SCHOOL, roles: ['school_educator'] }));

    expect(result).toMatchObject({ success: false, errorCode: 'PROFILE_CONFLICT', retryable: false });
    expect(fake.writes()).toEqual([]);
  });

  it('a 23505 race throws (retried); the retry then ends in PROFILE_CONFLICT with no new writes', async () => {
    fake.injected.push({ table: 'college_lecturers', op: 'insert', error: { code: '23505', message: 'duplicate' } });
    await expect(service().syncMembership(invite())).rejects.toThrow();

    // the concurrent writer's row for another college is now visible
    fake.injected = [];
    fake.seed('college_lecturers', [{ id: 'cl-9', user_id: USER, collegeId: OTHER_COLLEGE, accountStatus: 'active' }]);
    const before = fake.writes().length;
    const retry = await service().syncMembership(invite());

    expect(retry).toMatchObject({ success: false, errorCode: 'PROFILE_CONFLICT' });
    expect(fake.writes().length).toBe(before);
  });
});

describe('learner regression (AC10)', () => {
  const learner = { user_id: USER, organization_id: COLLEGE, roles: ['learner'], status: 'active' };

  it.each([
    ['without source', learner],
    ['with source: invite', { ...learner, source: 'invite' }],
  ])('learner events %s keep today\'s behavior and never touch educator tables', async (_label, payload) => {
    const result = await service().syncMembership(payload);

    expect(result).toEqual({ success: true });
    expect(fake.accessesTo(...EDUCATOR_TABLES)).toEqual([]);
    expect(fake.rows('organization_members')).toHaveLength(1);
    expect(fake.rows('learners')).toEqual([expect.objectContaining({ user_id: USER, college_id: COLLEGE })]);
  });
});

describe('non-invite producers are untouched (AC22)', () => {
  const cases = Object.entries(PRODUCER_PAYLOADS);

  it.each(cases)('%s payload (no source): no educator table read or write, success', async (_name, payload) => {
    fake.seed('users', [{ id: payload.user_id, email: 'edu@example.com', firstName: 'E', lastName: 'D' }]);
    const result = await service().syncMembership(payload);

    expect(result).toEqual({ success: true });
    expect(fake.accessesTo(...EDUCATOR_TABLES)).toEqual([]);
    expect(fake.rows('organization_members')).toHaveLength(1);
  });

  it.each(cases)('%s payload with source "other": still no educator access', async (_name, payload) => {
    fake.seed('users', [{ id: payload.user_id, email: 'edu@example.com', firstName: 'E', lastName: 'D' }]);
    const result = await service().syncMembership({ ...payload, source: 'other' });

    expect(result).toEqual({ success: true });
    expect(fake.accessesTo(...EDUCATOR_TABLES)).toEqual([]);
  });

  it.each(['suspended', 'inactive'])('source invite with status %s creates nothing', async (status) => {
    const result = await service().syncMembership(invite({ status }));
    expect(result).toEqual({ success: true });
    expect(fake.accessesTo(...EDUCATOR_TABLES)).toEqual([]);
  });

  it('syncFaculty is unchanged: inserted columns and idempotent skip', async () => {
    fake.tables.users = [];
    const payload = {
      user_id: 'faculty-1', college_id: COLLEGE, email: 'Fac@Example.com', first_name: 'Fay', last_name: 'Culty',
      employee_id: 'E1', role: 'faculty',
    };
    expect(await service().syncFaculty(payload)).toEqual({ success: true });
    expect(fake.rows('college_lecturers')).toEqual([expect.objectContaining({
      user_id: 'faculty-1', collegeId: COLLEGE, employeeId: 'E1', accountStatus: 'active',
      metadata: expect.objectContaining({ first_name: 'Fay', last_name: 'Culty', email: 'fac@example.com', created_by: 'bulk_import' }),
    })]);
    expect(fake.rows('college_lecturers')[0]).not.toHaveProperty('first_name');

    expect(await service().syncFaculty(payload)).toEqual({ success: true });
    expect(fake.rows('college_lecturers')).toHaveLength(1);
  });
});

describe('existing profile status matrix (AC23)', () => {
  const tables = [
    { name: 'college_lecturers', statusCol: 'accountStatus', orgCol: 'collegeId', org: COLLEGE, roles: ['college_educator'] },
    { name: 'school_educators', statusCol: 'account_status', orgCol: 'school_id', org: SCHOOL, roles: ['school_educator'] },
  ];

  for (const t of tables) {
    it.each(['inactive', 'pending'])(`${t.name}: %s becomes active`, async (status) => {
      fake.seed(t.name, [{ id: 'p1', user_id: USER, [t.orgCol]: t.org, [t.statusCol]: status,
        first_name: 'A', last_name: 'B', email: 'a@example.com' }]);
      expect(await service().syncMembership(invite({ organization_id: t.org, roles: t.roles }))).toEqual({ success: true });
      expect(fake.rows(t.name)).toHaveLength(1);
      expect(fake.rows(t.name)[0][t.statusCol]).toBe('active');
    });

    it.each(['suspended', 'blacklisted', 'rejected', 'deactivated', 'approved'])(
      `${t.name}: %s is never changed`, async (status) => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        fake.seed(t.name, [{ id: 'p1', user_id: USER, [t.orgCol]: t.org, [t.statusCol]: status,
          first_name: null, last_name: null, email: null }]);
        expect(await service().syncMembership(invite({ organization_id: t.org, roles: t.roles }))).toEqual({ success: true });
        expect(fake.writesTo(t.name)).toEqual([]);
        expect(fake.rows(t.name)[0][t.statusCol]).toBe(status);
      });

    it(`${t.name}: no code path writes 'inactive'`, async () => {
      await service().syncMembership(invite({ organization_id: t.org, roles: t.roles }));
      const written = JSON.stringify(fake.writesTo(t.name).map((w) => w.values));
      expect(written).not.toContain('inactive');
    });
  }
});

describe('failure classification (AC26)', () => {
  it('23505 on the profile insert throws', async () => {
    fake.injected.push({ table: 'college_lecturers', op: 'insert', error: { code: '23505', message: 'dup' } });
    await expect(service().syncMembership(invite())).rejects.toThrow();
  });

  it('an arbitrary error code on the profile insert throws', async () => {
    fake.injected.push({ table: 'school_educators', op: 'insert', error: { code: '57014', message: 'timeout' } });
    await expect(service().syncMembership(invite({ organization_id: SCHOOL, roles: ['school_educator'] }))).rejects.toThrow();
  });

  it('an error on the profile update throws', async () => {
    fake.seed('college_lecturers', [{ id: 'cl-1', user_id: USER, collegeId: COLLEGE, accountStatus: 'inactive' }]);
    fake.injected.push({ table: 'college_lecturers', op: 'update', error: { code: 'XX000', message: 'boom' } });
    await expect(service().syncMembership(invite())).rejects.toThrow();
  });

  it('a retryable failure from the base organization_members step is rethrown', async () => {
    fake.injected.push({ table: 'organization_members', op: 'upsert', error: { message: 'db down' } });
    await expect(service().syncMembership(invite())).rejects.toThrow();
    expect(fake.writesTo(...EDUCATOR_TABLES)).toEqual([]);
  });

  it('a NOT_FOUND from the base step is returned as-is (404, retried)', async () => {
    const fk = Object.assign(new Error('insert violates foreign key constraint on user_id'), { code: '23503' });
    fake.injected.push({ table: 'organization_members', op: 'upsert', throws: fk });
    const result = await service().syncMembership(invite());
    expect(result).toMatchObject({ success: false, errorCode: 'NOT_FOUND', retryable: true });
  });

  it('23514 on insert is a non-retryable VALIDATION_ERROR', async () => {
    fake.injected.push({ table: 'college_lecturers', op: 'insert', error: { code: '23514', message: 'check' } });
    expect(await service().syncMembership(invite())).toMatchObject({
      success: false, errorCode: 'VALIDATION_ERROR', retryable: false,
    });
  });

  it('23503 on insert is a retryable NOT_FOUND', async () => {
    fake.injected.push({ table: 'college_lecturers', op: 'insert', error: { code: '23503', message: 'fk' } });
    expect(await service().syncMembership(invite())).toMatchObject({
      success: false, errorCode: 'NOT_FOUND', retryable: true,
    });
  });

  it.each(['not-an-email', '', 'a@b'])('invalid email %j is a non-retryable VALIDATION_ERROR with no profile write', async (email) => {
    fake.tables.users = [{ id: USER, email, firstName: 'T', lastName: 'E' }];
    const result = await service().syncMembership(invite());
    expect(result).toMatchObject({ success: false, errorCode: 'VALIDATION_ERROR', retryable: false });
    expect(fake.writesTo(...EDUCATOR_TABLES)).toEqual([]);
  });
});
