/**
 * Student Service for ACTUAL Supabase Table Structure
 *
 * This service works with your real students table that has columns like:
 * - name, email, registration_number, contact_number, branch_field, etc.
 *
 * NO JSONB profile column - direct column access
 */

import { supabase } from './api';

/**
 * Get student data by email (direct from table columns)
 */
export async function getStudentByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching student:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Student not found' };
    }

    // Transform the data to match our UI structure
    const transformedData = transformStudentData(data);

    return {
      success: true,
      data: transformedData,
      rawData: data,
    };
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Transform Supabase student data to UI format
 */
function transformStudentData(dbData) {
  // Calculate age from date_of_birth if available
  const age = dbData.age || calculateAge(dbData.date_of_birth);

  // Generate passport ID from registration number
  const passportId = dbData.registration_number ? `SP-${dbData.registration_number}` : 'SP-0000';

  return {
    // Basic Info (directly from your table)
    profile: {
      name: dbData.name || 'Student',
      email: dbData.email || '',
      passportId: passportId,

      // Your actual fields
      registrationNumber: dbData.registration_number,
      contactNumber: formatPhoneNumber(dbData.contact_number, dbData.contact_number_dial_code),
      alternateNumber: dbData.alternate_number,
      dateOfBirth: dbData.date_of_birth,
      age: age,

      // University/Education info
      university: dbData.university || 'University',
      college: dbData.college_school_name || '',
      branch: dbData.branch_field || '',
      department: dbData.branch_field || '',

      // Location
      district: dbData.district_name || '',

      // Course/Training info
      course: dbData.course || '',
      skill: dbData.skill || '',
      trainerName: dbData.trainer_name || '',

      // IDs
      nmId: dbData.nm_id,

      // Metadata
      verified: true,
      employabilityScore: 75, // Default score
      photo: generateAvatarUrl(dbData.name),
    },

    // Education - constructed from your data
    education: [
      {
        id: 1,
        degree: dbData.branch_field || 'Degree',
        institution: dbData.college_school_name || dbData.university,
        university: dbData.university || '',
        yearOfPassing: extractYear(dbData.date_of_birth, age),
        status: 'ongoing',
        level: "Bachelor's",
      },
    ],

    // Training - from course field
    training: dbData.course
      ? [
          {
            id: 1,
            name: dbData.course,
            course: dbData.course,
            progress: 75,
            status: 'ongoing',
            trainerName: dbData.trainer_name,
          },
        ]
      : [],

    // Skills - from skill field
    technicalSkills: dbData.skill
      ? [
          {
            id: 1,
            name: dbData.skill,
            level: 3,
            verified: false,
          },
        ]
      : [],

    // Soft skills - defaults
    softSkills: [
      {
        id: 1,
        name: 'Communication',
        level: 3,
        type: 'skill',
      },
    ],

    // Experience - empty for now
    experience: [],

    // Recent Updates
    recentUpdates: [
      {
        id: 1,
        message: `Enrolled in ${dbData.course || 'course'}`,
        timestamp: dbData.imported_at || new Date().toISOString(),
        type: 'enrollment',
      },
    ],

    // Suggestions
    suggestions: [
      {
        id: 1,
        message: 'Complete your profile',
        priority: 3,
        isActive: true,
      },
    ],

    // Opportunities - empty for now
    opportunities: [],
  };
}

/**
 * Helper: Format phone number
 */
function formatPhoneNumber(number, dialCode) {
  if (!number) return '';
  const code = dialCode ? `+${dialCode}` : '+91';
  return `${code} ${number}`;
}

/**
 * Helper: Calculate age from date of birth
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Helper: Extract expected graduation year
 */
function extractYear(dateOfBirth, age) {
  if (!age) return new Date().getFullYear();

  // Assuming typical graduation age is 21-22
  const graduationAge = 22;
  const currentYear = new Date().getFullYear();
  const yearsToGraduation = graduationAge - age;

  return currentYear + yearsToGraduation;
}

/**
 * Helper: Generate avatar URL
 */
function generateAvatarUrl(name) {
  if (!name) return 'https://ui-avatars.com/api/?name=Student';

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
}

/**
 * Update student data (direct column update)
 */
export async function updateStudentByEmail(email, updates) {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

export default {
  getStudentByEmail,
  updateStudentByEmail,
};
