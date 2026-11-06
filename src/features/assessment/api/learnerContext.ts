import {apiGet, ApiError} from '@/shared/api/apiClient';

export interface AssessmentLearnerContext {
  id: string;
  user_id: string;
  grade: string | null;
  branch_field: string | null;
  course_name: string | null;
  specialization?: string | null;
  program_id: string | null;
  learner_type: string | null;
  school_id: string | null;
  college_id: string | null;
  program?: {name: string; code: string; degree_level?: string | null} | null;
  programs?: {name: string; code: string; degree_level?: string | null} | null;
}

/** The server chooses the SSO owner. A reference is only a local consistency check. */
export async function getOwnAssessmentLearner(reference?: string): Promise<AssessmentLearnerContext | null> {
  try {
    const response = await apiGet<{success: boolean; learner: AssessmentLearnerContext}>('/learners/profile');
    const learner = response.learner;
    if (response.success !== true || !learner?.id || !learner.user_id) throw new Error('Learner context unavailable');
    if (reference && reference !== learner.id && reference !== learner.user_id) return null;
    return {...learner, programs: learner.program ?? null};
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
