import { supabase } from '../../../lib/supabaseClient';
import { StudentProfile, Opportunity, Assignment } from './educatorDataService';

/**
 * Enhanced Data Fetcher Service
 * Fetches all necessary data for educator AI insights with optimized queries
 */

export interface StudentAssignment {
  student_assignment_id: string;
  assignment_id: string;
  student_id: string;
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

export interface StudentWithAssignments extends StudentProfile {
  assignments?: StudentAssignment[];
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
   * Fetch students with their assignment data
   */
  async getStudentsWithAssignments(universityId?: string): Promise<StudentWithAssignments[]> {
    try {
      // Fetch students (include user_id for assignment references)
      let studentsQuery = supabase
        .from('students')
        .select('id, user_id, universityId, profile')
        .order('profile->updatedAt', { ascending: false });

      if (universityId) {
        studentsQuery = studentsQuery.eq('universityId', universityId);
      }

      const { data: students, error: studentsError } = await studentsQuery;

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return [];
      }

      if (!students || students.length === 0) {
        return [];
      }

      // Fetch assignments using user_id (FK references students.user_id, not students.id)
      const userIds = students.map((s) => (s as any).user_id).filter(Boolean);
      let assignments: any[] = [];

      if (userIds.length > 0) {
        try {
          console.log('Querying student_assignments with user_ids:', userIds.slice(0, 3));

          // Try simple query first to test access
          const { data: testData, error: testError } = await supabase
            .from('student_assignments')
            .select('student_assignment_id, student_id, status')
            .limit(5);

          if (testError) {
            console.error('❌ Simple test query failed:', testError);
            console.log('RLS or permissions issue - continuing without assignments');
            return students.map(
              (s) =>
                ({
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
                }) as StudentWithAssignments
            );
          }

          console.log('✅ Test query succeeded, fetching full data...');

          // Batch queries in chunks of 100 to avoid query size limits
          const BATCH_SIZE = 100;
          const allAssignments = [];

          for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batchIds = userIds.slice(i, i + BATCH_SIZE);
            const { data: batchData, error: batchError } = await supabase
              .from('student_assignments')
              .select('*')
              .in('student_id', batchIds);

            if (batchError) {
              console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, batchError);
              // Continue with next batch
            } else if (batchData) {
              allAssignments.push(...batchData);
            }
          }

          assignments = allAssignments;
          console.log(
            `✅ Fetched ${assignments.length} student assignments from ${Math.ceil(userIds.length / BATCH_SIZE)} batch(es)`
          );
        } catch (tableError: any) {
          console.error('Exception querying student_assignments:', tableError);
        }
      }

      // Group assignments by student user_id (since FK references user_id)
      const assignmentsByStudent = new Map<string, StudentAssignment[]>();
      assignments.forEach((assignment) => {
        const studentAssignments = assignmentsByStudent.get(assignment.student_id) || [];
        studentAssignments.push(assignment as StudentAssignment);
        assignmentsByStudent.set(assignment.student_id, studentAssignments);
      });

      // Enhance students with assignment data (match by user_id)
      return students.map((student) => {
        const studentUserId = (student as any).user_id;
        const studentAssignments = assignmentsByStudent.get(studentUserId) || [];
        const submitted = studentAssignments.filter(
          (a) => a.status === 'submitted' || a.status === 'graded'
        );
        const graded = studentAssignments.filter((a) => a.status === 'graded');
        const pending = studentAssignments.filter(
          (a) => a.status === 'todo' || a.status === 'in-progress'
        );
        const lateSubmissions = studentAssignments.filter((a) => a.is_late);
        const avgGrade =
          graded.length > 0
            ? graded.reduce((sum, a) => sum + (a.grade_percentage || 0), 0) / graded.length
            : 0;

        return {
          ...student,
          assignments: studentAssignments,
          assignmentStats: {
            total: studentAssignments.length,
            submitted: submitted.length,
            graded: graded.length,
            pending: pending.length,
            avgGrade: Math.round(avgGrade * 10) / 10,
            lateSubmissions: lateSubmissions.length,
          },
        } as StudentWithAssignments;
      });
    } catch (error) {
      console.error('Exception fetching students with assignments:', error);
      return [];
    }
  }

  /**
   * Fetch specific student with full assignment details
   */
  async getStudentWithAssignments(studentId: string): Promise<StudentWithAssignments | null> {
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, user_id, universityId, profile')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        console.error('Error fetching student:', studentError);
        return null;
      }

      // Query using user_id since FK references students.user_id
      const studentUserId = (student as any).user_id;

      const { data: assignments, error: assignmentsError } = await supabase
        .from('student_assignments')
        .select('*')
        .eq('student_id', studentUserId);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
      }

      const studentAssignments = (assignments || []) as StudentAssignment[];
      const submitted = studentAssignments.filter(
        (a) => a.status === 'submitted' || a.status === 'graded'
      );
      const graded = studentAssignments.filter((a) => a.status === 'graded');
      const pending = studentAssignments.filter(
        (a) => a.status === 'todo' || a.status === 'in-progress'
      );
      const lateSubmissions = studentAssignments.filter((a) => a.is_late);
      const avgGrade =
        graded.length > 0
          ? graded.reduce((sum, a) => sum + (a.grade_percentage || 0), 0) / graded.length
          : 0;

      return {
        ...student,
        assignments: studentAssignments,
        assignmentStats: {
          total: studentAssignments.length,
          submitted: submitted.length,
          graded: graded.length,
          pending: pending.length,
          avgGrade: Math.round(avgGrade * 10) / 10,
          lateSubmissions: lateSubmissions.length,
        },
      } as StudentWithAssignments;
    } catch (error) {
      console.error('Exception fetching student with assignments:', error);
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
        console.error('Error fetching assignments:', assignmentsError);
        return [];
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Fetch all student assignments for these assignments (only if assignment IDs exist)
      const assignmentIds = assignments.map((a) => a.assignment_id).filter(Boolean);
      let studentAssignments: any[] = [];

      if (assignmentIds.length > 0) {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('student_assignments')
          .select('*')
          .in('assignment_id', assignmentIds);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          // Don't fail - proceed with no submissions
        } else {
          studentAssignments = submissionsData || [];
        }
      }

      // Group by assignment and calculate stats
      const submissionsByAssignment = new Map<string, StudentAssignment[]>();
      studentAssignments.forEach((sa) => {
        const subs = submissionsByAssignment.get(sa.assignment_id) || [];
        subs.push(sa as StudentAssignment);
        submissionsByAssignment.set(sa.assignment_id, subs);
      });

      return assignments.map((assignment) => {
        const submissions = submissionsByAssignment.get(assignment.assignment_id) || [];
        const submitted = submissions.filter(
          (s) => s.status === 'submitted' || s.status === 'graded'
        ).length;
        const graded = submissions.filter((s) => s.status === 'graded').length;
        const pending = submissions.filter(
          (s) => s.status === 'todo' || s.status === 'in-progress'
        ).length;
        const lateSubmissions = submissions.filter((s) => s.is_late).length;
        const grades = submissions
          .filter((s) => s.grade_percentage !== null)
          .map((s) => s.grade_percentage!);
        const avgGrade =
          grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0;

        return {
          ...assignment,
          stats: {
            totalStudents: submissions.length,
            submitted,
            graded,
            pending,
            lateSubmissions,
            avgGrade: Math.round(avgGrade * 10) / 10,
            submissionRate:
              submissions.length > 0 ? Math.round((submitted / submissions.length) * 100) : 0,
          },
        };
      });
    } catch (error) {
      console.error('Exception fetching assignments with stats:', error);
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
        .select(
          'id, title, job_title, company_name, employment_type, location, mode, experience_level, skills_required, requirements, department, status, is_active, deadline, applications_count, salary_range_min, salary_range_max'
        )
        .eq('is_active', true)
        .eq('status', 'published')
        .order('posted_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching opportunities:', error);
        return [];
      }

      return (data || []) as Opportunity[];
    } catch (error) {
      console.error('Exception fetching opportunities:', error);
      return [];
    }
  }
}

export const dataFetcherService = new DataFetcherService();
