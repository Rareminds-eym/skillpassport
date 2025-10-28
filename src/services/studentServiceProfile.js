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
      // Add the database ID to the transformed data
      transformedData.id = data.id;
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
      // Add the database ID to the transformed data
      transformedData.id = matchingStudent.id;
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
 * Create a new student profile if it doesn't exist
 */
export async function createStudentProfileByEmail(email, initialData = {}) {
  try {
    console.log('🆕 Creating new student profile for:', email);
    
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

    console.log('✅ Student profile created successfully');
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
      console.log('✅ Found existing student profile');
      return existingResult;
    }
    
    // If not found, create a new profile
    console.log('📝 Student not found, creating new profile...');
    return await createStudentProfileByEmail(email, initialData);
    
  } catch (err) {
    console.error('❌ Error in getOrCreateStudentByEmail:', err);
    return { success: false, error: err.message };
  }
}
export async function updateStudentByEmail(email, updates) {
  try {
    console.log('💾 updateStudentByEmail called');
    console.log('   - Email:', email);
    console.log('   - Updates:', updates);

    // Find student record using robust method
    const findResult = await findStudentByEmail(email);
    if (!findResult.success) {
      console.error('❌ Failed to find student:', findResult.error);
      return findResult;
    }

    const studentRecord = findResult.data;
    console.log('✅ Found student record:', studentRecord.id);
    
    const currentProfile = safeJSONParse(studentRecord.profile);
    console.log('📋 Current profile:', currentProfile);

    // Merge updates into existing profile AT THE ROOT LEVEL
    // This ensures fields like 'name' are stored at profile.name, not profile.profile.name
    const updatedProfile = {
      ...currentProfile,
      ...updates
    };
    
    console.log('📋 Updated profile (root level merge):', updatedProfile);
    
    // Log the specific fields being updated
    console.log('🔍 Checking updated fields:');
    console.log('   - name:', updatedProfile.name);
    console.log('   - email:', updatedProfile.email);
    console.log('   - university:', updatedProfile.university);

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
    
    console.log('📋 Final profile to save:', JSON.stringify(updatedProfile).substring(0, 300));
    console.log('💾 Saving to Supabase...');

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

    console.log('✅ Supabase update successful');
    console.log('📋 Returned data:', data);
    
    const transformedData = transformProfileData(data.profile, email);
    console.log('📋 Transformed data:', transformedData);
    
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
    console.log('📚 Updating education for:', email);
    
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
      console.log('✅ Found student by direct JSONB query');
    } else {
      console.log('🔍 Direct query failed, trying manual search...');
      
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
          console.log('✅ Found student by manual search');
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

    console.log('💾 Updating profile with new education data...');

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

    console.log('✅ Education updated successfully');
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
    console.log('🔍 Finding student by email:', email);
    
    // Try JSONB query first
    let { data: directData, error: directError } = await supabase
      .from('students')
      .select('*')
      .eq('profile->>email', email)
      .maybeSingle();

    if (directData) {
      console.log('✅ Found student by direct JSONB query');
      return { success: true, data: directData };
    }
    
    console.log('🔍 Direct query failed, trying manual search...');
    
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
        console.log('✅ Found student by manual search');
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
    console.log('🎓 Updating training for:', email);
    
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

    console.log('💾 Updating profile with new training data...');

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

    console.log('✅ Training updated successfully');
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
    console.log('💼 Updating experience for:', email);
    
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

    console.log('💾 Updating profile with new experience data...');

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

    console.log('✅ Experience updated successfully');
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
    console.log('⚡ Updating technical skills for:', email);
    
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

    console.log('💾 Updating profile with new technical skills data...');

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

    console.log('✅ Technical skills updated successfully');
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
    console.log('🤝 Updating soft skills for:', email);
    
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

    console.log('💾 Updating profile with new soft skills data...');

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

    console.log('✅ Soft skills updated successfully');
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
 * Update projects array in student profile
 */
export async function updateProjectsByEmail(email, projectsData) {
  try {
    console.log('🚀 Updating projects for:', email);
    
    // Find student record
    const findResult = await findStudentByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const studentRecord = findResult.data;
    const currentProfile = safeJSONParse(studentRecord.profile);
    
    const updatedProfile = {
      ...currentProfile,
      projects: projectsData
    };

    console.log('💾 Updating profile with new projects data...');

    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('id', studentRecord.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating projects:', error);
      throw error;
    }

    console.log('✅ Projects updated successfully');
    return {
      success: true,
      data: transformProfileData(data.profile, email)
    };
  } catch (err) {
    console.error('❌ Error updating projects:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update certificates array in student profile
 */
export async function updateCertificatesByEmail(email, certificatesData) {
  try {
    console.log('📜 Updating certificates for:', email);
    
    // Find student record
    const findResult = await findStudentByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const studentRecord = findResult.data;
    const currentProfile = safeJSONParse(studentRecord.profile);
    
    const updatedProfile = {
      ...currentProfile,
      certificates: certificatesData
    };

    console.log('💾 Updating profile with new certificates data...');

    const { data, error } = await supabase
      .from('students')
      .update({ profile: updatedProfile })
      .eq('id', studentRecord.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating certificates:', error);
      throw error;
    }

    console.log('✅ Certificates updated successfully');
    return {
      success: true,
      data: transformProfileData(data.profile, email)
    };
  } catch (err) {
    console.error('❌ Error updating certificates:', err);
    return { success: false, error: err.message };
  }
}