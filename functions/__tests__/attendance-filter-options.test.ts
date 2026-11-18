import { beforeEach, expect, it, vi } from 'vitest';

// BUG-169: get-filter-options must only return the requesting admin's own college data.
const mock = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), calls: [] as any[] }));
vi.mock('../lib/auth', () => ({ withAuth: (handler: any) => handler, getContextUser: () => ({ id: 'admin' }) }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => mock }));
import { onRequestPost } from '../api/college-admin/attendance';

/** Chainable query stub that records every filter applied to a table. */
function chain(table: string, rows: (filters: any[]) => any[], error: any = null) {
  const filters: any[] = [];
  const query: any = {};
  for (const key of ['select', 'eq', 'in', 'not', 'order']) {
    query[key] = (...args: any[]) => { filters.push([key, ...args]); return query; };
  }
  query.then = (resolve: any) => Promise.resolve({ data: error ? null : rows(filters), error }).then(resolve);
  mock.calls.push({ table, filters });
  return query;
}

const VIEW_ROWS = [
  { department_id: 'dept-own', department_name: 'CSE', program_id: 'p1', program_name: 'BTech', semester: 1, section: 'X1', status: 'active' },
  { department_id: 'dept-other', department_name: 'Other Dept', program_id: 'p2', program_name: 'Other Program', semester: 3, section: 'TT', status: 'active' },
];

/** Applies the recorded .in('department_id', ids) filter so the stub behaves like the database. */
function viewRows(filters: any[]) {
  const scope = filters.find(([key, column]) => key === 'in' && column === 'department_id');
  return scope ? VIEW_ROWS.filter(row => scope[2].includes(row.department_id)) : VIEW_ROWS;
}

function tables(departments: any[], departmentsError: any = null) {
  mock.from.mockImplementation((table: string) => {
    if (table === 'departments') return chain(table, () => departments, departmentsError);
    if (table === 'program_sections_view') return chain(table, viewRows);
    if (table === 'college_lecturers') return chain(table, () => [{ id: 'f1', email: 'f@college.test', department: 'CSE', metadata: {} }]);
    if (table === 'college_courses') return chain(table, () => [{ id: 's1', course_name: 'Maths', course_code: 'M1', college_id: 'college' }]);
    return chain(table, () => []);
  });
}

async function request(body: any) {
  return onRequestPost({
    env: {},
    request: new Request('https://example.test/api/college-admin/attendance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }),
  } as any);
}

const viewCalls = () => mock.calls.filter(call => call.table === 'program_sections_view');

beforeEach(() => {
  vi.clearAllMocks();
  mock.calls = [];
  mock.rpc.mockResolvedValue({ data: true, error: null });
});

it('returns only sections, departments, programs and semesters of the admin\'s own college', async () => {
  tables([{ id: 'dept-own' }]);
  const response = await request({ action: 'get-filter-options', collegeId: 'college' });
  expect(response.status).toBe(200);
  const { data } = await response.json() as any;
  expect(data.sections).toEqual(['X1']);
  expect(data.departments).toEqual(['CSE']);
  expect(data.courses).toEqual(['BTech']);
  expect(data.semesters).toEqual([1]);
  expect(mock.rpc).toHaveBeenCalledWith('external_teaching_college_admin', { p_actor: 'admin', p_college: 'college' });
  expect(mock.calls.find(call => call.table === 'departments')!.filters).toContainEqual(['eq', 'college_id', 'college']);
  expect(viewCalls()).toHaveLength(4);
  for (const call of viewCalls()) expect(call.filters).toContainEqual(['in', 'department_id', ['dept-own']]);
});

it('still filters faculty and subjects by the college', async () => {
  tables([{ id: 'dept-own' }]);
  const { data } = await (await request({ action: 'get-filter-options', collegeId: 'college' })).json() as any;
  expect(data.faculty).toEqual([{ value: 'f1', label: 'f@college.test (CSE)' }]);
  expect(data.subjects).toHaveLength(1);
  expect(mock.calls.find(call => call.table === 'college_lecturers')!.filters).toContainEqual(['eq', '"collegeId"', 'college']);
  expect(mock.calls.find(call => call.table === 'college_courses')!.filters).toContainEqual(['eq', 'college_id', 'college']);
});

it('returns empty lists without querying the view when the college has no departments', async () => {
  tables([]);
  const response = await request({ action: 'get-filter-options', collegeId: 'new-college' });
  expect(response.status).toBe(200);
  const { data } = await response.json() as any;
  expect(data.sections).toEqual([]);
  expect(data.departments).toEqual([]);
  expect(data.courses).toEqual([]);
  expect(data.semesters).toEqual([]);
  expect(viewCalls()).toHaveLength(0);
});

it('rejects a missing collegeId with 400 before reading any data', async () => {
  tables([{ id: 'dept-own' }]);
  const response = await request({ action: 'get-filter-options' });
  expect(response.status).toBe(400);
  expect(mock.rpc).not.toHaveBeenCalled();
  expect(mock.from).not.toHaveBeenCalled();
});

it('rejects a college the user does not administer with 403 before reading any data', async () => {
  tables([{ id: 'dept-other' }]);
  mock.rpc.mockResolvedValue({ data: false, error: null });
  const response = await request({ action: 'get-filter-options', collegeId: 'other-college' });
  expect(response.status).toBe(403);
  expect(mock.from).not.toHaveBeenCalled();
});

it('fails closed with 403 when the permission check errors', async () => {
  tables([{ id: 'dept-own' }]);
  mock.rpc.mockResolvedValue({ data: null, error: { message: 'rpc unavailable' } });
  const response = await request({ action: 'get-filter-options', collegeId: 'college' });
  expect(response.status).toBe(403);
  expect(mock.from).not.toHaveBeenCalled();
});

it('returns a database error when the departments lookup fails', async () => {
  tables([], { code: 'XX000', message: 'boom' });
  const response = await request({ action: 'get-filter-options', collegeId: 'college' });
  expect(response.status).toBeGreaterThanOrEqual(500);
  expect(viewCalls()).toHaveLength(0);
});
