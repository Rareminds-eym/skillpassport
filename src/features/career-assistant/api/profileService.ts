import { supabase } from '@/shared/api/supabaseClient';
import { StudentProfile, TechnicalSkill, Experience } from '@/features/student-profile/model';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('profile-service');

/**
 * Profile Service
 * Handles fetching and parsing student profiles from database
 */

export async function fetchStudentProfile(studentId: string): Promise<StudentProfile | null> {
  try {
    // Fetch student base data with JSONB profile
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      logger.error('Error fetching student profile', studentError instanceof Error ? studentError : new Error(String(studentError)), {
        studentId,
        hasError: !!studentError
      });
      return null;
    }

    // Parse the JSONB profile column
    const profileData = student.profile || {};

    // Extract department from education or profile
    const department = profileData.education?.[0]?.department || 
                      profileData.education?.[0]?.degree || 
                      profileData.branch_field ||
                      student.department ||
                      'General';

    // Extract technical skills from training courses
    const technicalSkills: TechnicalSkill[] = [];
    if (profileData.training && Array.isArray(profileData.training)) {
      profileData.training.forEach((training: any) => {
        if (training.skills && Array.isArray(training.skills)) {
          training.skills.forEach((skill: string) => {
            if (!technicalSkills.find(s => s.name?.toLowerCase() === skill.toLowerCase())) {
              technicalSkills.push({
                name: skill,
                level: 3, // Default level
                category: 'Technical',
                source: 'training'
              });
            }
          });
        }
      });
    }

    // Add skills from projects
    if (profileData.projects && Array.isArray(profileData.projects)) {
      profileData.projects.forEach((project: any) => {
        const projectSkills = project.skills || project.technologies || project.techStack || [];
        projectSkills.forEach((skill: string) => {
          if (skill && !technicalSkills.find(s => s.name?.toLowerCase() === skill.toLowerCase())) {
            technicalSkills.push({
              name: skill,
              level: 4, // Projects show applied skills
              category: 'Technical',
              source: 'project'
            });
          }
        });
      });
    }

    // Build experience from profile
    const experience: Experience[] = [];
    if (profileData.projects && Array.isArray(profileData.projects)) {
      profileData.projects.forEach((project: any) => {
        if (project.title && project.status === 'Completed') {
          experience.push({
            role: 'Project Developer',
            company: project.title,
            duration: project.duration || '',
            type: 'project'
          });
        }
      });
    }

    return {
      id: student.id,
      name: profileData.name || student.name || 'Student',
      email: profileData.email || student.email,
      department: department,
      university: profileData.university || student.university || '',
      cgpa: profileData.education?.[0]?.cgpa || '',
      year_of_passing: profileData.education?.[0]?.yearOfPassing || '',
      profile: {
        technicalSkills: technicalSkills,
        softSkills: profileData.softSkills || [],
        education: profileData.education || [],
        training: profileData.training || [],
        experience: experience,
        projects: profileData.projects || [],
        certificates: profileData.certificates || []
      }
    };
  } catch (error) {
    logger.error('Exception in fetchStudentProfile', error instanceof Error ? error : new Error(String(error)), {
      studentId
    });
    return null;
  }
}

/**
 * Fetch opportunities from database
 */
export async function fetchOpportunities(): Promise<any[]> {
  try {
    // Fetch ALL jobs (don't filter by is_active since many jobs may have it as false/null)
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Fetch up to 50 recent jobs

    if (error) {
      logger.error('Error fetching opportunities from database', error instanceof Error ? error : new Error(String(error)), {
        operation: 'fetchOpportunities'
      });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception in fetchOpportunities', error instanceof Error ? error : new Error(String(error)), {
      operation: 'fetchOpportunities'
    });
    return [];
  }
}
