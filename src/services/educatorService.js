import { supabase } from '../lib/supabaseClient';

/**
 * Get the current logged-in educator's school_educator record
 * @returns {Promise<{data: object | null, error: string | null}>}
 */
export const getCurrentEducator = async () => {
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    if (!user) {
      return { data: null, error: 'No authenticated user found' };
    }

    // Get the educator record from school_educators table
    const { data, error } = await supabase
      .from('school_educators')
      .select('id, user_id, school_id, employee_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching educator:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getCurrentEducator:', error);
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
