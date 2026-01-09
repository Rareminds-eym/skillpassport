import { supabase } from "../lib/supabaseClient";

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

/**
 * Get current educator ID from authenticated user
 */
export async function getCurrentEducatorId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: educator } = await supabase
      .from("school_educators")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    return educator?.id || null;
  } catch (error) {
    console.error("Error getting educator ID:", error);
    return null;
  }
}

/**
 * Get all lesson plans for current educator
 */
export async function getLessonPlans(): Promise<{ data: LessonPlan[] | null; error: any }> {
  try {
    const educatorId = await getCurrentEducatorId();
    if (!educatorId) {
      return { data: null, error: new Error("Educator not found") };
    }

    const { data, error } = await supabase
      .from("lesson_plans")
      .select(`
        *,
        school_classes(academic_year)
      `)
      .eq("educator_id", educatorId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching lesson plans:", error);
      return { data: null, error };
    }

    // Flatten the data to include academic_year at the top level
    const flattenedData = data?.map(plan => ({
      ...plan,
      academic_year: (plan as any).school_classes?.academic_year || null,
      school_classes: undefined, // Remove nested object
    }));

    return { data: flattenedData as LessonPlan[], error: null };
  } catch (error) {
    console.error("Error fetching lesson plans:", error);
    return { data: null, error };
  }
}

/**
 * Get a single lesson plan by ID
 */
export async function getLessonPlan(id: string): Promise<{ data: LessonPlan | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("lesson_plans")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    return { data, error };
  } catch (error) {
    console.error("Error fetching lesson plan:", error);
    return { data: null, error };
  }
}

/**
 * Create a new lesson plan
 */
export async function createLessonPlan(
  formData: LessonPlanFormData,
  classId: string | null
): Promise<{ data: LessonPlan | null; error: any }> {
  try {
    const educatorId = await getCurrentEducatorId();
    if (!educatorId) {
      return { data: null, error: new Error("Educator not found") };
    }

    // Get chapter details for duration
    const { data: chapter } = await supabase
      .from("curriculum_chapters")
      .select("estimated_duration, duration_unit")
      .eq("id", formData.chapterId)
      .maybeSingle();

    const duration = chapter?.estimated_duration || 60; // Default to 60 minutes

    const { data, error } = await supabase
      .from("lesson_plans")
      .insert({
        educator_id: educatorId,
        class_id: classId || null,
        title: formData.title,
        subject: formData.subject,
        class_name: formData.class,
        date: formData.date,
        duration: duration,
        chapter_id: formData.chapterId,
        // chapter_name will be auto-populated by trigger
        selected_learning_outcomes: formData.selectedLearningOutcomes,
        learning_objectives: formData.learningObjectives,
        teaching_methodology: formData.teachingMethodology,
        required_materials: formData.requiredMaterials,
        resource_files: formData.resourceFiles,
        resource_links: formData.resourceLinks,
        evaluation_criteria: formData.evaluationCriteria,
        evaluation_items: formData.evaluationItems,
        homework: formData.homework || null,
        differentiation_notes: formData.differentiationNotes || null,
        status: formData.status || "draft",
        activities: [],
        resources: [],
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error("Error creating lesson plan:", error);
    return { data: null, error };
  }
}

/**
 * Update an existing lesson plan
 */
export async function updateLessonPlan(
  id: string,
  formData: LessonPlanFormData,
  classId: string | null
): Promise<{ data: LessonPlan | null; error: any }> {
  try {
    // Get chapter details for duration
    const { data: chapter } = await supabase
      .from("curriculum_chapters")
      .select("estimated_duration, duration_unit")
      .eq("id", formData.chapterId)
      .maybeSingle();

    const duration = chapter?.estimated_duration || 60;

    const { data, error } = await supabase
      .from("lesson_plans")
      .update({
        class_id: classId || null,
        title: formData.title,
        subject: formData.subject,
        class_name: formData.class,
        date: formData.date,
        duration: duration,
        chapter_id: formData.chapterId,
        selected_learning_outcomes: formData.selectedLearningOutcomes,
        learning_objectives: formData.learningObjectives,
        teaching_methodology: formData.teachingMethodology,
        required_materials: formData.requiredMaterials,
        resource_files: formData.resourceFiles,
        resource_links: formData.resourceLinks,
        evaluation_criteria: formData.evaluationCriteria,
        evaluation_items: formData.evaluationItems,
        homework: formData.homework || null,
        differentiation_notes: formData.differentiationNotes || null,
        status: formData.status || "draft",
      })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error("Error updating lesson plan:", error);
    return { data: null, error };
  }
}

/**
 * Delete a lesson plan
 */
export async function deleteLessonPlan(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from("lesson_plans")
      .delete()
      .eq("id", id);

    return { error };
  } catch (error) {
    console.error("Error deleting lesson plan:", error);
    return { error };
  }
}

/**
 * Submit a lesson plan for review
 */
export async function submitLessonPlan(id: string): Promise<{ data: LessonPlan | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from("lesson_plans")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error("Error submitting lesson plan:", error);
    return { data: null, error };
  }
}

/**
 * Get curriculums for subject and class
 */
export async function getCurriculums(subject: string, className: string) {
  try {
    const { data, error } = await supabase
      .from("curriculums")
      .select(`
        id,
        subject,
        class,
        academic_year,
        status
      `)
      .eq("subject", subject)
      .eq("class", className)
      .eq("status", "approved")
      .order("academic_year", { ascending: false });

    return { data, error };
  } catch (error) {
    console.error("Error fetching curriculums:", error);
    return { data: null, error };
  }
}

/**
 * Get chapters for a curriculum
 */
export async function getChapters(curriculumId: string) {
  try {
    const { data, error } = await supabase
      .from("curriculum_chapters")
      .select("*")
      .eq("curriculum_id", curriculumId)
      .order("order_number", { ascending: true });

    // Transform snake_case to camelCase for frontend compatibility
    const transformedData = data?.map((chapter: any) => ({
      id: chapter.id,
      curriculum_id: chapter.curriculum_id,
      name: chapter.name,
      code: chapter.code,
      description: chapter.description,
      order: chapter.order_number,
      estimatedDuration: chapter.estimated_duration,
      durationUnit: chapter.duration_unit,
      created_at: chapter.created_at,
      updated_at: chapter.updated_at,
    }));

    return { data: transformedData, error };
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return { data: null, error };
  }
}

/**
 * Get learning outcomes for a chapter
 */
export async function getLearningOutcomes(chapterId: string) {
  try {
    const { data, error } = await supabase
      .from("curriculum_learning_outcomes")
      .select("*")
      .eq("chapter_id", chapterId);

    // Transform snake_case to camelCase for frontend compatibility
    const transformedData = data?.map((outcome: any) => ({
      id: outcome.id,
      chapterId: outcome.chapter_id,
      outcome: outcome.outcome,
      bloomLevel: outcome.bloom_level,
    }));

    return { data: transformedData, error };
  } catch (error) {
    console.error("Error fetching learning outcomes:", error);
    return { data: null, error };
  }
}

/**
 * Get subjects from curriculum configuration
 */
export async function getSubjects(schoolId?: string) {
  try {
    const { data, error } = await supabase
      .from("curriculum_subjects")
      .select("*")
      .or(`school_id.is.null,school_id.eq.${schoolId || ""}`)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    return { data, error };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return { data: null, error };
  }
}

/**
 * Get classes from school_classes table
 */
export async function getClasses(schoolId: string) {
  try {
    const { data, error } = await supabase
      .from("school_classes")
      .select("id, name, grade, section, academic_year")
      .eq("school_id", schoolId)
      .eq("account_status", "active")
      .order("grade", { ascending: true });

    return { data, error };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return { data: null, error };
  }
}
