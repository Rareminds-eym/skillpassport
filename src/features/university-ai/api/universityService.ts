import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

/**
 * University Service
 * Handles university-related database operations using the unified organizations table
 */

const logger = getLogger('university-service');

/**
 * Get all universities for dropdown selection from organizations table
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getUniversities = async () => {
    try {
        const response = await apiPost('/university-ai', { action: 'get-universities' });
        return { success: true, data: response.data || [], error: null };
    } catch (error) {
        logger.error('Error fetching universities', error);
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
        const response = await apiPost('/university-ai', { action: 'get-university-by-id', universityId });
        return { success: true, data: response.data || null, error: null };
    } catch (error) {
        logger.error('Error fetching university', error);
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
        const response = await apiPost('/university-ai', { action: 'get-university-by-owner', userId });
        return { success: true, data: response.data || null, error: null };
    } catch (error) {
        logger.error('Error fetching university by owner', error);
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
        const response = await apiPost('/university-ai', { action: 'create-university', ...universityData });
        return { success: true, data: response.data || null, error: null };
    } catch (error) {
        logger.error('Error creating university', error);
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
        const response = await apiPost('/university-ai', { action: 'check-university-college-code', universityId, code });
        return { isUnique: response.data?.isUnique ?? true, error: null };
    } catch (error) {
        logger.error('Error checking college code', error);
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
        const response = await apiPost('/university-ai', { action: 'create-university-college', ...collegeData });
        return { success: true, data: response.data || null, error: null };
    } catch (error) {
        logger.error('Error creating university college', error);
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
        const response = await apiPost('/university-ai', { action: 'get-university-college-by-owner', userId });
        return { success: true, data: response.data || null, error: null };
    } catch (error) {
        logger.error('Error fetching university college by owner', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Get all active universities for learner registration dropdown from organizations table
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getActiveUniversities = async () => {
    try {
        const response = await apiPost('/university-ai', { action: 'get-active-universities' });
        return { success: true, data: response.data || [], error: null };
    } catch (error) {
        logger.error('Error fetching active universities', error);
        return { success: false, data: null, error: error.message };
    }
};

