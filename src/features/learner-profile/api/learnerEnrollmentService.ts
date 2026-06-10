import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learnerEnrollmentService');

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
  }): Promise<{ success: boolean; data?: EnrolledLearnerView[]; error?: any }> {
    try {
      const result = await apiPost<any[]>('/learner-profile/actions', {
        action: 'fetch-enrolled-learner-list',
        ...filters,
      });
      return { success: true, data: result?.data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch enrolled learners' },
      };
    }
  },

  async enrollLearner(data: {
    learner_id: string;
    program_id: string;
    section?: string;
    semester: number;
  }): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const result = await apiPost<any>('/learner-profile/actions', {
        action: 'update-enrollment',
        learnerId: data.learner_id,
        enrollmentData: {
          program_id: data.program_id,
          semester: data.semester,
          section: data.section || null,
          enrollmentDate: new Date().toISOString().split('T')[0],
        },
      });
      return { success: true, data: result?.data };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'ENROLL_ERROR', message: error.message || 'Failed to enroll learner' },
      };
    }
  },

  async bulkEnrollLearners(enrollments: Array<{
    learner_id: string;
    program_id: string;
    section?: string;
    semester: number;
  }>): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const results = [];
      for (const enrollment of enrollments) {
        const result = await this.enrollLearner(enrollment);
        if (result.success) {
          results.push(result.data);
        }
      }
      return { success: true, data: results };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'BULK_ENROLL_ERROR', message: error.message || 'Failed to bulk enroll learners' },
      };
    }
  },

  async updateEnrollment(
    learnerId: string,
    updates: { section?: string; semester?: number; program_id?: string }
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const result = await apiPost<any>('/learner-profile/actions', {
        action: 'update-enrollment',
        learnerId,
        enrollmentData: updates,
      });
      return { success: true, data: result?.data };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message || 'Failed to update enrollment' },
      };
    }
  },

  async getUnenrolledLearners(): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const result = await apiPost<any[]>('/learner-profile/actions', { action: 'fetch-unenrolled-learners' });
      return { success: true, data: result?.data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch unenrolled learners' },
      };
    }
  },

  async getEnrollmentStats(filters?: { department_id?: string; program_id?: string }): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const result = await apiPost<any[]>('/learner-profile/actions', {
        action: 'fetch-enrollment-stats',
        filters,
      });
      const data = result?.data || [];
      const stats = {
        total: data.length,
        byProgram: {} as Record<string, number>,
        bySemester: {} as Record<number, number>,
      };

      data.forEach((learner: any) => {
        const programName = learner.programs?.name || 'Unknown';
        const semester = learner.semester || 0;
        stats.byProgram[programName] = (stats.byProgram[programName] || 0) + 1;
        stats.bySemester[semester] = (stats.bySemester[semester] || 0) + 1;
      });

      if (filters?.department_id) {
        stats.total = data.filter((s: any) => s.programs?.department_id === filters.department_id).length;
      }

      return { success: true, data: stats };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch enrollment statistics' },
      };
    }
  },
};
