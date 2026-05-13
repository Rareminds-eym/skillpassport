import { supabase } from '@/shared/api/supabaseClient';
import { LearnerProfile, TechnicalSkill, Experience } from '@/features/learner-profile/model';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('profile-service');

/**
 * Profile Service
 * Handles fetching and parsing learner profiles from database
 */

export async function fetchlearnerProfile(learnerId: string): Promise<LearnerProfile | null> {
  try {
    // Fetch learner base data with JSONB profile
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('*')
      .eq('id', learnerId)
      .single();

    if (learnerError || !learner) {
      logger.error('Error fetching learner profile', learnerError instanceof Error ? learnerError : new Error(String(learnerError)), {
        learnerId,
        hasError: !!learnerError
      });
      return null;
    }

    // Parse the JSONB profile column
    const profileData = learner.profile || {};

    // Extract department from education or profile
    const department = profileData.education?.[0]?.department || 
                      profileData.education?.[0]?.degree || 
                      profileData.branch_field ||
                      learner.department ||
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
      id: learner.id,
      name: profileData.name || learner.name || 'Learner',
      email: profileData.email || learner.email,
      department: department,
      university: profileData.university || learner.university || '',
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
    logger.error('Exception in fetchlearnerProfile', error instanceof Error ? error : new Error(String(error)), {
      learnerId
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
