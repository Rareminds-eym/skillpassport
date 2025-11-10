import { supabase } from '../../../lib/supabaseClient';
import { StudentProfile, TechnicalSkill, Experience } from '../types';

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
      console.error('Error fetching student:', studentError);
      return null;
    }

    // Parse the JSONB profile column
    const profileData = student.profile || {};
    
    console.log('📦 Raw profile data:', {
      hasProfile: !!student.profile,
      education: profileData.education?.length || 0,
      training: profileData.training?.length || 0,
      projects: profileData.projects?.length || 0,
      softSkills: profileData.softSkills?.length || 0
    });

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
    console.error('Error in fetchStudentProfile:', error);
    return null;
  }
}

/**
 * Fetch opportunities from database
 */
export async function fetchOpportunities(): Promise<any[]> {
  try {
    console.log('📊 Fetching opportunities from database...');
    
    // Fetch ALL jobs (don't filter by is_active since many jobs may have it as false/null)
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Fetch up to 50 recent jobs

    if (error) {
      console.error('❌ Error fetching opportunities:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} total opportunities in database`);
    
    if (data && data.length > 0) {
      const activeCount = data.filter(j => j.is_active === true).length;
      console.log(`📊 Active jobs: ${activeCount} | Total: ${data.length}`);
    } else {
      console.warn('⚠️ No jobs found in database. Please add some opportunities!');
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in fetchOpportunities:', error);
    return [];
  }
}
