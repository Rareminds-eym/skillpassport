import { EducatorContext } from '../types';
import { EducatorWithSchool } from '../types/database';
import { supabase } from '../../../lib/supabaseClient';

/**
 * Build educator context for AI prompts
 * Fetches real data from school_educators and schools tables
 * Uses only necessary columns for AI context
 */
export const buildEducatorContext = async (educatorId: string): Promise<EducatorContext> => {
  try {
    console.log('🔍 Fetching educator context for:', educatorId);

    // Fetch educator profile with school details (only necessary columns)
    const { data: educator, error: educatorError } = await supabase
      .from('school_educators')
      .select(
        `
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
      `
      )
      .eq('user_id', educatorId)
      .eq('account_status', 'active')
      .single();

    if (educatorError) {
      console.warn(
        '⚠️ Educator not found in school_educators table, using fallback:',
        educatorError.message
      );
      return buildFallbackContext();
    }

    if (!educator) {
      console.warn('⚠️ No educator data returned');
      return buildFallbackContext();
    }

    const educatorData = educator as any as EducatorWithSchool;

    // Build full name
    const fullName =
      [educatorData.first_name, educatorData.last_name].filter(Boolean).join(' ') || 'Educator';

    // Get institution details
    const institution = educatorData.schools?.name || 'Your Institution';
    const institutionDetails = [educatorData.schools?.city, educatorData.schools?.state]
      .filter(Boolean)
      .join(', ');

    // Get subjects taught (from subjects_handled array)
    const subjects_taught = educatorData.subjects_handled || [];

    // Count students taught by this educator (from students table)
    const { count: studentCount, error: countError } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('universityId', educatorData.school_id);

    if (countError) {
      console.warn('⚠️ Error counting students:', countError.message);
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
        ...(educatorData.experience_years
          ? [`Experience: ${educatorData.experience_years} years`]
          : []),
        ...(educatorData.schools?.board ? [`Board: ${educatorData.schools.board}`] : []),
      ].filter(Boolean),
    };

    console.log('✅ Educator context built successfully:', {
      name: context.name,
      institution: context.institution,
      department: context.department,
      total_students: context.total_students,
      subjects_count: context.subjects_taught.length,
    });

    return context;
  } catch (error) {
    console.error('❌ Error building educator context:', error);
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
    recent_activities: [],
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
    career_interests: [],
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
    engagement_level: 'unknown',
  });
};
