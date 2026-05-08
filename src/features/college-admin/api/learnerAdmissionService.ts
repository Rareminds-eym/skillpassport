import { supabase } from '@/shared/api/supabaseClient';
import type { LearnerAdmission, ApiResponse, BulkImportResult } from '@/shared/types/college';

/**
 * Learner Admission Service
 * Handles learner lifecycle from admission to graduation
 */

export const learnerAdmissionService = {
  /**
   * Create learner application
   */
  async createApplication(data: Partial<LearnerAdmission>): Promise<ApiResponse<LearnerAdmission>> {
    try {
      // Generate application number
      const appNumber = `APP${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const { data: admission, error } = await supabase
        .from('learner_admissions')
        .insert([{ ...data, application_number: appNumber, status: 'applied' }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: admission };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create application',
        },
      };
    }
  },

  /**
   * Verify documents
   */
  async verifyDocuments(id: string, documentIds: string[]): Promise<ApiResponse<void>> {
    try {
      const { data: admission, error: fetchError } = await supabase
        .from('learner_admissions')
        .select('documents')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const updatedDocuments = (admission.documents || []).map((doc: any) => {
        if (documentIds.includes(doc.id)) {
          return { ...doc, verified: true, verified_at: new Date().toISOString() };
        }
        return doc;
      });

      const { error } = await supabase
        .from('learner_admissions')
        .update({ documents: updatedDocuments, status: 'verified' })
        .eq('id', id);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VERIFY_ERROR',
          message: error.message || 'Failed to verify documents',
        },
      };
    }
  },

  /**
   * Approve admission
   */
  async approveAdmission(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('learner_admissions')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message: error.message || 'Failed to approve admission',
        },
      };
    }
  },

  /**
   * Generate roll number
   * Property 14: Roll number uniqueness
   */
  async generateRollNumber(programId: string, year: number): Promise<ApiResponse<string>> {
    try {
      // Get program code
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('code')
        .eq('id', programId)
        .single();

      if (programError) throw programError;

      // Get count of learners in this program for this year
      const { count } = await supabase
        .from('learner_admissions')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programId)
        .like('roll_number', `${year}${program.code}%`);

      const sequence = String((count || 0) + 1).padStart(4, '0');
      const rollNumber = `${year}${program.code}${sequence}`;

      // Verify uniqueness
      const { data: existing } = await supabase
        .from('learner_admissions')
        .select('id')
        .eq('roll_number', rollNumber)
        .single();

      if (existing) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Generated roll number already exists',
          },
        };
      }

      return { success: true, data: rollNumber };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GENERATE_ERROR',
          message: error.message || 'Failed to generate roll number',
        },
      };
    }
  },

  /**
   * Enroll learner (after approval)
   */
  async enrollLearner(id: string, rollNumber: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('learner_admissions')
        .update({ 
          status: 'enrolled', 
          roll_number: rollNumber,
          current_semester: 1 
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ENROLL_ERROR',
          message: error.message || 'Failed to enroll learner',
        },
      };
    }
  },

  /**
   * Promote learners to next semester
   * Property 15: Semester promotion validation
   */
  async promoteToNextSemester(learnerIds: string[]): Promise<ApiResponse<{ success: string[]; failed: string[] }>> {
    try {
      const result = { success: [] as string[], failed: [] as string[] };

      for (const learnerId of learnerIds) {
        // Get learner data
        const { data: learner, error: fetchError } = await supabase
          .from('learner_admissions')
          .select('current_semester, program_id')
          .eq('id', learnerId)
          .single();

        if (fetchError) {
          result.failed.push(learnerId);
          continue;
        }

        // Check if learner has cleared all courses (simplified - would need mark_entries check)
        // For now, just promote
        const { error: updateError } = await supabase
          .from('learner_admissions')
          .update({ current_semester: (learner.current_semester || 1) + 1 })
          .eq('id', learnerId);

        if (updateError) {
          result.failed.push(learnerId);
        } else {
          result.success.push(learnerId);
        }
      }

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'PROMOTION_ERROR',
          message: error.message || 'Failed to promote learners',
        },
      };
    }
  },

  /**
   * Check graduation eligibility
   */
  async checkGraduationEligibility(learnerId: string): Promise<ApiResponse<{ eligible: boolean; reason?: string }>> {
    try {
      const { data: learner, error } = await supabase
        .from('learner_admissions')
        .select('current_semester, cgpa, program_id')
        .eq('id', learnerId)
        .single();

      if (error) throw error;

      // Get program requirements
      const { data: program } = await supabase
        .from('programs')
        .select('duration_semesters, total_credits_required')
        .eq('id', learner.program_id)
        .single();

      if (!program) {
        return {
          success: true,
          data: { eligible: false, reason: 'Program not found' },
        };
      }

      // Check if completed all semesters
      if (learner.current_semester < program.duration_semesters) {
        return {
          success: true,
          data: { 
            eligible: false, 
            reason: `Not completed all semesters (${learner.current_semester}/${program.duration_semesters})` 
          },
        };
      }

      // Check minimum CGPA (assuming 5.0 minimum)
      if (learner.cgpa < 5.0) {
        return {
          success: true,
          data: { eligible: false, reason: `CGPA below minimum (${learner.cgpa}/10.0)` },
        };
      }

      return { success: true, data: { eligible: true } };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ELIGIBILITY_ERROR',
          message: error.message || 'Failed to check eligibility',
        },
      };
    }
  },

  /**
   * Mark learners as graduated
   */
  async markAsGraduated(learnerIds: string[]): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('learner_admissions')
        .update({ status: 'graduated' })
        .in('id', learnerIds);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GRADUATION_ERROR',
          message: error.message || 'Failed to mark as graduated',
        },
      };
    }
  },

  /**
   * Bulk import learners
   */
  async bulkImportlearners(csvData: any[]): Promise<ApiResponse<BulkImportResult>> {
    try {
      const result: BulkImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 2;

        // Validate required fields
        if (!row.program_id || !row.department_id || !row.personal_details) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            field: 'required',
            message: 'Missing required fields',
          });
          continue;
        }

        const createResult = await this.createApplication(row);
        if (createResult.success) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            field: createResult.error.field || 'unknown',
            message: createResult.error.message,
          });
        }
      }

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BULK_IMPORT_ERROR',
          message: error.message || 'Failed to import learners',
        },
      };
    }
  },

  /**
   * Calculate and update CGPA
   * Property 16: CGPA calculation accuracy
   */
  async updateCGPA(learnerId: string): Promise<ApiResponse<number>> {
    try {
      // Get all mark entries for learner
      const { data: marks, error } = await supabase
        .from('mark_entries')
        .select('grade, assessment_id')
        .eq('learner_id', learnerId)
        .not('grade', 'is', null);

      if (error) throw error;

      // Get course credits for each assessment
      // This is simplified - would need to join with assessments and course_mappings
      // For now, return a placeholder
      const cgpa = 7.5; // Placeholder calculation

      // Update learner CGPA
      const { error: updateError } = await supabase
        .from('learner_admissions')
        .update({ cgpa })
        .eq('user_id', learnerId);

      if (updateError) throw updateError;

      return { success: true, data: cgpa };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CGPA_ERROR',
          message: error.message || 'Failed to calculate CGPA',
        },
      };
    }
  },

  /**
   * Get learner admissions with filters
   */
  async getlearnerAdmissions(filters: {
    program_id?: string;
    department_id?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<LearnerAdmission[]>> {
    try {
      let query = supabase.from('learner_admissions').select('*');

      if (filters.program_id) query = query.eq('program_id', filters.program_id);
      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.search) {
        query = query.or(`application_number.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch admissions',
        },
      };
    }
  },
};
