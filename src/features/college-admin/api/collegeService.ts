import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('college-service');

/**
 * College Service
 * Handles college-related database operations using the unified organizations table
 */

/**
 * Create a new college record in the organizations table
 * @param {Object} collegeData - College data to insert
 * @param {string} userId - User ID of the college admin
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createCollege = async (collegeData, userId = null) => {
    try {
        let uid = userId;

        // If userId not provided, try to get from current session
        if (!uid) {
            const { data: { user } } = getCurrentUser();
            if (user) {
                uid = user.id;
            }
        }

        if (!uid) {
            throw new Error('User not authenticated');
        }

        // Map college data to organizations table structure
        const orgData = {
            name: collegeData.name,
            organization_type: 'college',
            admin_id: uid,
            email: collegeData.email,
            phone: collegeData.phone,
            address: collegeData.address,
            city: collegeData.city,
            state: collegeData.state,
            country: collegeData.country || 'India',
            website: collegeData.website,
            description: collegeData.description,
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
            logger.error('Failed to create college', error instanceof Error ? error : new Error(String(error)), {
                collegeName: collegeData.name,
                userId: uid
            });
            return {
                success: false,
                data: null,
                error: (error as any).message
            };
        }

        return {
            success: true,
            data: data,
            error: null
        };
    } catch (error) {
        logger.error('Failed to create college', error instanceof Error ? error : new Error(String(error)), {
            collegeName: collegeData.name
        });
        return {
            success: false,
            data: null,
            error: (error as any).message
        };
    }
};

/**
 * Check if a college name is unique (within college organization type)
 * @param {string} name - College name to check
 * @returns {Promise<{ isUnique: boolean, error: string | null }>}
 */
export const checkCollegeCode = async (name) => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', 'college')
            .ilike('name', name)
            .maybeSingle();

        if (error) {
            logger.error('Failed to check college name', error instanceof Error ? error : new Error(String(error)), {
                collegeName: name
            });
            return { isUnique: false, error: (error as any).message };
        }

        return {
            isUnique: !data,
            error: null
        };
    } catch (error) {
        logger.error('Failed to check college name', error instanceof Error ? error : new Error(String(error)), {
            collegeName: name
        });
        return { isUnique: false, error: (error as any).message };
    }
};

/**
 * Get college details by owner (admin_id) from organizations table
 * @param {string} userId - User ID of the owner
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getCollegeByOwner = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('organization_type', 'college')
            .eq('admin_id', userId)
            .maybeSingle();

        if (error) {
            logger.error('Failed to fetch college by owner', error instanceof Error ? error : new Error(String(error)), {
                userId
            });
            return {
                success: false,
                data: null,
                error: (error as any).message
            };
        }

        return {
            success: true,
            data: data,
            error: null
        };
    } catch (error) {
        logger.error('Failed to fetch college by owner', error instanceof Error ? error : new Error(String(error)), {
            userId
        });
        return {
            success: false,
            data: null,
            error: (error as any).message
        };
    }
};

/**
 * Get college by ID from organizations table
 * @param {string} collegeId - College ID
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getCollegeById = async (collegeId) => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', collegeId)
            .eq('organization_type', 'college')
            .single();

        if (error) {
            logger.error('Failed to fetch college by ID', error instanceof Error ? error : new Error(String(error)), {
                collegeId
            });
            return {
                success: false,
                data: null,
                error: (error as any).message
            };
        }

        return {
            success: true,
            data: data,
            error: null
        };
    } catch (error) {
        logger.error('Failed to fetch college by ID', error instanceof Error ? error : new Error(String(error)), {
            collegeId
        });
        return {
            success: false,
            data: null,
            error: (error as any).message
        };
    }
};

/**
 * Get all colleges from organizations table
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getAllColleges = async () => {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('organization_type', 'college')
            .order('name');

        if (error) {
            logger.error('Failed to fetch colleges', error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                data: null,
                error: (error as any).message
            };
        }

        return {
            success: true,
            data: data || [],
            error: null
        };
    } catch (error) {
        logger.error('Failed to fetch colleges', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            data: null,
            error: (error as any).message
        };
    }
};

