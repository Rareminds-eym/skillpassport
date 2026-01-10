import { supabase } from '../lib/supabaseClient';

/**
 * University Service
 * Handles university-related database operations using the unified organizations table
 */

/**
 * Get all universities for dropdown selection from organizations table
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getUniversities = async () => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('organization_type', 'university')
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ Error fetching universities:', error);
            return { success: false, data: null, error: error.message };
        }

        return { success: true, data: data || [], error: null };
    } catch (error) {
        console.error('❌ Unexpected error fetching universities:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Get university by ID from organizations table
 * @param {string} universityId - University UUID
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getUniversityById = async (universityId) => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', universityId)
            .eq('organization_type', 'university')
            .maybeSingle();

        if (error) {
            console.error('❌ Error fetching university:', error);
            return { success: false, data: null, error: error.message };
        }

        return { success: true, data, error: null };
    } catch (error) {
        console.error('❌ Unexpected error fetching university:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Get university by owner (admin_id) from organizations table
 * @param {string} userId - User ID of the owner
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getUniversityByOwner = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('organization_type', 'university')
            .eq('admin_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching university by owner:', error);
            return { success: false, data: null, error: error.message };
        }

        return { success: true, data, error: null };
    } catch (error) {
        console.error('Unexpected error fetching university by owner:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Create a new university in the organizations table
 * @param {Object} universityData - University data to insert
 * @param {string} userId - User ID of the admin
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createUniversity = async (universityData, userId = null) => {
    try {
        let uid = userId;

        if (!uid) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                uid = user.id;
            }
        }

        if (!uid) {
            throw new Error('User not authenticated');
        }

        const orgData = {
            name: universityData.name,
            organization_type: 'university',
            admin_id: uid,
            email: universityData.email,
            phone: universityData.phone,
            state: universityData.state,
            website: universityData.website,
            description: universityData.description,
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
            console.error('❌ Error creating university:', error);
            return { success: false, data: null, error: error.message };
        }

        return { success: true, data, error: null };
    } catch (error) {
        console.error('❌ Unexpected error creating university:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Check if a university college code is unique within a university
 * @param {string} universityId - University UUID
 * @param {string} code - College code to check
 * @returns {Promise<{ isUnique: boolean, error: string | null }>}
 */
export const checkUniversityCollegeCode = async (universityId, code) => {
    try {
        const { data, error } = await supabase
            .from('university_colleges')
            .select('id')
            .eq('university_id', universityId)
            .eq('code', code)
            .maybeSingle();

        if (error) {
            console.error('Error checking college code:', error);
            return { isUnique: false, error: error.message };
        }

        return { isUnique: !data, error: null };
    } catch (error) {
        console.error('Unexpected error checking college code:', error);
        return { isUnique: false, error: error.message };
    }
};

/**
 * Create a new university college record
 * @param {Object} collegeData - College data to insert
 * @param {string} userId - User ID of the admin
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createUniversityCollege = async (collegeData, userId = null) => {
    try {
        let uid = userId;

        if (!uid) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                uid = user.id;
            }
        }

        if (!uid) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('university_colleges')
            .insert([{
                ...collegeData,
                created_by: uid,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating university college:', error);
            return { success: false, data: null, error: error.message };
        }

        return { success: true, data, error: null };
    } catch (error) {
        console.error('❌ Unexpected error creating university college:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Get university college by owner (created_by)
 * @param {string} userId - User ID of the owner
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getUniversityCollegeByOwner = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('university_colleges')
            .select(`
                *,
                universities:organizations!university_id (
                    id,
                    name
                )
            `)
            .eq('created_by', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching university college by owner:', error);
            return { success: false, data: null, error: error.message };
        }

        return { success: true, data, error: null };
    } catch (error) {
        console.error('Unexpected error fetching university college by owner:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Get all colleges under a university
 * @param {string} universityId - University UUID
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getCollegesByUniversity = async (universityId) => {
    try {
        const { data, error } = await supabase
            .from('university_colleges')
            .select('id, name, code')
            .eq('university_id', universityId)
            .eq('account_status', 'active')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching colleges by university:', error);
            return { success: false, data: null, error: error.message };
        }

        return { success: true, data: data || [], error: null };
    } catch (error) {
        console.error('Unexpected error fetching colleges by university:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Get all active universities for student registration dropdown from organizations table
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getActiveUniversities = async () => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('organization_type', 'university')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ Error fetching active universities:', error);
            return { success: false, data: null, error: error.message };
        }

        return { success: true, data: data || [], error: null };
    } catch (error) {
        console.error('❌ Unexpected error fetching active universities:', error);
        return { success: false, data: null, error: error.message };
    }
};

