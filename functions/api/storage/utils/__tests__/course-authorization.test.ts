import { describe, expect, it } from 'vitest';
import { checkCourseEnrollment } from '../course-authorization';

function client(enrolled: boolean) {
  return {
    from(table: string) {
      const filters: Record<string, string> = {};
      const query = {
        select: () => query,
        eq: (key: string, value: string) => { filters[key] = value; return query; },
        maybeSingle: async () => ({
          data: table === 'learners'
            ? (filters.user_id === 'user' ? { id: 'learner' } : null)
            : (enrolled && filters.learner_id === 'learner' && filters.course_id === 'course' ? { id: 'enrollment' } : null),
          error: null,
        }),
      };
      return query;
    },
  } as any;
}

describe('course enrollment authorization', () => {
  it('resolves a login user to the enrolled learner', async () => {
    expect((await checkCourseEnrollment(client(true), 'user', 'course')).authorized).toBe(true);
  });
  it('denies users who are not enrolled', async () => {
    expect((await checkCourseEnrollment(client(false), 'user', 'course')).authorized).toBe(false);
    expect((await checkCourseEnrollment(client(true), 'other', 'course')).authorized).toBe(false);
  });
});
