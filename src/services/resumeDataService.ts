/**
 * Resume Data Service
 * Handles saving parsed resume data to separate database tables
 * instead of storing everything in the profile JSONB column
 */

import { supabase } from '../lib/supabaseClient';

// Type definitions
interface Education {
  level?: string;
  degree?: string;
  department?: string;
  university?: string;
  yearOfPassing?: string;
  cgpa?: string;
  status?: string;
}

interface Experience {
  organization?: string;
  role?: string;
  duration?: string;
  verified?: boolean;
}

interface Skill {
  name?: string;
  level?: number;
  category?: string;
  description?: string;
  type?: string;
  verified?: boolean;
}

interface Certificate {
  title?: string;
  issuer?: string;
  level?: string;
  credentialId?: string;
  link?: string;
  issuedOn?: string | null;
  description?: string;
  status?: string;
}

interface Project {
  title?: string;
  organization?: string;
  duration?: string;
  description?: string;
  status?: string;
  technologies?: string[];
  techStack?: string[];
  tech?: string[];
  skills?: string[];
  demoLink?: string;
  demo?: string;
  link?: string;
  url?: string;
  github?: string;
}

interface Training {
  course?: string;
  skill?: string;
  trainer?: string;
  status?: string;
  progress?: number;
}

interface ParsedResumeData {
  name?: string;
  contact_number?: string;
  alternate_number?: string;
  age?: string | number;
  date_of_birth?: string;
  university?: string;
  branch_field?: string;
  college_school_name?: string;
  registration_number?: string;
  district_name?: string;
  education?: Education[];
  experience?: Experience[];
  technicalSkills?: Skill[];
  softSkills?: Skill[];
  certificates?: Certificate[];
  projects?: Project[];
  training?: Training[];
}

interface SaveResult {
  success: boolean;
  saved: {
    education: number;
    experience: number;
    skills: number;
    certificates: number;
    projects: number;
    trainings: number;
  };
  errors: Array<{ table?: string; error?: string; general?: string }>;
  error?: string;
}

interface DatabaseEducation {
  id: string;
  student_id: string;
  level: string;
  degree: string;
  department: string;
  university: string;
  year_of_passing: string;
  cgpa: string;
  status: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseExperience {
  id: string;
  student_id: string;
  organization: string;
  role: string;
  duration: string;
  verified: boolean;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseSkill {
  id: string;
  student_id: string;
  name: string;
  type: 'technical' | 'soft';
  level: number;
  description: string;
  verified: boolean;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseCertificate {
  id: string;
  student_id: string;
  title: string;
  issuer: string;
  level: string;
  credential_id: string;
  link: string;
  issued_on: string | null;
  description: string;
  status: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseProject {
  id: string;
  student_id: string;
  title: string;
  organization: string;
  duration: string;
  description: string;
  status: string;
  tech_stack: string[];
  demo_link: string;
  github_link: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseTraining {
  id: string;
  student_id: string;
  title: string;
  organization: string;
  status: string;
  description: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

interface ResumeDataSummary {
  education: DatabaseEducation[];
  experience: DatabaseExperience[];
  skills: DatabaseSkill[];
  certificates: DatabaseCertificate[];
  projects: DatabaseProject[];
  trainings: DatabaseTraining[];
}

/**
 * Save parsed resume data to separate tables
 * @param parsedData - The parsed resume data
 * @param studentId - The student's ID (from students table)
 * @param userEmail - The student's email
 * @returns Result with success status and details
 */
export const saveResumeToTables = async (
  parsedData: ParsedResumeData,
  studentId: string,
  userEmail: string
): Promise<SaveResult> => {
  try {
    const results: SaveResult = {
      success: true,
      saved: {
        education: 0,
        experience: 0,
        skills: 0,
        certificates: 0,
        projects: 0,
        trainings: 0
      },
      errors: []
    };

    // 1. Save Education Records
    if (parsedData.education && Array.isArray(parsedData.education) && parsedData.education.length > 0) {
      try {
        const educationRecords = parsedData.education.map(edu => ({
          student_id: studentId,
          level: edu.level || "Bachelor's",
          degree: edu.degree || '',
          department: edu.department || '',
          university: edu.university || '',
          year_of_passing: edu.yearOfPassing || '',
          cgpa: edu.cgpa || '',
          status: edu.status || 'completed',
          approval_status: 'pending'
        }));

        const { data, error } = await supabase
          .from('education')
          .insert(educationRecords)
          .select();

        if (error) throw error;
        results.saved.education = data?.length || 0;
      } catch (error) {
        console.error('Error saving education:', error);
        results.errors.push({ table: 'education', error: (error as Error).message });
      }
    }

    // 2. Save Experience Records
    if (parsedData.experience && Array.isArray(parsedData.experience) && parsedData.experience.length > 0) {
      try {
        const experienceRecords = parsedData.experience.map(exp => ({
          student_id: studentId,
          organization: exp.organization || '',
          role: exp.role || '',
          duration: exp.duration || '',
          verified: exp.verified || false,
          approval_status: 'pending'
        }));

        const { data, error } = await supabase
          .from('experience')
          .insert(experienceRecords)
          .select();

        if (error) throw error;
        results.saved.experience = data?.length || 0;
      } catch (error) {
        console.error('Error saving experience:', error);
        results.errors.push({ table: 'experience', error: (error as Error).message });
      }
    }

    // 3. Save Skills (Technical + Soft)
    const allSkills: Array<{
      student_id: string;
      name: string;
      type: 'technical' | 'soft';
      level: number;
      description: string;
      verified: boolean;
      approval_status: string;
    }> = [];
    
    // Technical Skills
    if (parsedData.technicalSkills && Array.isArray(parsedData.technicalSkills)) {
      parsedData.technicalSkills.forEach(skill => {
        allSkills.push({
          student_id: studentId,
          name: skill.name || '',
          type: 'technical',
          level: skill.level || 3,
          description: skill.category || '',
          verified: skill.verified || false,
          approval_status: 'pending'
        });
      });
    }

    // Soft Skills
    if (parsedData.softSkills && Array.isArray(parsedData.softSkills)) {
      parsedData.softSkills.forEach(skill => {
        allSkills.push({
          student_id: studentId,
          name: skill.name || '',
          type: 'soft',
          level: skill.level || 3,
          description: skill.description || skill.type || '',
          verified: false,
          approval_status: 'pending'
        });
      });
    }

    if (allSkills.length > 0) {
      try {
        const { data, error } = await supabase
          .from('skills')
          .insert(allSkills)
          .select();

        if (error) throw error;
        results.saved.skills = data?.length || 0;
      } catch (error) {
        console.error('Error saving skills:', error);
        results.errors.push({ table: 'skills', error: (error as Error).message });
      }
    }

    // 4. Save Certificates
    if (parsedData.certificates && Array.isArray(parsedData.certificates) && parsedData.certificates.length > 0) {
      try {
        const certificateRecords = parsedData.certificates.map(cert => ({
          student_id: studentId,
          title: cert.title || '',
          issuer: cert.issuer || '',
          level: cert.level || 'Professional',
          credential_id: cert.credentialId || '',
          link: cert.link || '',
          issued_on: cert.issuedOn || null,
          description: cert.description || '',
          status: cert.status || 'pending',
          approval_status: 'pending'
        }));

        const { data, error } = await supabase
          .from('certificates')
          .insert(certificateRecords)
          .select();

        if (error) throw error;
        results.saved.certificates = data?.length || 0;
      } catch (error) {
        console.error('Error saving certificates:', error);
        results.errors.push({ table: 'certificates', error: (error as Error).message });
      }
    }

    // 5. Save Projects
    if (parsedData.projects && Array.isArray(parsedData.projects) && parsedData.projects.length > 0) {
      try {
        const projectRecords = parsedData.projects.map(proj => ({
          student_id: studentId,
          title: proj.title || '',
          organization: proj.organization || '',
          duration: proj.duration || '',
          description: proj.description || '',
          status: proj.status || 'Completed',
          tech_stack: proj.technologies || proj.techStack || proj.tech || proj.skills || [],
          demo_link: proj.demoLink || proj.demo || proj.link || proj.url || '',
          github_link: proj.github || '',
          approval_status: 'pending'
        }));

        const { data, error } = await supabase
          .from('projects')
          .insert(projectRecords)
          .select();

        if (error) throw error;
        results.saved.projects = data?.length || 0;
      } catch (error) {
        console.error('Error saving projects:', error);
        results.errors.push({ table: 'projects', error: (error as Error).message });
      }
    }

    // 6. Save Training/Courses
    if (parsedData.training && Array.isArray(parsedData.training) && parsedData.training.length > 0) {
      try {
        const trainingRecords = parsedData.training.map(train => ({
          student_id: studentId,
          title: train.course || train.skill || '',
          organization: train.trainer || '',
          status: train.status || 'ongoing',
          description: `Progress: ${train.progress || 0}%`,
          approval_status: 'pending'
        }));

        const { data, error } = await supabase
          .from('trainings')
          .insert(trainingRecords)
          .select();

        if (error) throw error;
        results.saved.trainings = data?.length || 0;
      } catch (error) {
        console.error('Error saving trainings:', error);
        results.errors.push({ table: 'trainings', error: (error as Error).message });
      }
    }

    // 7. Update basic profile info in students table (non-JSONB columns)
    try {
      const updateData: {
        name?: string;
        contact_number?: string;
        alternate_number?: string;
        age?: number;
        date_of_birth?: string;
        university?: string;
        branch_field?: string;
        college_school_name?: string;
        registration_number?: string;
        district_name?: string;
        resume_imported_at?: string;
      } = {};
      
      if (parsedData.name) updateData.name = parsedData.name;
      if (parsedData.contact_number) updateData.contact_number = parsedData.contact_number;
      if (parsedData.alternate_number) updateData.alternate_number = parsedData.alternate_number;
      if (parsedData.age) updateData.age = parseInt(String(parsedData.age));
      if (parsedData.date_of_birth) updateData.date_of_birth = parsedData.date_of_birth;
      if (parsedData.university) updateData.university = parsedData.university;
      if (parsedData.branch_field) updateData.branch_field = parsedData.branch_field;
      if (parsedData.college_school_name) updateData.college_school_name = parsedData.college_school_name;
      if (parsedData.registration_number) updateData.registration_number = parsedData.registration_number;
      if (parsedData.district_name) updateData.district_name = parsedData.district_name;
      
      // Mark when resume was imported
      updateData.resume_imported_at = new Date().toISOString();

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('students')
          .update(updateData)
          .eq('id', studentId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating student profile:', error);
      results.errors.push({ table: 'students', error: (error as Error).message });
    }

    // Check if there were any errors
    if (results.errors.length > 0) {
      results.success = false;
    }

    return results;
  } catch (error) {
    console.error('Error in saveResumeToTables:', error);
    return {
      success: false,
      error: (error as Error).message,
      saved: {
        education: 0,
        experience: 0,
        skills: 0,
        certificates: 0,
        projects: 0,
        trainings: 0
      },
      errors: [{ error: (error as Error).message }]
    };
  }
};

/**
 * Get summary of student's resume data from all tables
 * @param studentId - The student's ID
 * @returns Summary of all resume data
 */
export const getResumeDataSummary = async (studentId: string): Promise<ResumeDataSummary | null> => {
  try {
    const [education, experience, skills, certificates, projects, trainings] = await Promise.all([
      supabase.from('education').select('*').eq('student_id', studentId),
      supabase.from('experience').select('*').eq('student_id', studentId),
      supabase.from('skills').select('*').eq('student_id', studentId),
      supabase.from('certificates').select('*').eq('student_id', studentId),
      supabase.from('projects').select('*').eq('student_id', studentId),
      supabase.from('trainings').select('*').eq('student_id', studentId)
    ]);

    return {
      education: education.data || [],
      experience: experience.data || [],
      skills: skills.data || [],
      certificates: certificates.data || [],
      projects: projects.data || [],
      trainings: trainings.data || []
    };
  } catch (error) {
    console.error('Error fetching resume data summary:', error);
    return null;
  }
};