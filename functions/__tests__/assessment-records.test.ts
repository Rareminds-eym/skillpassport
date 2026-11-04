// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({from: vi.fn()}));
vi.mock('../lib/auth', () => ({withAuth: (handler: unknown) => handler}));
vi.mock('../lib/supabase', () => ({getServiceClient: () => ({from: mocks.from})}));
import {onRequestGet} from '../api/assessment-records';

const owner = '10000000-0000-4000-8000-000000000001';
const learner = '20000000-0000-4000-8000-000000000001';
const foreignLearner = '20000000-0000-4000-8000-000000000002';
const attempt = '30000000-0000-4000-8000-000000000001';
const foreignAttempt = '30000000-0000-4000-8000-000000000002';
const session = '40000000-0000-4000-8000-000000000001';
let tables: Record<string, any[]>;
let failedTable: string | undefined;
let filters: Array<{table: string; field: string; value: unknown}>;

// Evaluate owner predicates against mixed-owner rows, rather than returning any
// supplied fixture regardless of whether the handler actually constrained it.
function query(table: string) {
  let rows = [...(tables[table] ?? [])];
  let limit = Infinity;
  const ordering: Array<{field: string; ascending: boolean}> = [];
  const q: any = {};
  q.select = () => q;
  q.eq = (field: string, value: unknown) => {
    filters.push({table, field, value}); rows = rows.filter(row => row[field] === value); return q;
  };
  q.gt = (field: string, value: string) => {rows = rows.filter(row => row[field] > value); return q;};
  q.order = (field: string, options?: {ascending?: boolean}) => {
    ordering.push({field, ascending: options?.ascending !== false}); return q;
  };
  q.limit = (value: number) => {limit = value; return q;};
  const result = (single: boolean) => {
    rows.sort((a, b) => {
      for (const {field, ascending} of ordering) {
        const comparison = String(a[field]).localeCompare(String(b[field]));
        if (comparison) return ascending ? comparison : -comparison;
      }
      return 0;
    });
    const data = rows.slice(0, limit);
    return failedTable === table ? {data: null, error: {message: 'private database error'}}
      : {data: single ? data[0] ?? null : data, error: null};
  };
  q.maybeSingle = async () => result(true);
  q.then = (resolve: any, reject: any) => Promise.resolve(result(false)).then(resolve, reject);
  return q;
}

async function request(params: string, sub = owner) {
  return onRequestGet({request: new Request(`https://app.fixture.example/api/assessment-records?${params}`),
    env: {}, data: {user: {sub}}} as any);
}
beforeEach(() => {
  vi.clearAllMocks(); filters = []; failedTable = undefined;
  tables = {
    learners: [{id: learner, user_id: owner}, {id: foreignLearner, user_id: 'other'}],
    personal_assessment_attempts: [{id: attempt, learner_id: learner, created_at: '2026-10-01'},
      {id: foreignAttempt, learner_id: foreignLearner, created_at: '2026-10-02'}],
    personal_assessment_responses: [{id: 'answer', attempt_id: attempt}, {id: 'secret', attempt_id: foreignAttempt}],
    personal_assessment_results: [{id: 'result', learner_id: learner, attempt_id: attempt,
      status: 'completed', created_at: '2026-10-01', gemini_results: {}, adaptive_aptitude_session_id: session},
    {id: 'foreign-result', learner_id: foreignLearner, attempt_id: foreignAttempt,
      status: 'completed', created_at: '2026-10-02'}],
    adaptive_aptitude_results: [{id: 'adaptive', learner_id: learner, session_id: session},
      {id: 'foreign-adaptive', learner_id: foreignLearner, session_id: session}],
  };
  mocks.from.mockImplementation(query);
});

describe('owner-only assessment record reads', () => {
  it('returns only the owned in-progress record, including a valid nullable college stream', async () => {
    tables.personal_assessment_attempts[0].status = 'in_progress';
    tables.personal_assessment_attempts[0].stream_id = null;
    tables.personal_assessment_attempts[1].status = 'in_progress';
    const response = await request('mode=in-progress');
    expect(response.status).toBe(200); expect((await response.json() as any).data.id).toBe(attempt);
    expect(mocks.from.mock.calls.map(call => call[0])).toEqual(['learners', 'personal_assessment_attempts']);
  });
  it('never revives an abandoned record in a resume lookup', async () => {
    tables.personal_assessment_attempts[0].status = 'abandoned';
    expect((await (await request('mode=in-progress')).json() as any).data).toBeNull();
  });
  it('checks linked adaptive-session ownership before returning resume data', async () => {
    tables.personal_assessment_attempts[0].status = 'in_progress';
    tables.personal_assessment_attempts[0].adaptive_aptitude_session_id = session;
    tables.adaptive_aptitude_sessions = [{id: session, learner_id: foreignLearner, questions_answered: 50}];
    expect((await request('mode=in-progress')).status).toBe(409);
  });
  it('does not collapse a resume storage error into no saved attempt', async () => {
    failedTable = 'personal_assessment_attempts';
    expect((await request('mode=in-progress')).status).toBe(500);
  });
  it.each(['', 'mode=unknown', 'mode=history&user_id=other', 'mode=history&mode=latest',
    'mode=attempt', 'mode=responses&attemptId=bad', 'mode=history&reference=',
    `mode=latest&cursor=${attempt}`, `mode=history&attemptId=${attempt}`])('rejects malformed query %s before database access', async params => {
    expect((await request(params)).status).toBe(400); expect(mocks.from).not.toHaveBeenCalled();
  });
  it('rejects an absent verified subject before database access', async () => {
    expect((await request('mode=history', '')).status).toBe(401); expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([owner, learner])('accepts only an owned user/learner alias %s', async reference => {
    const response = await request(`mode=history&reference=${reference}`);
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect((await response.json() as any).data.map((row: any) => row.id)).toEqual([attempt]);
    expect(filters).toContainEqual({table: 'learners', field: 'user_id', value: owner});
  });
  it('rejects a foreign reference before reading assessment data', async () => {
    expect((await request(`mode=history&reference=${foreignLearner}`)).status).toBe(403);
    expect(mocks.from.mock.calls.map(call => call[0])).toEqual(['learners']);
  });
  it('does not accept a learner ID equal to the JWT subject as ownership', async () => {
    tables.learners = [{id: owner, user_id: 'other'}];
    expect((await request('mode=history')).status).toBe(404);
    expect(mocks.from).not.toHaveBeenCalledWith('personal_assessment_attempts');
  });
  it.each(['attempt', 'responses'])('hides foreign and absent %s attempts before child reads', async mode => {
    const response = await request(`mode=${mode}&attemptId=${foreignAttempt}`);
    expect(response.status).toBe(404); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.from).not.toHaveBeenCalledWith('personal_assessment_results');
    expect(mocks.from).not.toHaveBeenCalledWith('personal_assessment_responses');
  });
  it('checks the child result owner as well as its parent attempt', async () => {
    tables.personal_assessment_results.push({id: 'mismatched', attempt_id: attempt, learner_id: foreignLearner});
    const response = await request(`mode=attempt&attemptId=${attempt}`);
    expect((await response.json() as any).data.results.map((row: any) => row.id)).toEqual(['result']);
  });
  it('loads only the owned attempt responses', async () => {
    const response = await request(`mode=responses&attemptId=${attempt}`);
    expect((await response.json() as any).data).toEqual([{id: 'answer', attempt_id: attempt}]);
  });
  it('strips joined question keys while preserving the learner response value', async () => {
    tables.personal_assessment_responses[0].question = {id: 'q', correct_answer: 'A', metadata: {explanation: 'secret'}, options: ['A', 'B']};
    tables.personal_assessment_responses[0].response_value = {answer: 'B'};
    const response = await request(`mode=responses&attemptId=${attempt}`);
    const row = (await response.json() as any).data[0];
    expect(row.response_value).toEqual({answer: 'B'});
    expect(row.question).toEqual({id: 'q', metadata: {}, options: ['A', 'B']});
  });
  it('merges only adaptive data belonging to the same learner', async () => {
    const response = await request('mode=latest');
    const result = (await response.json() as any).data;
    expect(result.id).toBe('result'); expect(result.gemini_results.adaptiveAptitudeResults.id).toBe('adaptive');
    expect(filters).toContainEqual({table: 'adaptive_aptitude_results', field: 'learner_id', value: learner});
  });
  it('does not load adaptive details for a date-only check', async () => {
    expect((await request('mode=latest-date')).status).toBe(200);
    expect(mocks.from).not.toHaveBeenCalledWith('adaptive_aptitude_results');
  });
  it('returns null when no completed result exists', async () => {
    tables.personal_assessment_results[0].status = 'pending';
    expect((await (await request('mode=latest')).json() as any).data).toBeNull();
  });
  it('returns a bounded owner-filtered history page with a continuation', async () => {
    tables.personal_assessment_attempts = Array.from({length: 201}, (_, index) => ({
      id: `30000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, learner_id: learner,
    }));
    const first = await (await request('mode=history')).json() as any;
    expect(first.data).toHaveLength(200); expect(first.nextCursor).toBe(first.data[199].id);
    const last = await (await request(`mode=history&cursor=${first.nextCursor}`)).json() as any;
    expect(last.data).toHaveLength(1); expect(last.nextCursor).toBeNull();
  });
  it.each(['learners', 'personal_assessment_attempts', 'personal_assessment_results',
    'personal_assessment_responses', 'adaptive_aptitude_results'])('fails closed on %s database errors', async table => {
    failedTable = table;
    const mode = table === 'personal_assessment_responses' ? `responses&attemptId=${attempt}`
      : table === 'personal_assessment_attempts' ? 'history' : 'latest';
    const response = await request(`mode=${mode}`);
    expect(response.status).toBe(500); expect(await response.text()).not.toContain('private database error');
  });
});
