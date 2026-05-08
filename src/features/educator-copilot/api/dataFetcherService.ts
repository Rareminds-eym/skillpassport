import { supabase } from '@/shared/api/supabaseClient';
import { LearnerProfile, Opportunity, Assignment } from './educatorDataService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('data-fetcher-service');

/**
 * Enhanced Data Fetcher Service
 * Fetches all necessary data for educator AI insights with optimized queries
 */

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
  /**
   * Fetch learners with their assignment data
   */
  async getlearnersWithAssignments(universityId?: string): Promise<LearnerWithAssignments[]> {
    try {
      // Fetch learners (include user_id for assignment references)
      let learnersQuery = supabase
        .from('learners')
        .select('id, user_id, universityId, profile')
        .order('profile->updatedAt', { ascending: false });

      if (universityId) {
        learnersQuery = learnersQuery.eq('universityId', universityId);
      }

      const { data: learners, error: learnersError } = await learnersQuery;

      if (learnersError) {
        logger.error('Learners fetch failed', new Error(learnersError.message), { universityId });
        return [];
      }

      if (!learners || learners.length === 0) {
        return [];
      }

      // Fetch assignments using user_id (FK references learners.user_id, not learners.id)
      const userIds = learners.map(s => (s as any).user_id).filter(Boolean);
      let assignments: any[] = [];
      
      if (userIds.length > 0) {
        try {
          // Try simple query first to test access
          const { data: testData, error: testError } = await supabase
            .from('learner_assignments')
            .select('learner_assignment_id, learner_id, status')
            .limit(5);

          if (testError) {
            logger.warn('Learner assignments table access check failed - RLS or permissions issue', {
              error: testError.message
            });
            return learners.map(s => ({
              ...s,
              assignments: [],
              assignmentStats: {
                total: 0,
                submitted: 0,
                graded: 0,
                pending: 0,
                avgGrade: 0,
                lateSubmissions: 0,
              },
            } as LearnerWithAssignments));
          }
          
          // Batch queries in chunks of 100 to avoid query size limits
          const BATCH_SIZE = 100;
          const allAssignments = [];

          for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batchIds = userIds.slice(i, i + BATCH_SIZE);
            const { data: batchData, error: batchError } = await supabase
              .from('learner_assignments')
              .select('*')
              .in('learner_id', batchIds);

            if (batchError) {
              logger.warn('Batch learner assignments fetch failed', {
                batchNumber: Math.floor(i / BATCH_SIZE) + 1,
                error: batchError.message
              });
              // Continue with next batch
            } else if (batchData) {
              allAssignments.push(...batchData);
            }
          }

          assignments = allAssignments;
        
        } catch (tableError: any) {
          logger.error('Learner assignments query exception', tableError instanceof Error ? tableError : new Error(String(tableError)));
        }
      }

      // Group assignments by learner user_id (since FK references user_id)
      const assignmentsByLearner = new Map<string, LearnerAssignment[]>();
      assignments.forEach(assignment => {
        const learnerAssignments = assignmentsByLearner.get(assignment.learner_id) || [];
        learnerAssignments.push(assignment as LearnerAssignment);
        assignmentsByLearner.set(assignment.learner_id, learnerAssignments);
      });

      // Enhance learners with assignment data (match by user_id)
      return learners.map(learner => {
        const learnerUserId = (learner as any).user_id;
        const learnerAssignments = assignmentsByLearner.get(learnerUserId) || [];
        const submitted = learnerAssignments.filter(a => a.status === 'submitted' || a.status === 'graded');
        const graded = learnerAssignments.filter(a => a.status === 'graded');
        const pending = learnerAssignments.filter(a => a.status === 'todo' || a.status === 'in-progress');
        const lateSubmissions = learnerAssignments.filter(a => a.is_late);
        const avgGrade = graded.length > 0
          ? graded.reduce((sum, a) => sum + (a.grade_percentage || 0), 0) / graded.length
          : 0;

        return {
          ...learner,
          assignments: learnerAssignments,
          assignmentStats: {
            total: learnerAssignments.length,
            submitted: submitted.length,
            graded: graded.length,
            pending: pending.length,
            avgGrade: Math.round(avgGrade * 10) / 10,
            lateSubmissions: lateSubmissions.length,
          },
        } as LearnerWithAssignments;
      });
    } catch (error) {
      logger.error('Fetch learners with assignments exception', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Fetch specific learner with full assignment details
   */
  async getlearnerWithAssignments(learnerId: string): Promise<LearnerWithAssignments | null> {
    try {
      const { data: learner, error: learnerError } = await supabase
        .from('learners')
        .select('id, user_id, universityId, profile')
        .eq('id', learnerId)
        .single();

      if (learnerError || !learner) {
        logger.error('Learner fetch failed', learnerError instanceof Error ? learnerError : new Error(String(learnerError)), { learnerId });
        return null;
      }

      // Query using user_id since FK references learners.user_id
      const learnerUserId = (learner as any).user_id;
      
      const { data: assignments, error: assignmentsError } = await supabase
        .from('learner_assignments')
        .select('*')
        .eq('learner_id', learnerUserId);

      if (assignmentsError) {
        logger.error('Assignments fetch failed', new Error(assignmentsError.message), { learnerId });
      }

      const learnerAssignments = (assignments || []) as LearnerAssignment[];
      const submitted = learnerAssignments.filter(a => a.status === 'submitted' || a.status === 'graded');
      const graded = learnerAssignments.filter(a => a.status === 'graded');
      const pending = learnerAssignments.filter(a => a.status === 'todo' || a.status === 'in-progress');
      const lateSubmissions = learnerAssignments.filter(a => a.is_late);
      const avgGrade = graded.length > 0
        ? graded.reduce((sum, a) => sum + (a.grade_percentage || 0), 0) / graded.length
        : 0;

      return {
        ...learner,
        assignments: learnerAssignments,
        assignmentStats: {
          total: learnerAssignments.length,
          submitted: submitted.length,
          graded: graded.length,
          pending: pending.length,
          avgGrade: Math.round(avgGrade * 10) / 10,
          lateSubmissions: lateSubmissions.length,
        },
      } as LearnerWithAssignments;
    } catch (error) {
      logger.error('Fetch learner with assignments exception', error instanceof Error ? error : new Error(String(error)), { learnerId });
      return null;
    }
  }

  /**
   * Fetch assignments with submission statistics
   */
  async getAssignmentsWithStats(educatorId?: string): Promise<any[]> {
    try {
      let assignmentsQuery = supabase
        .from('assignments')
        .select('*')
        .eq('is_deleted', false)
        .order('due_date', { ascending: false });

      if (educatorId) {
        assignmentsQuery = assignmentsQuery.eq('educator_id', educatorId);
      }

      const { data: assignments, error: assignmentsError } = await assignmentsQuery;

      if (assignmentsError) {
        logger.error('Assignments fetch failed', new Error(assignmentsError.message), { educatorId });
        return [];
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Fetch all learner assignments for these assignments (only if assignment IDs exist)
      const assignmentIds = assignments.map(a => a.assignment_id).filter(Boolean);
      let learnerAssignments: any[] = [];
      
      if (assignmentIds.length > 0) {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('learner_assignments')
          .select('*')
          .in('assignment_id', assignmentIds);

        if (submissionsError) {
          logger.error('Submissions fetch failed', new Error(submissionsError.message));
          // Don't fail - proceed with no submissions
        } else {
          learnerAssignments = submissionsData || [];
        }
      }

      // Group by assignment and calculate stats
      const submissionsByAssignment = new Map<string, LearnerAssignment[]>();
      learnerAssignments.forEach(sa => {
        const subs = submissionsByAssignment.get(sa.assignment_id) || [];
        subs.push(sa as LearnerAssignment);
        submissionsByAssignment.set(sa.assignment_id, subs);
      });

      return assignments.map(assignment => {
        const submissions = submissionsByAssignment.get(assignment.assignment_id) || [];
        const submitted = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
        const graded = submissions.filter(s => s.status === 'graded').length;
        const pending = submissions.filter(s => s.status === 'todo' || s.status === 'in-progress').length;
        const lateSubmissions = submissions.filter(s => s.is_late).length;
        const grades = submissions.filter(s => s.grade_percentage !== null).map(s => s.grade_percentage!);
        const avgGrade = grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0;

        return {
          ...assignment,
          stats: {
            totallearners: submissions.length,
            submitted,
            graded,
            pending,
            lateSubmissions,
            avgGrade: Math.round(avgGrade * 10) / 10,
            submissionRate: submissions.length > 0 ? Math.round((submitted / submissions.length) * 100) : 0,
          },
        };
      });
    } catch (error) {
      logger.error('Fetch assignments with stats exception', error instanceof Error ? error : new Error(String(error)), { educatorId });
      return [];
    }
  }

  /**
   * Fetch active opportunities for matching
   */
  async getActiveOpportunities(limit: number = 100): Promise<Opportunity[]> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, job_title, company_name, employment_type, location, mode, experience_level, skills_required, requirements, department, status, is_active, deadline, applications_count, salary_range_min, salary_range_max')
        .eq('is_active', true)
        .eq('status', 'published')
        .order('posted_date', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Opportunities fetch failed', new Error(error.message), { limit });
        return [];
      }

      return (data || []) as Opportunity[];
    } catch (error) {
      logger.error('Fetch opportunities exception', error instanceof Error ? error : new Error(String(error)), { limit });
      return [];
    }
  }
}

export const dataFetcherService = new DataFetcherService();
