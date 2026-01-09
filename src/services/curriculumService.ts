import { supabase } from '@/lib/supabaseClient';

export { supabase };

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
  try {
    const schoolId = await getCurrentEducatorSchoolId();
    
    let query = supabase
      .from('assessment_types')
      .select('*')
      .eq('is_active', true);
    
    if (schoolId) {
      query = query.eq('institution_id', schoolId).eq('institution_type', 'school');
    }
    
    const { data, error } = await query.order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assessment types:', error);
    return [];
  }
};

// Get all subjects (school-specific + global fallback)
export const getSubjects = async (): Promise<string[]> => {
  try {
    const schoolId = await getCurrentEducatorSchoolId();
    
    if (!schoolId) {
      // Try to get global subjects as fallback
      const { data: globalData, error: globalError } = await supabase
        .from('curriculum_subjects')
        .select('name')
        .is('school_id', null)
        .eq('is_active', true)
        .order('display_order');

      if (globalError) throw globalError;
      return globalData?.map(s => s.name) || [];
    }
    
    // First, try to get school-specific subjects
    const { data: schoolData, error: schoolError } = await supabase
      .from('curriculum_subjects')
      .select('name')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('display_order');

    if (schoolError) {
      console.error('Error fetching school subjects:', schoolError);
    }

    // If we have school-specific subjects, return them
    if (schoolData && schoolData.length > 0) {
      return schoolData.map(s => s.name);
    }

    // Otherwise, get global subjects
    const { data: globalData, error: globalError } = await supabase
      .from('curriculum_subjects')
      .select('name')
      .is('school_id', null)
      .eq('is_active', true)
      .order('display_order');

    if (globalError) throw globalError;
    return globalData?.map(s => s.name) || [];
  } catch (error) {
    console.error('Error in getSubjects:', error);
    throw error;
  }
};

// Get all classes (from school_classes.grade field + curriculum_classes fallback)
export const getClasses = async (): Promise<string[]> => {
  try {
    const schoolId = await getCurrentEducatorSchoolId();
    
    if (schoolId) {
      // Get unique grades from school_classes for this school
      const { data: schoolClassesData, error: schoolError } = await supabase
        .from('school_classes')
        .select('grade')
        .eq('school_id', schoolId)
        .order('grade');

      if (schoolError) {
        console.error('Error fetching school classes:', schoolError);
      } else if (schoolClassesData && schoolClassesData.length > 0) {
        // Get unique grades and sort them
        const uniqueGrades = [...new Set(schoolClassesData.map(c => c.grade))];
        return uniqueGrades.sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.localeCompare(b);
        });
      }
      
      // Fallback 1: Try curriculum_classes for this school
      const { data: schoolCurrData, error: schoolCurrError } = await supabase
        .from('curriculum_classes')
        .select('name')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('display_order');

      if (schoolCurrError) {
        console.error('Error fetching school curriculum classes:', schoolCurrError);
      } else if (schoolCurrData && schoolCurrData.length > 0) {
        return schoolCurrData.map(c => c.name);
      }
    }

    // Fallback: Get global curriculum_classes
    const { data: globalData, error: globalError } = await supabase
      .from('curriculum_classes')
      .select('name')
      .is('school_id', null)
      .eq('is_active', true)
      .order('display_order');

    if (globalError) throw globalError;
    return globalData?.map(c => c.name) || [];
  } catch (error) {
    console.error('Error in getClasses:', error);
    throw error;
  }
};

// Get all academic years (school-specific + global fallback)
export const getAcademicYears = async (): Promise<string[]> => {
  try {
    const schoolId = await getCurrentEducatorSchoolId();
    
    if (!schoolId) {
      // Get global years
      const { data: globalData, error: globalError } = await supabase
        .from('curriculum_academic_years')
        .select('year')
        .is('school_id', null)
        .eq('is_active', true)
        .order('year', { ascending: false });

      if (globalError) throw globalError;
      return globalData?.map(y => y.year) || [];
    }
    
    // First, try to get school-specific academic years
    const { data: schoolData, error: schoolError } = await supabase
      .from('curriculum_academic_years')
      .select('year')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('year', { ascending: false });

    if (schoolError) {
      console.error('Error fetching school academic years:', schoolError);
    }

    // If we have school-specific years, return them
    if (schoolData && schoolData.length > 0) {
      return schoolData.map(y => y.year);
    }

    // Otherwise, get global years
    const { data: globalData, error: globalError } = await supabase
      .from('curriculum_academic_years')
      .select('year')
      .is('school_id', null)
      .eq('is_active', true)
      .order('year', { ascending: false });

    if (globalError) throw globalError;
    return globalData?.map(y => y.year) || [];
  } catch (error) {
    console.error('Error in getAcademicYears:', error);
    throw error;
  }
};

// Get current academic year (school-specific + global fallback)
export const getCurrentAcademicYear = async (): Promise<string | null> => {
  try {
    const schoolId = await getCurrentEducatorSchoolId();
    
    if (schoolId) {
      // First, try to get school-specific current year
      const { data: schoolData, error: schoolError } = await supabase
        .from('curriculum_academic_years')
        .select('year')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .eq('is_current', true)
        .maybeSingle();

      if (schoolError) {
        console.error('Error fetching school current year:', schoolError);
      }

      // If we have a school-specific current year, return it
      if (schoolData) {
        return schoolData.year;
      }
    }

    // Otherwise, get global current year
    const { data: globalData, error: globalError } = await supabase
      .from('curriculum_academic_years')
      .select('year')
      .is('school_id', null)
      .eq('is_active', true)
      .eq('is_current', true)
      .maybeSingle();

    if (globalError) {
      console.error('Error fetching global current year:', globalError);
      // Don't throw here, just return null
      return null;
    }

    return globalData?.year || null;
  } catch (error) {
    console.error('Error in getCurrentAcademicYear:', error);
    return null;
  }
};

// Get current educator's school_id (works for both school_educator and school_admin roles)
export const getCurrentEducatorSchoolId = async (): Promise<string | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) return null;

    // First, check if user is a school_educator
    const { data: educatorData, error: educatorError } = await supabase
      .from('school_educators')
      .select('id, school_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (educatorError) {
      console.error('Error fetching school educator:', educatorError);
    }

    if (educatorData && educatorData.school_id) {
      return educatorData.school_id;
    }

    // If not a school_educator, check if user is school_admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role === 'school_admin') {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('organization_type', 'school')
        .eq('admin_id', user.id)
        .maybeSingle();

      if (orgError) {
        console.error('Error fetching organization for admin:', orgError);
      }

      if (orgData) {
        return orgData.id;
      }
    }

    return null;
  } catch (error) {
    console.error('Error in getCurrentEducatorSchoolId:', error);
    return null;
  }
};

// Get current educator's ID (returns user_id for curriculum creation)
export const getCurrentEducatorId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Return the user_id directly since curriculums.created_by references users.id
  return user.id;
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
  try {
    const { data, error } = await supabase
      .rpc('validate_curriculum', { p_curriculum_id: curriculumId });

    if (error) {
      console.error('Validation RPC error:', error);
      throw error;
    }

    // Handle different response formats
    let result;
    if (Array.isArray(data)) {
      result = data[0] || { is_valid: false, validation_errors: [] };
    } else if (data && typeof data === 'object') {
      result = data;
    } else {
      result = { is_valid: false, validation_errors: [] };
    }
    
    return {
      isValid: result.is_valid || false,
      errors: Array.isArray(result.validation_errors) 
        ? result.validation_errors.map((e: any) => typeof e === 'string' ? e : e.message || String(e))
        : [],
    };
  } catch (error) {
    console.error('Error in validateCurriculum:', error);
    // Return a basic validation result instead of throwing
    return {
      isValid: false,
      errors: ['Validation service unavailable. Please ensure you have added chapters and learning outcomes.'],
    };
  }
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
