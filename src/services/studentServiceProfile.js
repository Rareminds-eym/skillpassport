/*
Connected to Database - Changes will be saved
✅ Functions Fixed
All verification functions are now properly defined. The DatabaseSaveVerification component should work correctly.

Refresh the page to test all sections!
🔍 Database Save Verification
Test Education Save
Test Technical Skills
Test Training
Test Experience
Test Soft Skills
🚀 Test ALL Sections
Clear Results
Connection Status:
Email: harrishhari2006@gmail.com
Profile data loaded
Test Results:
No tests run yet. Click a test button above.

How to verify manually:
1. Run a test above and see "SUCCESS" message
2. Go to your Supabase dashboard
3. Open Table Editor → students table
4. Find your profile row and click the "profile" JSONB cell
5. Look for the test data in the arrays:
• education: [...] - Education records
• training: [...] - Training courses
• experience: [...] - Work experience
• technicalSkills: [...] - Technical skills
• softSkills: [...] - Soft skills
🐛 Student Finding Debug Tool
User Email: harrishhari2006@gmail.com

Test JSONB Query
Test Manual Search
🚀 Test ALL Sections
Education
Training
Experience
Tech Skills
Soft Skills
Clear Results
Debug Results:
No tests run yet. Click buttons above to debug.

What this tests:
• JSONB Query: Tests if profile->>email query works
• Manual Search: Fallback method that should always work
• Individual Sections: Test each data type separately
• Test ALL Sections: Comprehensive test of all 5 data types
• Verifies: Education, Training, Experience, Technical Skills, Soft Skills
*/
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
export const getStudentByEmail = async (email) => {
  try {
    
    // STRATEGY 1: Try students.email column first (if it exists and is populated)
    let { data, error } = await supabase
      .from('students')
      .select(`
        *,
        skill_passports (
          id,
          projects,
          certificates,
          assessments,
          status,
          aiVerification,
          nsqfLevel,
          skills,
          createdAt,
          updatedAt
        )
      `)
      .eq('email', email)
      .maybeSingle();


    // STRATEGY 2: If not found, try JSONB profile query
    if (!data && !error) {
      const result = await supabase
        .from('students')
        .select(`
          *,
          skill_passports (
            id,
            projects,
            certificates,
            assessments,
            status,
            aiVerification,
            nsqfLevel,
            skills,
            createdAt,
            updatedAt
          )
        `)
        .eq('profile->>email', email)
        .maybeSingle();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('❌ Supabase error:', error);
      return { success: false, error: error.message };
    }

    // STRATEGY 3: If JSONB operator doesn't work, manual search
    if (!data) {
      const { data: allStudents, error: allError } = await supabase
        .from('students')
        .select(`
          *,
          skill_passports (
            id,
            projects,
            certificates,
            assessments,
            status,
            aiVerification,
            nsqfLevel,
            skills,
            createdAt,
            updatedAt
          )
        `);

      if (allError) {
        console.error('❌ Error fetching all students:', allError);
        return { success: false, error: allError.message };
      }


      // Manually search for matching email
      data = allStudents?.find(student => {
        const profileData = safeJSONParse(student.profile);
        const studentEmail = profileData?.email;
        return studentEmail?.toLowerCase() === email.toLowerCase();
      });

      if (!data) {
        return { success: false, error: 'No data found for this email.' };
      }
    }


    // Parse the profile JSONB
    const profileData = safeJSONParse(data.profile);
    
    // Transform profile data to consistent format
    const transformedProfile = transformProfileData(profileData, email);

    // Extract skill_passports data (if exists)
    const passport = data.skill_passports || {};

    // Merge: database fields + profile fields + passport fields
    const mergedData = {
      id: data.id,
      universityId: data.universityId,
      email: data.email || transformedProfile.email,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      
      // Profile data (from students.profile JSONB)
      profile: transformedProfile,
      
      // Legacy flattened access for backward compatibility
      ...transformedProfile,
      
      // NOW THESE COME FROM skill_passports table (NOT from profile):
      projects: Array.isArray(passport.projects)
        ? passport.projects
          .map((project) => ({
            ...project,
            verifiedAt:
              project?.verified === true || project?.status === 'verified'
                ? project?.verifiedAt || project?.updatedAt || project?.createdAt
                : null
          }))
        : [],
      certificates: Array.isArray(passport.certificates)
        ? passport.certificates
          .map((certificate) => ({
            ...certificate,
            verifiedAt:
              certificate?.verified === true || certificate?.status === 'verified'
                ? certificate?.verifiedAt || certificate?.updatedAt || certificate?.createdAt
                : null
          }))
        : [],
      assessments: passport.assessments || [],
      
      // Passport metadata:
      passportId: passport.id,
      passportStatus: passport.status,
      aiVerification: passport.aiVerification,
      nsqfLevel: passport.nsqfLevel,
      passportSkills: passport.skills || [],
      
      // Raw data for debugging
      rawData: data
    };

    return { success: true, data: mergedData };
  } catch (err) {
    console.error('❌ getStudentByEmail exception:', err);
    return { success: false, error: err.message };
  }
};

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
      // Social Media Links
      github_link: profile.github_link || '',
      portfolio_link: profile.portfolio_link || '',
      linkedin_link: profile.linkedin_link || '',
      twitter_link: profile.twitter_link || '',
      instagram_link: profile.instagram_link || '',
      facebook_link: profile.facebook_link || '',
      other_social_links: profile.other_social_links || [],
    },
    
    // Education - Build from imported data OR use existing from profile
    education: profile.education || [
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
    
    // Training - Build from course and skill OR use existing from profile
    training: profile.training || [
      {
        id: 1,
        course: profile.course || 'No course specified',
        progress: 75, // Default progress
        status: 'ongoing',
        skill: profile.skill || '',
        trainer: profile.trainer_name || ''
      }
    ],
    
    // Experience - Use existing from profile or empty
    experience: profile.experience || [],
    
    // Technical skills - Use existing or build from skill field
    technicalSkills: profile.technicalSkills || (profile.skill ? [
      {
        id: 1,
        name: profile.skill,
        level: 3,
        verified: true,
        icon: '🔬', // Science/lab icon
        category: profile.course || 'Training'
      }
    ] : []),
    
    // Soft skills - Use existing or default set
    softSkills: profile.softSkills || [
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

    projects: Array.isArray(profile.projects)
      ? profile.projects
      : Array.isArray(profile.profile?.projects)
        ? profile.profile.projects
        : Array.isArray(profile.profile?.profile?.projects)
          ? profile.profile.profile.projects
          : [],
    certificates: Array.isArray(profile.certificates)
      ? profile.certificates
      : Array.isArray(profile.profile?.certificates)
        ? profile.profile.certificates
        : Array.isArray(profile.profile?.profile?.certificates)
          ? profile.profile.profile.certificates
          : [],
    
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
 * Create a new student profile if it doesn't exist
 */
export async function createStudentProfileByEmail(email, initialData = {}) {
  try {
    
    const defaultProfile = {
      name: initialData.name || 'New Student',
      email: email,
      department: initialData.department || '',
      university: initialData.university || '',
      photo: generateAvatar(initialData.name || 'New Student'),
      verified: false,
      employabilityScore: 50,
      cgpa: '',
      yearOfPassing: '',
      phone: '',
      
      // Initialize empty arrays for data
      education: [],
      training: [],
      experience: [],
      technicalSkills: [],
      softSkills: [
        {
          id: 1,
          name: 'Communication',
          level: 3,
          type: 'communication',
          description: 'Effective communication skills'
        },
        {
          id: 2,
          name: 'Teamwork',
          level: 3,
          type: 'collaboration',
          description: 'Works well in teams'
        }
      ],
      
      // Additional fields
      recentUpdates: [
        {
          id: 1,
          message: 'Profile created',
          timestamp: new Date().toISOString(),
          type: 'profile'
        }
      ],
      suggestions: [
        {
          id: 1,
          message: 'Complete your profile information',
          priority: 3,
          isActive: true
        }
      ],
      opportunities: []
    };

    const { data, error } = await supabase
      .from('students')
      .insert([{
        profile: defaultProfile,
        universityId: initialData.universityId || null
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating student profile:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: transformProfileData(data.profile, email)
    };

  } catch (err) {
    console.error('❌ Unexpected error creating profile:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get or create student profile by email
 */
export async function getOrCreateStudentByEmail(email, initialData = {}) {
  try {
    // First try to get existing profile
    const existingResult = await getStudentByEmail(email);
    
    if (existingResult.success && existingResult.data) {
      return existingResult;
    }
    
    // If not found, create a new profile
    return await createStudentProfileByEmail(email, initialData);
    
  } catch (err) {
    console.error('❌ Error in getOrCreateStudentByEmail:', err);
    return { success: false, error: err.message };
  }
}
export async function updateStudentByEmail(email, updates) {
  try {

    // Find student record using robust method
    const findResult = await findStudentByEmail(email);
    if (!findResult.success) {
      console.error('❌ Failed to find student:', findResult.error);
      return findResult;
    }

    const studentRecord = findResult.data;
    
    const currentProfile = safeJSONParse(studentRecord.profile);

    // Merge updates into existing profile
    const updatedProfile = {
      ...currentProfile,
      ...updates
    };

    const nestedSyncKeys = ['projects', 'certificates'];
    if (updatedProfile && typeof updatedProfile === 'object') {
      if (updatedProfile.profile && typeof updatedProfile.profile === 'object') {
        let outerProfile = updatedProfile.profile;
        let outerChanged = false;
        nestedSyncKeys.forEach((key) => {
          if (updates[key] !== undefined) {
            if (!outerChanged) {
              outerProfile = { ...outerProfile };
              outerChanged = true;
            }
            outerProfile[key] = updates[key];
          }
        });
        if (outerChanged) {
          updatedProfile.profile = outerProfile;
        }
        if (outerProfile.profile && typeof outerProfile.profile === 'object') {
          let innerProfile = outerProfile.profile;
          let innerChanged = false;
          nestedSyncKeys.forEach((key) => {
            if (updates[key] !== undefined) {
              if (!innerChanged) {
                innerProfile = { ...innerProfile };
                innerChanged = true;
              }
              innerProfile[key] = updates[key];
            }
          });
          if (innerChanged) {
            updatedProfile.profile = {
              ...updatedProfile.profile,
              profile: innerProfile,
            };
          }
        }
      }
    }
    

    // Update using student ID (more reliable)
    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('id', studentRecord.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return { success: false, error: error.message };
    }

    
    const transformedData = transformProfileData(data.profile, email);
    
    return {
      success: true,
      data: transformedData
    };

  } catch (err) {
    console.error('❌ Unexpected error in updateStudentByEmail:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update education array in student profile
 */
export async function updateEducationByEmail(email, educationData) {
  try {
    
    // First, find the student record using the same logic as getStudentByEmail
    let studentRecord = null;
    
    // Try JSONB query first
    let { data: directData, error: directError } = await supabase
      .from('students')
      .select('*')
      .eq('profile->>email', email)
      .maybeSingle();

    if (directData) {
      studentRecord = directData;
    } else {
      
      // Fallback: get all students and search manually
      const { data: allStudents, error: allError } = await supabase
        .from('students')
        .select('*');

      if (allError) {
        console.error('❌ Error fetching all students:', allError);
        return { success: false, error: allError.message };
      }

      // Find student with matching email
      for (const student of allStudents || []) {
        const profile = safeJSONParse(student.profile);
        if (profile?.email === email) {
          studentRecord = student;
          break;
        }
      }
    }

    if (!studentRecord) {
      console.error('❌ Student not found for email:', email);
      return { success: false, error: 'Student not found' };
    }

    const currentProfile = safeJSONParse(studentRecord.profile);
    
    // Update education array
    const updatedProfile = {
      ...currentProfile,
      education: educationData
    };


    // Update using the student ID (more reliable than JSONB query)
    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('id', studentRecord.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating education:', error);
      throw error;
    }

    return {
      success: true,
      data: transformProfileData(data.profile, email)
    };
  } catch (err) {
    console.error('❌ Error updating education:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Helper function to find student record by email (robust method)
 */
async function findStudentByEmail(email) {
  try {
    
    // Try JSONB query first
    let { data: directData, error: directError } = await supabase
      .from('students')
      .select('*')
      .eq('profile->>email', email)
      .maybeSingle();

    if (directData) {
      return { success: true, data: directData };
    }
    
    
    // Fallback: get all students and search manually
    const { data: allStudents, error: allError } = await supabase
      .from('students')
      .select('*');

    if (allError) {
      console.error('❌ Error fetching all students:', allError);
      return { success: false, error: allError.message };
    }

    // Find student with matching email
    for (const student of allStudents || []) {
      const profile = safeJSONParse(student.profile);
      if (profile?.email === email) {
        return { success: true, data: student };
      }
    }

    console.error('❌ Student not found for email:', email);
    return { success: false, error: 'Student not found' };
    
  } catch (err) {
    console.error('❌ Error finding student:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update training array in student profile
 */
export async function updateTrainingByEmail(email, trainingData) {
  try {
    
    // Find student record
    const findResult = await findStudentByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const studentRecord = findResult.data;
    const currentProfile = safeJSONParse(studentRecord.profile);
    
    const updatedProfile = {
      ...currentProfile,
      training: trainingData
    };


    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('id', studentRecord.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating training:', error);
      throw error;
    }

    return {
      success: true,
      data: transformProfileData(data.profile, email)
    };
  } catch (err) {
    console.error('❌ Error updating training:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update experience array in student profile
 */
export async function updateExperienceByEmail(email, experienceData) {
  try {
    
    // Find student record
    const findResult = await findStudentByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const studentRecord = findResult.data;
    const currentProfile = safeJSONParse(studentRecord.profile);
    
    const updatedProfile = {
      ...currentProfile,
      experience: experienceData
    };


    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('id', studentRecord.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating experience:', error);
      throw error;
    }

    return {
      success: true,
      data: transformProfileData(data.profile, email)
    };
  } catch (err) {
    console.error('❌ Error updating experience:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update technical skills array in student profile
 */
export async function updateTechnicalSkillsByEmail(email, skillsData) {
  try {
    
    // Find student record
    const findResult = await findStudentByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const studentRecord = findResult.data;
    const currentProfile = safeJSONParse(studentRecord.profile);
    
    const updatedProfile = {
      ...currentProfile,
      technicalSkills: skillsData
    };


    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('id', studentRecord.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating technical skills:', error);
      throw error;
    }

    return {
      success: true,
      data: transformProfileData(data.profile, email)
    };
  } catch (err) {
    console.error('❌ Error updating technical skills:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update soft skills array in student profile
 */
export async function updateSoftSkillsByEmail(email, skillsData) {
  try {
    
    // Find student record
    const findResult = await findStudentByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const studentRecord = findResult.data;
    const currentProfile = safeJSONParse(studentRecord.profile);
    
    const updatedProfile = {
      ...currentProfile,
      softSkills: skillsData
    };


    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('id', studentRecord.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating soft skills:', error);
      throw error;
    }

    return {
      success: true,
      data: transformProfileData(data.profile, email)
    };
  } catch (err) {
    console.error('❌ Error updating soft skills:', err);
    return { success: false, error: err.message };
  }
}


/**
 * Update projects in skill_passports table
 */
export const updateProjectsByEmail = async (email, projectsData) => {
  try {

    // 1. Get student ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .single();

    if (studentError || !student) {
      return { success: false, error: 'Student not found' };
    }

    // 2. Update skill_passports.projects
    const { data: passport, error: passportError } = await supabase
      .from('skill_passports')
      .update({ projects: projectsData })
      .eq('studentId', student.id)
      .select()
      .single();

    if (passportError) {
      console.error('❌ Error updating projects:', passportError);
      return { success: false, error: passportError.message };
    }

    // 3. Fetch fresh merged data
    const result = await getStudentByEmail(email);
    return result;
  } catch (err) {
    console.error('❌ updateProjectsByEmail exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update certificates in skill_passports table
 */
export const updateCertificatesByEmail = async (email, certificatesData) => {
  try {

    // 1. Get student ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .single();

    if (studentError || !student) {
      return { success: false, error: 'Student not found' };
    }

    // 2. Update skill_passports.certificates
    const { data: passport, error: passportError } = await supabase
      .from('skill_passports')
      .update({ certificates: certificatesData })
      .eq('studentId', student.id)
      .select()
      .single();

    if (passportError) {
      console.error('❌ Error updating certificates:', passportError);
      return { success: false, error: passportError.message };
    }

    // 3. Fetch fresh merged data
    const result = await getStudentByEmail(email);
    return result;
  } catch (err) {
    console.error('❌ updateCertificatesByEmail exception:', err);
    return { success: false, error: err.message };
  }
};