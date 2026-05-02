import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('educator-data-service');

/**
 * Educator Data Service
 * Fetches and manages data from the database for educator insights
 */

export interface StudentProfile {
  id: string;
  universityId: string | null;
  profile: {
    name: string;
    email: string;
    age?: number;
    course?: string;
    technicalSkills?: Array<{
      id: number;
      name: string;
      level: number;
      enabled?: boolean;
      verified?: boolean;
    }>;
    softSkills?: Array<{
      id: number;
      name: string;
      level: number;
      type?: string;
    }>;
    projects?: Array<{
      id: number;
      title: string;
      status: string;
      techStack?: string[];
      technologies?: string[];
      duration?: string;
      enabled?: boolean;
    }>;
    training?: Array<{
      id: number;
      course: string;
      provider: string;
      status: string;
      progress: number;
      skills?: string[];
      startDate?: string;
      endDate?: string;
      hoursSpent?: number;
      enabled?: boolean;
    }>;
    experience?: Array<{
      id: number;
      role: string;
      organization: string;
      duration?: string;
      enabled?: boolean;
    }>;
    education?: Array<{
      id: number;
      level: string;
      degree: string;
      university: string;
      status: string;
      cgpa?: string;
      enabled?: boolean;
    }>;
    certificates?: Array<{
      id: number;
      title: string;
      issuer?: string;
      level?: string;
      status: string;
      enabled?: boolean;
    }>;
    updatedAt?: string;
  };
}

export interface Opportunity {
  id: number;
  title: string;
  job_title: string;
  company_name: string;
  employment_type: string;
  location: string;
  mode: string;
  experience_level: string;
  skills_required: string[];
  requirements?: string[];
  department: string;
  status: string;
  is_active: boolean;
  deadline?: string;
  applications_count: number;
  salary_range_min?: number;
  salary_range_max?: number;
}

export interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  course_name: string;
  course_code: string;
  total_points: number;
  due_date: string;
  assignment_type: string;
  skill_outcomes: string[];
  is_deleted: boolean;
}

export interface Certificate {
  id: string;
  student_id: string;
  title: string;
  issuer: string;
  level: string;
  approval_status: string;
  issued_on?: string;
  enabled: boolean;
}

class EducatorDataService {
  /**
   * Fetch all students with their complete profiles
   */
  async getStudents(universityId?: string): Promise<StudentProfile[]> {
    try {
      let query = supabase
        .from('students')
        .select('id, universityId, profile')
        .order('profile->updatedAt', { ascending: false });

      if (universityId) {
        query = query.eq('universityId', universityId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Fetch students failed', new Error(error.message), { universityId });
        return [];
      }

      return (data || []) as StudentProfile[];
    } catch (error) {
      logger.error('Fetch students exception', error instanceof Error ? error : new Error(String(error)), { universityId });
      return [];
    }
  }

  /**
   * Fetch a specific student by ID
   */
  async getStudentById(studentId: string): Promise<StudentProfile | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, universityId, profile')
        .eq('id', studentId)
        .single();

      if (error) {
        logger.error('Fetch student failed', new Error(error.message), { studentId });
        return null;
      }

      return data as StudentProfile;
    } catch (error) {
      logger.error('Fetch student exception', error instanceof Error ? error : new Error(String(error)), { studentId });
      return null;
    }
  }

  /**
   * Fetch active job opportunities
   */
  async getOpportunities(limit: number = 50): Promise<Opportunity[]> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'published')
        .order('posted_date', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Fetch opportunities failed', new Error(error.message), { limit });
        return [];
      }

      return (data || []) as Opportunity[];
    } catch (error) {
      logger.error('Fetch opportunities exception', error instanceof Error ? error : new Error(String(error)), { limit });
      return [];
    }
  }

  /**
   * Fetch assignments
   */
  async getAssignments(educatorId?: string): Promise<Assignment[]> {
    try {
      let query = supabase
        .from('assignments')
        .select('*')
        .eq('is_deleted', false)
        .order('created_date', { ascending: false });

      if (educatorId) {
        query = query.eq('educator_id', educatorId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Fetch assignments failed', new Error(error.message), { educatorId });
        return [];
      }

      return (data || []) as Assignment[];
    } catch (error) {
      logger.error('Fetch assignments exception', error instanceof Error ? error : new Error(String(error)), { educatorId });
      return [];
    }
  }

  /**
   * Fetch certificates pending approval
   */
  async getPendingCertificates(): Promise<Certificate[]> {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('approval_status', 'pending')
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Fetch pending certificates failed', new Error(error.message));
        return [];
      }

      return (data || []) as Certificate[];
    } catch (error) {
      logger.error('Fetch pending certificates exception', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Fetch student certificates
   */
  async getStudentCertificates(studentId: string): Promise<Certificate[]> {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', studentId)
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Fetch student certificates failed', new Error(error.message), { studentId });
        return [];
      }

      return (data || []) as Certificate[];
    } catch (error) {
      logger.error('Fetch student certificates exception', error instanceof Error ? error : new Error(String(error)), { studentId });
      return [];
    }
  }
}

export const educatorDataService = new EducatorDataService();
