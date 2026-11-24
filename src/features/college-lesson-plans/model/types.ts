export interface LessonPlanContent {
  id: string; title: string; session_date: string; duration_minutes: number | null;
  curriculum_id: string; unit_id: string; session_objectives: string; teaching_methodology: string;
  required_materials: string | null; evaluation_criteria: string | null; follow_up_activities: string | null;
  selected_learning_outcomes: string[];
  resource_links: { id: string; title: string; url: string }[];
  resource_files: { id: string; name: string; type: string; size: number; url: string }[];
  evaluation_items: { id: string; criterion: string; percentage: number }[];
}
export interface EducatorLessonPlan extends LessonPlanContent {
  academic_year: string; status: 'draft' | 'published'; additional_notes: string | null; updated_at: string;
}
export interface LessonPlanCurriculum {
  id: string; academic_year: string; units: { id: string; name: string }[];
  outcomes: { id: string; unit_id: string; outcome_text: string }[];
}
export interface EducatorLessonPlans {
  plans: EducatorLessonPlan[]; curricula: LessonPlanCurriculum[]; canEdit: boolean;
}
