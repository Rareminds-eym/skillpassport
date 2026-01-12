import { supabase } from '../lib/supabaseClient';

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
        const { data, error } = await supabase
            .from('university_colleges')
            .select(`
                *,
                university:organizations!university_id(name, code),
                college:organizations!college_id(name, code, city, state, email, phone, website, address, description, admin_id)
            `)
            .eq('university_id', universityId)
            .order('name');

        if (error) {
            console.error('Error fetching colleges by university:', error);
            return {
                success: false,
                data: null,
                error: error.message
            };
        }

        return {
            success: true,
            data: data || [],
            error: null
        };
    } catch (error) {
        console.error('Unexpected error fetching colleges by university:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
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
        // First, get the college data from organizations table
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', organizationId)
            .eq('organization_type', 'college')
            .single();

        if (orgError) {
            console.error('Error fetching organization:', orgError);
            return {
                success: false,
                data: null,
                error: orgError.message
            };
        }

        if (!orgData) {
            return {
                success: false,
                data: null,
                error: 'College organization not found'
            };
        }

        // Get current user for created_by field
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        // Prepare college data for university_colleges table
        const collegeData = {
            university_id: universityId,
            college_id: organizationId, // Reference to the original organization
            name: orgData.name,
            code: additionalData.code || orgData.code || generateCollegeCode(orgData.name),
            dean_name: additionalData.dean_name || null,
            dean_email: additionalData.dean_email || orgData.email,
            dean_phone: additionalData.dean_phone || orgData.phone,
            established_year: additionalData.established_year || null,
            account_status: additionalData.account_status || 'active',
            created_by: userId,
            metadata: {
                city: orgData.city,
                state: orgData.state,
                address: orgData.address,
                website: orgData.website,
                description: orgData.description,
                admin_id: orgData.admin_id,
                approval_status: orgData.approval_status,
                ...additionalData.metadata
            }
        };

        const { data, error } = await supabase
            .from('university_colleges')
            .insert([collegeData])
            .select()
            .single();

        if (error) {
            console.error('Error adding college to university:', error);
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
        console.error('Unexpected error adding college to university:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
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
        // Get all colleges from organizations table
        const { data: allColleges, error: collegesError } = await supabase
            .from('organizations')
            .select('*')
            .eq('organization_type', 'college')
            .eq('approval_status', 'approved')
            .order('name');

        if (collegesError) {
            console.error('Error fetching all colleges:', collegesError);
            return {
                success: false,
                data: null,
                error: collegesError.message
            };
        }

        // Get colleges already linked to this university
        const { data: linkedColleges, error: linkedError } = await supabase
            .from('university_colleges')
            .select('college_id')
            .eq('university_id', universityId);

        if (linkedError) {
            console.error('Error fetching linked colleges:', linkedError);
            return {
                success: false,
                data: null,
                error: linkedError.message
            };
        }

        // Extract college IDs from linked colleges
        const linkedCollegeIds = linkedColleges
            .map(college => college.college_id)
            .filter(Boolean);

        // Filter out already linked colleges
        const availableColleges = allColleges.filter(
            college => !linkedCollegeIds.includes(college.id)
        );

        return {
            success: true,
            data: availableColleges || [],
            error: null
        };
    } catch (error) {
        console.error('Unexpected error fetching available colleges:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
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
        const { data, error } = await supabase
            .from('university_colleges')
            .update(updateData)
            .eq('id', collegeId)
            .select()
            .single();

        if (error) {
            console.error('Error updating university college:', error);
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
        console.error('Unexpected error updating university college:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};

/**
 * Remove a college from university (soft delete by changing status)
 * @param {string} collegeId - University college ID
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const removeCollegeFromUniversity = async (collegeId) => {
    try {
        const { data, error } = await supabase
            .from('university_colleges')
            .update({ account_status: 'inactive' })
            .eq('id', collegeId)
            .select()
            .single();

        if (error) {
            console.error('Error removing college from university:', error);
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
        console.error('Unexpected error removing college from university:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
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
        let query = supabase
            .from('university_colleges')
            .select('id')
            .eq('university_id', universityId)
            .ilike('code', code);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            console.error('Error checking college code uniqueness:', error);
            return { isUnique: false, error: error.message };
        }

        return {
            isUnique: !data,
            error: null
        };
    } catch (error) {
        console.error('Unexpected error checking college code uniqueness:', error);
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
        const { data, error } = await supabase
            .from('university_colleges')
            .select('account_status')
            .eq('university_id', universityId);

        if (error) {
            console.error('Error fetching college stats:', error);
            return {
                success: false,
                data: null,
                error: error.message
            };
        }

        const stats = {
            total: data.length,
            active: data.filter(c => c.account_status === 'active').length,
            pending: data.filter(c => c.account_status === 'pending').length,
            inactive: data.filter(c => c.account_status === 'inactive').length
        };

        return {
            success: true,
            data: stats,
            error: null
        };
    } catch (error) {
        console.error('Unexpected error fetching college stats:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
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