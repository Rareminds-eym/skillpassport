// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({from: vi.fn()}));
vi.mock('../lib/auth', () => ({withAuth: (handler: any) => handler, getContextUser: (ctx: any) => ({...ctx.data.user, id: ctx.data.user.sub})}));
vi.mock('../lib/supabase', () => ({getServiceClient: () => ({from: mocks.from})}));
import {onRequestPost} from '../api/learner-profile/actions';
import {resultHandler} from '../api/assessment/handlers/result';
import {checkInProgressHandler} from '../api/assessment/handlers/check-in-progress';

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const actor = id(1), learner = id(2), foreign = id(3), foreignUser = id(4), privateId = id(5), privateUser = id(6), org = id(7), otherOrg = id(8);
let user: any;
let tables: Record<string, any[]>;
let failure: string | undefined;
let writes: string[];
let predicates: Array<[string, string, unknown]>;

function query(table: string) {
  let rows = [...(table === 'zoho_recruiter_learners'
    ? tables.learners.filter(row => !tables.zoho_candidate_projections.some(marker => marker.target_id === row.user_id))
    : tables[table] ?? [])];
  const q: any = {};
  let limit = Infinity;
  const orders: Array<[string, boolean]> = [];
  const conditions: Array<(row: any) => boolean> = [];
  q.select = () => q;
  q.eq = (field: string, value: unknown) => {predicates.push([table, field, value]); conditions.push(row => row[field] === value); return q;};
  q.or = (expression: string) => {
    const parts = expression.split(',').map(part => part.split('.eq.'));
    conditions.push(row => parts.some(([field, value]) => row[field] === value)); return q;
  };
  q.in = (field: string, values: any[]) => {conditions.push(row => values.includes(row[field])); return q;};
  q.is = (field: string, value: any) => {conditions.push(row => (row[field] ?? null) === value); return q;};
  q.not = (field: string, _op: string, value: any) => {conditions.push(row => (row[field] ?? null) !== value); return q;};
  q.order = (field: string, options?: any) => {orders.push([field, options?.ascending !== false]); return q;};
  q.limit = (size: number) => {limit = size; return q;};
  q.range = (start: number, end: number) => {rows = rows.slice(start, end + 1); return q;};
  for (const method of ['update', 'insert', 'upsert', 'delete']) q[method] = () => {writes.push(`${table}:${method}`); return q;};
  q.insert = (data: any) => {writes.push(`${table}:insert`); rows = [{id: id(30), ...data}]; return q;};
  const result = (single: boolean) => {
    const filtered = rows.filter(row => conditions.every(condition => condition(row))).sort((a, b) => {
      for (const [field, ascending] of orders) {
        const result = String(a[field]).localeCompare(String(b[field]));
        if (result) return ascending ? result : -result;
      }
      return 0;
    }).slice(0, limit);
    if (failure === table) return {data: null, error: {code: 'XX000', message: 'private failure'}};
    if (single && filtered.length > 1) return {data: null, error: {code: 'PGRST116'}};
    return {data: single ? filtered[0] ?? null : filtered, count: filtered.length, error: null};
  };
  q.maybeSingle = async () => result(true); q.single = q.maybeSingle;
  q.then = (resolve: any, reject: any) => Promise.resolve(result(false)).then(resolve, reject);
  return q;
}
function context(request: Request) {return {request, env: {}, data: {user}, waitUntil: vi.fn()} as any;}
async function post(body: any) {
  return onRequestPost(context(new Request('https://fixture.example/api/learner-profile/actions', {
    method: 'POST', body: JSON.stringify(body), headers: {'Content-Type': 'application/json'},
  })));
}
function admin() {user.roles = ['school_admin']; user.org_id = org;}
beforeEach(() => {
  vi.clearAllMocks(); failure = undefined; writes = []; predicates = [];
  user = {sub: actor, email: 'owner@fixture.invalid', roles: ['learner'], org_id: org};
  tables = {
    learners: [
      {id: learner, user_id: actor, email: user.email, name: 'Owner', school_id: org, is_deleted: false},
      {id: foreign, user_id: foreignUser, email: 'other@fixture.invalid', name: 'Other', school_id: org, is_deleted: false},
      {id: privateId, user_id: privateUser, email: 'private@fixture.invalid', name: 'Private', school_id: org, is_deleted: false},
      {id: id(9), user_id: id(10), name: 'Outside', school_id: otherOrg, is_deleted: false},
    ],
    zoho_candidate_projections: [{target_id: privateUser}],
    organization_members: [{id: id(11), user_id: actor, organization_id: org, status: 'active', role: 'admin'}],
    organizations: [{id: org, organization_type: 'school'}],
    personal_assessment_attempts: [{id: id(12), learner_id: foreign}],
    personal_assessment_results: [
      {id: id(13), learner_id: learner, attempt_id: id(14), status: 'completed', created_at: '2026-10-01'},
      {id: id(15), learner_id: learner, status: 'pending', created_at: '2026-10-02'},
      {id: id(16), learner_id: foreign, attempt_id: id(12), status: 'completed', created_at: '2026-10-03'},
    ],
    trainings: [{id: id(20), learner_id: learner}, {id: id(21), learner_id: foreign}],
    school_classes: [{id: id(22), school_id: org}, {id: id(23), school_id: otherOrg}],
    programs: [{id: id(24), department_id: id(25)}],
    departments: [{id: id(25), school_id: otherOrg}],
    conversations: [{id: 'conversation', learner_id: actor, educator_id: foreignUser}],
  };
  mocks.from.mockImplementation(query);
});

describe('legacy profile authorization boundary', () => {
  it.each(['fetch-personal-assessment-results', 'fetch-trainings', 'fetch-course-enrollments',
    'fetch-certificates', 'fetch-learner-skills', 'fetch-projects', 'fetch-learner-projects',
    'fetch-learner-certificates', 'fetch-skills', 'fetch-education', 'fetch-experience',
    'fetch-learner-streaks', 'fetch-skill-passports', 'fetch-attendance-records',
    'fetch-club-memberships', 'fetch-competition-registrations', 'fetch-exam-results',
    'fetch-assessment-results', 'fetch-mark-entries', 'fetch-exam-timetable', 'fetch-curriculum',
    'fetch-learner-portfolio', 'fetch-learner-admin-message', 'fetch-learner-by-id',
    'fetch-profile-section-data', 'fetch-weekly-learning', 'fetch-learner-documents',
    'fetch-learner-exam-data', 'fetch-learner-result-data', 'fetch-learner-class-data',
    'fetch-learner-club-event-data', 'fetch-learner-overview'])('denies foreign learner targets for %s', async action => {
    const response = await post({action, learnerId: foreign});
    expect(response.status).toBe(403); expect(writes).toEqual([]);
    expect(mocks.from).not.toHaveBeenCalledWith('personal_assessment_results');
  });
  it.each(['fetch-learners', 'fetch-learners-rich', 'fetch-learners-admin', 'fetch-learner-count',
    'fetch-enrolled-learners', 'fetch-unenrolled-learners', 'fetch-enrollment-stats', 'fetch-enrolled-learner-list'])('requires an administrator for %s', async action => {
    expect((await post({action})).status).toBe(403);
    expect(mocks.from).not.toHaveBeenCalledWith('zoho_recruiter_learners');
  });
  it.each(['fetch-learners-rich', 'fetch-learners-admin'])('filters private and other-organization rows before %s pagination', async action => {
    admin(); const response = await post({action, useSimple: true});
    expect(response.status).toBe(200);
    expect((await response.json() as any).data.map((row: any) => row.id)).toEqual([learner, foreign]);
    expect(predicates).toContainEqual(['zoho_recruiter_learners', 'school_id', org]);
    expect(mocks.from).not.toHaveBeenCalledWith('learners');
  });
  it('returns only the authorized organization count', async () => {
    admin(); const response = await post({action: 'fetch-learner-count'});
    expect((await response.json() as any).data.count).toBe(2);
  });
  it.each(['inactive', 'revoked'])('denies a stale administrator with %s membership', async status => {
    admin(); tables.organization_members[0].status = status;
    expect((await post({action: 'fetch-learners-rich'})).status).toBe(403);
  });
  it('does not elevate an ordinary live membership using a JWT admin role', async () => {
    admin(); tables.organization_members[0].role = 'member';
    expect((await post({action: 'fetch-learners-admin'})).status).toBe(403);
  });
  it.each([{schoolId: otherOrg}, {filters: {schoolId: otherOrg}}, {college_id: otherOrg}])('denies conflicting requested organization %j', async filters => {
    admin(); expect((await post({action: 'fetch-learners-admin', ...filters})).status).toBe(403);
  });
  it.each([learner, actor])('supports own assessment record/user alias %s', async learnerId => {
    const response = await post({action: 'fetch-personal-assessment-results', learnerId, completedOnly: true});
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect((await response.json() as any).data.map((row: any) => row.id)).toEqual([id(13)]);
  });
  it('allows a live institution admin to read an authorized public learner report', async () => {
    admin(); const response = await post({action: 'fetch-personal-assessment-results', learnerId: foreignUser, completedOnly: true});
    expect(response.status).toBe(200); expect((await response.json() as any).data[0].id).toBe(id(16));
  });
  it('excludes private imports even for an unrelated academic admin', async () => {
    admin(); expect((await post({action: 'fetch-personal-assessment-results', learnerId: privateId})).status).toBe(403);
  });
  it('allows the actual private profile owner to read their own profile', async () => {
    user.sub = privateUser;
    const response = await post({action: 'fetch-learner-by-id', learnerId: privateId});
    expect(response.status).toBe(200); expect((await response.json() as any).data.email).toBe('private@fixture.invalid');
  });
  it('rejects mixed learner/user identities before any child lookup', async () => {
    expect((await post({action: 'fetch-learner-overview', learnerId: learner, userId: foreignUser})).status).toBe(403);
    expect(mocks.from).not.toHaveBeenCalledWith('personal_assessment_results');
  });
  it.each(['user_id', 'id', 'school_id', 'college_id', 'metadata', 'role', 'is_deleted', 'email'])('blocks profile mutation of %s', async key => {
    expect((await post({action: 'update-learner-by-id', learnerId: learner, updates: {[key]: foreignUser}})).status).toBe(403);
    expect(writes).toEqual([]);
  });
  it('preserves permitted owner profile edits and scopes the write', async () => {
    expect((await post({action: 'update-learner-by-id', learnerId: learner, updates: {bio: 'Updated', updated_at: 'ignored'}})).status).toBe(200);
    expect(writes).toContain('learners:update'); expect(predicates).toContainEqual(['learners', 'id', learner]);
  });
  it('rejects foreign child IDs in a training batch', async () => {
    expect((await post({action: 'fetch-certificates-by-training', trainingIds: [id(20), id(21)]})).status).toBe(403);
    expect(mocks.from).not.toHaveBeenCalledWith('certificates');
  });
  it('accepts an owned training batch', async () => {
    expect((await post({action: 'fetch-skills-by-training', trainingIds: [id(20)]})).status).toBe(200);
  });
  it('rejects an academic update using a program from another organization', async () => {
    admin(); expect((await post({action: 'update-enrollment', learnerId: foreign, enrollmentData: {program_id: id(24)}})).status).toBe(403);
    expect(writes).toEqual([]);
  });
  it('rejects an academic update using a class from another organization', async () => {
    admin(); expect((await post({action: 'update-learner-by-id', learnerId: foreign, updates: {school_class_id: id(23)}})).status).toBe(403);
    expect(writes).toEqual([]);
  });
  it('allows a scoped academic class update', async () => {
    admin(); expect((await post({action: 'update-learner-by-id', learnerId: foreign, updates: {school_class_id: id(22)}})).status).toBe(200);
    expect(writes).toContain('zoho_recruiter_learners:update');
  });
  it('does not let learners grant themselves academic admission state', async () => {
    expect((await post({action: 'update-learner-by-id', learnerId: learner, updates: {approval_status: 'approved'}})).status).toBe(403);
    expect(writes).toEqual([]);
  });
  it('denies owner settings reads/writes aimed at another user', async () => {
    for (const action of ['fetch-user-settings', 'upsert-user-settings', 'fetch-user-by-id']) {
      expect((await post({action, userId: foreignUser})).status).toBe(403);
    }
    expect(mocks.from).not.toHaveBeenCalledWith('user_settings');
  });
  it('denies forged senders even when the caller is a conversation participant', async () => {
    expect((await post({action: 'create-message', conversationId: 'conversation', senderId: foreignUser, messageContent: 'x'})).status).toBe(403);
    expect(writes).toEqual([]);
  });
  it('denies nonparticipants before a conversation write', async () => {
    user.sub = privateUser;
    expect((await post({action: 'update-conversation-last-message', conversationId: 'conversation'})).status).toBe(403);
    expect(writes).toEqual([]);
  });
  it.each(['learners', 'organization_members', 'zoho_recruiter_learners'])('fails closed on %s failure', async table => {
    admin(); failure = table;
    const response = await post({action: 'fetch-personal-assessment-results', learnerId: foreign});
    expect(response.status).toBe(500); expect(await response.text()).not.toContain('private failure');
    expect(mocks.from).not.toHaveBeenCalledWith('personal_assessment_results');
  });
  it('rejects unknown capabilities without database reads', async () => {
    expect((await post({action: 'unreviewed-profile-action'})).status).toBe(403); expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each(['fetch-applied-jobs', 'fetch-saved-jobs', 'fetch-learner-assignments',
    'fetch-achievement-stats', 'fetch-certificate-url', 'fetch-authenticated-learner'])('denies a foreign user ID in %s', async action => {
    expect((await post({action, userId: foreignUser})).status).toBe(403); expect(writes).toEqual([]);
  });
  it.each(['fetch-learner-settings-by-email', 'fetch-learner-id-by-email', 'lookup-learner-by-email'])('does not accept arbitrary email ownership in %s', async action => {
    expect((await post({action, email: 'private@fixture.invalid'})).status).toBe(403);
  });
  it('allows institution enrollment only for an existing active member identity', async () => {
    admin(); tables.organization_members.push({id: id(29), user_id: foreignUser, organization_id: org, status: 'active', role: 'member'});
    tables.users = [{id: foreignUser, email: 'canonical@fixture.invalid'}];
    expect((await post({action: 'enroll-learner', enrollmentData: {user_id: foreignUser, name: 'Other', school_id: org}})).status).toBe(200);
    expect(writes).toContain('zoho_recruiter_learners:insert');
  });
  it('does not bypass import approval through manual enrollment', async () => {
    admin(); tables.organization_members.push({id: id(29), user_id: privateUser, organization_id: org, status: 'active', role: 'member'});
    tables.users = [{id: privateUser, email: 'private@fixture.invalid'}];
    expect((await post({action: 'enroll-learner', enrollmentData: {user_id: privateUser, name: 'Private', school_id: org}})).status).toBe(403);
    expect(writes).toEqual([]);
  });
  it('rejects forged sender fields without actual conversation participation', async () => {
    user.sub = privateUser;
    expect((await post({action: 'send-learner-message', conversationId: 'conversation', senderId: privateUser,
      receiverId: actor, messageText: 'x'})).status).toBe(403); expect(writes).toEqual([]);
  });
  it('rejects organization-shaped fields in enrollment payloads outside the admin scope', async () => {
    admin(); tables.organization_members.push({id: id(29), user_id: foreignUser, organization_id: org, status: 'active', role: 'member'});
    tables.users = [{id: foreignUser, email: 'canonical@fixture.invalid'}];
    expect((await post({action: 'enroll-learner', enrollmentData: {user_id: foreignUser, school_id: otherOrg}})).status).toBe(403);
    expect(writes).toEqual([]);
  });
});

describe('legacy assessment ownership', () => {
  it('keeps the legacy resume endpoint read-only for a recent abandoned attempt', async () => {
    tables.personal_assessment_attempts = [{id: id(12), learner_id: learner, status: 'abandoned',
      grade_level: 'college', current_section_index: 2, started_at: new Date().toISOString()}];
    const response = await checkInProgressHandler(context(new Request('https://fixture.example/api/assessment/check-in-progress')));
    expect((await response.json() as any).hasInProgress).toBe(false);
    expect(response.headers.get('Cache-Control')).toBe('no-store'); expect(writes).toEqual([]);
  });
  it('preserves a resume database failure instead of claiming no saved progress', async () => {
    failure = 'personal_assessment_attempts';
    const response = await checkInProgressHandler(context(new Request('https://fixture.example/api/assessment/check-in-progress')));
    expect(response.status).toBe(503); expect(writes).toEqual([]);
  });
  it('does not substitute a learner-record ID for user ownership in the result handler', async () => {
    tables.learners = [{id: actor, user_id: foreignUser}]; tables.personal_assessment_attempts[0].learner_id = actor;
    const response = await resultHandler(context(new Request(`https://fixture.example/api/assessment/result?attemptId=${id(12)}`)));
    expect(response.status).toBe(404); expect(mocks.from).not.toHaveBeenCalledWith('personal_assessment_results');
  });
  it('does not resume a learner-record UUID collision', async () => {
    tables.learners = [{id: actor, user_id: foreignUser}];
    const response = await checkInProgressHandler(context(new Request('https://fixture.example/api/assessment/check-in-progress')));
    expect((await response.json() as any).hasInProgress).toBe(false);
    expect(mocks.from).not.toHaveBeenCalledWith('personal_assessment_attempts');
  });
});
