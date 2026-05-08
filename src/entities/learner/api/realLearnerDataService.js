/**
 * Real Learner Data Service
 * 
 * Fetches actual learner records from Supabase based on email
 * Works with your existing learners table structure
 */

import { supabase } from '@/shared/lib/supabase';

/**
 * Fetch learner data by email from Supabase
 * @param {string} email - Learner email (e.g., "chinnuu116@gmail.com")
 * @returns {Object} Learner data or null
 */
export async function getlearnerByEmail(email) {
  try {

    // Query learners table by email
    const { data, error } = await supabase
      .from('learners')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching learner:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Learner not found',
        data: null
      };
    }


    return {
      success: true,
      data: data,
      error: null
    };

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return {
      success: false,
      error: err.message,
      data: null
    };
  }
}

/**
 * Transform real learner data to match Dashboard format
 * @param {Object} learnerRecord - Raw learner record from Supabase
 * @returns {Object} Formatted learner data for Dashboard
 */
export function transformlearnerData(learnerRecord) {
  if (!learnerRecord) return null;

  // Map your database fields to Dashboard format
  return {
    // Basic Info
    name: learnerRecord.name || 'Learner',
    email: learnerRecord.email || '',
    department: learnerRecord.branch_field || learnerRecord.course || 'Not specified',
    university: learnerRecord.university || learnerRecord.college_school_name || '',
    passportId: learnerRecord.registration_number?.toString() || 'N/A',

    // Contact Info
    phone: learnerRecord.contact_number ?
      `+${learnerRecord.contact_number_dial_code || 91} ${learnerRecord.contact_number}` : '',
    alternatePhone: learnerRecord.alternate_number?.toString() || '',

    // Academic Info
    cgpa: 'N/A', // Not in your data
    yearOfPassing: 'N/A', // Not in your data
    age: learnerRecord.age || 0,
    dateOfBirth: learnerRecord.date_of_birth || '',
    district: learnerRecord.district_name || '',

    // Training/Course Info
    course: learnerRecord.course || '',
    skill: learnerRecord.skill || '',
    trainerName: learnerRecord.trainer_name || '',
    nmId: learnerRecord.nm_id || '',
    registrationNumber: learnerRecord.registration_number || '',

    // Profile data (if exists as JSONB)
    profile: learnerRecord.profile || {},

    // Metadata
    verified: true,
    employabilityScore: 75, // Default
    photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(learnerRecord.name || 'Learner')}&size=200`,

    // Education (construct from available data)
    education: [
      {
        id: 1,
        degree: learnerRecord.course || 'Current Course',
        institution: learnerRecord.college_school_name || learnerRecord.university || '',
        duration: 'Ongoing',
        grade: 'N/A',
        achievements: []
      }
    ],

    // Training (construct from skill data)
    training: learnerRecord.skill ? [
      {
        id: 1,
        name: learnerRecord.skill,
        progress: 75,
        status: 'ongoing',
        trainer: learnerRecord.trainer_name || 'Assigned Trainer'
      }
    ] : [],

    // Experience
    experience: [],

    // Skills
    technicalSkills: learnerRecord.skill ? [
      {
        id: 1,
        name: learnerRecord.skill,
        level: 3,
        verified: false,
        icon: '📚'
      }
    ] : [],

    softSkills: [
      {
        id: 1,
        name: 'Communication',
        level: 3,
        type: 'skill'
      },
      {
        id: 2,
        name: 'Teamwork',
        level: 3,
        type: 'skill'
      }
    ],

    // Recent Updates
    recentUpdates: [
      {
        id: 1,
        message: `Enrolled in ${learnerRecord.course || 'course'}`,
        timestamp: learnerRecord.imported_at || new Date().toISOString(),
        type: 'achievement'
      },
      {
        id: 2,
        message: `Learning ${learnerRecord.skill || 'new skills'}`,
        timestamp: new Date().toISOString(),
        type: 'progress'
      }
    ],

    // Suggestions
    suggestions: [
      {
        id: 1,
        message: 'Complete your profile information',
        priority: 3,
        isActive: true
      },
      {
        id: 2,
        message: 'Update your skills assessment',
        priority: 2,
        isActive: true
      }
    ],

    // Opportunities
    opportunities: [
      {
        id: 1,
        title: 'Food Safety Internship',
        company: 'Industry Partner',
        type: 'internship',
        deadline: '2025-12-31',
        location: learnerRecord.district_name || 'Chennai'
      }
    ]
  };
}

/**
 * Get current user's learner data
 * This is called by the Dashboard to fetch data
 */
export async function getCurrentlearnerData() {
  try {
    // Get current Supabase user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Not logged in',
        data: null
      };
    }

    // Fetch learner by email
    const result = await getlearnerByEmail(user.email);

    if (!result.success || !result.data) {
      return result;
    }

    // Transform data for Dashboard
    const transformedData = transformlearnerData(result.data);

    return {
      success: true,
      data: transformedData,
      rawData: result.data,
      error: null
    };

  } catch (err) {
    console.error('❌ Error in getCurrentlearnerData:', err);
    return {
      success: false,
      error: err.message,
      data: null
    };
  }
}

// Export for use in Dashboard
export default {
  getlearnerByEmail,
  transformlearnerData,
  getCurrentlearnerData
};
