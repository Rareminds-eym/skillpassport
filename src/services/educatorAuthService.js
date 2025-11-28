import { supabase } from '../lib/supabaseClient';

/**
 * Educator Authentication Service
 * Handles educator-specific authentication operations and database interactions
 */

/**
 * Create user record in users table
 * This must be called before creating educator profile to satisfy foreign key constraint
 * @param {string} userId - Auth user ID
 * @param {Object} userData - User data
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createUserRecord = async (userId, userData) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                id: userId,
                email: userData.email,
                firstName: userData.firstName || null,
                lastName: userData.lastName || null,
                role: userData.role || 'educator',
                entity_type: userData.entity_type || 'school',
                isActive: true,
                metadata: userData.metadata || {}
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating user record:', error);
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
        console.error('❌ Unexpected error creating user record:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};

/**
 * Create educator profile in appropriate table after signup
 * College educators -> college_lecturers table
 * School educators -> school_educators table
 * @param {string} userId - Auth user ID
 * @param {Object} educatorData - Educator profile data
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createEducatorProfile = async (userId, educatorData) => {
    try {
        // Route to appropriate table based on entity type
        if (educatorData.entity_type === 'college') {
            // Insert into college_lecturers table with camelCase columns
            const insertData = {
                user_id: userId,
                userId: userId, // Duplicate for compatibility
                collegeId: educatorData.collegeId,
                employeeId: educatorData.employeeId || null,
                department: educatorData.department || null,
                specialization: educatorData.specialization || null,
                qualification: educatorData.qualification || null,
                experienceYears: educatorData.experienceYears || null,
                dateOfJoining: educatorData.dateOfJoining || null,
                accountStatus: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    firstName: educatorData.firstName,
                    lastName: educatorData.lastName,
                    email: educatorData.email,
                    phone: educatorData.phone,
                    designation: educatorData.designation
                }
            };

            const { data, error } = await supabase
                .from('college_lecturers')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                console.error('❌ Error creating college educator profile:', error);
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
        } else {
            // Insert into school_educators table with snake_case columns
            const insertData = {
                user_id: userId,
                first_name: educatorData.firstName,
                last_name: educatorData.lastName,
                email: educatorData.email,
                phone_number: educatorData.phone,
                designation: educatorData.designation || null,
                department: educatorData.department || null,
                employee_id: educatorData.employeeId || null,
                school_id: educatorData.schoolId,
                entity_type: 'school',
                account_status: 'active',
                verification_status: 'Pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('school_educators')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                console.error('❌ Error creating school educator profile:', error);
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
        }
    } catch (error) {
        console.error('❌ Unexpected error creating educator profile:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};

/**
 * Check if educator exists by email in either table
 * @param {string} email - Educator email
 * @returns {Promise<{ exists: boolean, data: Object | null, entityType: string | null }>}
 */
export const getEducatorByEmail = async (email) => {
    try {
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check school_educators first
        const { data: schoolData, error: schoolError } = await supabase
            .from('school_educators')
            .select('id, email, first_name, last_name, user_id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (schoolData) {
            return {
                exists: true,
                data: schoolData,
                entityType: 'school'
            };
        }

        // Check college_lecturers
        const { data: collegeData, error: collegeError } = await supabase
            .from('college_lecturers')
            .select('id, user_id, metadata')
            .eq('metadata->>email', normalizedEmail)
            .maybeSingle();

        if (collegeData) {
            return {
                exists: true,
                data: {
                    id: collegeData.id,
                    user_id: collegeData.user_id,
                    email: collegeData.metadata?.email,
                    first_name: collegeData.metadata?.firstName,
                    last_name: collegeData.metadata?.lastName
                },
                entityType: 'college'
            };
        }

        return {
            exists: false,
            data: null,
            entityType: null
        };
    } catch (error) {
        console.error('Unexpected error checking educator email:', error);
        return { exists: false, data: null, entityType: null };
    }
};

/**
 * Get educator profile by user ID from appropriate table
 * @param {string} userId - Auth user ID
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getEducatorProfile = async (userId) => {
    try {
        // First check which entity type this user is
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('entity_type')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            console.error('❌ Error fetching user entity type:', userError);
            return {
                success: false,
                data: null,
                error: userError?.message || 'User not found'
            };
        }

        // Query appropriate table based on entity type
        if (userData.entity_type === 'college') {
            const { data, error } = await supabase
                .from('college_lecturers')
                .select(`
                    id,
                    user_id,
                    collegeId,
                    employeeId,
                    department,
                    specialization,
                    qualification,
                    experienceYears,
                    dateOfJoining,
                    accountStatus,
                    metadata,
                    colleges:collegeId (
                        id,
                        name,
                        city,
                        state
                    )
                `)
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('❌ Error fetching college educator profile:', error);
                return {
                    success: false,
                    data: null,
                    error: error.message
                };
            }

            // Normalize the response format
            return {
                success: true,
                data: {
                    ...data,
                    entity_type: 'college',
                    first_name: data.metadata?.firstName,
                    last_name: data.metadata?.lastName,
                    email: data.metadata?.email,
                    phone_number: data.metadata?.phone,
                    designation: data.metadata?.designation
                },
                error: null
            };
        } else {
            const { data, error } = await supabase
                .from('school_educators')
                .select(`
                    id,
                    user_id,
                    school_id,
                    employee_id,
                    first_name,
                    last_name,
                    email,
                    phone_number,
                    designation,
                    department,
                    specialization,
                    qualification,
                    experience_years,
                    account_status,
                    verification_status,
                    schools (
                        id,
                        name,
                        city,
                        state
                    )
                `)
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('❌ Error fetching school educator profile:', error);
                return {
                    success: false,
                    data: null,
                    error: error.message
                };
            }

            return {
                success: true,
                data: {
                    ...data,
                    entity_type: 'school'
                },
                error: null
            };
        }
    } catch (error) {
        console.error('❌ Unexpected error fetching educator profile:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};

/**
 * Get all schools for dropdown selection
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getSchools = async () => {
    try {
        const { data, error } = await supabase
            .from('schools')
            .select('id, name, city, state, country')
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ Error fetching schools:', error);
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
        console.error('❌ Unexpected error fetching schools:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};

/**
 * Get all colleges for dropdown selection
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getColleges = async () => {
    try {
        const { data, error } = await supabase
            .from('colleges')
            .select('id, name, city, state, country')
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ Error fetching colleges:', error);
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
        console.error('❌ Unexpected error fetching colleges:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};

/**
 * Update educator profile in appropriate table
 * @param {string} userId - Auth user ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const updateEducatorProfile = async (userId, updates) => {
    try {
        // First check which entity type this user is
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('entity_type')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            console.error('❌ Error fetching user entity type:', userError);
            return {
                success: false,
                data: null,
                error: userError?.message || 'User not found'
            };
        }

        // Update appropriate table based on entity type
        if (userData.entity_type === 'college') {
            // Map updates to camelCase for college_lecturers
            const collegeUpdates = {
                updatedAt: new Date().toISOString()
            };

            // Map common fields
            if (updates.department) collegeUpdates.department = updates.department;
            if (updates.specialization) collegeUpdates.specialization = updates.specialization;
            if (updates.qualification) collegeUpdates.qualification = updates.qualification;
            if (updates.employee_id) collegeUpdates.employeeId = updates.employee_id;
            if (updates.experience_years) collegeUpdates.experienceYears = updates.experience_years;
            if (updates.account_status) collegeUpdates.accountStatus = updates.account_status;

            // Handle metadata updates
            if (updates.first_name || updates.last_name || updates.email || updates.phone_number || updates.designation) {
                // Fetch current metadata first
                const { data: currentData } = await supabase
                    .from('college_lecturers')
                    .select('metadata')
                    .eq('user_id', userId)
                    .single();

                collegeUpdates.metadata = {
                    ...(currentData?.metadata || {}),
                    ...(updates.first_name && { firstName: updates.first_name }),
                    ...(updates.last_name && { lastName: updates.last_name }),
                    ...(updates.email && { email: updates.email }),
                    ...(updates.phone_number && { phone: updates.phone_number }),
                    ...(updates.designation && { designation: updates.designation })
                };
            }

            const { data, error } = await supabase
                .from('college_lecturers')
                .update(collegeUpdates)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating college educator profile:', error);
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
        } else {
            const { data, error } = await supabase
                .from('school_educators')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating school educator profile:', error);
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
        }
    } catch (error) {
        console.error('❌ Unexpected error updating educator profile:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
};
