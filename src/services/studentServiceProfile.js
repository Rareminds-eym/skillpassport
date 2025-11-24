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
        ),
        skills(*),
        trainings (*),
        education (*) 
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
          ),
          skills(*),
          trainings (*),
          education (*) 
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
          ),
          skills(*),
          trainings (*),
          education (*) 
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
  // Format skills from skills table
const tableSkills = Array.isArray(data?.skills) ? data.skills : [];
const technicalSkills = tableSkills
  .filter(skill => skill.type === 'technical')
  .map(skill => ({
    id: skill.id,
    name: skill.name,
    level: skill.level || 3,
    description: skill.description || '',
    verified: skill.verified || false,
    enabled: skill.enabled ?? true,
    approval_status: skill.approval_status || 'pending',
    createdAt: skill.created_at,
    updatedAt: skill.updated_at,
  }));

const softSkills = tableSkills
  .filter(skill => skill.type === 'soft')
  .map(skill => ({
    id: skill.id,
    name: skill.name,
    level: skill.level || 3,
    type: skill.name.toLowerCase(), // For UI compatibility
    description: skill.description || '',
    verified: skill.verified || false,
    enabled: skill.enabled ?? true,
    approval_status: skill.approval_status || 'pending',
    createdAt: skill.created_at,
    updatedAt: skill.updated_at,
  }));

//   // Format education from education table
// const tableEducation = Array.isArray(data?.education) ? data.education : [];
// const formattedEducation = tableEducation.map((edu) => ({
//   id: edu.id,
//   level: edu.level || "Bachelor's",
//   degree: edu.degree || "",
//   department: edu.department || "",
//   university: edu.university || "",
//   yearOfPassing: edu.year_of_passing || "",
//   cgpa: edu.cgpa || "",
//   status: edu.status || "ongoing",
//   approval_status: edu.approval_status || "pending",
//   verified: edu.approval_status === "approved",
//   processing: edu.approval_status !== "approved",
//   enabled: edu.approval_status !== "rejected",
//   createdAt: edu.created_at,
//   updatedAt: edu.updated_at,
// }));

// console.log('📚 Formatted education records:', formattedEducation.length);
// Format education from education table
const tableEducation = Array.isArray(data?.education) ? data.education : [];
const formattedEducation = tableEducation
  .filter((edu) => edu.approval_status === 'approved' || edu.approval_status === 'verified') // Only show approved/verified
  .map((edu) => ({
    id: edu.id,
    level: edu.level || "Bachelor's",
    degree: edu.degree || "",
    department: edu.department || "",
    university: edu.university || "",
    yearOfPassing: edu.year_of_passing || "",
    cgpa: edu.cgpa || "",
    status: edu.status || "ongoing",
    approval_status: edu.approval_status || "pending",
    verified: edu.approval_status === "approved" || edu.approval_status === "verified",
    processing: false, // Already filtered, so won't be pending
    enabled: true, // Already filtered, so all are enabled
    createdAt: edu.created_at,
    updatedAt: edu.updated_at,
  }));

console.log('📚 Formatted education records:', formattedEducation.length);

// const tableTrainings = Array.isArray(data?.trainings) ? data.trainings : [];
  
// const formattedTrainings = tableTrainings.map((train) => ({
//   id: train.id,
//   title: train.title || "",
//   course: train.title || "", // Map title to course for backward compatibility
//   organization: train.organization || "",
//   start_date: train.start_date,
//   end_date: train.end_date,
//   duration: train.duration || "",
//   description: train.description || "",
//   status: train.status || "ongoing",
//   completedModules: train.completed_modules || 0,
//   totalModules: train.total_modules || 0,
//   hoursSpent: train.hours_spent || 0,
//   approval_status: train.approval_status || "pending",
//   verified: train.approval_status === "approved",
//   processing: train.approval_status !== "approved",
//   enabled: train.approval_status !== "rejected",
//   createdAt: train.created_at,
//   updatedAt: train.updated_at,
// }));
// const tableTrainings = Array.isArray(data?.trainings) ? data.trainings : [];

// // Fetch all training IDs
// const trainingIds = tableTrainings.map(t => t.id).filter(Boolean);

// // Fetch all certificates linked to these trainings
// const { data: trainingCertificates } = await supabase
//   .from('certificates')
//   .select('training_id, link')
//   .in('training_id', trainingIds);

// // Fetch all skills linked to these trainings
// const { data: trainingSkills } = await supabase
//   .from('skills')
//   .select('training_id, name')
//   .in('training_id', trainingIds)
//   .eq('type', 'technical');

// console.log('🔗 Found', trainingCertificates?.length || 0, 'training certificates');
// console.log('🔗 Found', trainingSkills?.length || 0, 'training skills');

// const formattedTrainings = tableTrainings.map((train) => {
//   // Find certificate for this specific training
//   const cert = (trainingCertificates || []).find(c => c.training_id === train.id);
  
//   // Find skills for this specific training
//   const skills = (trainingSkills || [])
//     .filter(s => s.training_id === train.id)
//     .map(s => s.name);

//   return {
//     id: train.id,
//     title: train.title || "",
//     course: train.title || "",
//     organization: train.organization || "",
//     provider: train.organization || "",
//     start_date: train.start_date,
//     end_date: train.end_date,
//     startDate: train.start_date,
//     endDate: train.end_date,
//     duration: train.duration || "",
//     description: train.description || "",
    
//     // From trainings table
//     status: train.status || "ongoing",
//     completedModules: train.completed_modules || 0,
//     totalModules: train.total_modules || 0,
//     hoursSpent: train.hours_spent || 0,
    
//     // From certificates table (linked by training_id)
//     certificateUrl: cert?.link|| "",
    
//     // From skills table (linked by training_id)
//     skills: skills,
    
//     approval_status: train.approval_status || "pending",
//     verified: train.approval_status === "approved",
//     processing: train.approval_status !== "approved",
//     enabled: train.approval_status !== "rejected",
//     createdAt: train.created_at,
//     updatedAt: train.updated_at,
//   };
// });

// console.log('📚 Formatted training records:', formattedTrainings.length);
const tableTrainings = Array.isArray(data?.trainings) ? data.trainings : [];

// Filter to only approved/verified trainings first
const approvedTrainings = tableTrainings.filter(
  (train) => train.approval_status === 'approved' || train.approval_status === 'verified'
);

// Fetch all training IDs (only from approved trainings)
const trainingIds = approvedTrainings.map(t => t.id).filter(Boolean);

// Only fetch certificates and skills if there are approved trainings
let trainingCertificates = [];
let trainingSkills = [];

if (trainingIds.length > 0) {
  // Fetch all certificates linked to these trainings
  const { data: certData } = await supabase
    .from('certificates')
    .select('training_id, link')
    .in('training_id', trainingIds);
  
  trainingCertificates = certData || [];

  // Fetch all skills linked to these trainings
  const { data: skillsData } = await supabase
    .from('skills')
    .select('training_id, name')
    .in('training_id', trainingIds)
    .eq('type', 'technical');
  
  trainingSkills = skillsData || [];
}

console.log('🔗 Found', trainingCertificates.length, 'training certificates');
console.log('🔗 Found', trainingSkills.length, 'training skills');

const formattedTrainings = approvedTrainings.map((train) => {
  // Find certificate for this specific training
  const cert = trainingCertificates.find(c => c.training_id === train.id);
  
  // Find skills for this specific training
  const skills = trainingSkills
    .filter(s => s.training_id === train.id)
    .map(s => s.name);

  return {
    id: train.id,
    title: train.title || "",
    course: train.title || "",
    organization: train.organization || "",
    provider: train.organization || "",
    start_date: train.start_date,
    end_date: train.end_date,
    startDate: train.start_date,
    endDate: train.end_date,
    duration: train.duration || "",
    description: train.description || "",
    
    // From trainings table
    status: train.status || "ongoing",
    completedModules: train.completed_modules || 0,
    totalModules: train.total_modules || 0,
    hoursSpent: train.hours_spent || 0,
    
    // From certificates table (linked by training_id)
    certificateUrl: cert?.link || "",
    
    // From skills table (linked by training_id)
    skills: skills,
    
    approval_status: train.approval_status,
    verified: true, // Already filtered, so all are verified
    processing: false, // Already filtered, so won't be pending
    enabled: true, // Already filtered, so all are enabled
    createdAt: train.created_at,
    updatedAt: train.updated_at,
  };
});

console.log('📚 Formatted training records:', formattedTrainings.length);
    const tableCertificates = Array.isArray(data?.certificates) ? data.certificates : [];
    const formattedTableCertificates = tableCertificates.map((certificate) => {
      const issuedOnValue = certificate?.issued_on || certificate?.issuedOn || null;
      const issuedOnFormatted = issuedOnValue ? new Date(issuedOnValue).toISOString().split("T")[0] : "";
      const approvalSource = certificate?.approval_status || certificate?.status || "pending";
      const approvalStatus = typeof approvalSource === "string" ? approvalSource.toLowerCase() : "pending";
      const statusSource = certificate?.status || (certificate?.enabled === false ? "disabled" : "active");
      const statusValue = typeof statusSource === "string" ? statusSource.toLowerCase() : "active";
      const documentUrlValue = certificate?.link || null;
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

    // const tableExperience = Array.isArray(data?.experience) ? data.experience : [];
    // const formattedExperience = tableExperience.map((exp) => ({
    //   id: exp.id,
    //   organization: exp.organization || "",
    //   role: exp.role || "",
    //   start_date: exp.start_date,
    //   end_date: exp.end_date,
    //   duration: exp.duration || "",
    //   verified: exp.verified || false,
    //   approval_status: exp.approval_status || "pending",
    //   processing: exp.approval_status !== "approved",
    //   enabled: exp.approval_status !== "rejected",
    //   createdAt: exp.created_at,
    //   updatedAt: exp.updated_at,
    // }));
    const tableExperience = Array.isArray(data?.experience) ? data.experience : [];
const formattedExperience = tableExperience
  .filter((exp) => exp.approval_status === 'approved' || exp.approval_status === 'verified') // Only show approved/verified
  .map((exp) => ({
    id: exp.id,
    organization: exp.organization || "",
    role: exp.role || "",
    start_date: exp.start_date,
    end_date: exp.end_date,
    duration: exp.duration || "",
    verified: exp.verified || exp.approval_status === 'approved' || exp.approval_status === 'verified',
    approval_status: exp.approval_status || "pending",
    processing: false, // Already filtered, so won't be pending
    enabled: true, // Already filtered, so all are enabled
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
    technicalSkills: technicalSkills.length > 0 ? technicalSkills : transformedProfile.technicalSkills,
  softSkills: softSkills.length > 0 ? softSkills : transformedProfile.softSkills,
  training: formattedTrainings.length > 0 ? formattedTrainings : transformedProfile.training,
      experience: formattedExperience,
  // ✅ ADD THIS LINE
  education: formattedEducation.length > 0 ? formattedEducation : transformedProfile.education,

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
 * Update education records in education table
 */
// export async function updateEducationByEmail(email, educationData) {
//   try {
//     // Find student record
//     const findResult = await findStudentByEmail(email);
//     if (!findResult.success) {
//       return findResult;
//     }

//     const studentRecord = findResult.data;
//     const studentId = studentRecord.id;

//     // Get existing education records
//     const { data: existingEducation, error: existingError } = await supabase
//       .from('education')
//       .select('id')
//       .eq('student_id', studentId);

//     if (existingError) {
//       return { success: false, error: existingError.message };
//     }

//     const nowIso = new Date().toISOString();

//     // Format education data for database
//     const formatted = (educationData || [])
//       .filter((edu) => edu && typeof edu.degree === 'string' && edu.degree.trim().length > 0)
//       .map((edu) => {
//         const record = {
//           student_id: studentId,
//           degree: edu.degree?.trim() || "",
//           department: edu.department?.trim() || "",
//           university: edu.university?.trim() || "",
//           year_of_passing: edu.yearOfPassing?.trim() || "",
//           cgpa: edu.cgpa?.trim() || "",
//           level: edu.level?.trim() || "Bachelor's",
//           status: edu.status?.trim() || "ongoing",
//           updated_at: nowIso,
//         };

//         // Preserve existing ID if valid
//         const rawId = typeof edu.id === 'string' ? edu.id.trim() : null;
//         if (rawId && rawId.length === 36) {
//           record.id = rawId;
//         } else {
//           record.id = generateUuid();
//         }

//         return record;
//       });

//     // Determine which records to delete
//     const incomingIds = new Set(formatted.filter((record) => record.id).map((record) => record.id));
//     const toDelete = (existingEducation || [])
//       .filter((existing) => !incomingIds.has(existing.id))
//       .map((existing) => existing.id);

//     // Delete removed records
//     if (toDelete.length > 0) {
//       const { error: deleteError } = await supabase
//         .from('education')
//         .delete()
//         .in('id', toDelete);

//       if (deleteError) {
//         return { success: false, error: deleteError.message };
//       }
//     }

//     // Upsert education records
//     if (formatted.length > 0) {
//       const { error: upsertError } = await supabase
//         .from('education')
//         .upsert(formatted, { onConflict: 'id' });

//       if (upsertError) {
//         return { success: false, error: upsertError.message };
//       }
//     } else if ((existingEducation || []).length > 0) {
//       // Delete all if no education data provided
//       const { error: deleteAllError } = await supabase
//         .from('education')
//         .delete()
//         .eq('student_id', studentId);

//       if (deleteAllError) {
//         return { success: false, error: deleteAllError.message };
//       }
//     }

//     // Return updated student data
//     return await getStudentByEmail(email);
//   } catch (err) {
//     console.error('❌ updateEducationByEmail exception:', err);
//     return { success: false, error: err.message };
//   }
// }

// /**
//  * Helper function to find student record by email (robust method)
//  */
// async function findStudentByEmail(email) {
//   try {

//     // Try JSONB query first
//     let { data: directData, error: directError } = await supabase
//       .from('students')
//       .select('*')
//       .eq('profile->>email', email)
//       .maybeSingle();

//     if (directData) {
//       return { success: true, data: directData };
//     }


//     // Fallback: get all students and search manually
//     const { data: allStudents, error: allError } = await supabase
//       .from('students')
//       .select('*');

//     if (allError) {
//       console.error('❌ Error fetching all students:', allError);
//       return { success: false, error: allError.message };
//     }

//     // Find student with matching email
//     for (const student of allStudents || []) {
//       const profile = safeJSONParse(student.profile);
//       if (profile?.email === email) {
//         return { success: true, data: student };
//       }
//     }

//     console.error('❌ Student not found for email:', email);
//     return { success: false, error: 'Student not found' };

//   } catch (err) {
//     console.error('❌ Error finding student:', err);
//     return { success: false, error: err.message };
//   }
// }
/**
 * Update education records in education table
 */
export async function updateEducationByEmail(email, educationData = []) {
  try {
    // Find student record
    let studentRecord = null;

    // Try direct email column first
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

    // Try JSONB profile email
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

    // Manual search fallback
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

    // ✅ Use user_id as student_id (matches FK: student_id -> students.user_id)
    const studentId = studentRecord.user_id;

    console.log('📚 Updating education for student_id:', studentId);

    // Get existing education records
    const { data: existingEducation, error: existingError } = await supabase
      .from('education')
      .select('id')
      .eq('student_id', studentId);

    if (existingError) {
      console.error('❌ Error fetching existing education:', existingError);
      return { success: false, error: existingError.message };
    }

    console.log('📖 Existing education records:', existingEducation?.length || 0);

    const nowIso = new Date().toISOString();

    // Format education data for database
    const formatted = (educationData || [])
      .filter((edu) => {
        // Must have at least a degree
        const degreeField = edu.degree || edu.qualification;
        return edu && typeof degreeField === 'string' && degreeField.trim().length > 0;
      })
      .map((edu) => {
        const record = {
          student_id: studentId,
          level: edu.level?.trim() || "Bachelor's",
          degree: (edu.degree || edu.qualification)?.trim() || "",
          department: edu.department?.trim() || "",
          university: edu.university?.trim() || "",
          year_of_passing: (edu.yearOfPassing || edu.year_of_passing)?.toString().trim() || "",
          cgpa: edu.cgpa?.toString().trim() || "",
          status: edu.status?.trim() || "ongoing",
          approval_status: edu.approval_status || 'pending',
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof edu.id === 'string' ? edu.id.trim() : null;
        if (rawId && rawId.length === 36 && rawId.includes('-')) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    console.log('💾 Formatted education records to save:', formatted.length);

    // Determine which records to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingEducation || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
      console.log('🗑️ Deleting education records:', toDelete.length);
      const { error: deleteError } = await supabase
        .from('education')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        console.error('❌ Error deleting education:', deleteError);
        return { success: false, error: deleteError.message };
      }
    }

    // Upsert education records
    if (formatted.length > 0) {
      console.log('✍️ Upserting education records...', formatted);
      const { data: upsertData, error: upsertError } = await supabase
        .from('education')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        console.error('❌ Error upserting education:', upsertError);
        return { success: false, error: upsertError.message };
      }
      console.log('✅ Education records saved successfully');
    } else if ((existingEducation || []).length > 0) {
      // Delete all if no education data provided
      console.log('🗑️ Deleting all education records (empty data provided)');
      const { error: deleteAllError } = await supabase
        .from('education')
        .delete()
        .eq('student_id', studentId);

      if (deleteAllError) {
        console.error('❌ Error deleting all education:', deleteAllError);
        return { success: false, error: deleteAllError.message };
      }
    }

    // Return updated student data
    return await getStudentByEmail(email);
  } catch (err) {
    console.error('❌ updateEducationByEmail exception:', err);
    return { success: false, error: err.message };
  }
}

/** 1
 * Update training array in student profile
 */
// export async function updateTrainingByEmail(email, trainingData) {
//   try {

//     // Find student record
//     const findResult = await findStudentByEmail(email);
//     if (!findResult.success) {
//       return findResult;
//     }

//     const studentRecord = findResult.data;
//     const currentProfile = safeJSONParse(studentRecord.profile);

//     const updatedProfile = {
//       ...currentProfile,
//       training: trainingData
//     };


//     const { data, error } = await supabase
//       .from('students')
//       .update({ profile: updatedProfile })
//       .eq('id', studentRecord.id)
//       .select()
//       .single();

//     if (error) {
//       console.error('❌ Error updating training:', error);
//       throw error;
//     }

//     return {
//       success: true,
//       data: transformProfileData(data.profile, email)
//     };
//   } catch (err) {
//     console.error('❌ Error updating training:', err);
//     return { success: false, error: err.message };
//   }
// }

/**2
 * Update training records in trainings table
 */
// export async function updateTrainingByEmail(email, trainingData = []) {
//   try {
//     // Find student record
//     let studentRecord = null;

//     const { data: directByEmail, error: directEmailError } = await supabase
//       .from('students')
//       .select('id, user_id')
//       .eq('email', email)
//       .maybeSingle();

//     if (directEmailError) {
//       return { success: false, error: directEmailError.message };
//     }

//     if (directByEmail) {
//       studentRecord = directByEmail;
//     }

//     if (!studentRecord) {
//       const { data: profileMatch, error: profileError } = await supabase
//         .from('students')
//         .select('id, user_id, profile')
//         .eq('profile->>email', email)
//         .maybeSingle();

//       if (profileError) {
//         return { success: false, error: profileError.message };
//       }

//       if (profileMatch) {
//         studentRecord = profileMatch;
//       }
//     }

//     if (!studentRecord) {
//       const { data: allStudents, error: allError } = await supabase
//         .from('students')
//         .select('id, user_id, profile');

//       if (allError) {
//         return { success: false, error: allError.message };
//       }

//       for (const student of allStudents || []) {
//         const profile = safeJSONParse(student.profile);
//         if (profile?.email === email) {
//           studentRecord = student;
//           break;
//         }
//       }
//     }

//     if (!studentRecord) {
//       return { success: false, error: 'Student not found' };
//     }

//     // Use user_id as student_id (as per foreign key constraint)
//     const studentId = studentRecord.user_id;

//     // Get existing training records
//     const { data: existingTrainings, error: existingError } = await supabase
//       .from('trainings')
//       .select('id')
//       .eq('student_id', studentId);

//     if (existingError) {
//       return { success: false, error: existingError.message };
//     }

//     const nowIso = new Date().toISOString();

//     // Format training data for database
//     const formatted = (trainingData || [])
//       .filter((train) => {
//         // Accept either 'title' or 'course' field
//         const titleField = train.title || train.course;
//         return train && typeof titleField === 'string' && titleField.trim().length > 0;
//       })
//       .map((train) => {
//         // Map 'course' to 'title' for backward compatibility
//         const titleValue = train.title || train.course || '';
        
//         const record = {
//           student_id: studentId,
//           title: titleValue.trim(),
//           organization: train.organization?.trim() || train.provider?.trim() || null,
//           start_date: train.start_date || train.startDate || null,
//           end_date: train.end_date || train.endDate || null,
//           duration: train.duration?.trim() || null,
//           description: train.description?.trim() || null,
//           status: train.status || 'ongoing',
//       completed_modules: train.completedModules || 0,
//       total_modules: train.totalModules || 0,
//       hours_spent: train.hoursSpent || 0,
//           approval_status: train.approval_status || 'pending',
//           updated_at: nowIso,
//         };

//         // Preserve existing ID if valid UUID
//         const rawId = typeof train.id === 'string' ? train.id.trim() : null;
//         if (rawId && rawId.length === 36) {
//           record.id = rawId;
//         } else {
//           record.id = generateUuid();
//         }

//         return record;
//       });

//     // Determine which records to delete
//     const incomingIds = new Set(formatted.filter((record) => record.id).map((record) => record.id));
//     const toDelete = (existingTrainings || [])
//       .filter((existing) => !incomingIds.has(existing.id))
//       .map((existing) => existing.id);

//     // Delete removed records
//     if (toDelete.length > 0) {
//       const { error: deleteError } = await supabase
//         .from('trainings')
//         .delete()
//         .in('id', toDelete);

//       if (deleteError) {
//         return { success: false, error: deleteError.message };
//       }
//     }

//     // Upsert training records
//     if (formatted.length > 0) {
//       const { error: upsertError } = await supabase
//         .from('trainings')
//         .upsert(formatted, { onConflict: 'id' });

//       if (upsertError) {
//         return { success: false, error: upsertError.message };
//       }
//     } else if ((existingTrainings || []).length > 0) {
//       // Delete all if no training data provided
//       const { error: deleteAllError } = await supabase
//         .from('trainings')
//         .delete()
//         .eq('student_id', studentId);

//       if (deleteAllError) {
//         return { success: false, error: deleteAllError.message };
//       }
//     }

//     // Return updated student data
//     return await getStudentByEmail(email);
//   } catch (err) {
//     console.error('❌ updateTrainingByEmail exception:', err);
//     return { success: false, error: err.message };
//   }
// }

// 3
// export async function updateTrainingByEmail(email, trainingData = []) {
//   try {
//     console.log('🎓 Starting training update for:', email);
//     console.log('📦 Training data received:', trainingData.length, 'records');

//     // Find student record
//     let studentRecord = null;

//     const { data: directByEmail, error: directEmailError } = await supabase
//       .from('students')
//       .select('id, user_id')
//       .eq('email', email)
//       .maybeSingle();

//     if (directEmailError) {
//       return { success: false, error: directEmailError.message };
//     }

//     if (directByEmail) {
//       studentRecord = directByEmail;
//     }

//     if (!studentRecord) {
//       const { data: profileMatch, error: profileError } = await supabase
//         .from('students')
//         .select('id, user_id, profile')
//         .eq('profile->>email', email)
//         .maybeSingle();

//       if (profileError) {
//         return { success: false, error: profileError.message };
//       }

//       if (profileMatch) {
//         studentRecord = profileMatch;
//       }
//     }

//     if (!studentRecord) {
//       const { data: allStudents, error: allError } = await supabase
//         .from('students')
//         .select('id, user_id, profile');

//       if (allError) {
//         return { success: false, error: allError.message };
//       }

//       for (const student of allStudents || []) {
//         const profile = safeJSONParse(student.profile);
//         if (profile?.email === email) {
//           studentRecord = student;
//           break;
//         }
//       }
//     }

//     if (!studentRecord) {
//       return { success: false, error: 'Student not found' };
//     }

//     const studentId = studentRecord.user_id;
//     console.log('✅ Found student with user_id:', studentId);

//     // Get existing training records
//     const { data: existingTrainings, error: existingError } = await supabase
//       .from('trainings')
//       .select('id')
//       .eq('student_id', studentId);

//     if (existingError) {
//       return { success: false, error: existingError.message };
//     }

//     console.log('📚 Existing trainings:', existingTrainings?.length || 0);

//     const nowIso = new Date().toISOString();

//     // Format training data for database
//     const formatted = (trainingData || [])
//       .filter((train) => {
//         const titleField = train.title || train.course;
//         return train && typeof titleField === 'string' && titleField.trim().length > 0;
//       })
//       .map((train) => {
//         const titleValue = train.title || train.course || '';
        
//         const record = {
//           student_id: studentId,
//           title: titleValue.trim(),
//           organization: train.organization?.trim() || train.provider?.trim() || null,
//           start_date: train.start_date || train.startDate || null,
//           end_date: train.end_date || train.endDate || null,
//           duration: train.duration?.trim() || null,
//           description: train.description?.trim() || null,
//           status: train.status || 'ongoing',
//           completed_modules: train.completedModules || 0,
//           total_modules: train.totalModules || 0,
//           hours_spent: train.hoursSpent || 0,
//           approval_status: train.approval_status || 'pending',
//           updated_at: nowIso,
//         };

//         // Preserve existing ID if valid UUID
//         const rawId = typeof train.id === 'string' ? train.id.trim() : null;
//         if (rawId && rawId.length === 36) {
//           record.id = rawId;
//         } else {
//           record.id = generateUuid();
//         }

//         // Store certificateUrl and skills for later use
//         record._certificateUrl = train.certificateUrl?.trim() || null;
//         record._skills = Array.isArray(train.skills) ? train.skills : [];

//         return record;
//       });

//     console.log('💾 Formatted training records:', formatted.length);

//     // Determine which records to delete
//     const incomingIds = new Set(formatted.map((record) => record.id));
//     const toDelete = (existingTrainings || [])
//       .filter((existing) => !incomingIds.has(existing.id))
//       .map((existing) => existing.id);

//     // Delete removed records and their related data
//     if (toDelete.length > 0) {
//       console.log('🗑️ Deleting', toDelete.length, 'training records');

//       // Delete related certificates
//       await supabase
//         .from('certificates')
//         .delete()
//         .in('training_id', toDelete);

//       // Delete related skills
//       await supabase
//         .from('skills')
//         .delete()
//         .in('training_id', toDelete);

//       // Delete trainings
//       const { error: deleteError } = await supabase
//         .from('trainings')
//         .delete()
//         .in('id', toDelete);

//       if (deleteError) {
//         console.error('❌ Error deleting trainings:', deleteError);
//         return { success: false, error: deleteError.message };
//       }
//     }

//     // Upsert training records (without certificateUrl and skills)
//     if (formatted.length > 0) {
//       // Remove temporary fields before upserting
//       const cleanedFormatted = formatted.map(({ _certificateUrl, _skills, ...rest }) => rest);

//       const { error: upsertError } = await supabase
//         .from('trainings')
//         .upsert(cleanedFormatted, { onConflict: 'id' });

//       if (upsertError) {
//         console.error('❌ Error upserting trainings:', upsertError);
//         return { success: false, error: upsertError.message };
//       }

//       console.log('✅ Training records saved');

//       // Now save related certificates and skills
//       for (const record of formatted) {
//         const trainingId = record.id;
//         const certificateUrl = record._certificateUrl;
//         const skills = record._skills;

//         console.log(`\n🔗 Processing related data for training: ${record.title}`);

//         // ===== SAVE CERTIFICATE =====
//         if (certificateUrl && certificateUrl.length > 0) {
//           console.log('  📜 Saving certificate...');

//           // Check if certificate already exists for this training
//           const { data: existingCert } = await supabase
//             .from('certificates')
//             .select('id')
//             .eq('training_id', trainingId)
//             .maybeSingle();

//           const certRecord = {
//             student_id: studentId,
//             training_id: trainingId,
//             title: `${record.title} - Certificate`,
//             issuer: record.organization || 'Training Provider',
//             document_url: certificateUrl,
//             status: 'active',
//             approval_status: 'pending',
//             enabled: true,
//             updated_at: nowIso,
//           };

//           if (existingCert) {
//             // Update existing certificate
//             const { error: certUpdateError } = await supabase
//               .from('certificates')
//               .update(certRecord)
//               .eq('id', existingCert.id);

//             if (certUpdateError) {
//               console.error('  ❌ Error updating certificate:', certUpdateError);
//             } else {
//               console.log('  ✅ Certificate updated');
//             }
//           } else {
//             // Insert new certificate
//             certRecord.id = generateUuid();
//             certRecord.created_at = nowIso;

//             const { error: certInsertError } = await supabase
//               .from('certificates')
//               .insert([certRecord]);

//             if (certInsertError) {
//               console.error('  ❌ Error inserting certificate:', certInsertError);
//             } else {
//               console.log('  ✅ Certificate created');
//             }
//           }
//         } else {
//           // No certificate URL, delete any existing certificate for this training
//           await supabase
//             .from('certificates')
//             .delete()
//             .eq('training_id', trainingId);
//           console.log('  🗑️ Certificate removed (no URL provided)');
//         }

//         // ===== SAVE SKILLS =====
//         if (Array.isArray(skills) && skills.length > 0) {
//           console.log(`  🎯 Saving ${skills.length} skills...`);

//           // Delete existing skills for this training
//           await supabase
//             .from('skills')
//             .delete()
//             .eq('training_id', trainingId);

//           // Insert new skills
//           const skillRecords = skills
//             .filter(skill => typeof skill === 'string' && skill.trim().length > 0)
//             .map(skill => ({
//               id: generateUuid(),
//               student_id: studentId,
//               training_id: trainingId,
//               name: skill.trim(),
//               type: 'technical',
//               level: 3,
//               description: `Learned from ${record.title}`,
//               verified: false,
//               enabled: true,
//               approval_status: 'pending',
//               created_at: nowIso,
//               updated_at: nowIso,
//             }));

//           if (skillRecords.length > 0) {
//             const { error: skillsInsertError } = await supabase
//               .from('skills')
//               .insert(skillRecords);

//             if (skillsInsertError) {
//               console.error('  ❌ Error inserting skills:', skillsInsertError);
//             } else {
//               console.log(`  ✅ ${skillRecords.length} skills saved`);
//             }
//           }
//         } else {
//           // No skills, delete any existing skills for this training
//           await supabase
//             .from('skills')
//             .delete()
//             .eq('training_id', trainingId);
//           console.log('  🗑️ Skills removed (none provided)');
//         }
//       }
//     } else if ((existingTrainings || []).length > 0) {
//       // Delete all if no training data provided
//       console.log('🗑️ Deleting all training records (empty data provided)');

//       const trainingIds = existingTrainings.map(t => t.id);

//       // Delete related certificates
//       await supabase
//         .from('certificates')
//         .delete()
//         .in('training_id', trainingIds);

//       // Delete related skills
//       await supabase
//         .from('skills')
//         .delete()
//         .in('training_id', trainingIds);

//       // Delete trainings
//       const { error: deleteAllError } = await supabase
//         .from('trainings')
//         .delete()
//         .eq('student_id', studentId);

//       if (deleteAllError) {
//         console.error('❌ Error deleting all trainings:', deleteAllError);
//         return { success: false, error: deleteAllError.message };
//       }
//     }

//     console.log('🎉 Training update completed successfully');

//     // Return updated student data
//     return await getStudentByEmail(email);
//   } catch (err) {
//     console.error('❌ updateTrainingByEmail exception:', err);
//     return { success: false, error: err.message };
//   }
// }
export async function updateTrainingByEmail(email, trainingData = []) {
  try {
    console.log('🎓 Starting training update for:', email);
    console.log('📦 Training data received:', trainingData.length, 'records');

    // Find student record (keep existing code)
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

    const studentId = studentRecord.user_id;
    console.log('✅ Found student with user_id:', studentId);

    // Get existing training records
    const { data: existingTrainings, error: existingError } = await supabase
      .from('trainings')
      .select('id')
      .eq('student_id', studentId);

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    console.log('📚 Existing trainings:', existingTrainings?.length || 0);

    const nowIso = new Date().toISOString();

    // Format training data for database
    const formatted = (trainingData || [])
      .filter((train) => {
        const titleField = train.title || train.course;
        return train && typeof titleField === 'string' && titleField.trim().length > 0;
      })
      .map((train) => {
        const titleValue = train.title || train.course || '';
        
        const record = {
          student_id: studentId,
          title: titleValue.trim(),
          organization: train.organization?.trim() || train.provider?.trim() || null,
          start_date: train.start_date || train.startDate || null,
          end_date: train.end_date || train.endDate || null,
          duration: train.duration?.trim() || null,
          description: train.description?.trim() || null,
          status: train.status || 'ongoing',
          completed_modules: train.completedModules || 0,
          total_modules: train.totalModules || 0,
          hours_spent: train.hoursSpent || 0,
          approval_status: train.approval_status || 'pending',
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof train.id === 'string' ? train.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        // Store certificateUrl and skills for later use
        record._certificateUrl = train.certificateUrl?.trim() || null;
        record._skills = Array.isArray(train.skills) ? train.skills : [];

        return record;
      });

    console.log('💾 Formatted training records:', formatted.length);

    // Determine which records to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingTrainings || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records and their related data
    if (toDelete.length > 0) {
      console.log('🗑️ Deleting', toDelete.length, 'training records');

      // Delete related certificates
      await supabase
        .from('certificates')
        .delete()
        .in('training_id', toDelete);

      // Delete related skills
      await supabase
        .from('skills')
        .delete()
        .in('training_id', toDelete);

      // Delete trainings
      const { error: deleteError } = await supabase
        .from('trainings')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        console.error('❌ Error deleting trainings:', deleteError);
        return { success: false, error: deleteError.message };
      }
    }

    // Upsert training records (without certificateUrl and skills)
    if (formatted.length > 0) {
      // Remove temporary fields before upserting
      const cleanedFormatted = formatted.map(({ _certificateUrl, _skills, ...rest }) => rest);

      const { error: upsertError } = await supabase
        .from('trainings')
        .upsert(cleanedFormatted, { onConflict: 'id' });

      if (upsertError) {
        console.error('❌ Error upserting trainings:', upsertError);
        return { success: false, error: upsertError.message };
      }

      console.log('✅ Training records saved');

      // ===== NOW SAVE ONLY CERTIFICATE URL AND SKILLS =====
      for (const record of formatted) {
        const trainingId = record.id;
        const certificateUrl = record._certificateUrl;
        const skills = record._skills;

        console.log(`\n🔗 Processing related data for training: ${record.title}`);

        // ===== SAVE ONLY CERTIFICATE URL =====
        if (certificateUrl && certificateUrl.length > 0) {
          console.log('  📜 Checking for existing certificate...');

          // Check if certificate already exists for this training
          const { data: existingCert } = await supabase
            .from('certificates')
            .select('id, link')
            .eq('training_id', trainingId)
            .maybeSingle();

          if (existingCert) {
            // ✅ Only update document_url if it changed
            if (existingCert.document_url !== certificateUrl) {
              const { error: certUpdateError } = await supabase
                .from('certificates')
                .update({ 
                  link: certificateUrl,
                  updated_at: nowIso 
                })
                .eq('id', existingCert.id);

              if (certUpdateError) {
                console.error('  ❌ Error updating certificate URL:', certUpdateError);
              } else {
                console.log('  ✅ Certificate URL updated');
              }
            } else {
              console.log('  ℹ️ Certificate URL unchanged');
            }
          } else {
            // ✅ Create new certificate with ONLY required fields
            const certRecord = {
              id: generateUuid(),
              student_id: studentId,
              training_id: trainingId,
              title: `${record.title} - Certificate`,
              link: certificateUrl,
              status: 'active',
              approval_status: 'pending',
              enabled: true,
              created_at: nowIso,
              updated_at: nowIso,
            };

            const { error: certInsertError } = await supabase
              .from('certificates')
              .insert([certRecord]);

            if (certInsertError) {
              console.error('  ❌ Error inserting certificate:', certInsertError);
            } else {
              console.log('  ✅ Certificate created with URL');
            }
          }
        } else {
          // No certificate URL, delete any existing certificate for this training
          const { error: deleteError } = await supabase
            .from('certificates')
            .delete()
            .eq('training_id', trainingId);

          if (!deleteError) {
            console.log('  🗑️ Certificate removed (no URL provided)');
          }
        }

        // ===== SAVE ONLY SKILL NAMES =====
        if (Array.isArray(skills) && skills.length > 0) {
          console.log(`  🎯 Processing ${skills.length} skills...`);

          // Get existing skills for this training
          const { data: existingSkills } = await supabase
            .from('skills')
            .select('id, name')
            .eq('training_id', trainingId)
            .eq('type', 'technical');

          const existingSkillNames = new Set(
            (existingSkills || []).map(s => s.name.toLowerCase().trim())
          );

          const newSkillNames = skills
            .filter(skill => typeof skill === 'string' && skill.trim().length > 0)
            .map(skill => skill.trim());

          // Find skills to add (not in existing)
          const skillsToAdd = newSkillNames.filter(
            skillName => !existingSkillNames.has(skillName.toLowerCase())
          );

          // Find skills to remove (in existing but not in new)
          const newSkillNamesSet = new Set(newSkillNames.map(s => s.toLowerCase()));
          const skillIdsToDelete = (existingSkills || [])
            .filter(s => !newSkillNamesSet.has(s.name.toLowerCase().trim()))
            .map(s => s.id);

          // Delete removed skills
          if (skillIdsToDelete.length > 0) {
            await supabase
              .from('skills')
              .delete()
              .in('id', skillIdsToDelete);
            console.log(`  🗑️ Removed ${skillIdsToDelete.length} skills`);
          }

          // ✅ Add new skills with ONLY required fields
          if (skillsToAdd.length > 0) {
            const skillRecords = skillsToAdd.map(skillName => ({
              id: generateUuid(),
              student_id: studentId,
              training_id: trainingId,
              name: skillName,
              type: 'technical',
              // level: 3,
              // verified: false,
              // enabled: true,
              // approval_status: 'pending',
              created_at: nowIso,
              updated_at: nowIso,
            }));

            const { error: skillsInsertError } = await supabase
              .from('skills')
              .insert(skillRecords);

            if (skillsInsertError) {
              console.error('  ❌ Error inserting skills:', skillsInsertError);
            } else {
              console.log(`  ✅ Added ${skillsToAdd.length} new skills`);
            }
          }

          if (skillsToAdd.length === 0 && skillIdsToDelete.length === 0) {
            console.log('  ℹ️ Skills unchanged');
          }
        } else {
          // No skills, delete any existing skills for this training
          const { error: deleteError } = await supabase
            .from('skills')
            .delete()
            .eq('training_id', trainingId);

          if (!deleteError) {
            console.log('  🗑️ All skills removed (none provided)');
          }
        }
      }
    } else if ((existingTrainings || []).length > 0) {
      // Delete all if no training data provided
      console.log('🗑️ Deleting all training records (empty data provided)');

      const trainingIds = existingTrainings.map(t => t.id);

      // Delete related certificates
      await supabase
        .from('certificates')
        .delete()
        .in('training_id', trainingIds);

      // Delete related skills
      await supabase
        .from('skills')
        .delete()
        .in('training_id', trainingIds);

      // Delete trainings
      const { error: deleteAllError } = await supabase
        .from('trainings')
        .delete()
        .eq('student_id', studentId);

      if (deleteAllError) {
        console.error('❌ Error deleting all trainings:', deleteAllError);
        return { success: false, error: deleteAllError.message };
      }
    }

    console.log('🎉 Training update completed successfully');

    // Return updated student data
    return await getStudentByEmail(email);
  } catch (err) {
    console.error('❌ updateTrainingByEmail exception:', err);
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
// export async function updateTechnicalSkillsByEmail(email, skillsData) {
//   try {

//     // Find student record
//     const findResult = await findStudentByEmail(email);
//     if (!findResult.success) {
//       return findResult;
//     }

//     const studentRecord = findResult.data;
//     const currentProfile = safeJSONParse(studentRecord.profile);

//     const updatedProfile = {
//       ...currentProfile,
//       technicalSkills: skillsData
//     };


//     const { data, error } = await supabase
//       .from('students')
//       .update({ profile: updatedProfile })
//       .eq('id', studentRecord.id)
//       .select()
//       .single();

//     if (error) {
//       console.error('❌ Error updating technical skills:', error);
//       throw error;
//     }

//     return {
//       success: true,
//       data: transformProfileData(data.profile, email)
//     };
//   } catch (err) {
//     console.error('❌ Error updating technical skills:', err);
//     return { success: false, error: err.message };
//   }
// }

// /**
//  * Update soft skills array in student profile
//  */
// export async function updateSoftSkillsByEmail(email, skillsData) {
//   try {

//     // Find student record
//     const findResult = await findStudentByEmail(email);
//     if (!findResult.success) {
//       return findResult;
//     }

//     const studentRecord = findResult.data;
//     const currentProfile = safeJSONParse(studentRecord.profile);

//     const updatedProfile = {
//       ...currentProfile,
//       softSkills: skillsData
//     };


//     const { data, error } = await supabase
//       .from('students')
//       .update({ profile: updatedProfile })
//       .eq('id', studentRecord.id)
//       .select()
//       .single();

//     if (error) {
//       console.error('❌ Error updating soft skills:', error);
//       throw error;
//     }

//     return {
//       success: true,
//       data: transformProfileData(data.profile, email)
//     };
//   } catch (err) {
//     console.error('❌ Error updating soft skills:', err);
//     return { success: false, error: err.message };
//   }
// }

/**
 * Update technical skills in skills table
 */
export async function updateTechnicalSkillsByEmail(email, skillsData = []) {
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

    // Get existing technical skills
    const { data: existingSkills, error: existingError } = await supabase
      .from('skills')
      .select('id')
      .eq('student_id', studentId)
      .is('training_id', null) 
      .eq('type', 'technical');

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format technical skills data for database
    const formatted = (skillsData || [])
      .filter((skill) => skill && typeof skill.name === 'string' && skill.name.trim().length > 0)
      .map((skill) => {
        const record = {
          student_id: studentId,
          name: skill.name.trim(),
          type: 'technical',
          level: skill.level || 3, // Default to level 3 if not provided
          description: skill.description?.trim() || null,
          verified: skill.verified || false,
          enabled: typeof skill.enabled === 'boolean' ? skill.enabled : true,
          approval_status: skill.approval_status || 'pending',
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof skill.id === 'string' ? skill.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.filter((record) => record.id).map((record) => record.id));
    const toDelete = (existingSkills || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
    }

    // Upsert technical skills records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('skills')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
    } else if ((existingSkills || []).length > 0) {
      // Delete all if no skills data provided
      const { error: deleteAllError } = await supabase
        .from('skills')
        .delete()
        .eq('student_id', studentId)
        .eq('type', 'technical');

      if (deleteAllError) {
        return { success: false, error: deleteAllError.message };
      }
    }

    // Return updated student data
    return await getStudentByEmail(email);
  } catch (err) {
    console.error('❌ updateTechnicalSkillsByEmail exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update soft skills in skills table
 */
export async function updateSoftSkillsByEmail(email, skillsData = []) {
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

    // Get existing soft skills
    const { data: existingSkills, error: existingError } = await supabase
      .from('skills')
      .select('id')
      .eq('student_id', studentId)
      .is('training_id', null) 
      .eq('type', 'soft');

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format soft skills data for database
    const formatted = (skillsData || [])
      .filter((skill) => skill && typeof skill.name === 'string' && skill.name.trim().length > 0)
      .map((skill) => {
        const record = {
          student_id: studentId,
          name: skill.name.trim(),
          type: 'soft',
          level: skill.level || 3, // Default to level 3 if not provided
          description: skill.description?.trim() || null,
          verified: skill.verified || false,
          enabled: typeof skill.enabled === 'boolean' ? skill.enabled : true,
          approval_status: skill.approval_status || 'pending',
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof skill.id === 'string' ? skill.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.filter((record) => record.id).map((record) => record.id));
    const toDelete = (existingSkills || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
    }

    // Upsert soft skills records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('skills')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
    } else if ((existingSkills || []).length > 0) {
      // Delete all if no skills data provided
      const { error: deleteAllError } = await supabase
        .from('skills')
        .delete()
        .eq('student_id', studentId)
        .eq('type', 'soft');

      if (deleteAllError) {
        return { success: false, error: deleteAllError.message };
      }
    }

    // Return updated student data
    return await getStudentByEmail(email);
  } catch (err) {
    console.error('❌ updateSoftSkillsByEmail exception:', err);
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