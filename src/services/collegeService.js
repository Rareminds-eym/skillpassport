import { supabase } from '../lib/supabaseClient';

/**
 * College Service
 * Handles college-related database operations
 */

/**
 * Create a new college record
 * @param {Object} collegeData - College data to insert
 * @param {string} userId - User ID of the college admin
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createCollege = async (collegeData, userId = null) => {
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
            .from('colleges')
            .insert([{
                ...collegeData,
                created_by: uid,
                updated_by: uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating college:', error);
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
        console.error('❌ Unexpected error creating college:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};

/**
 * Check if a college code is unique
 * @param {string} code - College code to check
 * @returns {Promise<{ isUnique: boolean, error: string | null }>}
 */
export const checkCollegeCode = async (code) => {
    try {
        const { data, error } = await supabase
            .from('colleges')
            .select('id')
            .eq('code', code)
            .maybeSingle();

        if (error) {
            console.error('Error checking college code:', error);
            return { isUnique: false, error: error.message };
        }

        return {
            isUnique: !data,
            error: null
        };
    } catch (error) {
        console.error('Unexpected error checking college code:', error);
        return { isUnique: false, error: error.message };
    }
};

/**
 * Get college details by owner (created_by)
 * @param {string} userId - User ID of the owner
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getCollegeByOwner = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('colleges')
            .select('*')
            .eq('created_by', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching college by owner:', error);
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
        console.error('Unexpected error fetching college by owner:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};
