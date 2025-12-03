import { supabase } from '../lib/supabaseClient';

export interface AssessmentType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface AssessmentMapping {
  assessmentType: string;
  assessment_type_id?: string;
  weightage?: number;
}

export interface LearningOutcome {
  id: string;
  chapter_id: string;
  outcome: string;
  bloom_level?: string;
  assessmentMappings?: AssessmentMapping[];
  created_at?: string;
}

export interface Chapter {
  id: string;
  curriculum_id: string;
  name: string;
  code?: string;
  description: string;
  order_number: number;
  estimated_duration?: number;
  duration_unit?: 'hours' | 'weeks';
  created_at?: string;
}

export interface Curriculum {
  id: string;
  school_id: string;
  subject: string;
  class: string;
  academic_year: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  created_by: string;
  approved_by?: string;
  approval_date?: string;
  rejection_reason?: string;
  last_modified: string;
  created_at: string;
}

// Get all assessment types
export const getAssessmentTypes = async (): Promise<AssessmentType[]> => {
  const { data, error } = await supabase
    .from('assessment_types')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

// Get all subjects (school-specific + global fallback)
export const getSubjects = async (): Promise<string[]> => {
  const schoolId = await getCurrentEducatorSchoolId();
  
  // First, try to get school-specific subjects
  let { data, error } = await supabase
    .from('curriculum_subjects')
    .select('name')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('display_order');

  // If no school-specific subjects, get global subjects
  if (!data || data.length === 0) {
    const result = await supabase
      .from('curriculum_subjects')
      .select('name')
      .is('school_id', null)
      .eq('is_active', true)
      .order('display_order');
    
    data = result.data;
    error = result.error;
  }

  if (error) throw error;
  return data?.map(s => s.name) || [];
};

// Get all classes (from school_classes.grade field + curriculum_classes fallback)
export const getClasses = async (): Promise<string[]> => {
  const schoolId = await getCurrentEducatorSchoolId();
  
  if (schoolId) {
    // Get unique grades from school_classes for this school
    const { data: schoolClassesData, error: schoolError } = await supabase
      .from('school_classes')
      .select('grade')
      .eq('school_id', schoolId)
      .order('grade');

    if (!schoolError && schoolClassesData && schoolClassesData.length > 0) {
      // Get unique grades and sort them
      const uniqueGrades = [...new Set(schoolClassesData.map(c => c.grade))];
      return uniqueGrades.sort((a, b) => {
        // Try to sort numerically if possible
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      });
    }
  }
  
  // Fallback 1: Try curriculum_classes for this school
  let { data, error } = await supabase
    .from('curriculum_classes')
    .select('name')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('display_order');

  // Fallback 2: Get global curriculum_classes
  if (!data || data.length === 0) {
    const result = await supabase
      .from('curriculum_classes')
      .select('name')
      .is('school_id', null)
      .eq('is_active', true)
      .order('display_order');
    
    data = result.data;
    error = result.error;
  }

  if (error) throw error;
  return data?.map(c => c.name) || [];
};

// Get all academic years (school-specific + global fallback)
export const getAcademicYears = async (): Promise<string[]> => {
  const schoolId = await getCurrentEducatorSchoolId();
  
  // First, try to get school-specific academic years
  let { data, error } = await supabase
    .from('curriculum_academic_years')
    .select('year')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('year', { ascending: false });

  // If no school-specific years, get global years
  if (!data || data.length === 0) {
    const result = await supabase
      .from('curriculum_academic_years')
      .select('year')
      .is('school_id', null)
      .eq('is_active', true)
      .order('year', { ascending: false });
    
    data = result.data;
    error = result.error;
  }

  if (error) throw error;
  return data?.map(y => y.year) || [];
};

// Get current academic year (school-specific + global fallback)
export const getCurrentAcademicYear = async (): Promise<string | null> => {
  const schoolId = await getCurrentEducatorSchoolId();
  
  // First, try to get school-specific current year
  let { data, error } = await supabase
    .from('curriculum_academic_years')
    .select('year')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .eq('is_current', true)
    .maybeSingle();

  // If no school-specific current year, get global current year
  if (!data) {
    const result = await supabase
      .from('curriculum_academic_years')
      .select('year')
      .is('school_id', null)
      .eq('is_active', true)
      .eq('is_current', true)
      .maybeSingle();
    
    data = result.data;
    error = result.error;
  }

  if (error) throw error;
  return data?.year || null;
};

// Get current educator's school_id
export const getCurrentEducatorSchoolId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('school_educators')
    .select('id, school_id')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data?.school_id || null;
};

// Get current educator's ID
export const getCurrentEducatorId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('school_educators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data?.id || null;
};

// Get curriculum by subject, class, and academic year
export const getCurriculum = async (
  subject: string,
  className: string,
  academicYear: string
): Promise<Curriculum | null> => {
  const schoolId = await getCurrentEducatorSchoolId();
  if (!schoolId) return null;

  const { data, error } = await supabase
    .from('curriculums')
    .select('*')
    .eq('school_id', schoolId)
    .eq('subject', subject)
    .eq('class', className)
    .eq('academic_year', academicYear)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Create new curriculum
export const createCurriculum = async (
  subject: string,
  className: string,
  academicYear: string
): Promise<Curriculum> => {
  const schoolId = await getCurrentEducatorSchoolId();
  const educatorId = await getCurrentEducatorId();
  
  if (!schoolId || !educatorId) {
    throw new Error('Educator not found');
  }

  const { data, error } = await supabase
    .from('curriculums')
    .insert({
      school_id: schoolId,
      subject,
      class: className,
      academic_year: academicYear,
      status: 'draft',
      created_by: educatorId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update curriculum status
export const updateCurriculumStatus = async (
  curriculumId: string,
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected',
  rejectionReason?: string
): Promise<void> => {
  const updates: any = { status };
  
  if (status === 'approved') {
    const { data: { user } } = await supabase.auth.getUser();
    updates.approved_by = user?.id;
    updates.approval_date = new Date().toISOString();
  }
  
  if (status === 'rejected' && rejectionReason) {
    updates.rejection_reason = rejectionReason;
  }

  const { error } = await supabase
    .from('curriculums')
    .update(updates)
    .eq('id', curriculumId);

  if (error) throw error;
};

// Get chapters for a curriculum
export const getChapters = async (curriculumId: string): Promise<Chapter[]> => {
  const { data, error } = await supabase
    .from('curriculum_chapters')
    .select('*')
    .eq('curriculum_id', curriculumId)
    .order('order_number');

  if (error) throw error;
  return data || [];
};

// Create chapter
export const createChapter = async (
  curriculumId: string,
  chapter: Omit<Chapter, 'id' | 'curriculum_id' | 'created_at'>
): Promise<Chapter> => {
  const { data, error } = await supabase
    .from('curriculum_chapters')
    .insert({
      curriculum_id: curriculumId,
      ...chapter,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update chapter
export const updateChapter = async (
  chapterId: string,
  updates: Partial<Omit<Chapter, 'id' | 'curriculum_id' | 'created_at'>>
): Promise<Chapter> => {
  const { data, error } = await supabase
    .from('curriculum_chapters')
    .update(updates)
    .eq('id', chapterId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete chapter
export const deleteChapter = async (chapterId: string): Promise<void> => {
  const { error } = await supabase
    .from('curriculum_chapters')
    .delete()
    .eq('id', chapterId);

  if (error) throw error;
};

// Get learning outcomes for a curriculum
export const getLearningOutcomes = async (curriculumId: string): Promise<LearningOutcome[]> => {
  const { data, error } = await supabase
    .from('curriculum_learning_outcomes')
    .select(`
      *,
      curriculum_chapters!inner(curriculum_id)
    `)
    .eq('curriculum_chapters.curriculum_id', curriculumId);

  if (error) throw error;
  
  // Fetch assessment mappings for each outcome
  const outcomesWithMappings = await Promise.all(
    (data || []).map(async (outcome) => {
      const { data: mappings } = await supabase
        .from('outcome_assessment_mappings')
        .select(`
          weightage,
          assessment_types(id, name)
        `)
        .eq('learning_outcome_id', outcome.id);

      return {
        ...outcome,
        assessmentMappings: mappings?.map(m => ({
          assessmentType: (m.assessment_types as any)?.name || '',
          assessment_type_id: (m.assessment_types as any)?.id || '',
          weightage: m.weightage,
        })) || [],
      };
    })
  );

  return outcomesWithMappings;
};

// Create learning outcome
export const createLearningOutcome = async (
  chapterId: string,
  outcome: string,
  bloomLevel?: string,
  assessmentMappings?: AssessmentMapping[]
): Promise<LearningOutcome> => {
  const { data, error } = await supabase
    .from('curriculum_learning_outcomes')
    .insert({
      chapter_id: chapterId,
      outcome,
      bloom_level: bloomLevel,
    })
    .select()
    .single();

  if (error) throw error;

  // Create assessment mappings
  if (assessmentMappings && assessmentMappings.length > 0) {
    const mappingsToInsert = assessmentMappings.map(mapping => ({
      learning_outcome_id: data.id,
      assessment_type_id: mapping.assessment_type_id,
      weightage: mapping.weightage,
    }));

    const { error: mappingError } = await supabase
      .from('outcome_assessment_mappings')
      .insert(mappingsToInsert);

    if (mappingError) throw mappingError;
  }

  return { ...data, assessmentMappings };
};

// Update learning outcome
export const updateLearningOutcome = async (
  outcomeId: string,
  outcome: string,
  bloomLevel?: string,
  assessmentMappings?: AssessmentMapping[]
): Promise<LearningOutcome> => {
  const { data, error } = await supabase
    .from('curriculum_learning_outcomes')
    .update({
      outcome,
      bloom_level: bloomLevel,
    })
    .eq('id', outcomeId)
    .select()
    .single();

  if (error) throw error;

  // Delete existing mappings
  await supabase
    .from('outcome_assessment_mappings')
    .delete()
    .eq('learning_outcome_id', outcomeId);

  // Create new mappings
  if (assessmentMappings && assessmentMappings.length > 0) {
    const mappingsToInsert = assessmentMappings.map(mapping => ({
      learning_outcome_id: outcomeId,
      assessment_type_id: mapping.assessment_type_id,
      weightage: mapping.weightage,
    }));

    const { error: mappingError } = await supabase
      .from('outcome_assessment_mappings')
      .insert(mappingsToInsert);

    if (mappingError) throw mappingError;
  }

  return { ...data, assessmentMappings };
};

// Delete learning outcome
export const deleteLearningOutcome = async (outcomeId: string): Promise<void> => {
  const { error } = await supabase
    .from('curriculum_learning_outcomes')
    .delete()
    .eq('id', outcomeId);

  if (error) throw error;
};

// Validate curriculum before submission
export const validateCurriculum = async (curriculumId: string): Promise<{
  isValid: boolean;
  errors: string[];
}> => {
  const { data, error } = await supabase
    .rpc('validate_curriculum', { p_curriculum_id: curriculumId });

  if (error) throw error;

  const result = data?.[0] || { is_valid: false, validation_errors: [] };
  
  return {
    isValid: result.is_valid,
    errors: result.validation_errors.map((e: any) => e.message),
  };
};

// Copy curriculum template
export const copyCurriculumTemplate = async (
  sourceCurriculumId: string,
  targetSubject: string,
  targetClass: string,
  targetAcademicYear: string
): Promise<string> => {
  const schoolId = await getCurrentEducatorSchoolId();
  const educatorId = await getCurrentEducatorId();
  
  if (!schoolId || !educatorId) {
    throw new Error('Educator not found');
  }

  const { data, error } = await supabase
    .rpc('copy_curriculum_template', {
      p_source_curriculum_id: sourceCurriculumId,
      p_target_school_id: schoolId,
      p_target_subject: targetSubject,
      p_target_class: targetClass,
      p_target_academic_year: targetAcademicYear,
      p_created_by: educatorId,
    });

  if (error) throw error;
  return data;
};
