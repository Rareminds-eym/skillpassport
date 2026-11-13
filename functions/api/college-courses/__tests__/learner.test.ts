// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet } from '../learner';
const state = vi.hoisted(() => ({ tables: {} as Record<string, any[]>, selections: [] as [string, string][], fail: '' }));
vi.mock('../../../lib/auth', () => ({ withAuth: (handler: unknown) => handler, getContextUser: () => ({ id: 'signed-in', email: 'own@test' }) }));
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => ({ from: (table: string) => {
  let rows = state.tables[table] || [];
  const response = () => ({ data: rows, error: state.fail === table ? { code: 'XX000', message: 'Unavailable' } : null });
  const chain: any = {
    select: (fields: string) => { state.selections.push([table, fields]); return chain; },
    eq: (field: string, value: unknown) => { rows = rows.filter(row => row[field] === value); return chain; },
    is: (field: string, value: unknown) => { rows = rows.filter(row => row[field] === value); return chain; },
    not: (field: string, _operator: string, value: unknown) => { rows = rows.filter(row => row[field] !== value); return chain; },
    in: (field: string, values: unknown[]) => { rows = rows.filter(row => values.includes(row[field])); return chain; },
    maybeSingle: async () => ({ ...response(), data: rows[0] || null }),
    then: (resolve: any) => Promise.resolve(response()).then(resolve),
  };
  return chain;
} }) }));
const own = { id: 'learner', user_id: 'signed-in', email: 'own@test', college_id: 'college', program_id: 'program', semester: 1, program_section_id: 'section', college_class_id: null, is_deleted: false };
const course = { id: 'course', college_id: 'college', course_code: 'M101', course_name: 'Mathematics', credits: 3, is_active: true };
const curriculum = { id: 'published', college_id: 'college', program_id: 'program', course_id: 'course', status: 'published', academic_year: '2026-2027', units: [{ id: 'second', order_index: 2 }, { id: 'first', order_index: 1 }], outcomes: [] };
const request = () => onRequestGet({ request: new Request('https://example.test/api/college-courses/learner?learnerId=other&collegeId=other&academicYear=2025-2026'), env: {} } as never) as Promise<Response>;
beforeEach(() => {
  state.fail = ''; state.selections = [];
  state.tables = {
    learners: [{ ...own }, { ...own, id: 'other', user_id: 'other', email: 'other@test', college_id: 'other' }],
    programs: [{ id: 'program', name: 'Engineering', department_id: 'department' }],
    departments: [{ id: 'department', college_id: 'college' }],
    program_sections: [{ id: 'section', program_id: 'program', department_id: 'department', semester: 1, academic_year: '2026-27', status: 'active' }],
    college_course_mappings: [{ course_id: 'course', program_id: 'program', semester: 1 }],
    college_courses: [{ ...course }], college_curriculums: [{ ...curriculum }],
  };
});
describe('learner college curriculum access', () => {
  it('uses the signed-in enrollment, accepts year formats and orders published units', async () => {
    const response = await request(); expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data.enrollment).toEqual({ program_name: 'Engineering', semester: 1, academic_year: '2026-27' });
    expect(data.courses.map((item: any) => item.id)).toEqual(['published']);
    expect(data.courses[0].units.map((item: any) => item.id)).toEqual(['first', 'second']);
    const fields = state.selections.find(([table]) => table === 'college_curriculums')![1];
    expect(fields).not.toMatch(/\*|pending_changes|change_history|review_notes|requested_by/);
  });
  it('shows a course once when the same year exists in short and full formats', async () => {
    state.tables.college_curriculums.push({ ...curriculum, id: 'short-year', academic_year: '2026-27' });
    const courses = (await (await request()).json()).data.courses;
    expect(courses.map((item: any) => item.id)).toEqual(['short-year']);
  });
  it('excludes draft, approved-only, rejected, previous-year and other-program curriculum', async () => {
    state.tables.college_curriculums.push(...['draft', 'approved', 'rejected', 'pending_approval', 'archived'].map(status => ({ ...curriculum, id: status, status })),
      { ...curriculum, id: 'previous-year', academic_year: '2025-2026' }, { ...curriculum, id: 'other-program', program_id: 'other' }, { ...curriculum, id: 'other-college', college_id: 'other' });
    expect((await (await request()).json()).data.courses.map((item: any) => item.id)).toEqual(['published']);
  });
  it('excludes unmapped, inactive, other-college and other-semester courses', async () => {
    for (const [id, patch] of [['unmapped', {}], ['inactive', { is_active: false }], ['outside', { college_id: 'other' }], ['later', {}]] as const) {
      state.tables.college_courses.push({ ...course, ...patch, id });
      state.tables.college_curriculums.push({ ...curriculum, id, course_id: id });
      if (id !== 'unmapped') state.tables.college_course_mappings.push({ course_id: id, program_id: 'program', semester: id === 'later' ? 2 : 1 });
    }
    expect((await (await request()).json()).data.courses.map((item: any) => item.id)).toEqual(['published']);
  });
  it('does not guess the year when the linked section is stale', async () => {
    state.tables.program_sections[0].semester = 2;
    const data = (await (await request()).json()).data;
    expect(data.courses).toEqual([]); expect(data.setupRequired).toMatch(/academic year/);
    expect(state.selections.some(([table]) => table === 'college_curriculums')).toBe(false);
  });
  it('uses a same-college active class year when no section is assigned', async () => {
    state.tables.learners[0] = { ...own, program_section_id: null, college_class_id: 'class' };
    state.tables.college_classes = [{ id: 'class', college_id: 'college', status: 'active', academic_year: '2026-2027' }];
    expect((await (await request()).json()).data.courses).toHaveLength(1);
    state.tables.college_classes[0].college_id = 'other';
    expect((await (await request()).json()).data.setupRequired).toMatch(/academic year/);
  });
  it('does not accept a program belonging to another college', async () => {
    state.tables.departments[0].college_id = 'other';
    expect((await (await request()).json()).data.setupRequired).toMatch(/belong to your college/);
  });
  it('supports an unlinked own-email profile but never a profile linked to another user', async () => {
    state.tables.learners[0].user_id = null;
    expect((await (await request()).json()).data.courses).toHaveLength(1);
    state.tables.learners[0].user_id = 'other';
    expect((await request()).status).toBe(403);
  });
  it('rejects deleted profiles and reports missing enrollment clearly', async () => {
    state.tables.learners[0].is_deleted = true;
    expect((await request()).status).toBe(403);
    state.tables.learners[0] = { ...own, semester: null };
    expect((await (await request()).json()).data.setupRequired).toMatch(/semester/);
  });
  it('returns a successful empty list if nothing is published', async () => {
    state.tables.college_curriculums = [];
    expect((await (await request()).json()).data).toMatchObject({ courses: [], setupRequired: null });
  });
  it('reports database failures instead of presenting an empty course list', async () => {
    state.fail = 'college_curriculums';
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await request()).status).toBeGreaterThanOrEqual(400);
    log.mockRestore();
  });
});
