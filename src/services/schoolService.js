import { supabase } from '../lib/supabaseClient';

/**
 * School Service
 * Handles school-related database operations
 */

/**
 * Create a new school record
 * @param {Object} schoolData - School data to insert
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createSchool = async (schoolData, userId = null) => {
    try {
        let uid = userId;

        // If userId not provided, try to get from current session
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
            .from('schools')
            .insert([{
                ...schoolData,
                created_by: uid,
                updated_by: uid,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating school:', error);
            return {
                success: false,
                data: null,
                error: error.message
            };
        }

        return {
            success: true,
            data: data,
            error: null
        };
    } catch (error) {
        console.error('❌ Unexpected error creating school:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};

/**
 * Check if a school code is unique
 * @param {string} code - School code to check
 * @returns {Promise<{ isUnique: boolean, error: string | null }>}
 */
export const checkSchoolCode = async (code) => {
    try {
        const { data, error } = await supabase
            .from('schools')
            .select('id')
            .eq('code', code)
            .maybeSingle();

        if (error) {
            console.error('Error checking school code:', error);
            return { isUnique: false, error: error.message };
        }

        return {
            isUnique: !data,
            error: null
        };
    } catch (error) {
        console.error('Unexpected error checking school code:', error);
        return { isUnique: false, error: error.message };
    }
};

/**
 * Get school details by owner (created_by)
 * @param {string} userId - User ID of the owner
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getSchoolByOwner = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('schools')
            .select('*')
            .eq('created_by', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching school by owner:', error);
            return {
                success: false,
                data: null,
                error: error.message
            };
        }

        return {
            success: true,
            data: data,
            error: null
        };
    } catch (error) {
        console.error('Unexpected error fetching school by owner:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};
