import { EducatorContext } from '@/features/student-profile/model';
import { EducatorWithSchool } from '@/shared/types/database';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('EducatorContextBuilder');

/**
 * Build educator context for AI prompts
 * Fetches real data from school_educators and schools tables
 * Uses only necessary columns for AI context
 */
export const buildEducatorContext = async (educatorId: string): Promise<EducatorContext> => {
  try {

    // Fetch educator profile with school details (only necessary columns)
    const { data: educator, error: educatorError } = await supabase
      .from('school_educators')
      .select(`
        id,
        user_id,
        school_id,
        first_name,
        last_name,
        email,
        designation,
        department,
        specialization,
        qualification,
        experience_years,
        subjects_handled,
        account_status,
        schools (
          id,
          name,
          code,
          city,
          state,
          board
        )
      `)
      .eq('user_id', educatorId)
      .eq('account_status', 'active')
      .single();

    if (educatorError) {
      logger.error('Failed to fetch educator from school_educators table', educatorError as Error);
      return buildFallbackContext();
    }

    if (!educator) {
      logger.error('No educator data returned from query', new Error('Empty response'));
      return buildFallbackContext();
    }

    const educatorData = educator as any as EducatorWithSchool;
    
    // Build full name
    const fullName = [
      educatorData.first_name,
      educatorData.last_name
    ].filter(Boolean).join(' ') || 'Educator';

    // Get institution details
    const institution = educatorData.schools?.name || 'Your Institution';
    const institutionDetails = [
      educatorData.schools?.city,
      educatorData.schools?.state
    ].filter(Boolean).join(', ');

    // Get subjects taught (from subjects_handled array)
    const subjects_taught = educatorData.subjects_handled || [];

    // Count students taught by this educator (from students table)
    const { count: studentCount, error: countError } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('universityId', educatorData.school_id);

    if (countError) {
      logger.error('Failed to count students', countError as Error);
    }

    // Build rich context for AI
    const context: EducatorContext = {
      name: fullName,
      institution: institutionDetails ? `${institution} (${institutionDetails})` : institution,
      department: educatorData.department || undefined,
      total_students: studentCount || 0,
      active_classes: 1, // Can be enhanced if class data is tracked
      subjects_taught: subjects_taught,
      recent_activities: [
        // Add context-rich activity information
        ...(educatorData.designation ? [`Role: ${educatorData.designation}`] : []),
        ...(educatorData.specialization ? [`Specialization: ${educatorData.specialization}`] : []),
        ...(educatorData.qualification ? [`Qualification: ${educatorData.qualification}`] : []),
        ...(educatorData.experience_years ? [`Experience: ${educatorData.experience_years} years`] : []),
        ...(educatorData.schools?.board ? [`Board: ${educatorData.schools.board}`] : [])
      ].filter(Boolean)
    };


    return context;
  } catch (error) {
    logger.error('Failed to build educator context', error as Error);
    return buildFallbackContext();
  }
};

/**
 * Fallback context when database fetch fails
 */
function buildFallbackContext(): EducatorContext {
  return {
    name: 'Educator',
    institution: 'Your Institution',
    total_students: 0,
    active_classes: 0,
    subjects_taught: [],
    recent_activities: []
  };
}

/**
 * Extract class summary for AI context
 */
export const buildClassContext = (classId: string): Promise<any> => {
  // TODO: Implement class data fetching
  return Promise.resolve({
    id: classId,
    name: 'Class',
    total_students: 0,
    active_students: 0,
    skill_distribution: [],
    career_interests: []
  });
};

/**
 * Extract student summary for AI context
 */
export const buildStudentContext = (studentId: string): Promise<any> => {
  // TODO: Implement student data fetching
  return Promise.resolve({
    id: studentId,
    name: 'Student',
    skills: [],
    projects: [],
    career_interests: [],
    engagement_level: 'unknown'
  });
};
