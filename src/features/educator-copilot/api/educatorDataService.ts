import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('educator-data-service');

export interface LearnerProfile {
  id: string;
  universityId: string | null;
  profile: {
    name: string;
    email: string;
    age?: number;
    course?: string;
    technicalSkills?: Array<{ id: number; name: string; level: number; enabled?: boolean; verified?: boolean }>;
    softSkills?: Array<{ id: number; name: string; level: number; type?: string }>;
    projects?: Array<{ id: number; title: string; status: string; techStack?: string[]; technologies?: string[]; duration?: string; enabled?: boolean }>;
    training?: Array<{ id: number; course: string; provider: string; status: string; progress: number; skills?: string[]; startDate?: string; endDate?: string; hoursSpent?: number; enabled?: boolean }>;
    experience?: Array<{ id: number; role: string; organization: string; duration?: string; enabled?: boolean }>;
    education?: Array<{ id: number; level: string; degree: string; university: string; status: string; cgpa?: string; enabled?: boolean }>;
    certificates?: Array<{ id: number; title: string; issuer?: string; level?: string; status: string; enabled?: boolean }>;
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
  learner_id: string;
  title: string;
  issuer: string;
  level: string;
  approval_status: string;
  issued_on?: string;
  enabled: boolean;
}

class EducatorDataService {
  async getLearners(universityId?: string): Promise<LearnerProfile[]> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'educatorGetLearners',
        universityId,
      });
      return (result?.data || []) as LearnerProfile[];
    } catch (error) {
      logger.error('Fetch learners exception', error instanceof Error ? error : new Error(String(error)), { universityId });
      return [];
    }
  }

  async getlearnerById(learnerId: string): Promise<LearnerProfile | null> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'getLearnerById',
        learnerId,
      });
      return (result?.data || null) as LearnerProfile | null;
    } catch (error) {
      logger.error('Fetch learner exception', error instanceof Error ? error : new Error(String(error)), { learnerId });
      return null;
    }
  }

  async getOpportunities(limit: number = 50): Promise<Opportunity[]> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'getOpportunities',
        limit,
      });
      return (result?.data || []) as Opportunity[];
    } catch (error) {
      logger.error('Fetch opportunities exception', error instanceof Error ? error : new Error(String(error)), { limit });
      return [];
    }
  }

  async getAssignments(educatorId?: string): Promise<Assignment[]> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'educatorGetAssignments',
        educatorId,
      });
      return (result?.data || []) as Assignment[];
    } catch (error) {
      logger.error('Fetch assignments exception', error instanceof Error ? error : new Error(String(error)), { educatorId });
      return [];
    }
  }

  async getPendingCertificates(): Promise<Certificate[]> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'getPendingCertificates',
      });
      return (result?.data || []) as Certificate[];
    } catch (error) {
      logger.error('Fetch pending certificates exception', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  async getlearnerCertificates(learnerId: string): Promise<Certificate[]> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'getLearnerCertificates',
        learnerId,
      });
      return (result?.data || []) as Certificate[];
    } catch (error) {
      logger.error('Fetch learner certificates exception', error instanceof Error ? error : new Error(String(error)), { learnerId });
      return [];
    }
  }
}

export const educatorDataService = new EducatorDataService();
