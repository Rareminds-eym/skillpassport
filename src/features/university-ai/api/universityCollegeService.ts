import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('university-college');

/**
 * University College Service
 * Handles university-college relationship operations using the university_colleges table
 */

/**
 * Get all colleges for a specific university
 * @param {string} universityId - University organization ID
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getCollegesByUniversity = async (universityId) => {
    try {
        const response = await apiPost('/university-ai', { action: 'get-colleges-by-university', universityId });
        return { success: true, data: response.data || [], error: null };
    } catch (error) {
        logger.error('Error fetching colleges by university', error, { universityId });
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Add a college to a university from the organizations table
 * @param {string} universityId - University organization ID
 * @param {string} organizationId - College organization ID to add
 * @param {Object} additionalData - Additional college data (dean info, etc.)
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const addCollegeToUniversity = async (universityId, organizationId, additionalData = {}) => {
    try {
        const response = await apiPost('/university-ai', { action: 'add-college-to-university', universityId, organizationId, ...additionalData });
        return { success: true, data: response.data || null, error: null };
    } catch (error) {
        logger.error('Error adding college to university', error, { universityId, organizationId });
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Get available colleges that can be added to a university
 * (Colleges from organizations table that are not yet linked to this university)
 * @param {string} universityId - University organization ID
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getAvailableColleges = async (universityId) => {
    try {
        const response = await apiPost('/university-ai', { action: 'get-available-colleges', universityId });
        return { success: true, data: response.data || [], error: null };
    } catch (error) {
        logger.error('Error fetching available colleges', error, { universityId });
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Update college information in university_colleges table
 * @param {string} collegeId - University college ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const updateUniversityCollege = async (collegeId, updateData) => {
    try {
        const response = await apiPost('/university-ai', { action: 'update-university-college', collegeId, ...updateData });
        return { success: true, data: response.data || null, error: null };
    } catch (error) {
        logger.error('Error updating university college', error, { collegeId });
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Remove a college from university (soft delete by changing status)
 * @param {string} collegeId - University college ID
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const removeCollegeFromUniversity = async (collegeId) => {
    try {
        const response = await apiPost('/university-ai', { action: 'remove-college-from-university', collegeId });
        return { success: true, data: response.data || null, error: null };
    } catch (error) {
        logger.error('Error removing college from university', error, { collegeId });
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Check if a college code is unique within a university
 * @param {string} universityId - University organization ID
 * @param {string} code - College code to check
 * @param {string} excludeId - College ID to exclude from check (for updates)
 * @returns {Promise<{ isUnique: boolean, error: string | null }>}
 */
export const checkCollegeCodeUnique = async (universityId, code, excludeId = null) => {
    try {
        const response = await apiPost('/university-ai', { action: 'check-college-code-unique', universityId, code, excludeId });
        return { isUnique: response.data?.isUnique ?? true, error: null };
    } catch (error) {
        logger.error('Error checking college code uniqueness', error, { universityId, code });
        return { isUnique: false, error: error.message };
    }
};

/**
 * Generate a college code from college name
 * @param {string} name - College name
 * @returns {string} Generated code
 */
const generateCollegeCode = (name) => {
    if (!name) return 'COL001';
    
    // Remove common words and take first letters
    const words = name
        .replace(/\b(college|university|institute|of|the|and|for)\b/gi, '')
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);
    
    let code = words
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 6);
    
    // Ensure minimum length
    if (code.length < 3) {
        code = name.replace(/\s+/g, '').substring(0, 6).toUpperCase();
    }
    
    return code;
};

/**
 * Get college statistics for a university
 * @param {string} universityId - University organization ID
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getUniversityCollegeStats = async (universityId) => {
    try {
        const response = await apiPost('/university-ai', { action: 'get-university-college-stats', universityId });
        return { success: true, data: response.data || null, error: null };
    } catch (error) {
        logger.error('Error fetching college stats', error, { universityId });
        return { success: false, data: null, error: error.message };
    }
};

export default {
    getCollegesByUniversity,
    addCollegeToUniversity,
    getAvailableColleges,
    updateUniversityCollege,
    removeCollegeFromUniversity,
    checkCollegeCodeUnique,
    getUniversityCollegeStats
};