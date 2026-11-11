import { expect, it } from 'vitest';
import { assignmentNotificationTarget, assignmentNotificationTypes } from '../assignmentNotificationTarget';
const id = '11111111-1111-4111-8111-111111111111';
it.each(assignmentNotificationTypes)('routes %s to the course assignment panel', type => {
  expect(assignmentNotificationTarget({type, metadata: {course_id: id, result_id: id}}, '/learner/dashboard')).toBe(`/learner/courses/${id}/learn?panel=assignments&result_id=${id}`);
});
it('preserves the educator route prefix', () => {
  expect(assignmentNotificationTarget({type:'assignment_submitted', metadata:{course_id:id}}, '/educator/dashboard')).toContain('/educator/courses/');
});
it('rejects unrelated events, invalid identifiers and unsupported roles', () => {
  expect(assignmentNotificationTarget({type:'new_message', metadata:{course_id:id}}, '/learner')).toBeNull();
  expect(assignmentNotificationTarget({type:'assignment_assigned', metadata:{course_id:'https://other.test'}}, '/learner')).toBeNull();
  expect(assignmentNotificationTarget({type:'assignment_assigned', metadata:{course_id:id}}, '/recruiter')).toBeNull();
});
