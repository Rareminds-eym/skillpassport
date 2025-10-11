/**
 * Student Service for JSONB Profile Structure
 * 
 * Your actual Supabase table structure:
 * - students table with profile JSONB column
 * - Profile contains: name, registration_number, contact_number, branch_field, etc.
 * - This is imported/raw data, needs transformation for UI
 */

import { supabase } from '../utils/api';

/**
 * Safely parse JSON string that may contain NaN values
 * @param {string} jsonString - JSON string with potential NaN values
 * @returns {Object} Parsed object
 */
function safeJSONParse(jsonString) {
  if (typeof jsonString !== 'string') {
    return jsonString; // Already an object
  }
  
  // Replace NaN with null before parsing (NaN is not valid JSON)
  const sanitized = jsonString.replace(/:\s*NaN\s*([,}])/g, ': null$1');
  
  try {
    return JSON.parse(sanitized);
  } catch (error) {
    console.error('❌ JSON parse error:', error);
    console.error('📋 Problematic JSON:', jsonString.substring(0, 200));
    return null;
  }
}

/**
 * Fetch student data by email from Supabase
 * @param {string} email - Student email
 * @returns {Promise<Object>} Student data
 */
export async function getStudentByEmail(email) {
  try {
    console.log('🔍 Fetching student data for email:', email);
    
    // First, try to find by email in profile (for students with email populated)
    console.log('🔍 Trying JSONB query: profile->>email =', email);
    let { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('profile->>email', email)
      .maybeSingle();

    console.log('🔍 JSONB query result - data:', data);
    console.log('🔍 JSONB query result - error:', error);

    if (error) {
      console.error('❌ Error fetching student:', error);
      return { success: false, error: error.message };
    }

    // If found by email, we're done!
    if (data) {
      console.log('✅ Student found by email in profile:', data.profile?.name);
      console.log('📋 Raw profile data:', data.profile);
      
      // CRITICAL: Parse profile if it's a string (Supabase returns JSONB as string sometimes)
      // Handle NaN values which are not valid JSON
      const profileData = safeJSONParse(data.profile);
      
      const transformedData = transformProfileData(profileData, email);
      console.log('📋 Transformed data:', transformedData);
      return {
        success: true,
        data: transformedData,
        rawData: data
      };
    }

    // If JSONB query didn't work, try fetching all students and checking manually
    // (This handles cases where profile is stored as a string or JSONB operator doesn't work)
    console.log('🔍 JSONB query returned null. Trying manual search...');
    const { data: allStudents, error: allError } = await supabase
      .from('students')
      .select('*');

    if (allError) {
      console.error('❌ Error fetching all students:', allError);
      return { success: false, error: allError.message };
    }

    console.log('🔍 Found', allStudents?.length || 0, 'total students. Searching for email...');

    // Manually search for matching email
    const matchingStudent = allStudents?.find(student => {
      const profileData = safeJSONParse(student.profile);
      const studentEmail = profileData?.email;
      console.log('🔍 Checking student:', profileData?.name, 'email:', studentEmail);
      return studentEmail?.toLowerCase() === email.toLowerCase();
    });

    if (matchingStudent) {
      console.log('✅ Student found by manual search:', matchingStudent.profile?.name || matchingStudent.profile);
      const profileData = safeJSONParse(matchingStudent.profile);
      const transformedData = transformProfileData(profileData, email);
      return {
        success: true,
        data: transformedData,
        rawData: matchingStudent
      };
    }

    // If not found by email, do NOT fallback to name matching or first student
    // Only show a student if their email is actually present in the JSONB profile
    console.log('❌ No student found with email in profile. Returning null.');
    return { success: false, error: 'No data found for this email.' };

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Transform imported JSONB profile data to UI format
 * 
 * Input: Raw imported data with fields like registration_number, branch_field, etc.
 * Output: Structured data matching Dashboard expectations
 */
function transformProfileData(profile, email) {
  console.log('🔄 transformProfileData called with:');
  console.log('  - profile:', profile);
  console.log('  - email:', email);
  console.log('  - profile.name:', profile?.name);
  console.log('  - profile.registration_number:', profile?.registration_number);
  console.log('  - profile.university:', profile?.university);
  
  if (!profile) {
    console.log('❌ Profile is null/undefined!');
    return null;
  }

  // Calculate age from date_of_birth if available
  const age = profile.age || calculateAge(profile.date_of_birth);
  
  // Generate passport ID from registration number
  const passportId = profile.registration_number 
    ? `SP-${profile.registration_number}` 
    : 'SP-0000';
  
  console.log('  - Calculated passportId:', passportId);

  // Format phone number
  const phone = formatPhoneNumber(profile.contact_number, profile.contact_number_dial_code);
  const alternatePhone = formatPhoneNumber(profile.alternate_number);

  const result = {
    // Basic profile info
    profile: {
      name: profile.name || 'Student',
      email: email || profile.email || '', // Use login email if profile email is blank
      passportId: passportId,
      department: profile.branch_field || '',
      university: profile.university || '',
      photo: generateAvatar(profile.name),
      verified: true, // Assume imported data is verified
      employabilityScore: 75, // Default score
      cgpa: 'N/A',
      yearOfPassing: '',
      phone: phone,
      alternatePhone: alternatePhone,
      age: age,
      dateOfBirth: profile.date_of_birth,
      district: profile.district_name || '',
      college: profile.college_school_name || '',
      registrationNumber: profile.registration_number,
    },
    
    // Education - Build from imported data
    education: [
      {
        id: 1,
        degree: profile.branch_field || 'Not specified',
        university: profile.university || 'Not specified',
        yearOfPassing: '',
        cgpa: 'N/A',
        level: "Bachelor's", // Assume Bachelor's from branch_field
        status: 'ongoing'
      }
    ],
    
    // Training - Build from course and skill
    training: [
      {
        id: 1,
        course: profile.course || 'No course specified',
        progress: 75, // Default progress
        status: 'ongoing',
        skill: profile.skill || '',
        trainer: profile.trainer_name || ''
      }
    ],
    
    // Experience - Empty for imported data
    experience: [],
    
    // Technical skills - Build from skill field
    technicalSkills: profile.skill ? [
      {
        id: 1,
        name: profile.skill,
        level: 3,
        verified: true,
        icon: '🔬', // Science/lab icon
        category: profile.course || 'Training'
      }
    ] : [],
    
    // Soft skills - Default set
    softSkills: [
      {
        id: 1,
        name: 'Communication',
        level: 4,
        type: 'communication',
        description: 'Effective communication skills'
      },
      {
        id: 2,
        name: 'Teamwork',
        level: 4,
        type: 'collaboration',
        description: 'Works well in teams'
      }
    ],
    
    // Recent updates
    recentUpdates: [
      {
        id: 1,
        message: `Enrolled in ${profile.course || 'course'}`,
        timestamp: profile.imported_at || new Date().toISOString(),
        type: 'achievement'
      }
    ],
    
    // Suggestions
    suggestions: [
      {
        id: 1,
        message: 'Complete your profile with project details',
        priority: 3,
        isActive: true
      },
      {
        id: 2,
        message: `Continue your training in ${profile.skill || 'your field'}`,
        priority: 2,
        isActive: true
      }
    ],
    
    // Opportunities
    opportunities: [
      {
        id: 1,
        title: `${profile.skill || 'Technical'} Specialist`,
        company: 'Industry Partner',
        type: 'internship',
        deadline: ''
      }
    ]
  };
  
  console.log('✅ Transform complete, returning result with name:', result.profile.name);
  return result;
}

/**
 * Calculate age from date of birth
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
 * Format phone number with country code
 */
function formatPhoneNumber(number, dialCode = 91) {
  if (!number) return '';
  return `+${dialCode} ${number}`;
}

/**
 * Generate avatar URL from name
 */
function generateAvatar(name) {
  if (!name) return 'https://ui-avatars.com/api/?name=Student&background=4F46E5&color=fff';
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4F46E5&color=fff&size=200`;
}

/**
 * Update student profile by email
 */
export async function updateStudentByEmail(email, updates) {
  try {
    console.log('💾 Updating student profile for:', email);

    // First, get the current profile
    const { data: currentData, error: fetchError } = await supabase
      .from('students')
      .select('profile')
      .eq('profile->>email', email)
      .maybeSingle();

    if (fetchError || !currentData) {
      return { success: false, error: 'Student not found' };
    }

    // Merge updates into existing profile
    const updatedProfile = {
      ...currentData.profile,
      ...updates
    };

    // Update the profile
    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('profile->>email', email)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Profile updated successfully');
    return {
      success: true,
      data: transformProfileData(data.profile)
    };

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { success: false, error: err.message };
  }
}
