import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('educator-service');

/**
 * Get the current logged-in educator's record (school_educator or college_lecturer)
 * @returns {Promise<{data: object | null, error: string | null}>}
 */
export const getCurrentEducator = async () => {
  try {
    // Get current authenticated user
    const user = useAuthStore.getState().user;
    const authError = null;
    
    if (authError) throw authError;
    if (!user) {
      return { data: null, error: 'No authenticated user found' };
    }

    // First check school_educators table
    const { data: schoolEducatorData, error: schoolError } = await supabase
      .from('school_educators')
      .select('id, user_id, school_id, employee_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (schoolError && schoolError.code !== 'PGRST116') {
      logger.error('Fetch school educator failed', new Error(schoolError.message), { userId: user.id });
      return { data: null, error: schoolError.message };
    }

    if (schoolEducatorData) {
      return { data: { ...schoolEducatorData, type: 'school' }, error: null };
    }

    // If not found in school_educators, check college_lecturers table
    const { data: collegeLecturerData, error: collegeError } = await supabase
      .from('college_lecturers')
      .select('id, user_id, collegeId, department')
      .eq('user_id', user.id)
      .maybeSingle();

    if (collegeError && collegeError.code !== 'PGRST116') {
      logger.error('Fetch college lecturer failed', new Error(collegeError.message), { userId: user.id });
      return { data: null, error: collegeError.message };
    }

    if (collegeLecturerData) {
      return { 
        data: { 
          ...collegeLecturerData, 
          school_id: collegeLecturerData.collegeId, // Normalize field name
          type: 'college' 
        }, 
        error: null 
      };
    }

    // Not found in either table
    return { data: null, error: 'Educator record not found' };
  } catch (error) {
    logger.error('Get current educator exception', error instanceof Error ? error : new Error(String(error)));
    return {
      data: null,
      error: error?.message || 'Failed to fetch educator information'
    };
  }
};

/**
 * Get educator ID for the current logged-in user
 * @returns {Promise<string | null>} The school_educator.id or null
 */
export const getCurrentEducatorId = async () => {
  const { data } = await getCurrentEducator();
  return data?.id || null;
};
