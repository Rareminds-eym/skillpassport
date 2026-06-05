import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';


const logger = getLogger('lesson-plans');

export interface LessonPlanFormData {
  title: string;
  subject: string;
  class: string;
  date: string;
  chapterId: string;
  selectedLearningOutcomes: string[];
  learningObjectives: string;
  teachingMethodology: string;
  requiredMaterials: string;
  resourceFiles: ResourceFile[];
  resourceLinks: ResourceLink[];
  evaluationCriteria: string;
  evaluationItems: EvaluationCriteria[];
  homework?: string;
  differentiationNotes?: string;
  status?: 'draft' | 'approved';
}

export interface ResourceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
}

export interface EvaluationCriteria {
  id: string;
  criterion: string;
  percentage: number;
}

export interface LessonPlan {
  id: string;
  educator_id: string;
  class_id: string;
  title: string;
  subject: string;
  class_name: string;
  academic_year?: string;
  date: string;
  duration: number;
  chapter_id: string;
  chapter_name: string;
  selected_learning_outcomes: string[];
  learning_objectives: string;
  teaching_methodology: string;
  required_materials: string;
  resource_files: ResourceFile[];
  resource_links: ResourceLink[];
  activities: any[];
  resources: any[];
  evaluation_criteria: string;
  evaluation_items: EvaluationCriteria[];
  assessment_methods?: string;
  homework?: string;
  differentiation_notes?: string;
  notes?: string;
  status: string;
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_comments?: string;
  created_at: string;
  updated_at: string;
}

export async function getCurrentEducatorId(): Promise<string | null> {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getCurrentEducatorId',
    });
    return result?.data ?? null;
  } catch (error) {
    logger.error("Error getting educator ID", error as Error);
    return null;
  }
}

export async function getLessonPlans(): Promise<{ data: LessonPlan[] | null; error: any }> {
  try {
    const educatorId = await getCurrentEducatorId();
    let schoolId: string | null = null;

    if (!educatorId) {
      try {
        const storedUser = (useAuthStore.getState().user ? JSON.stringify(useAuthStore.getState().user) : localStorage.getItem("user"));
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'school_admin' && userData.schoolId) {
            schoolId = userData.schoolId;
          }
        }
        if (!schoolId) {
          const orgResult: any = await apiPost('/educator-copilot/actions', {
            action: 'getCurrentEducatorId',
          });
          schoolId = null;
        }
      } catch { }
    }

    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getLessonPlans',
      educatorId,
      schoolId,
    });

    return { data: result?.data as LessonPlan[] || [], error: null };
  } catch (error) {
    logger.error("Error fetching lesson plans", error as Error);
    return { data: null, error };
  }
}

export async function getLessonPlan(id: string): Promise<{ data: LessonPlan | null; error: any }> {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getLessonPlan',
      id,
    });
    return { data: result?.data, error: null };
  } catch (error) {
    logger.error("Error fetching lesson plan", error as Error);
    return { data: null, error };
  }
}

export async function createLessonPlan(
  formData: LessonPlanFormData,
  classId: string | null
): Promise<{ data: LessonPlan | null; error: any }> {
  try {
    const educatorId = await getCurrentEducatorId();
    if (!educatorId) {
      return { data: null, error: new Error("Educator not found") };
    }

    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'createLessonPlan',
      educatorId,
      formData,
      classId,
    });

    return { data: result?.data, error: null };
  } catch (error) {
    logger.error("Error creating lesson plan", error as Error);
    return { data: null, error };
  }
}

export async function updateLessonPlan(
  id: string,
  formData: LessonPlanFormData,
  classId: string | null
): Promise<{ data: LessonPlan | null; error: any }> {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'updateLessonPlan',
      id,
      formData,
      classId,
    });

    return { data: result?.data, error: null };
  } catch (error) {
    logger.error("Error updating lesson plan", error as Error);
    return { data: null, error };
  }
}

export async function deleteLessonPlan(id: string): Promise<{ error: any }> {
  try {
    await apiPost('/educator-copilot/actions', {
      action: 'deleteLessonPlan',
      id,
    });
    return { error: null };
  } catch (error) {
    logger.error("Error deleting lesson plan", error as Error);
    return { error };
  }
}

export async function submitLessonPlan(id: string): Promise<{ data: LessonPlan | null; error: any }> {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'submitLessonPlan',
      id,
    });
    return { data: result?.data, error: null };
  } catch (error) {
    logger.error("Error submitting lesson plan", error as Error);
    return { data: null, error };
  }
}

export async function getCurriculums(subject: string, className: string) {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getCurriculums',
      subject,
      className,
    });
    return { data: result?.data, error: null };
  } catch (error) {
    logger.error("Error fetching curriculums", error as Error);
    return { data: null, error };
  }
}

export async function getChapters(curriculumId: string) {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getChapters',
      curriculumId,
    });
    return { data: result?.data, error: null };
  } catch (error) {
    logger.error("Error fetching chapters", error as Error);
    return { data: null, error };
  }
}

export async function getLearningOutcomes(chapterId: string) {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getLearningOutcomes',
      chapterId,
    });
    return { data: result?.data, error: null };
  } catch (error) {
    logger.error("Error fetching learning outcomes", error as Error);
    return { data: null, error };
  }
}

export async function getSubjects(schoolId?: string) {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getSubjects',
      schoolId,
    });
    return { data: result?.data, error: null };
  } catch (error) {
    logger.error("Error fetching subjects", error as Error);
    return { data: null, error };
  }
}

export async function getClasses(schoolId: string) {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getClasses',
      schoolId,
    });
    return { data: result?.data, error: null };
  } catch (error) {
    logger.error("Error fetching classes", error as Error);
    return { data: null, error };
  }
}
