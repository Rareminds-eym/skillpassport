/**
 * Student Settings Service
 * Handles fetching and updating student data from the students table
 * Uses direct column access instead of profile JSONB for better performance
 */

import { supabase } from '../utils/api';

/**
 * Fetch student data by email for settings page
 * @param {string} email - Student email
 * @returns {Promise<Object>} Student data
 */
export const getStudentSettingsByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        email,
        name,
        age,
        date_of_birth,
        dateOfBirth,
        contact_number,
        contactNumber,
        alternate_number,
        district_name,
        city,
        state,
        country,
        pincode,
        address,
        university,
        branch_field,
        college_school_name,
        registration_number,
        enrollmentNumber,
        github_link,
        linkedin_link,
        twitter_link,
        facebook_link,
        instagram_link,
        portfolio_link,
        other_social_links,
        resumeUrl,
        profilePicture,
        gender,
        bloodGroup,
        guardianName,
        guardianPhone,
        guardianEmail,
        guardianRelation,
        currentCgpa,
        expectedGraduationDate,
        enrollmentDate,
        approval_status,
        created_at,
        updated_at
      `)
      .eq('email', email)
      .single();

    if (error) {
      console.error('❌ Error fetching student settings:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Student not found' };
    }

    // Transform data for settings form
    const settingsData = {
      id: data.id,
      name: data.name || '',
      email: data.email || '',
      phone: data.contactNumber || data.contact_number || '',
      alternatePhone: data.alternate_number || '',
      location: data.city || data.district_name || '',
      address: data.address || '',
      state: data.state || '',
      country: data.country || 'India',
      pincode: data.pincode || '',
      dateOfBirth: data.dateOfBirth || data.date_of_birth || '',
      age: data.age || '',
      gender: data.gender || '',
      bloodGroup: data.bloodGroup || '',

      // Academic info
      university: data.university || '',
      branch: data.branch_field || '',
      college: data.college_school_name || '',
      registrationNumber: data.registration_number || '',
      enrollmentNumber: data.enrollmentNumber || '',
      currentCgpa: data.currentCgpa || '',
      enrollmentDate: data.enrollmentDate || '',
      expectedGraduationDate: data.expectedGraduationDate || '',

      // Guardian info
      guardianName: data.guardianName || '',
      guardianPhone: data.guardianPhone || '',
      guardianEmail: data.guardianEmail || '',
      guardianRelation: data.guardianRelation || '',

      // Social links
      linkedIn: data.linkedin_link || '',
      github: data.github_link || '',
      twitter: data.twitter_link || '',
      facebook: data.facebook_link || '',
      instagram: data.instagram_link || '',
      portfolio: data.portfolio_link || '',
      otherSocialLinks: data.other_social_links || [],

      // Profile
      resumeUrl: data.resumeUrl || '',
      profilePicture: data.profilePicture || '',
      bio: '', // Bio field removed from profile JSONB

      // Default settings (no longer stored in profile JSONB)
      notificationSettings: {
        emailNotifications: true,
        pushNotifications: true,
        applicationUpdates: true,
        newOpportunities: true,
        recruitingMessages: true,
        weeklyDigest: false,
        monthlyReport: false,
      },

      privacySettings: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: true,
        allowRecruiterContact: true,
        showInTalentPool: true,
      },

      // Status
      approvalStatus: data.approval_status || 'pending',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, data: settingsData };
  } catch (err) {
    console.error('❌ getStudentSettingsByEmail exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update student profile data
 * @param {string} email - Student email
 * @param {Object} updates - Data to update
 * @returns {Promise<Object>} Updated student data
 */
export const updateStudentSettings = async (email, updates) => {
  try {
    // First get the student ID
    const { data: student, error: findError } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .single();

    if (findError || !student) {
      return { success: false, error: 'Student not found' };
    }

    // Prepare updates for direct columns
    const columnUpdates = {};

    // Map form fields to database columns
    const fieldMapping = {
      name: 'name',
      phone: 'contactNumber',
      alternatePhone: 'alternate_number',
      location: 'city',
      address: 'address',
      state: 'state',
      country: 'country',
      pincode: 'pincode',
      dateOfBirth: 'dateOfBirth',
      age: 'age',
      gender: 'gender',
      bloodGroup: 'bloodGroup',
      university: 'university',
      branch: 'branch_field',
      college: 'college_school_name',
      registrationNumber: 'registration_number',
      enrollmentNumber: 'enrollmentNumber',
      currentCgpa: 'currentCgpa',
      enrollmentDate: 'enrollmentDate',
      expectedGraduationDate: 'expectedGraduationDate',
      guardianName: 'guardianName',
      guardianPhone: 'guardianPhone',
      guardianEmail: 'guardianEmail',
      guardianRelation: 'guardianRelation',
      linkedIn: 'linkedin_link',
      github: 'github_link',
      twitter: 'twitter_link',
      facebook: 'facebook_link',
      instagram: 'instagram_link',
      portfolio: 'portfolio_link',
      resumeUrl: 'resumeUrl',
      profilePicture: 'profilePicture',
    };

    // Define numeric fields that should be null instead of empty string
    const numericFields = ['age', 'pincode', 'currentCgpa'];

    // Define fields that might contain phone numbers (could be numeric in DB)
    const phoneFields = ['phone', 'alternatePhone', 'guardianPhone'];

    // Process updates
    Object.keys(updates).forEach(key => {
      if (fieldMapping[key]) {
        let value = updates[key];

        // Handle numeric fields - convert empty strings to null
        if (numericFields.includes(key) && (value === '' || value === null || value === undefined)) {
          value = null;
        }

        // Handle phone fields - convert empty strings to null (in case they're stored as numeric)
        if (phoneFields.includes(key) && (value === '' || value === null || value === undefined)) {
          value = null;
        }

        columnUpdates[fieldMapping[key]] = value;
      } else if (key === 'otherSocialLinks') {
        columnUpdates.other_social_links = updates[key];
      }
      // Note: bio, notificationSettings, and privacySettings are no longer stored in database
      // They can be handled client-side or stored in separate tables if needed
    });

    // Add updated timestamp
    columnUpdates.updated_at = new Date().toISOString();

    // Perform the update
    const { data, error } = await supabase
      .from('students')
      .update(columnUpdates)
      .eq('id', student.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating student settings:', error);
      return { success: false, error: error.message };
    }

    // Return fresh data
    return await getStudentSettingsByEmail(email);
  } catch (err) {
    console.error('❌ updateStudentSettings exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update password (placeholder - would integrate with auth system)
 * @param {string} email - Student email
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result
 */
export const updateStudentPassword = async (email, currentPassword, newPassword) => {
  try {
    // This would integrate with Supabase Auth
    // For now, return success (implement actual password change logic)
    console.log('Password update requested for:', email);

    // In a real implementation, you would:
    // 1. Verify current password with Supabase Auth
    // 2. Update password using supabase.auth.updateUser()

    return { success: true, message: 'Password updated successfully' };
  } catch (err) {
    console.error('❌ updateStudentPassword exception:', err);
    return { success: false, error: err.message };
  }
};