import { supabase } from '../lib/supabaseClient';

/**
 * School Service
 * Handles school-related database operations using the unified organizations table
 */

/**
 * Create a new school record in the organizations table
 * @param {Object} schoolData - School data to insert
 * @param {string} userId - User ID of the school admin
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createSchool = async (schoolData, userId = null) => {
  try {
    let uid = userId;

    // If userId not provided, try to get from current session
    if (!uid) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        uid = user.id;
      }
    }

    if (!uid) {
      throw new Error('User not authenticated');
    }

    // Map school data to organizations table structure
    const orgData = {
      name: schoolData.name,
      organization_type: 'school',
      admin_id: uid,
      email: schoolData.email,
      phone: schoolData.phone,
      address: schoolData.address,
      city: schoolData.city,
      state: schoolData.state,
      country: schoolData.country || 'India',
      website: schoolData.website,
      description: schoolData.description,
      approval_status: 'approved',
      account_status: 'active',
      is_active: true,
    };

    const { data, error } = await supabase
      .from('organizations')
      .insert([orgData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating school:', error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data,
      error: null,
    };
  } catch (error) {
    console.error('❌ Unexpected error creating school:', error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Check if a school name is unique (within school organization type)
 * @param {string} name - School name to check
 * @returns {Promise<{ isUnique: boolean, error: string | null }>}
 */
export const checkSchoolCode = async (name) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('organization_type', 'school')
      .ilike('name', name)
      .maybeSingle();

    if (error) {
      console.error('Error checking school name:', error);
      return { isUnique: false, error: error.message };
    }

    return {
      isUnique: !data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error checking school name:', error);
    return { isUnique: false, error: error.message };
  }
};

/**
 * Get school details by owner (admin_id) from organizations table
 * @param {string} userId - User ID of the owner
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getSchoolByOwner = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_type', 'school')
      .eq('admin_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching school by owner:', error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching school by owner:', error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Get school by ID from organizations table
 * @param {string} schoolId - School ID
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getSchoolById = async (schoolId) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', schoolId)
      .eq('organization_type', 'school')
      .single();

    if (error) {
      console.error('Error fetching school by ID:', error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching school by ID:', error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Get all schools from organizations table
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getAllSchools = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_type', 'school')
      .order('name');

    if (error) {
      console.error('Error fetching schools:', error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching schools:', error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Get school by email from organizations table
 * @param {string} email - School email
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getSchoolByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_type', 'school')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching school by email:', error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching school by email:', error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};
