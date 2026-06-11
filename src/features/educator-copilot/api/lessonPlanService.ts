import { apiPost } from '@/shared/api/apiClient';

export interface LessonPlan {
  id: string;
  educator_id: string;
  class_id: string | null;
  title: string;
  subject: string;
  class_name: string;
  date: string;
  duration: number;
  chapter_id: string | null;
  chapter_name: string | null;
  selected_learning_outcomes: string[];
  learning_objectives: string;
  teaching_methodology: string | null;
  required_materials: string | null;
  resource_files: any[];
  resource_links: any[];
  evaluation_criteria: string | null;
  evaluation_items: any[];
  homework: string | null;
  differentiation_notes: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_required';
  created_at: string;
  updated_at: string;
}

export const lessonPlanService = {
  async getLessonPlans(schoolId: string): Promise<LessonPlan[]> {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'lpGetLessonPlans',
      schoolId,
    });
    return result?.data || [];
  },

  async getEducatorLessonPlans(educatorId: string): Promise<LessonPlan[]> {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'lpGetEducatorLessonPlans',
      educatorId,
    });
    return result?.data || [];
  },

  async createLessonPlan(lessonPlan: Omit<LessonPlan, 'id' | 'created_at' | 'updated_at'>): Promise<LessonPlan> {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'lpCreateLessonPlan',
      lessonPlan,
    });
    return result?.data;
  },

  async updateLessonPlan(id: string, updates: Partial<LessonPlan>): Promise<LessonPlan> {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'lpUpdateLessonPlan',
      id,
      updates,
    });
    return result?.data;
  },

  async deleteLessonPlan(id: string): Promise<void> {
    await apiPost('/educator-copilot/actions', {
      action: 'lpDeleteLessonPlan',
      id,
    });
  },

  async getLessonPlanById(id: string): Promise<LessonPlan | null> {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'lpGetLessonPlanById',
      id,
    });
    return result?.data || null;
  },
};
