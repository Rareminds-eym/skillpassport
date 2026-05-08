/**
 * Portfolio Service - Fetches learner data from relational tables
 * 
 * Uses proper database schema:
 * - learners (main table with individual columns)
 * - skills (technical and soft skills)
 * - trainings (training programs)
 * - projects (learner projects)
 * - certificates (certifications)
 * - education (educational background)
 * - experience (work experience)
 * - schools (school information)
 * - universities (university information)
 * - university_colleges (college information)
 */

import { supabase } from "@/shared/api/supabaseClient";
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('PortfolioService');

/**
 * Fetch complete learner portfolio data by email
 * @param {string} email - Learner email
 * @returns {Promise<Object>} Complete learner portfolio data
 */
export const getlearnerPortfolioByEmail = async (email) => {
  try {
    // First, get the learner record to get their user_id
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select(`
        *,
        school:organizations!learners_school_id_fkey (
          id,
          name,
          code,
          city,
          state,
          organization_type
        ),
        college:organizations!learners_college_id_fkey (
          id,
          name,
          code,
          city,
          state,
          organization_type
        ),
        universityInfo:organizations!learners_universityid_fkey (
          id,
          name,
          code,
          state,
          city,
          website,
          organization_type
        ),
        university_colleges:university_college_id (
          id,
          name,
          code,
          university:organizations!university_colleges_university_id_fkey (
            id,
            name,
            state,
            city,
            organization_type
          )
        )
      `)
      .eq('email', email)
      .maybeSingle();

    if (learnerError) {
      return { success: false, error: learnerError.message };
    }

    if (!learner) {
      return { success: false, error: 'Learner not found' };
    }

    // If school relationship didn't load but school_id exists, fetch it separately
    if (learner.school_id && !learner.school) {
      const { data: schoolData, error: schoolError } = await supabase
        .from('organizations')
        .select('id, name, code, city, state, organization_type')
        .eq('id', learner.school_id)
        .single();
      
      if (!schoolError && schoolData) {
        learner.school = schoolData;
      }
    }

    // If college relationship didn't load but college_id exists, fetch it separately
    if (learner.college_id && !learner.college) {
      const { data: collegeData, error: collegeError } = await supabase
        .from('organizations')
        .select('id, name, code, city, state, organization_type')
        .eq('id', learner.college_id)
        .single();
      
      if (!collegeError && collegeData) {
        learner.college = collegeData;
      }
    }

    const userId = learner.id;

    // Fetch all related data in parallel for performance
    const [
      skillsResult,
      trainingsResult,
      projectsResult,
      certificatesResult,
      educationResult,
      experienceResult
    ] = await Promise.all([
      // Skills (both technical and soft)
      supabase
        .from('skills')
        .select('*')
        .eq('learner_id', userId)
        .in('approval_status', ['verified', 'approved'])
        .eq('enabled', true)
        .order('created_at', { ascending: false }),

      
      // Trainings
      supabase
        .from('trainings')
        .select('*')
        .eq('learner_id', userId)
        .eq('enabled', true)
        .in('approval_status', ['verified', 'approved'])
        .order('start_date', { ascending: false }),
      
      // Projects
      supabase
        .from('projects')
        .select('*')
        .eq('learner_id', userId)
        .eq('enabled', true)
        .in('approval_status', ['verified', 'approved'])
        .order('start_date', { ascending: false }),
      
      // Certificates
      supabase
        .from('certificates')
        .select('*')
        .eq('learner_id', userId)
        .eq('enabled', true)
        .in('approval_status', ['verified', 'approved'])
        .order('issued_on', { ascending: false }),
      
      // Education
      supabase
        .from('education')
        .select('*')
        .eq('learner_id', userId)
        .eq('enabled', true)
        .in('approval_status', ['verified', 'approved'])
        .order('year_of_passing', { ascending: false }),
      
      // Experience
      supabase
        .from('experience')
        .select('*')
        .eq('learner_id', userId)
        .eq('enabled', true)
        .in('approval_status', ['verified', 'approved'])
        .order('start_date', { ascending: false })
    ]);

    // Transform the data to match the Learner type interface
    const portfolioData = transformToPortfolioFormat(
      learner,
      skillsResult.data || [],
      trainingsResult.data || [],
      projectsResult.data || [],
      certificatesResult.data || [],
      educationResult.data || [],
      experienceResult.data || []
    );

    return { success: true, data: portfolioData };

  } catch (error) {
    logger.error('Exception in getlearnerPortfolioByEmail', error as Error);
    return { success: false, error: error.message };
  }
};

/**
 * Transform database records to Learner interface format
 */
function transformToPortfolioFormat(
  learner,
  skills,
  trainings,
  projects,
  certificates,
  education,
  experience
) {
  // Separate technical and soft skills
  const technicalSkills = skills
    .filter(skill => skill.type === 'technical')
    .map(skill => ({
      id: skill.id,
      name: skill.name,
      level: skill.level || 3,
      category: skill.description || 'General',
      verified: skill.verified,
      approvalStatus: skill.approval_status
    }));

  const softSkills = skills
    .filter(skill => skill.type === 'soft')
    .map(skill => ({
      id: skill.id,
      name: skill.name,
      level: mapLevelToString(skill.level),
      category: skill.description || 'General',
      verified: skill.verified,
      approvalStatus: skill.approval_status
    }));

  // Transform trainings
  const formattedTrainings = trainings.map(training => ({
    id: training.id,
    name: training.title,
    provider: training.organization || 'N/A',
    completionDate: training.end_date || training.start_date,
    startDate: training.start_date,
    endDate: training.end_date,
    duration: training.duration,
    description: training.description,
    skills: [], // Can be enhanced if you have a training_skills junction table
    approvalStatus: training.approval_status
  }));

  // Transform projects
  const formattedProjects = projects.map(project => ({
    id: project.id,
    title: project.title,
    description: project.description || '',
    technologies: project.tech_stack || [],
    github_url: project.github_link,
    live_url: project.demo_link,
    image: project.certificate_url, // Using certificate as image
    startDate: project.start_date,
    endDate: project.end_date,
    duration: project.duration,
    organization: project.organization,
    status: project.status,
    videoUrl: project.video_url,
    pptUrl: project.ppt_url,
    approvalStatus: project.approval_status,
    enabled: project.enabled
  }));

  // Transform certificates
  const formattedCertificates = certificates.map(cert => ({
    id: cert.id,
    name: cert.title,
    issuer: cert.issuer || 'N/A',
    date: cert.issued_on,
    url: cert.link,
    image: cert.document_url,
    credentialId: cert.credential_id,
    level: cert.level,
    description: cert.description,
    verified: cert.approval_status === 'approved',
    approvalStatus: cert.approval_status,
    enabled: cert.enabled !== false
  }));

  // Transform education
  const formattedEducation = education.map(edu => ({
    id: edu.id,
    institution: edu.university || 'N/A',
    degree: edu.degree || 'N/A',
    field: edu.department || learner.branch_field || 'N/A',
    startDate: '', // Not in current schema
    endDate: edu.year_of_passing,
    grade: edu.cgpa,
    description: '',
    level: edu.level,
    status: edu.status,
    approvalStatus: edu.approval_status
  }));

  // Transform experience
  const formattedExperience = experience.map(exp => ({
    id: exp.id,
    company: exp.organization || 'N/A',
    position: exp.role || 'N/A',
    startDate: exp.start_date,
    endDate: exp.end_date,
    duration: exp.duration,
    description: '',
    technologies: [],
    verified: exp.verified,
    approvalStatus: exp.approval_status
  }));

  // Build the profile object
  const profile = {
    email: learner.email,
    name: learner.name,
    passportId: learner.registration_number ? `SP-${learner.registration_number}` : `SP-${learner.learner_id || '0000'}`,
    profileImage: learner.profilePicture || generateAvatar(learner.name),
    bio: learner.bio || '',
    skills: softSkills, // For backward compatibility
    technicalSkills: technicalSkills,
    projects: formattedProjects,
    education: formattedEducation,
    experience: formattedExperience,
    certifications: formattedCertificates,
    training: formattedTrainings,
    languages: learner.languages || [],
    hobbies: learner.hobbies || [],
    interests: learner.interests || [],
    achievements: [],
    
    // Additional profile info
    phone: learner.contactNumber || learner.contact_number,
    age: learner.age || calculateAge(learner.dateOfBirth || learner.date_of_birth),
    dateOfBirth: learner.dateOfBirth || learner.date_of_birth,
    gender: learner.gender,
    bloodGroup: learner.bloodGroup,
    
    // Address
    address: learner.address,
    city: learner.city,
    state: learner.state,
    district: learner.district_name,
    country: learner.country,
    pincode: learner.pincode,
    
    // Academic
    university: learner.university || learner.university_main,
    college: learner.college_school_name,
    department: learner.branch_field,
    registrationNumber: learner.registration_number,
    enrollmentNumber: learner.enrollmentNumber,
    currentCgpa: learner.currentCgpa,
    expectedGraduationDate: learner.expectedGraduationDate,
    
    // Guardian
    guardianName: learner.guardianName,
    guardianPhone: learner.guardianPhone,
    guardianEmail: learner.guardianEmail,
    guardianRelation: learner.guardianRelation,
    
    // Social links
    github_link: learner.github_link,
    linkedin_link: learner.linkedin_link,
    twitter_link: learner.twitter_link,
    facebook_link: learner.facebook_link,
    instagram_link: learner.instagram_link,
    portfolio_link: learner.portfolio_link,
    other_social_links: learner.other_social_links || [],
    
    // Resume
    resumeUrl: learner.resumeUrl,
    
    // School/College info
    school: learner.schools,
    universityCollege: learner.university_colleges,
    universityInfo: learner.universities
  };

  // Return the complete learner object
  return {
    id: learner.id,
    learner_id: learner.learner_id,
    universityId: learner.universityId,
    email: learner.email,
    name: learner.name,
    age: profile.age,
    date_of_birth: learner.date_of_birth,
    dateOfBirth: learner.dateOfBirth,
    contact_number: learner.contact_number,
    contactNumber: learner.contactNumber,
    alternate_number: learner.alternate_number,
    district_name: learner.district_name,
    university: learner.university,
    branch_field: learner.branch_field,
    college_school_name: learner.college_school_name,
    registration_number: learner.registration_number,
    github_link: learner.github_link,
    linkedin_link: learner.linkedin_link,
    twitter_link: learner.twitter_link,
    facebook_link: learner.facebook_link,
    instagram_link: learner.instagram_link,
    portfolio_link: learner.portfolio_link,
    other_social_links: learner.other_social_links || [],
    approval_status: learner.approval_status,
    created_at: learner.created_at,
    updated_at: learner.updated_at,
    createdAt: learner.created_at,
    updatedAt: learner.updated_at,
    
    // Nested profile object (for backward compatibility with existing components)
    profile: profile,
    
    // Direct access to collections
    skills: softSkills,
    technicalSkills: technicalSkills,
    softSkills: softSkills,
    training: formattedTrainings,
    projects: formattedProjects,
    certificates: formattedCertificates,
    certifications: formattedCertificates,
    education: formattedEducation,
    experience: formattedExperience,
    languages: learner.languages || [],
    hobbies: learner.hobbies || [],
    interests: learner.interests || [],
    
    // School/College relationships
    school_id: learner.school_id,
    university_college_id: learner.university_college_id,
    school: learner.schools,
    universityCollege: learner.university_colleges,
    universityInfo: learner.universities,

    // School learner fields
    learner_type: learner.learner_type,
    grade: learner.grade,
    section: learner.section,

    // Location fields
    city: learner.city,
    state: learner.state,
    country: learner.country,

    // Metadata
    user_id: learner.user_id,
    metadata: learner.metadata
  };
}

/**
 * Helper: Map numeric skill level to string
 */
function mapLevelToString(level) {
  const mapping = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert',
    5: 'Expert'
  };
  return mapping[level] || 'Intermediate';
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
 * Helper: Generate avatar URL from name
 */
function generateAvatar(name) {
  if (!name) return `https://ui-avatars.com/api/?name=Learner&background=random`;
  const initials = name.split(' ').map(n => n[0]).join('');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
}
