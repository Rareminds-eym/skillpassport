/**
 * Real Student Data Service
 *
 * Fetches actual student records from Supabase based on email
 * Works with your existing students table structure
 */

import { supabase } from './api';

/**
 * Fetch student data by email from Supabase
 * @param {string} email - Student email (e.g., "chinnuu116@gmail.com")
 * @returns {Object} Student data or null
 */
export async function getStudentByEmail(email) {
  try {
    // Query students table by email
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching student:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Student not found',
        data: null,
      };
    }

    return {
      success: true,
      data: data,
      error: null,
    };
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Transform real student data to match Dashboard format
 * @param {Object} studentRecord - Raw student record from Supabase
 * @returns {Object} Formatted student data for Dashboard
 */
export function transformStudentData(studentRecord) {
  if (!studentRecord) return null;

  // Map your database fields to Dashboard format
  return {
    // Basic Info
    name: studentRecord.name || 'Student',
    email: studentRecord.email || '',
    department: studentRecord.branch_field || studentRecord.course || 'Not specified',
    university: studentRecord.university || studentRecord.college_school_name || '',
    passportId: studentRecord.registration_number?.toString() || 'N/A',

    // Contact Info
    phone: studentRecord.contact_number
      ? `+${studentRecord.contact_number_dial_code || 91} ${studentRecord.contact_number}`
      : '',
    alternatePhone: studentRecord.alternate_number?.toString() || '',

    // Academic Info
    cgpa: 'N/A', // Not in your data
    yearOfPassing: 'N/A', // Not in your data
    age: studentRecord.age || 0,
    dateOfBirth: studentRecord.date_of_birth || '',
    district: studentRecord.district_name || '',

    // Training/Course Info
    course: studentRecord.course || '',
    skill: studentRecord.skill || '',
    trainerName: studentRecord.trainer_name || '',
    nmId: studentRecord.nm_id || '',
    registrationNumber: studentRecord.registration_number || '',

    // Profile data (if exists as JSONB)
    profile: studentRecord.profile || {},

    // Metadata
    verified: true,
    employabilityScore: 75, // Default
    photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentRecord.name || 'Student')}&size=200`,

    // Education (construct from available data)
    education: [
      {
        id: 1,
        degree: studentRecord.course || 'Current Course',
        institution: studentRecord.college_school_name || studentRecord.university || '',
        duration: 'Ongoing',
        grade: 'N/A',
        achievements: [],
      },
    ],

    // Training (construct from skill data)
    training: studentRecord.skill
      ? [
          {
            id: 1,
            name: studentRecord.skill,
            progress: 75,
            status: 'ongoing',
            trainer: studentRecord.trainer_name || 'Assigned Trainer',
          },
        ]
      : [],

    // Experience
    experience: [],

    // Skills
    technicalSkills: studentRecord.skill
      ? [
          {
            id: 1,
            name: studentRecord.skill,
            level: 3,
            verified: false,
            icon: '📚',
          },
        ]
      : [],

    softSkills: [
      {
        id: 1,
        name: 'Communication',
        level: 3,
        type: 'skill',
      },
      {
        id: 2,
        name: 'Teamwork',
        level: 3,
        type: 'skill',
      },
    ],

    // Recent Updates
    recentUpdates: [
      {
        id: 1,
        message: `Enrolled in ${studentRecord.course || 'course'}`,
        timestamp: studentRecord.imported_at || new Date().toISOString(),
        type: 'achievement',
      },
      {
        id: 2,
        message: `Learning ${studentRecord.skill || 'new skills'}`,
        timestamp: new Date().toISOString(),
        type: 'progress',
      },
    ],

    // Suggestions
    suggestions: [
      {
        id: 1,
        message: 'Complete your profile information',
        priority: 3,
        isActive: true,
      },
      {
        id: 2,
        message: 'Update your skills assessment',
        priority: 2,
        isActive: true,
      },
    ],

    // Opportunities
    opportunities: [
      {
        id: 1,
        title: 'Food Safety Internship',
        company: 'Industry Partner',
        type: 'internship',
        deadline: '2025-12-31',
        location: studentRecord.district_name || 'Chennai',
      },
    ],
  };
}

/**
 * Get current user's student data
 * This is called by the Dashboard to fetch data
 */
export async function getCurrentStudentData() {
  try {
    // Get current Supabase user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Not logged in',
        data: null,
      };
    }

    // Fetch student by email
    const result = await getStudentByEmail(user.email);

    if (!result.success || !result.data) {
      return result;
    }

    // Transform data for Dashboard
    const transformedData = transformStudentData(result.data);

    return {
      success: true,
      data: transformedData,
      rawData: result.data,
      error: null,
    };
  } catch (err) {
    console.error('❌ Error in getCurrentStudentData:', err);
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

// Export for use in Dashboard
export default {
  getStudentByEmail,
  transformStudentData,
  getCurrentStudentData,
};
