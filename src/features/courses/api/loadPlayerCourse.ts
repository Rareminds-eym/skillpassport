import { apiPost } from '@/shared/api/apiClient';
import { teaching } from '@/features/external-teaching/api/teachingApi';

/** Keep assigned trainer reads inside the mapping-checked teaching boundary. */
export async function loadPlayerCourse(courseId: string, assignedTeaching: boolean) {
  if (assignedTeaching) {
    const courses = await teaching('courses');
    const course = courses.find((item: any) => item.course_id === courseId);
    if (!course) throw new Error('Course is not assigned to you.');
    const modules = await teaching('course_content', { courseId });
    return { ...course, modules };
  }
  const result = await apiPost<{ data: any }>('/learner-pages/actions', {
    action: 'fetch-course-full', courseId,
  });
  return result?.data;
}
