/**
 * Student Settings Service
 * Handles fetching and updating student data from the students table
 * Uses direct column access instead of profile JSONB for better performance
 * Notification and privacy settings are stored in user_settings table
 */

import { supabase } from '../lib/supabaseClient';

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
        user_id,
        approval_status,
        created_at,
        updated_at
      `)
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching student settings:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Student not found' };
    }

    // Get settings from user_settings table
    let userSettings = null;
    if (data.user_id) {
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('notification_preferences, privacy_settings')
        .eq('user_id', data.user_id)
        .maybeSingle();

      if (!settingsError && settingsData) {
        userSettings = settingsData;
      }
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

      // Notification settings from user_settings table
      notificationSettings: userSettings?.notification_preferences || {
        emailNotifications: true,
        pushNotifications: true,
        applicationUpdates: true,
        newOpportunities: true,
        recruitingMessages: true,
        weeklyDigest: false,
        monthlyReport: false,
      },

      // Privacy settings from user_settings table
      privacySettings: userSettings?.privacy_settings || {
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
    // First get the student ID and user_id
    const { data: student, error: findError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('email', email)
      .maybeSingle();

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
      // Note: notificationSettings and privacySettings are handled separately below
    });

    // Handle notification and privacy settings in user_settings table
    if ((updates.notificationSettings || updates.privacySettings) && student.user_id) {
      console.log('💾 Saving settings to user_settings table...');
      console.log('   Notification settings:', updates.notificationSettings);
      console.log('   Privacy settings:', updates.privacySettings);
      
      // Check if user_settings record exists
      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', student.user_id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking user_settings:', checkError);
      }

      const settingsUpdate = {};
      if (updates.notificationSettings) {
        settingsUpdate.notification_preferences = updates.notificationSettings;
      }
      if (updates.privacySettings) {
        settingsUpdate.privacy_settings = updates.privacySettings;
      }
      settingsUpdate.updated_at = new Date().toISOString();

      if (existingSettings) {
        // Update existing record
        console.log('📝 Updating existing user_settings record...');
        const { error: updateError } = await supabase
          .from('user_settings')
          .update(settingsUpdate)
          .eq('user_id', student.user_id);
        
        if (updateError) {
          console.error('❌ Error updating user_settings:', updateError);
          return { success: false, error: updateError.message };
        }
        console.log('✅ User settings updated successfully');
      } else {
        // Create new record
        console.log('➕ Creating new user_settings record...');
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: student.user_id,
            ...settingsUpdate,
          });
        
        if (insertError) {
          console.error('❌ Error inserting user_settings:', insertError);
          return { success: false, error: insertError.message };
        }
        console.log('✅ User settings created successfully');
      }
    }

    // Add updated timestamp
    columnUpdates.updated_at = new Date().toISOString();

    // Perform the update on students table (only if there are column updates)
    if (Object.keys(columnUpdates).length > 1) { // More than just updated_at
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
    }

    // Return fresh data
    console.log('🔄 Fetching fresh data after save...');
    return await getStudentSettingsByEmail(email);
  } catch (err) {
    console.error('❌ updateStudentSettings exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update password using Supabase Auth
 * Same pattern as studentAuthService - simple and direct
 * @param {string} email - Student email
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result
 */
export const updateStudentPassword = async (email, currentPassword, newPassword) => {
  try {
    console.log('🔐 Password update requested for:', email);

    // Verify current password by signing in (same as login flow)
    console.log('🔐 Verifying current password...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (authError) {
      console.error('❌ Current password verification failed:', authError.message);
      return { 
        success: false, 
        error: 'Current password is incorrect. Please try again.' 
      };
    }

    if (!authData?.user) {
      console.error('❌ No user returned from authentication');
      return { 
        success: false, 
        error: 'Authentication failed. Please try again.' 
      };
    }

    console.log('✅ Current password verified');

    // Update to new password (user is now authenticated with fresh session)
    console.log('🔐 Updating to new password...');
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('❌ Password update failed:', updateError.message);
      
      // Handle specific error cases
      if (updateError.message?.includes('same password')) {
        return { 
          success: false, 
          error: 'New password must be different from your current password.' 
        };
      }
      
      if (updateError.message?.includes('password') && (updateError.message?.includes('6') || updateError.message?.includes('characters'))) {
        return { 
          success: false, 
          error: 'Password must be at least 6 characters long.' 
        };
      }
      
      return { 
        success: false, 
        error: updateError.message || 'Failed to update password. Please try again.' 
      };
    }

    console.log('✅ Password updated successfully for:', email);
    console.log('   User ID:', data?.user?.id);
    console.log('   Updated at:', data?.user?.updated_at);
    
    return { 
      success: true, 
      message: 'Password updated successfully!',
      data 
    };
  } catch (err) {
    console.error('❌ updateStudentPassword exception:', err);
    return { 
      success: false, 
      error: err.message || 'An unexpected error occurred. Please try again.' 
    };
  }
};