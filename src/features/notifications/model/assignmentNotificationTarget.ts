const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const assignmentNotificationTypes = ['assignment_assigned', 'assignment_allocation_complete', 'assignment_submission_received', 'assignment_submitted', 'assignment_evaluated'];

export function assignmentNotificationTarget(notification: {type: string; metadata?: Record<string, unknown> | null}, pathname: string): string | null {
  const metadata = notification.metadata;
  if (!assignmentNotificationTypes.includes(notification.type) || typeof metadata?.course_id !== 'string' || !uuid.test(metadata.course_id)) return null;
  const prefix = pathname.split('/')[1];
  if (!['learner', 'educator', 'college-admin', 'school-admin'].includes(prefix)) return null;
  const query = new URLSearchParams({panel: 'assignments'});
  for (const field of ['assignment_id', 'allocation_id', 'result_id']) {
    const value = metadata[field];
    if (typeof value === 'string' && uuid.test(value)) query.set(field, value);
  }
  return `/${prefix}/courses/${metadata.course_id}/learn?${query}`;
}
