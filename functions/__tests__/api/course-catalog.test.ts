import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../../lib/auth', () => ({
  withAuth: (handler: any) => handler,
  getContextUser: () => ({ id: 'user' }),
  getServiceClient: () => ({ from: mocks.from }),
}));
vi.mock('../../lib/supabase', () => ({ getServiceClient: () => ({ from: mocks.from }) }));
import { onRequest } from '../../api/courses/[[path]]';
import { onRequestPost as college } from '../../api/college-admin/actions';
import { onRequestPost as school } from '../../api/school-admin/actions';
import { onRequestPost as university } from '../../api/university-admin/actions';

const course = {
  course_id: 'course', duration: '6 hours', credits: 5, thumbnail: null,
  target_outcomes: ['SQL - Database'],
  course_skills: [{ skill_name: 'Programming' }, { skill_name: 'Technical Skills' }],
  modules: [
    { module_id: 'second', title: 'Second', order_index: 1, lessons: [] },
    { module_id: 'first', title: 'First', order_index: 0, lessons: [
      { lesson_id: 'later', title: 'Later', order_index: 1 },
      { lesson_id: 'earlier', title: 'Earlier', order_index: 0 },
    ] },
  ],
};

let query: any;
beforeEach(() => {
  vi.clearAllMocks();
  query = {
    select: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [course], count: 1, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: course, error: null }),
  };
  mocks.from.mockReturnValue(query);
});

async function get(path: string) {
  return onRequest({ request: new Request(`https://example.test/api/courses/${path}`), env: {} } as any);
}

it('returns saved metadata, module/lesson summaries and skill names for browse details', async () => {
  const response = await get('list');
  const { data } = await response.json() as any;
  expect(query.select.mock.calls[0][0]).toContain('modules:course_modules');
  expect(query.select.mock.calls[0][0]).toContain('course_skills(skill_name)');
  expect(data.total).toBe(1);
  expect(data.courses[0]).toMatchObject({ duration: '6 hours', credits: 5, thumbnail: null,
    target_outcomes: ['SQL - Database'], skills_covered: ['Programming', 'Technical Skills'] });
  expect(data.courses[0].modules.map((m: any) => m.module_id)).toEqual(['first', 'second']);
  expect(data.courses[0].modules[0].lessons.map((l: any) => l.lesson_id)).toEqual(['earlier', 'later']);
  expect(data.courses[0].modules[1].lessons).toEqual([]);
});

it('includes the same saved hierarchy when opening a course directly', async () => {
  const response = await get('list/course');
  const { data } = await response.json() as any;
  expect(data.modules).toHaveLength(2);
  expect(data.skills_covered).toEqual(['Programming', 'Technical Skills']);
});

it('reports database errors instead of presenting an empty hierarchy', async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: { message: 'relationship unavailable' } });
  expect((await get('list/course')).status).toBe(500);
});

it.each([
  ['college-admin', college, { action: 'get-browse-courses' }],
  ['school-admin', school, { action: 'fetchBrowseCourses' }],
  ['university-admin', university, { action: 'list-courses', filters: { status: { in: ['Active', 'Upcoming'] }, deleted_at: { is: null } } }],
] as const)('%s browse endpoint returns saved modules, lessons and skill names', async (role, handler, body) => {
  const response = await handler({ request: new Request(`https://example.test/api/${role}/actions`, {
    method: 'POST', body: JSON.stringify(body),
  }), env: {} } as any);
  const { data } = await response.json() as any;
  expect(response.status).toBe(200);
  expect(query.select.mock.calls[0][0]).toContain('modules:course_modules');
  expect(query.select.mock.calls[0][0]).toContain('course_skills(skill_name)');
  expect(data[0].modules).toHaveLength(2);
  expect(data[0].modules[0].lessons).toHaveLength(2);
  expect(data[0].skills_covered).toEqual(['Programming', 'Technical Skills']);
  expect(query.is).toHaveBeenCalledWith('deleted_at', null);
});

it.skipIf(process.env.COURSE_CATALOG_LOCAL_TEST !== '1')('college-admin returns the actual AI Tools for Teachers hierarchy from local Postgres', async () => {
  const { readFileSync } = await import('node:fs');
  const { parse } = await import('dotenv');
  const { createClient } = await import('@supabase/supabase-js');
  const env = parse(readFileSync('../sp-dash-2/.env.local'));
  const url = env.SKILLPASSPORT_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Local database required');
  const db = createClient(url, env.SKILLPASSPORT_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  mocks.from.mockImplementation(db.from.bind(db));
  const response = await college({ request: new Request('http://localhost:8788/api/college-admin/actions', {
    method: 'POST', body: JSON.stringify({ action: 'get-browse-courses' }),
  }), env: {} } as any);
  expect(response.status).toBe(200);
  const { data } = await response.json() as any;
  const savedCourse = data.find((row: any) => row.code === 'AITT2026-02');
  expect(savedCourse.modules).toHaveLength(1);
  expect(savedCourse.modules[0].lessons).toHaveLength(1);
  expect(savedCourse.skills_covered).toEqual(['Technical Skills']);
});
