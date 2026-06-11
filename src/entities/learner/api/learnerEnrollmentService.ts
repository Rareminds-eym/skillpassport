import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('LearnerEnrollmentService');

export interface EnrolledLearnerView {
  learner_id: string;
  learner_name: string;
  roll_number: string;
  email: string;
  contact_number: string;
  college_id: string;
  department_id: string;
  department_name: string;
  department_code: string;
  program_id: string;
  program_name: string;
  program_code: string;
  section: string;
  semester: number;
  enrollment_date: string;
  created_at: string;
  updated_at: string;
}

export const learnerEnrollmentService = {
  async getEnrolledLearners(filters?: {
    college_id?: string;
    department_id?: string;
    program_id?: string;
    semester?: number;
    search?: string;
  }): Promise<{ success: boolean; data?: EnrolledLearnerView[]; error?: string }> {
    try {
      const result = await apiPost('/learner-profile/actions', {
        action: 'fetch-enrolled-learners', filters: filters || {},
      });
      const data = result?.data || [];

      const transformedData: EnrolledLearnerView[] = (data || []).map((learner: any) => ({
        learner_id: learner.id,
        learner_name: learner.name,
        roll_number: learner.roll_number,
        email: learner.email,
        contact_number: learner.contact_number,
        college_id: learner.college_id,
        department_id: learner.programs?.department_id || '',
        department_name: learner.programs?.departments?.name || 'N/A',
        department_code: learner.programs?.departments?.code || '',
        program_id: learner.program_id,
        program_name: learner.programs?.name || 'N/A',
        program_code: learner.programs?.code || '',
        section: learner.section || 'Not Assigned',
        semester: learner.semester || 1,
        enrollment_date: learner.enrollmentDate || learner.created_at,
        created_at: learner.created_at,
        updated_at: learner.updated_at,
      }));

      let filteredData = transformedData;
      if (filters?.department_id) {
        filteredData = transformedData.filter(s => s.department_id === filters.department_id);
      }

      return { success: true, data: filteredData };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error fetching enrolled learners', error instanceof Error ? error : new Error(String(error)), { filters });
      return { success: false, error: errorMessage };
    }
  },

  async enrollLearner(data: {
    learner_id: string;
    program_id: string;
    section?: string;
    semester: number;
  }): Promise<{ success: boolean; data?: { id: string; program_id: string; semester: number; section?: string; enrollmentDate: string }; error?: string }> {
    try {
      const result = await apiPost('/learner-profile/actions', {
        action: 'update-learner-by-id',
        learnerId: data.learner_id,
        updates: {
          program_id: data.program_id,
          semester: data.semester,
          section: data.section || null,
          enrollmentDate: new Date().toISOString().split('T')[0],
        },
      });

      if (!result?.data) {
        return { success: false, error: 'Failed to enroll learner' };
      }

      return { success: true, data: result.data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error enrolling learner', error instanceof Error ? error : new Error(String(error)), { learnerId: data.learner_id, programId: data.program_id });
      return { success: false, error: errorMessage };
    }
  },

  async bulkEnrollLearners(enrollments: Array<{
    learner_id: string;
    program_id: string;
    section?: string;
    semester: number;
  }>): Promise<{ success: boolean; data?: { id: string; program_id: string; semester: number; section?: string; enrollmentDate: string }[]; error?: string }> {
    try {
      const results = [];
      for (const enrollment of enrollments) {
        const result = await this.enrollLearner(enrollment);
        if (result.success && result.data) {
          results.push(result.data);
        }
      }
      return { success: true, data: results };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error bulk enrolling learners', error instanceof Error ? error : new Error(String(error)), { count: enrollments.length });
      return { success: false, error: errorMessage };
    }
  },

  async updateEnrollment(
    learnerId: string,
    updates: { section?: string; semester?: number; program_id?: string }
  ): Promise<{ success: boolean; data?: { id: string; program_id?: string; semester?: number; section?: string }; error?: string }> {
    try {
      const result = await apiPost('/learner-profile/actions', {
        action: 'update-learner-by-id',
        learnerId,
        updates,
      });

      if (!result?.data) {
        return { success: false, error: 'Failed to update enrollment' };
      }

      return { success: true, data: result.data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error updating enrollment', error instanceof Error ? error : new Error(String(error)), { learnerId, updates });
      return { success: false, error: errorMessage };
    }
  },

  async getUnenrolledLearners(): Promise<{ success: boolean; data?: { id: string; name: string; roll_number: string; email: string; contact_number: string; college_id: string }[]; error?: string }> {
    try {
      const result = await apiPost('/learner-profile/actions', {
        action: 'fetch-unenrolled-learners',
      });
      return { success: true, data: result?.data || [] };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error fetching unenrolled learners', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: errorMessage };
    }
  },

  async getEnrollmentStats(filters?: {
    department_id?: string;
    program_id?: string;
  }): Promise<{ success: boolean; data?: { total: number; byProgram: Record<string, number>; bySemester: Record<number, number> }; error?: string }> {
    try {
      const result = await apiPost('/learner-profile/actions', {
        action: 'fetch-enrollment-stats', filters: filters || {},
      });

      if (!result?.data) {
        return { success: false, error: 'Failed to fetch enrollment stats' };
      }

      const raw = result.data as any[];

      const stats = {
        total: raw?.length || 0,
        byProgram: {} as Record<string, number>,
        bySemester: {} as Record<number, number>,
      };

      raw?.forEach((learner: any) => {
        const programName = learner.programs?.name || 'Unknown';
        const semester = learner.semester || 0;
        stats.byProgram[programName] = (stats.byProgram[programName] || 0) + 1;
        stats.bySemester[semester] = (stats.bySemester[semester] || 0) + 1;
      });

      if (filters?.department_id) {
        const filteredTotal = raw?.filter((s: any) => s.programs?.department_id === filters.department_id).length || 0;
        stats.total = filteredTotal;
      }

      return { success: true, data: stats };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error fetching enrollment stats', error instanceof Error ? error : new Error(String(error)), { filters });
      return { success: false, error: errorMessage };
    }
  },
};
