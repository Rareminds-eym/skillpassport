import { supabase } from '../lib/supabaseClient';

/**
 * Create a new skill verification request
 * @param {string} studentId - The student's UUID
 * @param {Object} skillData - The skill details
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const createSkillVerificationRequest = async (studentId, skillData) => {
    try {
        const { data, error } = await supabase
            .from('skill_verification_requests')
            .insert([
                {
                    student_id: studentId,
                    skill_name: skillData.name,
                    skill_type: skillData.type, // 'technical' or 'soft'
                    skill_level: skillData.level,
                    skill_icon: skillData.icon,
                    skill_category: skillData.category,
                    institution_admin_status: 'pending',
                    rareminds_admin_status: 'pending',
                    overall_status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error creating skill verification request:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get verification requests for a student
 * @param {string} studentId 
 * @returns {Promise<{success: boolean, data: any[], error: any}>}
 */
export const getStudentVerificationRequests = async (studentId) => {
    try {
        const { data, error } = await supabase
            .from('skill_verification_requests')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching student verification requests:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get pending requests for institution admin
 * @param {string} institutionId - Optional: filter by school/college ID if linked
 * @returns {Promise<{success: boolean, data: any[], error: any}>}
 */
export const getInstitutionPendingRequests = async () => {
    try {
        // In a real app, we would filter by the admin's institution ID
        // For now, we fetch all requests where institution_admin_status is pending
        const { data, error } = await supabase
            .from('skill_verification_requests')
            .select(`
        *,
        students (
          id,
          name,
          email,
          university,
          department,
          photo
        )
      `)
            .eq('institution_admin_status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching institution pending requests:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get requests awaiting Rareminds approval (already approved by institution)
 * @returns {Promise<{success: boolean, data: any[], error: any}>}
 */
export const getRaremindsPendingRequests = async () => {
    try {
        const { data, error } = await supabase
            .from('skill_verification_requests')
            .select(`
        *,
        students (
          id,
          name,
          email,
          university,
          department,
          photo
        )
      `)
            .eq('institution_admin_status', 'approved')
            .eq('rareminds_admin_status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching Rareminds pending requests:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Approve request by Institution Admin
 * @param {string} requestId 
 * @param {string} adminId 
 * @param {string} notes 
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const approveByInstitutionAdmin = async (requestId, adminId, notes = '') => {
    try {
        const { data, error } = await supabase
            .from('skill_verification_requests')
            .update({
                institution_admin_status: 'approved',
                institution_admin_id: adminId, // In real app, this would be the UUID of the admin user
                institution_admin_reviewed_at: new Date().toISOString(),
                institution_admin_notes: notes,
                overall_status: 'awaiting_rareminds'
            })
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error approving by institution admin:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Approve request by Rareminds Admin
 * @param {string} requestId 
 * @param {string} adminId 
 * @param {string} notes 
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const approveByRaremindsAdmin = async (requestId, adminId, notes = '') => {
    try {
        // 1. Update request status
        const { data: requestData, error: updateError } = await supabase
            .from('skill_verification_requests')
            .update({
                rareminds_admin_status: 'approved',
                rareminds_admin_id: adminId,
                rareminds_admin_reviewed_at: new Date().toISOString(),
                rareminds_admin_notes: notes,
                overall_status: 'verified'
            })
            .eq('id', requestId)
            .select()
            .single();

        if (updateError) throw updateError;

        // 2. Add skill to student's profile (technical_skills or soft_skills table)
        // We need to check which table to insert into based on skill_type
        const table = requestData.skill_type === 'technical' ? 'technical_skills' : 'soft_skills';

        // Check if skill already exists to avoid duplicates
        const { data: existingSkill } = await supabase
            .from(table)
            .select('id')
            .eq('student_id', requestData.student_id)
            .eq('name', requestData.skill_name)
            .single();

        let skillResult;

        if (existingSkill) {
            // Update existing skill
            skillResult = await supabase
                .from(table)
                .update({
                    level: requestData.skill_level,
                    verified: true,
                    // icon: requestData.skill_icon // Only for technical skills usually
                })
                .eq('id', existingSkill.id);
        } else {
            // Insert new skill
            const skillPayload = {
                student_id: requestData.student_id,
                name: requestData.skill_name,
                level: requestData.skill_level,
                verified: true
            };

            if (requestData.skill_type === 'technical') {
                skillPayload.icon = requestData.skill_icon;
                skillPayload.category = requestData.skill_category;
            } else {
                skillPayload.type = requestData.skill_category; // soft_skills uses 'type' column
            }

            skillResult = await supabase
                .from(table)
                .insert([skillPayload]);
        }

        if (skillResult.error) {
            console.error('Error adding verified skill to profile:', skillResult.error);
            // We don't throw here because the request is already approved, 
            // but we should probably log this or handle it manually
        }

        return { success: true, data: requestData };
    } catch (error) {
        console.error('Error approving by Rareminds admin:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Reject verification request
 * @param {string} requestId 
 * @param {string} adminId 
 * @param {string} notes 
 * @param {string} adminType - 'institution' or 'rareminds'
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const rejectVerificationRequest = async (requestId, adminId, notes, adminType) => {
    try {
        const updateData = {
            overall_status: 'rejected'
        };

        if (adminType === 'institution') {
            updateData.institution_admin_status = 'rejected';
            updateData.institution_admin_id = adminId;
            updateData.institution_admin_reviewed_at = new Date().toISOString();
            updateData.institution_admin_notes = notes;
        } else {
            updateData.rareminds_admin_status = 'rejected';
            updateData.rareminds_admin_id = adminId;
            updateData.rareminds_admin_reviewed_at = new Date().toISOString();
            updateData.rareminds_admin_notes = notes;
        }

        const { data, error } = await supabase
            .from('skill_verification_requests')
            .update(updateData)
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error rejecting verification request:', error);
        return { success: false, error: error.message };
    }
};
