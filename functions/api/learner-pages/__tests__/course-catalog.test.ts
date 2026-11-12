import { beforeEach, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({
  user: { id: 'lavanya-user' }, from: vi.fn(), catalog: null as any,
  courseId: '9abd3049-2cf2-4178-90dd-58eeb63ad30a', enrolled: true,
}));
vi.mock('../../../lib/auth', () => ({ withAuth: (handler: any) => handler, getContextUser: () => f.user }));
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => ({ from: f.from }) }));
import { onRequestPost } from '../actions';

function query(data: any, count?: number) {
  const q: any = { then: (resolve: any) => Promise.resolve({ data, count, error: null }).then(resolve) };
  for (const method of ['select', 'eq', 'in', 'is', 'or', 'range', 'order']) q[method] = vi.fn(() => q);
  q.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'lavanya-profile' }, error: null });
  return q;
}
beforeEach(() => {
  vi.clearAllMocks(); f.enrolled = true;
  f.catalog = query([{ course_id: f.courseId, classification: 'middle_school' }], 1);
  f.from.mockImplementation((table: string) => table === 'courses' ? f.catalog :
    query(table === 'course_enrollments' && f.enrolled ? [{ course_id: f.courseId }] : []));
});
async function catalog() {
  return onRequestPost({ env: {}, request: new Request('http://localhost/api/learner-pages/actions', {
    method: 'POST', body: JSON.stringify({ action: 'fetch-courses-query', userId: 'someone-else',
      filters: { classification: 'college', search: 'Climate-Ready School Biodiversity Zone' } }),
  }) } as any);
}
it('includes an enrolled school course in a college learner catalog and permits direct opening', async () => {
  const response = await catalog();
  expect(response.status).toBe(200);
  expect(f.catalog.or).toHaveBeenCalledWith(`classification.eq.college,classification.is.null,course_id.in.(${f.courseId})`);
  expect(f.catalog.or).toHaveBeenCalledWith(expect.stringContaining('title.ilike.%Climate-Ready'));
  expect((await response.json()).data.assignedCourseIds).toEqual([f.courseId]);
  const learnerQuery = f.from.mock.results.find((_: any, index: number) => f.from.mock.calls[index][0] === 'learners')!.value;
  expect(learnerQuery.eq).toHaveBeenCalledWith('user_id', 'lavanya-user');
});
it('keeps grade filtering when the learner has no enrollment or explicit assignment', async () => {
  f.enrolled = false;
  await catalog();
  expect(f.catalog.or).toHaveBeenCalledWith('classification.eq.college,classification.is.null');
  expect(f.catalog.or).not.toHaveBeenCalledWith(expect.stringContaining('course_id.in.'));
});
