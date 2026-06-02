import { apiPost } from '@/shared/api/apiClient';
import { LearnerProfile, Opportunity, Assignment } from './educatorDataService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('data-fetcher-service');

export interface LearnerAssignment {
  learner_assignment_id: string;
  assignment_id: string;
  learner_id: string;
  status: 'todo' | 'in-progress' | 'submitted' | 'graded';
  priority: 'low' | 'medium' | 'high';
  grade_received: number | null;
  grade_percentage: number | null;
  instructor_feedback: string | null;
  submission_date: string | null;
  is_late: boolean;
  assigned_date: string;
  completed_date: string | null;
}

export interface LearnerWithAssignments extends LearnerProfile {
  assignments?: LearnerAssignment[];
  assignmentStats?: {
    total: number;
    submitted: number;
    graded: number;
    pending: number;
    avgGrade: number;
    lateSubmissions: number;
  };
}

class DataFetcherService {
  async getlearnersWithAssignments(universityId?: string): Promise<LearnerWithAssignments[]> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'getLearnersWithAssignments',
        universityId,
      });
      return (result?.data || []) as LearnerWithAssignments[];
    } catch (error) {
      logger.error('Fetch learners with assignments exception', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  async getlearnerWithAssignments(learnerId: string): Promise<LearnerWithAssignments | null> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'getLearnerWithAssignments',
        learnerId,
      });
      return (result?.data || null) as LearnerWithAssignments | null;
    } catch (error) {
      logger.error('Fetch learner with assignments exception', error instanceof Error ? error : new Error(String(error)), { learnerId });
      return null;
    }
  }

  async getAssignmentsWithStats(educatorId?: string): Promise<any[]> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'getAssignmentsWithStats',
        educatorId,
      });
      return (result?.data || []) as any[];
    } catch (error) {
      logger.error('Fetch assignments with stats exception', error instanceof Error ? error : new Error(String(error)), { educatorId });
      return [];
    }
  }

  async getActiveOpportunities(limit: number = 100): Promise<Opportunity[]> {
    try {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'getActiveOpportunities',
        limit,
      });
      return (result?.data || []) as Opportunity[];
    } catch (error) {
      logger.error('Fetch opportunities exception', error instanceof Error ? error : new Error(String(error)), { limit });
      return [];
    }
  }
}

export const dataFetcherService = new DataFetcherService();
