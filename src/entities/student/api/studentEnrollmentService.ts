import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('StudentEnrollmentService');

export interface EnrolledStudentView {
  student_id: string;
  student_name: string;
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

export const studentEnrollmentService = {
  /**
   * Get all enrolled students with filters (using students table directly)
   */
  async getEnrolledStudents(filters?: {
    college_id?: string;
    department_id?: string;
    program_id?: string;
    semester?: number;
    search?: string;
  }): Promise<{ success: boolean; data?: EnrolledStudentView[]; error?: string }> {
    try {
      let query = supabase
        .from('students')
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
          programs!students_program_id_fkey (
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

      // Transform data to match EnrolledStudentView interface
      const transformedData: EnrolledStudentView[] = (data || []).map((student: any) => ({
        student_id: student.id,
        student_name: student.name,
        roll_number: student.roll_number,
        email: student.email,
        contact_number: student.contact_number,
        college_id: student.college_id,
        department_id: student.programs?.department_id || '',
        department_name: student.programs?.departments?.name || 'N/A',
        department_code: student.programs?.departments?.code || '',
        program_id: student.program_id,
        program_name: student.programs?.name || 'N/A',
        program_code: student.programs?.code || '',
        section: student.section || 'Not Assigned',
        semester: student.semester || 1,
        enrollment_date: student.enrollmentDate || student.created_at,
        created_at: student.created_at,
        updated_at: student.updated_at,
      }));

      // Apply department filter manually (since it's nested)
      let filteredData = transformedData;
      if (filters?.department_id) {
        filteredData = transformedData.filter(s => s.department_id === filters.department_id);
      }

      return { success: true, data: filteredData };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error fetching enrolled students', error instanceof Error ? error : new Error(String(error)), { filters });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Enroll a student (update students table)
   */
  async enrollStudent(data: {
    student_id: string;
    program_id: string;
    section?: string;
    semester: number;
  }): Promise<{ success: boolean; data?: { id: string; program_id: string; semester: number; section?: string; enrollmentDate: string }; error?: string }> {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .update({
          program_id: data.program_id,
          semester: data.semester,
          section: data.section || null,
          enrollmentDate: new Date().toISOString().split('T')[0],
        })
        .eq('id', data.student_id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: student };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error enrolling student', error instanceof Error ? error : new Error(String(error)), { studentId: data.student_id, programId: data.program_id });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Bulk enroll students (update students table)
   */
  async bulkEnrollStudents(enrollments: Array<{
    student_id: string;
    program_id: string;
    section?: string;
    semester: number;
  }>): Promise<{ success: boolean; data?: { id: string; program_id: string; semester: number; section?: string; enrollmentDate: string }[]; error?: string }> {
    try {
      const results = [];
      
      for (const enrollment of enrollments) {
        const result = await this.enrollStudent(enrollment);
        if (result.success && result.data) {
          results.push(result.data);
        }
      }

      return { success: true, data: results };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error bulk enrolling students', error instanceof Error ? error : new Error(String(error)), { count: enrollments.length });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Update enrollment (update students table)
   */
  async updateEnrollment(
    studentId: string,
    updates: {
      section?: string;
      semester?: number;
      program_id?: string;
    }
  ): Promise<{ success: boolean; data?: { id: string; program_id?: string; semester?: number; section?: string }; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error updating enrollment', error instanceof Error ? error : new Error(String(error)), { studentId, updates });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Get unenrolled students (students without program_id)
   */
  async getUnenrolledStudents(): Promise<{ success: boolean; data?: { id: string; name: string; roll_number: string; email: string; contact_number: string; college_id: string }[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, roll_number, email, contact_number, college_id')
        .eq('is_deleted', false)
        .is('program_id', null);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error fetching unenrolled students', error instanceof Error ? error : new Error(String(error)));
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
        .from('students')
        .select(`
          id,
          program_id,
          semester,
          programs!students_program_id_fkey (
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

      data?.forEach((student: any) => {
        const programName = student.programs?.name || 'Unknown';
        const semester = student.semester || 0;

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
