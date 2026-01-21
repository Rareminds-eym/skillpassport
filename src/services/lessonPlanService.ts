import { supabase } from '../lib/supabaseClient';

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
  // Get all lesson plans for a school
  async getLessonPlans(schoolId: string): Promise<LessonPlan[]> {
    const { data, error } = await supabase
      .from('lesson_plans')
      .select(
        `
        *,
        school_educators!inner(school_id)
      `
      )
      .eq('school_educators.school_id', schoolId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get lesson plans for a specific educator
  async getEducatorLessonPlans(educatorId: string): Promise<LessonPlan[]> {
    const { data, error } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('educator_id', educatorId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create a new lesson plan
  async createLessonPlan(
    lessonPlan: Omit<LessonPlan, 'id' | 'created_at' | 'updated_at'>
  ): Promise<LessonPlan> {
    const { data, error } = await supabase
      .from('lesson_plans')
      .insert(lessonPlan)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing lesson plan
  async updateLessonPlan(id: string, updates: Partial<LessonPlan>): Promise<LessonPlan> {
    const { data, error } = await supabase
      .from('lesson_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a lesson plan
  async deleteLessonPlan(id: string): Promise<void> {
    const { error } = await supabase.from('lesson_plans').delete().eq('id', id);

    if (error) throw error;
  },

  // Get lesson plan by ID
  async getLessonPlanById(id: string): Promise<LessonPlan | null> {
    const { data, error } = await supabase.from('lesson_plans').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  },
};
