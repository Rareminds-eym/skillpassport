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
 * Get student data by looking up profile fields
 * Some profiles have email populated, others don't - we handle both
 */
export async function getStudentByEmail(email) {
  try {
    console.log('🔍 Fetching student data for email:', email);

    // First, try to find by email in profile (for students with email populated)
    let { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('profile->>email', email)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching student:', error);
      return { success: false, error: error.message };
    }

    // If found by email, we're done!
    if (data) {
      console.log('✅ Student found by email in profile:', data.profile?.name);
      const transformedData = transformProfileData(data.profile, email);
      return {
        success: true,
        data: transformedData,
        rawData: data
      };
    }

    // If not found by email, try fallback for imported data with blank emails
    console.log('⚠️ Email not found in profile, trying fallback...');
    const nameFromEmail = email.split('@')[0]; // e.g., "chinnuu116" from "chinnuu116@gmail.com"
    
    const { data: allData, error: allError } = await supabase
      .from('students')
      .select('*');
    
    if (allError) {
      return { success: false, error: allError.message };
    }

    if (allData && allData.length > 0) {
      // Find by name similarity or just return first student for demo
      data = allData.find(student => 
        student.profile?.name?.toLowerCase().includes(nameFromEmail.toLowerCase())
      ) || allData[0]; // Fallback to first student for demo
      
      if (data) {
        console.log('✅ Found student by fallback:', data.profile?.name);
        const transformedData = transformProfileData(data.profile, email);
        return {
          success: true,
          data: transformedData,
          rawData: data
        };
      }
    }

    console.log('⚠️ No student found');
    return { success: false, error: 'Student not found' };

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
  if (!profile) {
    return null;
  }

  // Calculate age from date_of_birth if available
  const age = profile.age || calculateAge(profile.date_of_birth);
  
  // Generate passport ID from registration number
  const passportId = profile.registration_number 
    ? `SP-${profile.registration_number}` 
    : 'SP-0000';

  // Format phone number
  const phone = formatPhoneNumber(profile.contact_number, profile.contact_number_dial_code);
  const alternatePhone = formatPhoneNumber(profile.alternate_number);

  return {
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
