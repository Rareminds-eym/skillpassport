import { apiGet } from '@/shared/api/apiClient';

export type LearnerCollegeCourse = {
  id: string; course_id: string; academic_year: string;
  course: { id: string; course_code: string; course_name: string; description: string | null; credits: number | null };
  units: { id: string; name: string; code: string | null; description: string | null; credits: number | null; estimated_duration: number | null; duration_unit: string | null; order_index: number | null }[];
  outcomes: { id: string; unit_id: string; outcome_text: string; bloom_level: string | null }[];
};
export type LearnerCollegeCourses = {
  courses: LearnerCollegeCourse[];
  enrollment: { program_name: string; semester: number; academic_year: string } | null;
  setupRequired: string | null;
};
export async function getLearnerCollegeCourses(): Promise<LearnerCollegeCourses> {
  const response = await apiGet<{ data: LearnerCollegeCourses }>('/college-courses/learner');
  return response.data;
}
