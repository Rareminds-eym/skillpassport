import { supabase } from '@/shared/api/supabaseClient';
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
  /**
   * Get all enrolled learners with filters (using learners table directly)
   */
  async getEnrolledLearners(filters?: {
    college_id?: string;
    department_id?: string;
    program_id?: string;
    semester?: number;
    search?: string;
  }): Promise<{ success: boolean; data?: EnrolledLearnerView[]; error?: string }> {
    try {
      let query = supabase
        .from('learners')
        .select(`
          id,
          name,
          roll_number,
          email,
          contact_number,
          college_id,
          program_id,
          semester,
          section,
          enrollmentDate,
          created_at,
          updated_at,
          programs!learners_program_id_fkey (
            id,
            name,
            code,
            department_id,
            departments!programs_department_id_fkey (
              id,
              name,
              code
            )
          )
        `)
        .eq('is_deleted', false)
        .not('program_id', 'is', null)
        .order('name', { ascending: true });

      if (filters?.college_id) {
        query = query.eq('college_id', filters.college_id);
      }
      if (filters?.program_id) {
        query = query.eq('program_id', filters.program_id);
      }
      if (filters?.semester) {
        query = query.eq('semester', filters.semester);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match EnrolledLearnerView interface
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

      // Apply department filter manually (since it's nested)
      let filteredData = transformedData;
      if (filters?.department_id) {
        filteredData = transformedData.filter(s => s.department_id === filters.department_id);
      }

      return { success: true, data: filteredData };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error fetching enrolled learners', error instanceof Error ? error : new Error(String(error)), { filters });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Enroll a learner (update learners table)
   */
  async enrollLearner(data: {
    learner_id: string;
    program_id: string;
    section?: string;
    semester: number;
  }): Promise<{ success: boolean; data?: { id: string; program_id: string; semester: number; section?: string; enrollmentDate: string }; error?: string }> {
    try {
      const { data: learner, error } = await supabase
        .from('learners')
        .update({
          program_id: data.program_id,
          semester: data.semester,
          section: data.section || null,
          enrollmentDate: new Date().toISOString().split('T')[0],
        })
        .eq('id', data.learner_id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: learner };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error enrolling learner', error instanceof Error ? error : new Error(String(error)), { learnerId: data.learner_id, programId: data.program_id });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Bulk enroll learners (update learners table)
   */
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
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Update enrollment (update learners table)
   */
  async updateEnrollment(
    learnerId: string,
    updates: {
      section?: string;
      semester?: number;
      program_id?: string;
    }
  ): Promise<{ success: boolean; data?: { id: string; program_id?: string; semester?: number; section?: string }; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('learners')
        .update(updates)
        .eq('id', learnerId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error updating enrollment', error instanceof Error ? error : new Error(String(error)), { learnerId, updates });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Get unenrolled learners (learners without program_id)
   */
  async getUnenrolledLearners(): Promise<{ success: boolean; data?: { id: string; name: string; roll_number: string; email: string; contact_number: string; college_id: string }[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('learners')
        .select('id, name, roll_number, email, contact_number, college_id')
        .eq('is_deleted', false)
        .is('program_id', null);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error fetching unenrolled learners', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Get enrollment statistics
   */
  async getEnrollmentStats(filters?: {
    department_id?: string;
    program_id?: string;
  }): Promise<{ success: boolean; data?: { total: number; byProgram: Record<string, number>; bySemester: Record<number, number> }; error?: string }> {
    try {
      let query = supabase
        .from('learners')
        .select(`
          id,
          program_id,
          semester,
          programs!learners_program_id_fkey (
            name,
            department_id,
            departments!programs_department_id_fkey (
              id,
              name
            )
          )
        `)
        .eq('is_deleted', false)
        .not('program_id', 'is', null);

      if (filters?.program_id) {
        query = query.eq('program_id', filters.program_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byProgram: {} as Record<string, number>,
        bySemester: {} as Record<number, number>,
      };

      data?.forEach((learner: any) => {
        const programName = learner.programs?.name || 'Unknown';
        const semester = learner.semester || 0;

        if (!stats.byProgram[programName]) {
          stats.byProgram[programName] = 0;
        }
        stats.byProgram[programName]++;

        if (!stats.bySemester[semester]) {
          stats.bySemester[semester] = 0;
        }
        stats.bySemester[semester]++;
      });

      // Apply department filter manually
      if (filters?.department_id) {
        const filteredTotal = data?.filter((s: any) => 
          s.programs?.department_id === filters.department_id
        ).length || 0;
        stats.total = filteredTotal;
      }

      return { success: true, data: stats };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error fetching enrollment stats', error instanceof Error ? error : new Error(String(error)), { filters });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
