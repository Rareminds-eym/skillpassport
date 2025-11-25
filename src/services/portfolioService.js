/**
 * Portfolio Service - Fetches student data from relational tables
 * 
 * Uses proper database schema:
 * - students (main table with individual columns)
 * - skills (technical and soft skills)
 * - trainings (training programs)
 * - projects (student projects)
 * - certificates (certifications)
 * - education (educational background)
 * - experience (work experience)
 * - schools (school information)
 * - universities (university information)
 * - university_colleges (college information)
 */

import { supabase } from '../utils/api';

/**
 * Fetch complete student portfolio data by email
 * @param {string} email - Student email
 * @returns {Promise<Object>} Complete student portfolio data
 */
export const getStudentPortfolioByEmail = async (email) => {
  try {
    console.log('🔍 Fetching portfolio data for:', email);

    // First, get the student record to get their user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        schools:school_id (
          id,
          name,
          code,
          city,
          state,
          board,
          principal_name
        ),
        universities:universityId (
          id,
          name,
          code,
          state,
          district,
          website
        ),
        university_colleges:university_college_id (
          id,
          name,
          code,
          dean_name,
          universities:university_id (
            id,
            name,
            state,
            district
          )
        )
      `)
      .eq('email', email)
      .maybeSingle();

    if (studentError) {
      console.error('❌ Error fetching student:', studentError);
      return { success: false, error: studentError.message };
    }

    if (!student) {
      console.warn('⚠️ No student found with email:', email);
      return { success: false, error: 'Student not found' };
    }

    const userId = student.user_id;
    console.log('✅ Student found, fetching related data for user_id:', userId);

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
        .eq('student_id', userId)
        .in('approval_status', ['verified', 'approved'])
        .eq('enabled', true)
        .order('created_at', { ascending: false }),

      
      // Trainings
      supabase
        .from('trainings')
        .select('*')
        .eq('student_id', userId)
        .in('approval_status', ['verified', 'approved'])
        .order('start_date', { ascending: false }),
      
      // Projects
      supabase
        .from('projects')
        .select('*')
        .eq('student_id', userId)
        .eq('enabled', true)
        .in('approval_status', ['verified', 'approved'])
        .order('start_date', { ascending: false }),
      
      // Certificates
      supabase
        .from('certificates')
        .select('*')
        .eq('student_id', userId)
        .in('approval_status', ['verified', 'approved'])
        .order('issued_on', { ascending: false }),
      
      // Education
      supabase
        .from('education')
        .select('*')
        .eq('student_id', userId)
        .in('approval_status', ['verified', 'approved'])
        .order('year_of_passing', { ascending: false }),
      
      // Experience
      supabase
        .from('experience')
        .select('*')
        .eq('student_id', userId)
        .in('approval_status', ['verified', 'approved'])
        .order('start_date', { ascending: false })
    ]);

    // Check for errors in any of the queries
    if (skillsResult.error) console.error('⚠️ Skills error:', skillsResult.error);
    if (trainingsResult.error) console.error('⚠️ Trainings error:', trainingsResult.error);
    if (projectsResult.error) console.error('⚠️ Projects error:', projectsResult.error);
    if (certificatesResult.error) console.error('⚠️ Certificates error:', certificatesResult.error);
    if (educationResult.error) console.error('⚠️ Education error:', educationResult.error);
    if (experienceResult.error) console.error('⚠️ Experience error:', experienceResult.error);

    // Transform the data to match the Student type interface
    const portfolioData = transformToPortfolioFormat(
      student,
      skillsResult.data || [],
      trainingsResult.data || [],
      projectsResult.data || [],
      certificatesResult.data || [],
      educationResult.data || [],
      experienceResult.data || []
    );

    console.log('✅ Portfolio data compiled successfully');
    return { success: true, data: portfolioData };

  } catch (error) {
    console.error('❌ Exception in getStudentPortfolioByEmail:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Transform database records to Student interface format
 */
function transformToPortfolioFormat(
  student,
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
    field: edu.department || student.branch_field || 'N/A',
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
    email: student.email,
    name: student.name,
    passportId: student.registration_number ? `SP-${student.registration_number}` : `SP-${student.student_id || '0000'}`,
    profileImage: student.profilePicture || generateAvatar(student.name),
    bio: student.bio || '',
    skills: softSkills, // For backward compatibility
    technicalSkills: technicalSkills,
    projects: formattedProjects,
    education: formattedEducation,
    experience: formattedExperience,
    certifications: formattedCertificates,
    training: formattedTrainings,
    languages: [], // Can be added if you have a languages table
    hobbies: [],
    interests: [],
    achievements: [],
    
    // Additional profile info
    phone: student.contactNumber || student.contact_number,
    age: student.age || calculateAge(student.dateOfBirth || student.date_of_birth),
    dateOfBirth: student.dateOfBirth || student.date_of_birth,
    gender: student.gender,
    bloodGroup: student.bloodGroup,
    
    // Address
    address: student.address,
    city: student.city,
    state: student.state,
    district: student.district_name,
    country: student.country,
    pincode: student.pincode,
    
    // Academic
    university: student.university || student.university_main,
    college: student.college_school_name,
    department: student.branch_field,
    registrationNumber: student.registration_number,
    enrollmentNumber: student.enrollmentNumber,
    currentCgpa: student.currentCgpa,
    expectedGraduationDate: student.expectedGraduationDate,
    
    // Guardian
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    guardianEmail: student.guardianEmail,
    guardianRelation: student.guardianRelation,
    
    // Social links
    github_link: student.github_link,
    linkedin_link: student.linkedin_link,
    twitter_link: student.twitter_link,
    facebook_link: student.facebook_link,
    instagram_link: student.instagram_link,
    portfolio_link: student.portfolio_link,
    other_social_links: student.other_social_links || [],
    
    // Resume
    resumeUrl: student.resumeUrl,
    
    // School/College info
    school: student.schools,
    universityCollege: student.university_colleges,
    universityInfo: student.universities
  };

  // Return the complete student object
  return {
    id: student.id,
    student_id: student.student_id,
    universityId: student.universityId,
    email: student.email,
    name: student.name,
    age: profile.age,
    date_of_birth: student.date_of_birth,
    dateOfBirth: student.dateOfBirth,
    contact_number: student.contact_number,
    contactNumber: student.contactNumber,
    alternate_number: student.alternate_number,
    district_name: student.district_name,
    university: student.university,
    branch_field: student.branch_field,
    college_school_name: student.college_school_name,
    registration_number: student.registration_number,
    github_link: student.github_link,
    linkedin_link: student.linkedin_link,
    twitter_link: student.twitter_link,
    facebook_link: student.facebook_link,
    instagram_link: student.instagram_link,
    portfolio_link: student.portfolio_link,
    other_social_links: student.other_social_links || [],
    approval_status: student.approval_status,
    created_at: student.created_at,
    updated_at: student.updated_at,
    createdAt: student.created_at,
    updatedAt: student.updated_at,
    
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
    
    // School/College relationships
    school_id: student.school_id,
    university_college_id: student.university_college_id,
    school: student.schools,
    universityCollege: student.university_colleges,
    
    // Metadata
    user_id: student.user_id,
    student_type: student.student_type,
    metadata: student.metadata
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
  if (!name) return `https://ui-avatars.com/api/?name=Student&background=random`;
  const initials = name.split(' ').map(n => n[0]).join('');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
}
