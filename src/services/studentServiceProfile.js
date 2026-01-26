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
    // Since profile column is removed, we only query by email column
    let { data, error } = await supabase
      .from('students')
      .select(`
        *,
        school:organizations!students_school_id_fkey (
          id,
          name,
          code,
          city,
          state,
          organization_type
        ),
        college:organizations!students_college_id_fkey (
          id,
          name,
          code,
          city,
          state,
          organization_type
        ),
        university_colleges:university_college_id (
          id,
          name,
          code,
          university:organizations!university_colleges_university_id_fkey (
            id,
            name,
            city,
            state,
            organization_type
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

    if (error) {
      console.error('❌ Supabase error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No data found for this email.' };
    }

    // Since we no longer have a JSONB profile column, we'll create a profile object from individual columns
    const profileData = {
      name: data.name || 'Student',
      email: data.email || email,
      age: data.age,
      dateOfBirth: data.date_of_birth || data.dateOfBirth,
      phone: formatPhoneNumber(data.contact_number || data.contactNumber, data.contact_dial_code),
      alternatePhone: formatPhoneNumber(data.alternate_number),
      district: data.district_name,
      university: data.university,
      department: data.branch_field,
      college: data.college_school_name,
      registrationNumber: data.registration_number,
      
      // Guardian info
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      guardianEmail: data.guardianEmail,
      guardianRelation: data.guardianRelation,
      
      // Personal details
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      bio: data.bio,
      
      // Location
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,
      
      // Social links
      github_link: data.github_link,
      linkedin_link: data.linkedin_link,
      twitter_link: data.twitter_link,
      facebook_link: data.facebook_link,
      instagram_link: data.instagram_link,
      portfolio_link: data.portfolio_link,
      youtube_link: data.youtube_link,
      other_social_links: data.other_social_links || [],
      
      // Files
      resumeUrl: data.resumeUrl,
      profilePicture: data.profilePicture,
      
      // School/College specific
      grade: data.grade,
      section: data.section,
      roll_number: data.roll_number,
      admission_number: data.admission_number,
      
      // Additional fields
      hobbies: data.hobbies || [],
      languages: data.languages || [],
      interests: data.interests || [],
      
      // New fields for gap years, work experience, and academic info
      gapInStudies: data.gap_in_studies || false,
      gapYears: data.gap_years || 0,
      gapReason: data.gap_reason || '',
      workExperience: data.work_experience || '',
      aadharNumber: data.aadhar_number || '',
      backlogsHistory: data.backlogs_history || '',
      currentBacklogs: data.current_backlogs || 0,
      
      // Generate passport ID from registration number
      passportId: data.registration_number ? `SP-${data.registration_number}` : 'SP-0000',
      verified: true,
      employabilityScore: 75,
      cgpa: data.currentCgpa || 'N/A',
      photo: generateAvatar(data.name)
    };

    // Transform profile data to consistent format
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
const tableEducation = Array.isArray(data?.education) ? data.education : [];
const formattedEducation = tableEducation.map((edu) => ({
  id: edu.id,
  level: edu.level || "Bachelor's",
  degree: edu.degree || "",
  department: edu.department || "",
  university: edu.university || "",
  yearOfPassing: edu.year_of_passing || "",
  cgpa: edu.cgpa || "",
  status: edu.status || "ongoing",
  approval_status: edu.approval_status || "pending",
  verified: edu.approval_status === "approved",
  processing: edu.approval_status !== "approved",
  enabled: edu.enabled !== undefined ? edu.enabled : true, // Use actual enabled column
  createdAt: edu.created_at,
  updatedAt: edu.updated_at,
}));


const tableTrainings = Array.isArray(data?.trainings) ? data.trainings : [];

// Filter to only approved/verified trainings first
const approvedTrainings = tableTrainings.filter(
  (train) => train.approval_status === 'approved' || 
             train.approval_status === 'verified' ||
             train.approval_status === 'pending'  // Show pending too
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
    
    // IMPORTANT: Include course_id and source for internal/external detection
    course_id: train.course_id || null,
    source: train.source || null,
    
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

    
const tableExperience = Array.isArray(data?.experience) ? data.experience : [];
const formattedExperience = tableExperience
  .map((exp) => ({
    id: exp.id,
    organization: exp.organization || "",
    role: exp.role || "",
    start_date: exp.start_date,
    end_date: exp.end_date,
    duration: exp.duration || "",
    verified: exp.verified || exp.approval_status === 'approved' || exp.approval_status === 'verified',
    approval_status: exp.approval_status || "pending",
    processing: exp.approval_status === 'pending',
    enabled: exp.enabled !== undefined ? exp.enabled : true,
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
      school: data.school || null,
      universityCollege: data.university_colleges || null,

      // School Information Fields
      grade: data.grade,
      section: data.section,
      roll_number: data.roll_number,
      admission_number: data.admission_number,

      // Profile data (from students.profile JSONB)
      profile: transformedProfile,

      // Legacy flattened access for backward compatibility - BUT individual columns take precedence
      ...transformedProfile,
      
      // CRITICAL FIX: Individual database columns override profile data
      name: data.name || transformedProfile.name,
      approval_status: data.approval_status, // This was getting overwritten!
      age: data.age || transformedProfile.age,
      date_of_birth: data.date_of_birth || transformedProfile.date_of_birth,
      contact_number: data.contact_number || transformedProfile.contact_number,
      university: data.university || transformedProfile.university,
      branch_field: data.branch_field || transformedProfile.branch_field,
      // Add other important individual columns
      github_link: data.github_link || transformedProfile.github_link,
      linkedin_link: data.linkedin_link || transformedProfile.linkedin_link,
      twitter_link: data.twitter_link || transformedProfile.twitter_link,
      facebook_link: data.facebook_link || transformedProfile.facebook_link,
      instagram_link: data.instagram_link || transformedProfile.instagram_link,
      portfolio_link: data.portfolio_link || transformedProfile.portfolio_link,
      youtube_link: data.youtube_link || transformedProfile.youtube_link,

      // NOW THESE COME FROM projects table:
      projects: Array.isArray(data.projects)
        ? data.projects
        .filter((project) => 
        project.approval_status === 'verified' || 
        project.approval_status === 'approved'
      )
        .map((project) => ({
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
 * Fetch student data by student ID from Supabase
 * @param {string} studentId - Student ID (UUID)
 * @returns {Promise<Object>} Student data
 */
export const getStudentById = async (studentId) => {
  try {
    // console.log('🔍 Fetching student data for ID:', studentId);

    let { data, error } = await supabase
      .from('students')
      .select(`
        *,
        school:organizations!students_school_id_fkey (
          id,
          name,
          code,
          city,
          state,
          organization_type
        ),
        university_colleges:university_college_id (
          id,
          name,
          code,
          university:organizations!university_colleges_university_id_fkey (
            id,
            name,
            city,
            state,
            organization_type
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
      .eq('id', studentId)
      .maybeSingle();

    if (error) {
      console.error('❌ Supabase error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No data found for this student ID.' };
    }

    // Use the same data processing logic as getStudentByEmail
    const email = data.email;
    
    // Since we no longer have a JSONB profile column, we'll create a profile object from individual columns
    const profileData = {
      name: data.name || 'Student',
      email: data.email || email,
      age: data.age,
      dateOfBirth: data.date_of_birth || data.dateOfBirth,
      phone: formatPhoneNumber(data.contact_number || data.contactNumber, data.contact_dial_code),
      alternatePhone: formatPhoneNumber(data.alternate_number),
      district: data.district_name,
      university: data.university,
      department: data.branch_field,
      college: data.college_school_name,
      registrationNumber: data.registration_number,
      
      // Guardian info
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      guardianEmail: data.guardianEmail,
      guardianRelation: data.guardianRelation,
      
      // Personal details
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      bio: data.bio,
      
      // Location
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,
      
      // Social links
      github_link: data.github_link,
      linkedin_link: data.linkedin_link,
      twitter_link: data.twitter_link,
      facebook_link: data.facebook_link,
      instagram_link: data.instagram_link,
      portfolio_link: data.portfolio_link,
      youtube_link: data.youtube_link,
      other_social_links: data.other_social_links || [],
      
      // Files
      resumeUrl: data.resumeUrl,
      profilePicture: data.profilePicture,
      
      // School/College specific
      grade: data.grade,
      section: data.section,
      roll_number: data.roll_number,
      admission_number: data.admission_number,
      
      // Additional fields
      hobbies: data.hobbies || [],
      languages: data.languages || [],
      interests: data.interests || [],
      
      // New fields for gap years, work experience, and academic info
      gapInStudies: data.gap_in_studies || false,
      gapYears: data.gap_years || 0,
      gapReason: data.gap_reason || '',
      workExperience: data.work_experience || '',
      aadharNumber: data.aadhar_number || '',
      backlogsHistory: data.backlogs_history || '',
      currentBacklogs: data.current_backlogs || 0,
      
      // Generate passport ID from registration number
      passportId: data.registration_number ? `SP-${data.registration_number}` : 'SP-0000',
      verified: true,
      employabilityScore: 75,
      cgpa: data.currentCgpa || 'N/A',
      photo: generateAvatar(data.name)
    };

    // Transform profile data to consistent format
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

    // Format education from education table
    const tableEducation = Array.isArray(data?.education) ? data.education : [];
    const formattedEducation = tableEducation.map((edu) => ({
      id: edu.id,
      level: edu.level || "Bachelor's",
      degree: edu.degree || "",
      department: edu.department || "",
      university: edu.university || "",
      yearOfPassing: edu.year_of_passing || "",
      cgpa: edu.cgpa || "",
      status: edu.status || "ongoing",
      approval_status: edu.approval_status || "pending",
      verified: edu.approval_status === "approved",
      processing: edu.approval_status !== "approved",
      enabled: edu.enabled !== undefined ? edu.enabled : true,
      createdAt: edu.created_at,
      updatedAt: edu.updated_at,
    }));

    const tableTrainings = Array.isArray(data?.trainings) ? data.trainings : [];

    // Filter to only approved/verified trainings first
    const approvedTrainings = tableTrainings.filter(
      (train) => train.approval_status === 'approved' || 
                 train.approval_status === 'verified' ||
                 train.approval_status === 'pending'
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
        
        // IMPORTANT: Include course_id and source for internal/external detection
        course_id: train.course_id || null,
        source: train.source || null,
        
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

    const tableExperience = Array.isArray(data?.experience) ? data.experience : [];
    const formattedExperience = tableExperience
      .map((exp) => ({
        id: exp.id,
        organization: exp.organization || "",
        role: exp.role || "",
        start_date: exp.start_date,
        end_date: exp.end_date,
        duration: exp.duration || "",
        verified: exp.verified || exp.approval_status === 'approved' || exp.approval_status === 'verified',
        approval_status: exp.approval_status || "pending",
        processing: exp.approval_status === 'pending',
        enabled: exp.enabled !== undefined ? exp.enabled : true,
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
      school: data.school || null,
      universityCollege: data.university_colleges || null,

      // School Information Fields
      grade: data.grade,
      section: data.section,
      roll_number: data.roll_number,
      admission_number: data.admission_number,

      // Profile data (from students.profile JSONB)
      profile: transformedProfile,

      // Legacy flattened access for backward compatibility - BUT individual columns take precedence
      ...transformedProfile,
      
      // CRITICAL FIX: Individual database columns override profile data
      name: data.name || transformedProfile.name,
      approval_status: data.approval_status, // This was getting overwritten!
      age: data.age || transformedProfile.age,
      date_of_birth: data.date_of_birth || transformedProfile.date_of_birth,
      contact_number: data.contact_number || transformedProfile.contact_number,
      university: data.university || transformedProfile.university,
      branch_field: data.branch_field || transformedProfile.branch_field,
      // Add other important individual columns
      github_link: data.github_link || transformedProfile.github_link,
      linkedin_link: data.linkedin_link || transformedProfile.linkedin_link,
      twitter_link: data.twitter_link || transformedProfile.twitter_link,
      facebook_link: data.facebook_link || transformedProfile.facebook_link,
      instagram_link: data.instagram_link || transformedProfile.instagram_link,
      portfolio_link: data.portfolio_link || transformedProfile.portfolio_link,
      youtube_link: data.youtube_link || transformedProfile.youtube_link,

      // NOW THESE COME FROM projects table:
      projects: Array.isArray(data.projects)
        ? data.projects
        .filter((project) => 
        project.approval_status === 'verified' || 
        project.approval_status === 'approved'
      )
        .map((project) => ({
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
    console.error('❌ getStudentById exception:', err);
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
    education: profileData.education || [],

    // Training - Will be fetched from separate 'training' table
    // Fallback to profile JSONB only if separate table is empty
    training: profileData.training || (data.course_name || profileData.course ? [{ course: data.course_name || profileData.course }] : []),

    // Experience - Will be fetched from separate 'experience' table
    experience: profileData.experience || [],

    // Technical skills - Will be fetched from separate 'skills' table (type='technical')
    // Fallback to profile JSONB only if separate table is empty
    technicalSkills: profileData.technicalSkills ||  [],

    // Soft skills - Will be fetched from separate 'skills' table (type='soft')
    // Fallback to profile JSONB only if separate table is empty
    softSkills: profileData.softSkills || [],

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
/**
 * Find student record by email using the current table structure
 * @param {string} email - Student email
 * @returns {Promise<Object>} Result with success flag and data
 */
export async function findStudentByEmail(email) {
  try {

    // Since profile column is removed, we only need to search by email column
    const { data: studentRecord, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error);
      return { success: false, error: error.message };
    }

    if (!studentRecord) {
      return { success: false, error: 'Student not found' };
    }

    return { success: true, data: studentRecord };
  } catch (err) {
    console.error('❌ findStudentByEmail exception:', err);
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

    // Map the updates to the correct column names in the students table
    const columnUpdates = {};
    
    // Map common profile fields to their corresponding columns
    const fieldMapping = {
      // Personal Info
      'name': 'name',
      'email': 'email',
      'age': 'age',
      'dateOfBirth': 'date_of_birth',
      'date_of_birth': 'date_of_birth',
      'phone': 'contact_number',
      'contactNumber': 'contact_number',
      'contact_number': 'contact_number',
      'alternatePhone': 'alternate_number',
      'alternate_number': 'alternate_number',
      'contact_number_dial_code': 'contact_dial_code', // Fix: map the form field to correct column
      'contact_dial_code': 'contact_dial_code',
      'location': 'address', // Map location to address field
      'bio': 'bio',
      
      // Location
      'district': 'district_name',
      'district_name': 'district_name',
      'address': 'address',
      'city': 'city',
      'state': 'state',
      'country': 'country',
      'pincode': 'pincode',
      
      // Education
      'university': 'university',
      'department': 'branch_field',
      'branch_field': 'branch_field',
      'college': 'college_school_name',
      'college_school_name': 'college_school_name',
      'registrationNumber': 'registration_number',
      'registration_number': 'registration_number',
      'enrollmentNumber': 'enrollmentNumber',
      'currentCgpa': 'currentCgpa',
      
      // Guardian Info
      'guardianName': 'guardianName',
      'guardianPhone': 'guardianPhone',
      'guardianEmail': 'guardianEmail',
      'guardianRelation': 'guardianRelation',
      
      // Personal Details
      'gender': 'gender',
      'bloodGroup': 'bloodGroup',
      
      // Social Links (map form field names to database column names)
      'linkedinUrl': 'linkedin_link',
      'githubUrl': 'github_link',
      'portfolioUrl': 'portfolio_link',
      'github_link': 'github_link',
      'linkedin_link': 'linkedin_link',
      'twitter_link': 'twitter_link',
      'facebook_link': 'facebook_link',
      'instagram_link': 'instagram_link',
      'portfolio_link': 'portfolio_link',
      'youtube_link': 'youtube_link',
      
      // Files
      'resumeUrl': 'resumeUrl',
      'profilePicture': 'profilePicture',
      
      // School/College specific
      'grade': 'grade',
      'section': 'section',
      'roll_number': 'roll_number',
      'admission_number': 'admission_number',
      
      // New fields for gap years, work experience, and academic info
      'gapInStudies': 'gap_in_studies',
      'gap_in_studies': 'gap_in_studies',
      'gapYears': 'gap_years',
      'gap_years': 'gap_years',
      'gapReason': 'gap_reason',
      'gap_reason': 'gap_reason',
      'workExperience': 'work_experience',
      'work_experience': 'work_experience',
      'aadharNumber': 'aadhar_number',
      'aadhar_number': 'aadhar_number',
      'backlogsHistory': 'backlogs_history',
      'backlogs_history': 'backlogs_history',
      'currentBacklogs': 'current_backlogs',
      'current_backlogs': 'current_backlogs'
    };

    // Apply field mapping
    Object.keys(updates).forEach(key => {
      const columnName = fieldMapping[key] || key;
      
      // Handle nested profile updates (for backward compatibility)
      if (key === 'profile' && typeof updates[key] === 'object') {
        // If someone passes a profile object, extract its fields
        Object.keys(updates[key]).forEach(profileKey => {
          const profileColumnName = fieldMapping[profileKey] || profileKey;
          if (updates[key][profileKey] !== undefined) {
            columnUpdates[profileColumnName] = updates[key][profileKey];
          }
        });
      } else if (updates[key] !== undefined) {
        columnUpdates[columnName] = updates[key];
      }
    });

    // Handle special cases for JSONB fields
    if (updates.other_social_links || updates.otherSocialLinks) {
      columnUpdates.other_social_links = updates.other_social_links || updates.otherSocialLinks;
    }
    if (updates.hobbies) {
      columnUpdates.hobbies = updates.hobbies;
    }
    if (updates.languages) {
      columnUpdates.languages = updates.languages;
    }
    if (updates.interests) {
      columnUpdates.interests = updates.interests;
    }
    if (updates.metadata) {
      columnUpdates.metadata = updates.metadata;
    }
    if (updates.notification_settings || updates.notificationSettings) {
      columnUpdates.notification_settings = updates.notification_settings || updates.notificationSettings;
    }

    // Always update the updated_at timestamp
    columnUpdates.updated_at = new Date().toISOString();

    // Filter out any columns that don't exist in the database
    const validColumns = [
      'id', 'universityId', 'createdAt', 'updatedAt', 'email', 'name', 'age', 'date_of_birth', 
      'contact_number', 'alternate_number', 'district_name', 'university', 'branch_field', 
      'college_school_name', 'registration_number', 'github_link', 'linkedin_link', 
      'twitter_link', 'facebook_link', 'instagram_link', 'portfolio_link', 'other_social_links', 
      'approval_status', 'created_at', 'updated_at', 'embedding', 'universityCollegeId', 
      'schoolClassId', 'collegeCourseId', 'universityCourseId', 'enrollmentNumber', 
      'guardianName', 'guardianPhone', 'guardianEmail', 'guardianRelation', 'dateOfBirth', 
      'gender', 'bloodGroup', 'enrollmentDate', 'expectedGraduationDate', 'currentCgpa', 
      'contactNumber', 'address', 'city', 'state', 'country', 'pincode', 'resumeUrl', 
      'profilePicture', 'metadata', 'university_college_id', 'school_id', 'school_class_id', 
      'student_type', 'user_id', 'student_id', 'bio', 'university_main', 'imported_at', 
      'resume_imported_at', 'skill_summary', 'course_name', 'contact_dial_code', 'trainer_name', 
      'is_deleted', 'deleted_at', 'deleted_by', 'grade', 'section', 'roll_number', 
      'admission_number', 'college_id', 'hobbies', 'languages', 'interests', 'category', 
      'quota', 'youtube_link', 'notification_settings', 'gap_in_studies', 'gap_years', 
      'gap_reason', 'work_experience', 'aadhar_number', 'backlogs_history', 'current_backlogs'
    ];

    const filteredUpdates = {};
    Object.keys(columnUpdates).forEach(key => {
      if (validColumns.includes(key)) {
        filteredUpdates[key] = columnUpdates[key];
      } else {
        console.warn(`⚠️ Skipping unknown column: ${key}`);
      }
    });


    // Update the student record
    const { data, error } = await supabase
      .from('students')
      .update(filteredUpdates)
      .eq('id', studentRecord.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return { success: false, error: error.message };
    }


    // Return the updated data in the expected format
    // Since we no longer have a profile JSONB, we need to fetch the complete updated record
    const updatedResult = await getStudentByEmail(email);
    
    return {
      success: true,
      data: updatedResult.success ? updatedResult.data : data
    };

  } catch (err) {
    console.error('❌ Unexpected error in updateStudentByEmail:', err);
    return { success: false, error: err.message };
  }
}


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

    // Use studentRecord.id (NOT user_id) because education.student_id FK references students.id
    const studentId = studentRecord.id;


    // Get existing education records
    const { data: existingEducation, error: existingError } = await supabase
      .from('education')
      .select('id')
      .eq('student_id', studentId);

    if (existingError) {
      console.error('❌ Error fetching existing education:', existingError);
      return { success: false, error: existingError.message };
    }


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
          enabled: typeof edu.enabled === 'boolean' ? edu.enabled : true, // Handle enabled field
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


    // Determine which records to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingEducation || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
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
      const { data: upsertData, error: upsertError } = await supabase
        .from('education')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        console.error('❌ Error upserting education:', upsertError);
        return { success: false, error: upsertError.message };
      }
    } else if ((existingEducation || []).length > 0) {
      // Delete all if no education data provided
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

export async function updateTrainingByEmail(email, trainingData = []) {
  try {
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

    // Use studentRecord.id (NOT user_id) because trainings.student_id FK references students.id
    const studentId = studentRecord.id;

    // Get existing training records
    const { data: existingTrainings, error: existingError } = await supabase
      .from('trainings')
      .select('id, approval_status')
      .eq('student_id', studentId);

    if (existingError) {
      return { success: false, error: existingError.message };
    }


    const nowIso = new Date().toISOString();

    // Format training data for database
    const formatted = (trainingData || [])
      .filter((train) => {
        // Prefer 'course' (form field) over 'title' (database field) for validation
        const titleField = train.course || train.title;
        return train && typeof titleField === 'string' && titleField.trim().length > 0;
      })
      .map((train) => {
        // 🔧 FIX: Prioritize 'course' (form field with user edits) over 'title' (old database value)
        const titleValue = train.course || train.title || '';
        
        const record = {
          student_id: studentId,
          title: titleValue.trim(),
          // 🔧 FIX: Prioritize form fields (camelCase) over database fields (snake_case)
          organization: train.provider?.trim() || train.organization?.trim() || null,
          start_date: train.startDate || train.start_date || null,
          end_date: train.endDate || train.end_date || null,
          duration: train.duration?.trim() || null,
          description: train.description?.trim() || null,
          status: train.status || 'ongoing',
          completed_modules: train.completedModules || 0,
          total_modules: train.totalModules || 0,
          hours_spent: train.hoursSpent || 0,
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof train.id === 'string' ? train.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
          
          // 🔥 CRITICAL FIX: Preserve existing approval_status for updates
          const existingTraining = existingTrainings?.find(t => t.id === rawId);
          if (existingTraining) {
            // Keep the existing approval status (could be 'approved', 'pending', or 'rejected')
            record.approval_status = existingTraining.approval_status;
          } else {
            // New training (somehow has ID but not in DB)
            record.approval_status = 'pending';
          }
        } else {
          // Brand new training without ID
          record.id = generateUuid();
          record.approval_status = 'pending'; // New trainings start as pending
        }

        // Store certificateUrl and skills for later use
        record._certificateUrl = train.certificateUrl?.trim() || null;
        record._skills = Array.isArray(train.skills) ? train.skills : [];

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingTrainings || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records and their related data
    if (toDelete.length > 0) {

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


      // ===== NOW SAVE ONLY CERTIFICATE URL AND SKILLS =====
      for (const record of formatted) {
        const trainingId = record.id;
        const certificateUrl = record._certificateUrl;
        const skills = record._skills;


        // ===== SAVE ONLY CERTIFICATE URL =====
        if (certificateUrl && certificateUrl.length > 0) {

          // Check if certificate already exists for this training
          const { data: existingCert } = await supabase
            .from('certificates')
            .select('id, link')
            .eq('training_id', trainingId)
            .maybeSingle();

          if (existingCert) {
            // ✅ Only update link if it changed
            if (existingCert.link !== certificateUrl) {
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
              approval_status: 'pending', // Certificates also need approval
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
              console.log('  ✅ Certificate created with URL (pending approval)');
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
          }

          // ✅ Add new skills with ONLY required fields
          if (skillsToAdd.length > 0) {
            const skillRecords = skillsToAdd.map(skillName => ({
              id: generateUuid(),
              student_id: studentId,
              training_id: trainingId,
              name: skillName,
              type: 'technical',
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

          // if (skillsToAdd.length === 0 && skillIdsToDelete.length === 0) {
          //   console.log('  ℹ️ Skills unchanged');
          // }
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


    // Return updated student data
    return await getStudentByEmail(email);
  } catch (err) {
    console.error('❌ updateTrainingByEmail exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update a single training record by ID
 * Used for editing individual training items from My Learning page
 */
export async function updateSingleTrainingById(trainingId, updateData, email) {
  try {
    // Prepare the update object
    const nowIso = new Date().toISOString();
    const updateRecord = {
      // 🔧 FIX: Prioritize form fields (camelCase) over database fields (snake_case)
      title: updateData.course?.trim() || updateData.title?.trim(),
      organization: updateData.provider?.trim() || updateData.organization?.trim() || null,
      start_date: updateData.startDate || updateData.start_date || null,
      end_date: updateData.endDate || updateData.end_date || null,
      duration: updateData.duration?.trim() || null,
      description: updateData.description?.trim() || null,
      status: updateData.status || 'ongoing',
      completed_modules: parseInt(updateData.completedModules) || 0,
      total_modules: parseInt(updateData.totalModules) || 0,
      hours_spent: parseInt(updateData.hoursSpent) || 0,
      updated_at: nowIso,
    };

    // Update the training record
    const { data: updatedTraining, error: updateError } = await supabase
      .from('trainings')
      .update(updateRecord)
      .eq('id', trainingId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating training:', updateError);
      return { success: false, error: updateError.message };
    }

    // Handle skills update if provided
    const skills = updateData.skills;
    if (Array.isArray(skills)) {
      const studentId = updatedTraining.student_id;
      
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

      // Find skills to add
      const skillsToAdd = newSkillNames.filter(
        skillName => !existingSkillNames.has(skillName.toLowerCase())
      );

      // Find skills to remove
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
      }

      // Add new skills
      if (skillsToAdd.length > 0) {
        const skillRecords = skillsToAdd.map(skillName => ({
          id: generateUuid(),
          student_id: studentId,
          training_id: trainingId,
          name: skillName,
          type: 'technical',
          created_at: nowIso,
          updated_at: nowIso,
        }));

        const { error: skillsInsertError } = await supabase
          .from('skills')
          .insert(skillRecords);

        if (skillsInsertError) {
          console.error('❌ Error inserting skills:', skillsInsertError);
        } else {
          console.log(`✅ Added ${skillsToAdd.length} new skills`);
        }
      }
    }

    // Handle certificate URL update if provided
    if (updateData.certificateUrl !== undefined) {
      const studentId = updatedTraining.student_id;
      
      if (updateData.certificateUrl && updateData.certificateUrl.trim()) {
        // Check if certificate exists
        const { data: existingCert } = await supabase
          .from('certificates')
          .select('id')
          .eq('training_id', trainingId)
          .maybeSingle();

        if (existingCert) {
          // Update existing certificate
          await supabase
            .from('certificates')
            .update({ 
              link: updateData.certificateUrl.trim(),
              updated_at: nowIso 
            })
            .eq('id', existingCert.id);
        } else {
          // Create new certificate
          await supabase
            .from('certificates')
            .insert([{
              id: generateUuid(),
              student_id: studentId,
              training_id: trainingId,
              title: `${updateRecord.title} - Certificate`,
              link: updateData.certificateUrl.trim(),
              status: 'active',
              approval_status: 'pending',
              enabled: true,
              created_at: nowIso,
              updated_at: nowIso,
            }]);
        }
      } else {
        // Remove certificate if URL is empty
        await supabase
          .from('certificates')
          .delete()
          .eq('training_id', trainingId);
      }
    }

    
    // Return refreshed student data if email provided
    if (email) {
      return await getStudentByEmail(email);
    }
    
    return { success: true, data: updatedTraining };
  } catch (err) {
    console.error('❌ updateSingleTrainingById exception:', err);
    return { success: false, error: err.message };
  }
}

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
 * Update projects table records
 */
export const updateProjectsByEmail = async (email, projectsData = []) => {
  try {
    // Find student record
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

    // Get existing projects
    const { data: existingProjects, error: existingError } = await supabase
      .from('projects')
      .select('id')
      .eq('student_id', studentId);

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format projects data for database
    const formatted = (projectsData || [])
      .filter((project) => project && typeof project.title === 'string' && project.title.trim().length > 0)
      .map((project) => {
        const record = {
          student_id: studentId,
          title: project.title.trim(),
          description: project.description?.trim() || null,
          status: project.status || 'completed',
          start_date: project.start_date || project.startDate || null,
          end_date: project.end_date || project.endDate || null,
          duration: project.duration || null,
          organization: project.organization || project.company || project.client || null,
          tech_stack: project.tech || project.tech_stack || project.technologies || [],
          demo_link: project.demo_link || project.link || null,
          github_link: project.github_link || project.github || project.github_url || null,
          certificate_url: project.certificate_url || null,
          video_url: project.video_url || null,
          ppt_url: project.ppt_url || null,
          enabled: typeof project.enabled === 'boolean' ? project.enabled : true,
          approval_status: project.approval_status || 'pending',
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof project.id === 'string' ? project.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.filter((record) => record.id).map((record) => record.id));
    const toDelete = (existingProjects || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
    }

    // Upsert projects records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('projects')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
    } else if ((existingProjects || []).length > 0) {
      // Delete all if no projects data provided
      const { error: deleteAllError } = await supabase
        .from('projects')
        .delete()
        .eq('student_id', studentId);

      if (deleteAllError) {
        return { success: false, error: deleteAllError.message };
      }
    }

    // Return updated student data
    return await getStudentByEmail(email);
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