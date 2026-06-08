/**
 * Learner Settings Service
 * Handles fetching and updating learner data from the learners table
 * Uses direct column access instead of profile JSONB for better performance
 * Notification and privacy settings are stored in user_settings table
 */

import { PASSWORD_MIN } from '@/shared/constants';
import { apiPost } from '@/shared/api/apiClient';

/**
 * Fetch learner data by email for settings page
 * @param {string} email - Learner email
 * @returns {Promise<Object>} Learner data
 */
export const getlearnerSettingsByEmail = async (email) => {
  try {
    const learnerResult = await apiPost('/learner-profile/actions', {
      action: 'fetch-learner-settings-by-email', email,
    });
    const data = learnerResult?.data;

    if (!data) {
      return { success: false, error: 'Learner not found' };
    }

    // Fetch user settings separately
    let userSettings = null;
    if (data.user_id) {
      const settingsResult = await apiPost('/learner-profile/actions', {
        action: 'fetch-user-settings', userId: data.user_id,
      });
      if (settingsResult?.data) {
        userSettings = settingsResult.data;
      }
    }

    const userRole = Array.isArray(data.users) && data.users.length > 0
      ? data.users[0]?.role
      : data.users?.role;

    const collegeSchoolName = data.college_school_name || '';

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
      university: data.university || '',
      branch: data.branch_field || '',
      college: userRole === 'learner' ? collegeSchoolName : '',
      schoolName: userRole === 'learner' ? collegeSchoolName : '',
      registrationNumber: data.registration_number || '',
      enrollmentNumber: data.enrollmentNumber || '',
      currentCgpa: data.currentCgpa || '',
      grade: data.grade || '',
      gradeStartDate: data.grade_start_date || '',
      universityId: data.universityId || '',
      universityCollegeId: data.university_college_id || '',
      schoolId: data.school_id || '',
      schoolClassId: data.school_class_id || '',
      collegeId: data.college_id || '',
      programId: data.program_id || '',
      programSectionId: data.program_section_id || '',
      semester: data.semester || '',
      section: data.section || '',
      enrollmentDate: data.enrollmentDate || '',
      expectedGraduationDate: data.expectedGraduationDate || '',
      guardianName: data.guardianName || '',
      guardianPhone: data.guardianPhone || '',
      guardianEmail: data.guardianEmail || '',
      guardianRelation: data.guardianRelation || '',
      linkedIn: data.linkedin_link || '',
      github: data.github_link || '',
      twitter: data.twitter_link || '',
      facebook: data.facebook_link || '',
      instagram: data.instagram_link || '',
      portfolio: data.portfolio_link || '',
      otherSocialLinks: data.other_social_links || [],
      resumeUrl: data.resumeUrl || '',
      profilePicture: data.profilePicture || '',
      bio: data.bio || '',
      gapInStudies: data.gap_in_studies || false,
      gapYears: data.gap_years || 0,
      gapReason: data.gap_reason || '',
      workExperience: data.work_experience || '',
      aadharNumber: data.aadhar_number || '',
      backlogsHistory: data.backlogs_history || '',
      currentBacklogs: data.current_backlogs || 0,
      interests: typeof data.interests === 'string' ? data.interests : JSON.stringify(data.interests || []),
      languages: typeof data.languages === 'string' ? data.languages : JSON.stringify(data.languages || []),
      hobbies: typeof data.hobbies === 'string' ? data.hobbies : JSON.stringify(data.hobbies || []),
      notificationSettings: userSettings?.notification_preferences || {
        emailNotifications: true,
        pushNotifications: true,
        applicationUpdates: true,
        newOpportunities: true,
        recruitingMessages: true,
        weeklyDigest: false,
        monthlyReport: false,
      },
      privacySettings: userSettings?.privacy_settings || {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: true,
        allowRecruiterContact: true,
        showInTalentPool: true,
      },
      approvalStatus: data.approval_status || 'pending',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      schoolOrganization: data.school || null,
      collegeOrganization: data.college || data.universityOrganization || null,
      userRole: userRole || null,
    };

    return { success: true, data: settingsData };
  } catch (err) {
    console.error('❌ getlearnerSettingsByEmail exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update learner profile data
 * @param {string} email - Learner email
 * @param {Object} updates - Data to update
 * @returns {Promise<Object>} Updated learner data
 */
export const updatelearnerSettings = async (email, updates) => {
  try {
    const learnerResult = await apiPost('/learner-profile/actions', {
      action: 'fetch-learner-id-by-email', email,
    });
    const learner = learnerResult?.data;

    if (!learner) {
      return { success: false, error: 'Learner not found' };
    }

    const columnUpdates = {};

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
      program: 'branch_field',
      college: 'college_school_name',
      courseName: 'course_name',
      registrationNumber: 'registration_number',
      enrollmentNumber: 'enrollmentNumber',
      currentCgpa: 'currentCgpa',
      grade: 'grade',
      gradeStartDate: 'grade_start_date',
      universityId: 'universityId',
      universityCollegeId: 'university_college_id',
      schoolId: 'school_id',
      schoolClassId: 'school_class_id',
      collegeId: 'college_id',
      programId: 'program_id',
      programSectionId: 'program_section_id',
      semester: 'semester',
      section: 'section',
      rollNumber: 'roll_number',
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
      bio: 'bio',
      gapInStudies: 'gap_in_studies',
      gapYears: 'gap_years',
      gapReason: 'gap_reason',
      workExperience: 'work_experience',
      aadharNumber: 'aadhar_number',
      backlogsHistory: 'backlogs_history',
      currentBacklogs: 'current_backlogs',
      interests: 'interests',
      languages: 'languages',
      hobbies: 'hobbies',
    };

    const numericFields = ['age', 'pincode', 'currentCgpa', 'semester', 'gapYears', 'currentBacklogs'];
    const uuidFields = ['universityCollegeId', 'schoolId', 'schoolClassId', 'collegeId', 'programId', 'universityId', 'programSectionId'];
    const phoneFields = ['phone', 'alternatePhone', 'guardianPhone'];
    const dateFields = ['dateOfBirth', 'gradeStartDate', 'enrollmentDate', 'expectedGraduationDate'];
    const nullableTextFields = ['courseName', 'gapReason'];

    Object.keys(updates).forEach(key => {
      if (fieldMapping[key]) {
        let value = updates[key];

        if (numericFields.includes(key) && (value === '' || value === null || value === undefined)) {
          value = null;
        }
        if (uuidFields.includes(key) && (value === '' || value === null || value === undefined)) {
          value = null;
        }
        if (phoneFields.includes(key) && (value === '' || value === null || value === undefined)) {
          value = null;
        }
        if (dateFields.includes(key) && (value === '' || value === null || value === undefined)) {
          value = null;
        }
        if (key === 'aadharNumber' && (value === '' || value === null || value === undefined)) {
          value = null;
        }
        if (nullableTextFields.includes(key) && (value === '' || value === null || value === undefined)) {
          value = null;
        }
        if (key === 'guardianRelation' && value && typeof value === 'string' && value.length > 50) {
          value = value.substring(0, 50);
        }
        if (key === 'category' && value && typeof value === 'string' && value.length > 50) {
          value = value.substring(0, 50);
        }
        if (key === 'quota' && value && typeof value === 'string' && value.length > 50) {
          value = value.substring(0, 50);
        }
        if (key === 'rollNumber' && value && typeof value === 'string' && value.length > 50) {
          value = value.substring(0, 50);
        }
        if (['interests', 'languages', 'hobbies'].includes(key)) {
          if (typeof value === 'string') {
            try { value = JSON.parse(value); } catch (e) { value = []; }
          }
          if (!Array.isArray(value)) value = [];
        }

        columnUpdates[fieldMapping[key]] = value;

        if ((key === 'branch' || key === 'program') && value) {
          columnUpdates.course_name = value;
          const hasProgramId = updates.programId && updates.programId !== '' && updates.programId !== null;
          if (!hasProgramId) {
            columnUpdates.program_id = null;
          }
        }
      } else if (key === 'otherSocialLinks') {
        columnUpdates.other_social_links = updates[key];
      }
    });

    if (columnUpdates.program_id && columnUpdates.program_id !== null) {
      const programResult = await apiPost('/learner-profile/actions', {
        action: 'fetch-program-name-by-id', programId: columnUpdates.program_id,
      });
      const programData = programResult?.data;
      if (programData) {
        const programName = programData.name || programData.code;
        columnUpdates.branch_field = programName;
        columnUpdates.course_name = programName;
      }
    }

    if ((updates.notificationSettings || updates.privacySettings) && learner.user_id) {
      await apiPost('/learner-profile/actions', {
        action: 'upsert-user-settings',
        userId: learner.user_id,
        notificationPreferences: updates.notificationSettings,
        privacySettings: updates.privacySettings,
      });
    }

    columnUpdates.updated_at = new Date().toISOString();

    if (Object.keys(columnUpdates).length > 1) {
      const updateResult = await apiPost('/learner-profile/actions', {
        action: 'update-learner-by-id',
        learnerId: learner.id,
        updates: columnUpdates,
      });

      if (!updateResult?.data) {
        return { success: false, error: 'Failed to update learner settings' };
      }
    } else {
      console.log('⚠️ No column updates to save (only timestamp)');
    }

    return await getlearnerSettingsByEmail(email);
  } catch (err) {
    console.error('❌ updatelearnerSettings exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update password using SSO Worker (not Supabase Auth which is disabled)
 * Delegates to updatePassword from user mutations which calls /auth/change-password
 * @param {string} email - Learner email (used for logging only)
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result
 */
export const updatelearnerPassword = async (email, currentPassword, newPassword) => {
  try {
    const { updatePassword } = await import('@/entities/user/api/mutations');
    await updatePassword(newPassword, currentPassword);
    return { success: true, message: 'Password updated successfully!' };
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Current password') || msg.includes('Invalid credentials') || msg.includes('incorrect')) {
      return { success: false, error: 'Current password is incorrect. Please try again.' };
    }
    if (msg.includes('same password')) {
      return { success: false, error: 'New password must be different from your current password.' };
    }
    if (msg.includes('too weak') || msg.includes('8 characters')) {
      return { success: false, error: `Password must be at least ${PASSWORD_MIN} characters long.` };
    }
    return { success: false, error: msg || 'An unexpected error occurred. Please try again.' };
  }
};
