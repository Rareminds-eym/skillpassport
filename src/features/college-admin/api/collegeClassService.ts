import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('college-class-service');

export interface CollegeClassInfo {
  id: string; // This is the learner ID, not program_section_id
  program_id: string;
  program_name: string;
  program_code: string;
  department_name: string;
  semester: number;
  section?: string;
  academic_year?: string;
  college_name?: string;
  current_learners: number;
  max_learners?: number;
  college_id?: string;
  program_section_id?: string; // Add this field
}

export interface CollegeClassmate {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  semester: number;
  roll_number?: string;
  admission_number?: string;
}

/**
 * Get college learner's class information including program, department, and college details
 */
export const getCollegeLearnerClassInfo = async (learnerId: string): Promise<CollegeClassInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('learners')
      .select(`
        id,
        program_id,
        semester,
        program_section_id,
        college_id,
        programs (
          id,
          name,
          code,
          departments (
            id,
            name
          )
        ),
        program_sections (
          id,
          section,
          academic_year,
          current_learners,
          max_learners,
          semester
        )
      `)
      .eq('id', learnerId)
      .single();

    if (error) {
      logger.error('Failed to fetch college class info', error instanceof Error ? error : new Error(String(error)), {
        learnerId
      });
      return null;
    }

    if (!data || !data.program_id) {
      return null;
    }

    const program = Array.isArray(data.programs) ? data.programs[0] : data.programs;
    const department = program?.departments ? 
      (Array.isArray(program.departments) ? program.departments[0] : program.departments) : null;
    const programSection = Array.isArray(data.program_sections) ? data.program_sections[0] : data.program_sections;

    // Determine the actual semester - use program_section semester if learner semester is null
    const actualSemester = data.semester || programSection?.semester || 1;

    // Get college name if college_id exists
    let collegeName = '';
    if (data.college_id) {
      const { data: collegeData } = await supabase
        .from('colleges')
        .select('name')
        .eq('id', data.college_id)
        .single();
      
      collegeName = collegeData?.name || '';
    }

    // Calculate actual current learners count for college learners only
    let actualCurrentlearners = 0;
    if (data.program_section_id) {
      const { count } = await supabase
        .from('learners')
        .select('id', { count: 'exact' })
        .eq('program_section_id', data.program_section_id)
        .not('is_deleted', 'is', true)
        .not('is_deleted', 'eq', true);
      
      // Filter by college learners only
      const { data: learnersData } = await supabase
        .from('learners')
        .select(`
          id,
          users!inner (
            role
          )
        `)
        .eq('program_section_id', data.program_section_id)
        .eq('users.role', 'learner')
        .not('is_deleted', 'is', true);
      
      actualCurrentlearners = learnersData?.length || 0;
    }

    return {
      id: data.id,
      program_id: data.program_id,
      program_name: program?.name || 'Unknown Program',
      program_code: program?.code || 'N/A',
      department_name: department?.name || 'Unknown Department',
      semester: actualSemester,
      section: programSection?.section || undefined,
      academic_year: programSection?.academic_year || undefined,
      college_name: collegeName,
      current_learners: actualCurrentlearners,
      max_learners: programSection?.max_learners || 0,
      college_id: data.college_id || undefined,
      program_section_id: data.program_section_id || undefined,
    };
  } catch (error) {
    logger.error('Failed to get college learner class info', error instanceof Error ? error : new Error(String(error)), {
      learnerId
    });
    return null;
  }
};

/**
 * Get college classmates based on program, semester, and section
 */
export const getCollegeClassmates = async (
  programId: string, 
  semester: number, 
  programSectionId?: string, 
  currentLearnerId?: string
): Promise<CollegeClassmate[]> => {
  try {
    let query = supabase
      .from('learners')
      .select(`
        id,
        name,
        email,
        profilePicture,
        semester,
        roll_number,
        admission_number,
        program_section_id,
        users!inner (
          role
        )
      `)
      .eq('program_id', programId)
      .eq('users.role', 'learner');

    // Exclude current learner
    if (currentLearnerId) {
      query = query.neq('id', currentLearnerId);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch college classmates', error instanceof Error ? error : new Error(String(error)), {
        programId,
        semester
      });
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Filter classmates based on program section and semester logic
    const filteredClassmates = data.filter(learner => {
      // If current learner has a program_section_id, find others in the same section
      if (programSectionId) {
        return learner.program_section_id === programSectionId;
      }
      
      // If current learner has no program_section_id, find others with same semester or no section
      // This handles cases where semester might be null but they're in the same program
      const learnerSemester = learner.semester || semester; // Use provided semester as fallback
      return learnerSemester === semester && !learner.program_section_id;
    });

    return filteredClassmates.map(learner => ({
      id: learner.id,
      name: learner.name || 'Unknown',
      email: learner.email,
      profilePicture: learner.profilePicture,
      semester: learner.semester || semester,
      roll_number: learner.roll_number,
      admission_number: learner.admission_number,
    }));
  } catch (error) {
    logger.error('Failed to get college classmates', error instanceof Error ? error : new Error(String(error)), {
      programId,
      semester
    });
    return [];
  }
};

/**
 * Check if a learner is a college learner based on their user role
 */
export const isCollegeLearner = async (learnerId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('learners')
      .select(`
        users!inner (
          role
        )
      `)
      .eq('id', learnerId)
      .single();

    if (error) {
      logger.error('Failed to check learner type', error instanceof Error ? error : new Error(String(error)), {
        learnerId
      });
      return false;
    }

    const user = Array.isArray(data.users) ? data.users[0] : data.users;
    return user?.role === 'learner';
  } catch (error) {
    logger.error('Failed to check if learner is college learner', error instanceof Error ? error : new Error(String(error)), {
      learnerId
    });
    return false;
  }
};

/**
 * Get college learner type and basic info for routing decisions
 */
export const getlearnerTypeInfo = async (learnerId: string): Promise<{
  isCollege: boolean;
  isSchool: boolean;
  hasProgram: boolean;
  hasClass: boolean;
}> => {
  try {
    const { data, error } = await supabase
      .from('learners')
      .select(`
        program_id,
        school_class_id,
        users!inner (
          role
        )
      `)
      .eq('id', learnerId)
      .single();

    if (error) {
      logger.error('Failed to get learner type info', error instanceof Error ? error : new Error(String(error)), {
        learnerId
      });
      return { isCollege: false, isSchool: false, hasProgram: false, hasClass: false };
    }

    const user = Array.isArray(data.users) ? data.users[0] : data.users;
    const role = user?.role;

    return {
      isCollege: role === 'learner',
      isSchool: role === 'learner',
      hasProgram: !!data.program_id,
      hasClass: !!data.school_class_id,
    };
  } catch (error) {
    logger.error('Failed to get learner type info', error instanceof Error ? error : new Error(String(error)), {
      learnerId
    });
    return { isCollege: false, isSchool: false, hasProgram: false, hasClass: false };
  }
};