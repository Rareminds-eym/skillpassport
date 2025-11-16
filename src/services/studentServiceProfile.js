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

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

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
        schools:school_id (
          id,
          name,
          code,
          city,
          state
        ),
        university_colleges:university_college_id (
          id,
          name,
          code,
          universities:university_id (
            id,
            name,
            district,
            state
          )
        ),
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
        ),
        projects (
          id,
          title,
          description,
          status,
          start_date,
          end_date,
          duration,
          organization,
          tech_stack,
          demo_link,
          github_link,
          enabled,
          approval_status,
          created_at,
          updated_at,
          certificate_url,
          video_url,
          ppt_url
        ),
        certificates (*),
        experience (
        *
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
          schools:school_id (
            id,
            name,
            code,
            city,
            state
          ),
          university_colleges:university_college_id (
            id,
            name,
            code,
            universities:university_id (
              id,
              name,
              district,
              state
            )
          ),
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
          ),
          projects (
            id,
            title,
            description,
            status,
            start_date,
            end_date,
            duration,
            organization,
            tech_stack,
            demo_link,
            github_link,
            enabled,
            approval_status,
            created_at,
            updated_at,
            certificate_url,
            video_url,
            ppt_url
          ),
          certificates (*),
          experience (
            *
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
          schools:school_id (
            id,
            name,
            code,
            city,
            state
          ),
          university_colleges:university_college_id (
            id,
            name,
            code,
            universities:university_id (
              id,
              name,
              district,
              state
            )
          ),
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
          ),
          projects (
            id,
            title,
            description,
            status,
            start_date,
            end_date,
            duration,
            organization,
            tech_stack,
            demo_link,
            github_link,
            enabled,
            approval_status,
            created_at,
            updated_at,
            certificate_url,
            video_url,
            ppt_url
          ),
          certificates (*),
          experience (
            *
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

    // Transform profile data to consistent format, prioritizing individual columns
    const transformedProfile = transformProfileData(profileData, email, data);

    // Extract skill_passports data (if exists)
    const passport = data.skill_passports || {};

    const tableCertificates = Array.isArray(data?.certificates) ? data.certificates : [];
    const formattedTableCertificates = tableCertificates.map((certificate) => {
      const issuedOnValue = certificate?.issued_on || certificate?.issuedOn || null;
      const issuedOnFormatted = issuedOnValue ? new Date(issuedOnValue).toISOString().split("T")[0] : "";
      const approvalSource = certificate?.approval_status || certificate?.status || "pending";
      const approvalStatus = typeof approvalSource === "string" ? approvalSource.toLowerCase() : "pending";
      const statusSource = certificate?.status || (certificate?.enabled === false ? "disabled" : "active");
      const statusValue = typeof statusSource === "string" ? statusSource.toLowerCase() : "active";
      const documentUrlValue = certificate?.document_url || null;
      return {
        id: certificate?.id,
        title: certificate?.title || "",
        issuer: certificate?.issuer || "",
        issuedOn: issuedOnFormatted,
        level: certificate?.level || "",
        description: certificate?.description || "",
        credentialId: certificate?.credential_id || "",
        link: certificate?.link || "",
        status: statusValue,
        approval_status: approvalStatus,
        verified: approvalStatus === "approved",
        processing: approvalStatus !== "approved",
        enabled: statusValue !== "disabled",
        document_url: documentUrlValue,
        documentLink: documentUrlValue || "",
        createdAt: certificate?.created_at,
        updatedAt: certificate?.updated_at,
      };
    });

    const passportCertificates = Array.isArray(passport.certificates)
      ? passport.certificates.map((certificate) => ({
        ...certificate,
        verifiedAt:
          certificate?.verified === true || certificate?.status === 'verified'
            ? certificate?.verifiedAt || certificate?.updatedAt || certificate?.createdAt
            : null,
      }))
      : [];

    const mergedCertificates = formattedTableCertificates.length > 0 ? formattedTableCertificates : passportCertificates;

    const tableExperience = Array.isArray(data?.experience) ? data.experience : [];
    const formattedExperience = tableExperience.map((exp) => ({
      id: exp.id,
      organization: exp.organization || "",
      role: exp.role || "",
      start_date: exp.start_date,
      end_date: exp.end_date,
      duration: exp.duration || "",
      verified: exp.verified || false,
      approval_status: exp.approval_status || "pending",
      processing: exp.approval_status !== "approved",
      enabled: exp.approval_status !== "rejected",
      createdAt: exp.created_at,
      updatedAt: exp.updated_at,
    }));

    // Merge: database fields + profile fields + passport fields
    const mergedData = {
      id: data.id,
      student_id: data.student_id,
      universityId: data.universityId,
      email: data.email || transformedProfile.email,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,

      // School/University College linkage
      school_id: data.school_id,
      university_college_id: data.university_college_id,
      school: data.schools || null,
      universityCollege: data.university_colleges || null,

      // Profile data (from students.profile JSONB)
      profile: transformedProfile,

      // Legacy flattened access for backward compatibility
      ...transformedProfile,

      // NOW THESE COME FROM projects table:
      projects: Array.isArray(data.projects)
        ? data.projects.map((project) => ({
          ...project,
          // Map database column names to UI expected names
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
          start_date: project.start_date,
          end_date: project.end_date,
          duration: project.duration,
          tech: project.tech_stack, // UI expects 'tech' array
          tech_stack: project.tech_stack,
          link: project.demo_link, // UI expects 'link' for demo link
          demo_link: project.demo_link,
          organization: project.organization,
          github: project.github_link, // UI expects 'github'
          github_link: project.github_link,
          github_url: project.github_link,
          certificate_url: project.certificate_url,
          video_url: project.video_url,
          ppt_url: project.ppt_url,
          approval_status: project.approval_status,
          created_at: project.created_at,
          updated_at: project.updated_at,
          enabled: project.enabled ?? true, // Default to enabled for UI
          verifiedAt:
            project?.approval_status === 'approved' || project?.status === 'verified'
              ? project?.updated_at || project?.created_at
              : null
        }))
        : [],
      certificates: mergedCertificates,
      assessments: passport.assessments || [],

      experience: formattedExperience,


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
function transformProfileData(profile, email, studentRecord = null) {

  if (!profile && !studentRecord) {
    return null;
  }

  // Prioritize individual columns over profile JSONB
  const data = studentRecord || {};
  const profileData = profile || {};

  // Calculate age from date_of_birth if available (prioritize individual columns)
  const age = data.age || profileData.age || calculateAge(data.date_of_birth || data.dateOfBirth || profileData.date_of_birth || profileData.dateOfBirth);

  // Generate passport ID from registration number (prioritize individual columns)
  const registrationNumber = data.registration_number || profileData.registration_number || profileData.registrationNumber;
  const passportId = registrationNumber ? `SP-${registrationNumber}` : 'SP-0000';

  // Format phone number (prioritize individual columns)
  const phone = formatPhoneNumber(
    data.contact_number || data.contactNumber || profileData.contact_number || profileData.phone,
    data.contact_dial_code || profileData.contact_number_dial_code
  );
  const alternatePhone = formatPhoneNumber(data.alternate_number || profileData.alternate_number || profileData.alternatePhone);

  const result = {
    // Basic profile info (prioritize individual columns)
    profile: {
      name: data.name || profileData.name || 'Student',
      email: email || data.email || profileData.email || '', // Use login email if profile email is blank
      passportId: passportId,
      department: data.branch_field || profileData.branch_field || profileData.department || '',
      university: data.university || profileData.university || '',
      photo: generateAvatar(data.name || profileData.name),
      verified: true, // Assume imported data is verified
      employabilityScore: 75, // Default score
      cgpa: 'N/A',
      yearOfPassing: '',
      phone: phone,
      alternatePhone: alternatePhone,
      age: age,
      dateOfBirth: data.date_of_birth || data.dateOfBirth || profileData.date_of_birth || profileData.dateOfBirth,
      district: data.district_name || profileData.district_name || profileData.district || '',
      college: data.college_school_name || profileData.college_school_name || profileData.college || '',
      registrationNumber: registrationNumber,
      classYear: data.class_year || profileData.classYear || '',
      // Social Media Links (prioritize individual columns)
      github_link: data.github_link || profileData.github_link || '',
      portfolio_link: data.portfolio_link || profileData.portfolio_link || '',
      linkedin_link: data.linkedin_link || profileData.linkedin_link || '',
      twitter_link: data.twitter_link || profileData.twitter_link || '',
      instagram_link: data.instagram_link || profileData.instagram_link || '',
      facebook_link: data.facebook_link || profileData.facebook_link || '',
      other_social_links: data.other_social_links || profileData.other_social_links || [],
    },

    // Education - Will be fetched from separate 'education' table
    // Fallback to profile JSONB only if separate table is empty
    education: profileData.education || [
      {
        id: 1,
        degree: data.branch_field || profileData.branch_field || 'Not specified',
        university: data.university || profileData.university || 'Not specified',
        yearOfPassing: '',
        cgpa: data.currentCgpa || 'N/A',
        level: "Bachelor's", // Assume Bachelor's from branch_field
        status: 'ongoing'
      }
    ],

    // Training - Will be fetched from separate 'training' table
    // Fallback to profile JSONB only if separate table is empty
    training: profileData.training || [
      {
        id: 1,
        course: data.course_name || profileData.course || 'No course specified',
        progress: 75, // Default progress
        status: 'ongoing',
        skill: profileData.skill || '',
        trainer: data.trainer_name || profileData.trainer_name || ''
      }
    ],

    // Experience - Will be fetched from separate 'experience' table
    experience: profileData.experience || [],

    // Technical skills - Will be fetched from separate 'skills' table (type='technical')
    // Fallback to profile JSONB only if separate table is empty
    technicalSkills: profileData.technicalSkills || (profileData.skill ? [
      {
        id: 1,
        name: profileData.skill,
        level: 3,
        verified: true,
        icon: '🔬', // Science/lab icon
        category: data.course_name || profileData.course || 'Training'
      }
    ] : []),

    // Soft skills - Will be fetched from separate 'skills' table (type='soft')
    // Fallback to profile JSONB only if separate table is empty
    softSkills: profileData.softSkills || [
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

    projects: Array.isArray(profileData.projects)
      ? profileData.projects
      : Array.isArray(profileData.profile?.projects)
        ? profileData.profile.projects
        : Array.isArray(profileData.profile?.profile?.projects)
          ? profileData.profile.profile.projects
          : [],
    certificates: Array.isArray(profileData.certificates)
      ? profileData.certificates
      : Array.isArray(profileData.profile?.certificates)
        ? profileData.profile.certificates
        : Array.isArray(profileData.profile?.profile?.certificates)
          ? profileData.profile.profile.certificates
          : [],

    // Recent updates
    recentUpdates: [
      {
        id: 1,
        message: `Enrolled in ${data.course_name || profileData.course || 'course'}`,
        timestamp: data.imported_at || profileData.imported_at || new Date().toISOString(),
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
        message: `Continue your training in ${profileData.skill || 'your field'}`,
        priority: 2,
        isActive: true
      }
    ],

    // Opportunities
    opportunities: [
      {
        id: 1,
        title: `${profileData.skill || 'Technical'} Specialist`,
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

    // Prepare column updates for fields that have dedicated columns
    const columnUpdates = {};
    const profileOnlyUpdates = {};

    // Fields with dedicated columns (from migrate_students_to_columns.sql)
    const columnFields = ['name', 'email', 'phone', 'department', 'university', 'cgpa', 'employability_score', 'verified'];

    Object.keys(updates).forEach(key => {
      if (columnFields.includes(key)) {
        columnUpdates[key] = updates[key];
      } else {
        profileOnlyUpdates[key] = updates[key];
      }
    });

    // Merge updates into existing profile for non-column fields
    const updatedProfile = {
      ...currentProfile,
      ...profileOnlyUpdates
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

    // Prepare the update object
    const updateData = { ...columnUpdates };
    if (Object.keys(profileOnlyUpdates).length > 0 || Object.keys(updatedProfile).length > Object.keys(currentProfile).length) {
      updateData.profile = updatedProfile;
    }

    // Update using student ID (more reliable)
    const { data, error } = await supabase
      .from('students')
      .update(updateData)
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
export const updateExperienceByEmail = async (email, experienceData = []) => {
  try {
    // Find student record
    let studentRecord = null;

    const { data: directByEmail, error: directEmailError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('email', email)
      .maybeSingle();

    if (directEmailError) {
      return { success: false, error: directEmailError.message };
    }

    if (directByEmail) {
      studentRecord = directByEmail;
    }

    if (!studentRecord) {
      const { data: profileMatch, error: profileError } = await supabase
        .from('students')
        .select('id, user_id, profile')
        .eq('profile->>email', email)
        .maybeSingle();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      if (profileMatch) {
        studentRecord = profileMatch;
      }
    }

    if (!studentRecord) {
      const { data: allStudents, error: allError } = await supabase
        .from('students')
        .select('id, user_id, profile');

      if (allError) {
        return { success: false, error: allError.message };
      }

      for (const student of allStudents || []) {
        const profile = safeJSONParse(student.profile);
        if (profile?.email === email) {
          studentRecord = student;
          break;
        }
      }
    }

    if (!studentRecord) {
      return { success: false, error: 'Student not found' };
    }

    // Use user_id as student_id (as per foreign key constraint)
    const studentId = studentRecord.user_id;

    // Get existing experience records
    const { data: existingExperience, error: existingError } = await supabase
      .from('experience')
      .select('id')
      .eq('student_id', studentId);

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format experience data for database
    const formatted = (experienceData || [])
      .filter((exp) => exp && typeof exp.role === 'string' && exp.role.trim().length > 0)
      .map((exp) => {
        const record = {
          student_id: studentId,
          organization: exp.organization?.trim() || null,
          role: exp.role?.trim() || "",
          start_date: exp.start_date || null,
          end_date: exp.end_date || null,
          duration: exp.duration?.trim() || null,
          verified: exp.verified || false,
          approval_status: exp.approval_status || 'pending',
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof exp.id === 'string' ? exp.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.filter((record) => record.id).map((record) => record.id));
    const toDelete = (existingExperience || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('experience')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
    }

    // Upsert experience records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('experience')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
    } else if ((existingExperience || []).length > 0) {
      // Delete all if no experience data provided
      const { error: deleteAllError } = await supabase
        .from('experience')
        .delete()
        .eq('student_id', studentId);

      if (deleteAllError) {
        return { success: false, error: deleteAllError.message };
      }
    }

    // Return updated student data
    return await getStudentByEmail(email);
  } catch (err) {
    console.error('❌ updateExperienceByEmail exception:', err);
    return { success: false, error: err.message };
  }
};

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
    // 1️⃣ Find student.id by email
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .single();

    if (studentError || !student) {
      return { success: false, error: 'Student not found' };
    }

    const studentId = student.id;

    // 2️⃣ Clear existing projects for this student (simplest sync method)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('student_id', studentId);

    if (deleteError) {
      console.error('❌ Error deleting old projects:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // 3️⃣ Prepare new projects array for insert
    const formatted = projectsData.map((p) => ({
      student_id: studentId,
      title: p.title || 'Untitled Project',
      description: p.description || null,
      status: p.status || null,
      start_date: p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : null,
      end_date: p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : null,
      duration: p.duration || null,
      tech_stack: Array.isArray(p.tech) ? p.tech : Array.isArray(p.tech_stack) ? p.tech_stack : [],
      demo_link: p.link || p.demo_link || null,
      organization: p.organization || null,
      github_link:
        p.github ||
        p.github_link ||
        p.github_url ||
        p.githubLink ||
        null,
      certificate_url: p.certificate_url || p.certificateLink || null,
      video_url: p.video_url || p.videoLink || null,
      ppt_url: p.ppt_url || p.pptLink || null,
      approval_status: p.approval_status || 'pending',
      enabled:
        typeof p.enabled === 'boolean'
          ? p.enabled
          : typeof p.enabled === 'string'
            ? p.enabled.toLowerCase() === 'true'
            : true,
      created_at: p.createdAt || p.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // 4️⃣ Insert new rows
    const { error: insertError } = await supabase
      .from('projects')
      .insert(formatted);

    if (insertError) {
      console.error('❌ Error inserting projects:', insertError);
      return { success: false, error: insertError.message };
    }

    // 5️⃣ Return success
    return { success: true };
  } catch (err) {
    console.error('❌ updateProjectsByEmail exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update certificates table records
 */
export const updateCertificatesByEmail = async (email, certificatesData = []) => {
  try {
    let studentRecord = null;

    const { data: directByEmail, error: directEmailError } = await supabase
      .from('students')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (directEmailError) {
      return { success: false, error: directEmailError.message };
    }

    if (directByEmail) {
      studentRecord = directByEmail;
    }

    if (!studentRecord) {
      const { data: profileMatch, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('profile->>email', email)
        .maybeSingle();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      if (profileMatch) {
        studentRecord = profileMatch;
      }
    }

    if (!studentRecord) {
      const { data: allStudents, error: allError } = await supabase
        .from('students')
        .select('*');

      if (allError) {
        return { success: false, error: allError.message };
      }

      for (const student of allStudents || []) {
        const profile = safeJSONParse(student.profile);
        if (profile?.email === email) {
          studentRecord = student;
          break;
        }
      }
    }

    if (!studentRecord) {
      return { success: false, error: 'Student not found' };
    }

    const studentId = studentRecord.id;

    const { data: existingCertificates, error: existingError } = await supabase
      .from('certificates')
      .select('id')
      .eq('student_id', studentId);

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    const normalizeIssuedOn = (value) => {
      if (!value) {
        return null;
      }
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return null;
      }
      return parsed.toISOString().split('T')[0];
    };

    const nowIso = new Date().toISOString();

    const formatted = (certificatesData || [])
      .filter((cert) => cert && typeof cert.title === 'string' && cert.title.trim().length > 0)
      .map((cert) => {
        const titleValue = cert.title.trim();
        const issuerValue = typeof cert.issuer === 'string' ? cert.issuer.trim() : cert.issuer || null;
        const levelValue = typeof cert.level === 'string' ? cert.level.trim() : cert.level || null;
        const credentialValue = cert.credentialId || cert.credential_id || null;
        const credentialTrimmed = typeof credentialValue === 'string' ? credentialValue.trim() : credentialValue;
        const linkValue = typeof cert.link === 'string' ? cert.link.trim() : cert.link || null;
        const descriptionValue = typeof cert.description === 'string' ? cert.description.trim() : cert.description || null;
        const approvalSource = cert.approval_status || cert.status || 'pending';
        const approvalStatus = typeof approvalSource === 'string' ? approvalSource.toLowerCase() : 'pending';
        const statusSource = cert.status || (cert.enabled === false ? 'disabled' : 'active');
        const statusValue = typeof statusSource === 'string' ? statusSource.trim().toLowerCase() : 'active';
        const documentValue = cert.document_url || cert.documentLink || null;
        const documentTrimmed = typeof documentValue === 'string' ? documentValue.trim() : documentValue;
        const issuedOn = normalizeIssuedOn(cert.issuedOn || cert.issued_on);
        const record = {
          student_id: studentId,
          title: titleValue,
          issuer: issuerValue && issuerValue.length > 0 ? issuerValue : null,
          level: levelValue && levelValue.length > 0 ? levelValue : null,
          credential_id: credentialTrimmed && credentialTrimmed.length > 0 ? credentialTrimmed : null,
          link: linkValue && linkValue.length > 0 ? linkValue : null,
          issued_on: issuedOn,
          description: descriptionValue && descriptionValue.length > 0 ? descriptionValue : null,
          status: statusValue,
          approval_status: approvalStatus,
          document_url: documentTrimmed && documentTrimmed.length > 0 ? documentTrimmed : null,
          updated_at: nowIso,
        };

        const rawId = typeof cert.id === 'string' ? cert.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    const incomingIds = new Set(formatted.filter((record) => record.id).map((record) => record.id));

    const toDelete = (existingCertificates || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('certificates')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
    }

    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('certificates')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
    } else if ((existingCertificates || []).length > 0) {
      const { error: deleteAllError } = await supabase
        .from('certificates')
        .delete()
        .eq('student_id', studentId);

      if (deleteAllError) {
        return { success: false, error: deleteAllError.message };
      }
    }

    return await getStudentByEmail(email);
  } catch (err) {
    console.error('❌ updateCertificatesByEmail exception:', err);
    return { success: false, error: err.message };
  }
};