import { supabase } from '../../lib/supabaseClient';
import type { Curriculum, ApiResponse } from '../../types/college';

/**
 * Curriculum Service
 * Handles curriculum creation, approval workflow, and version control
 */

export const curriculumService = {
  /**
   * Create curriculum
   * Property 11: Curriculum mandatory fields
   */
  async createCurriculum(data: Partial<Curriculum>): Promise<ApiResponse<Curriculum>> {
    try {
      // Validate mandatory fields
      if (!data.academic_year || !data.department_id || !data.program_id || 
          !data.semester || !data.course_id) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All mandatory fields must be specified (academic_year, department, program, semester, course)',
          },
        };
      }

      const { data: curriculum, error } = await supabase
        .from('curriculum')
        .insert([{ ...data, status: 'draft', version: 1 }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: curriculum };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create curriculum',
        },
      };
    }
  },

  /**
   * Update curriculum
   * Property 13: Approved curriculum immutability
   */
  async updateCurriculum(id: string, updates: Partial<Curriculum>): Promise<ApiResponse<Curriculum>> {
    try {
      // Check if curriculum is approved
      const { data: existing, error: fetchError } = await supabase
        .from('curriculum')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (existing.status === 'approved' || existing.status === 'published') {
        return {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'Cannot modify approved curriculum without creating new version',
          },
        };
      }

      const { data, error } = await supabase
        .from('curriculum')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update curriculum',
        },
      };
    }
  },

  /**
   * Submit curriculum for approval
   */
  async submitForApproval(id: string): Promise<ApiResponse<void>> {
    try {
      // Validate outcome assessment mapping completeness (Property 12)
      const { data: curriculum, error: fetchError } = await supabase
        .from('curriculum')
        .select('outcomes, assessment_mappings')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Check if all outcomes are mapped to at least one assessment
      const outcomes = curriculum.outcomes || [];
      const mappings = curriculum.assessment_mappings || [];
      
      for (const outcome of outcomes) {
        const hasMapping = mappings.some((m: any) => 
          m.outcome_id === outcome.id && m.assessment_types && m.assessment_types.length > 0
        );
        
        if (!hasMapping) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Learning outcome "${outcome.text}" is not mapped to any assessment type`,
            },
          };
        }
      }

      const { error } = await supabase
        .from('curriculum')
        .update({ status: 'submitted' })
        .eq('id', id);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SUBMIT_ERROR',
          message: error.message || 'Failed to submit curriculum',
        },
      };
    }
  },

  /**
   * Approve curriculum
   */
  async approveCurriculum(id: string, approvedBy: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('curriculum')
        .update({ status: 'approved', approved_by: approvedBy })
        .eq('id', id);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message: error.message || 'Failed to approve curriculum',
        },
      };
    }
  },

  /**
   * Publish curriculum
   */
  async publishCurriculum(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('curriculum')
        .update({ status: 'published' })
        .eq('id', id)
        .eq('status', 'approved');

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'PUBLISH_ERROR',
          message: error.message || 'Failed to publish curriculum',
        },
      };
    }
  },

  /**
   * Clone curriculum to new academic year
   */
  async cloneCurriculum(id: string, targetYear: string, createdBy: string): Promise<ApiResponse<Curriculum>> {
    try {
      const { data: source, error: fetchError } = await supabase
        .from('curriculum')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const clonedData = {
        academic_year: targetYear,
        department_id: source.department_id,
        program_id: source.program_id,
        semester: source.semester,
        course_id: source.course_id,
        units: source.units,
        outcomes: source.outcomes,
        assessment_mappings: source.assessment_mappings,
        status: 'draft',
        version: 1,
        created_by: createdBy,
      };

      const { data: cloned, error } = await supabase
        .from('curriculum')
        .insert([clonedData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: cloned };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CLONE_ERROR',
          message: error.message || 'Failed to clone curriculum',
        },
      };
    }
  },

  /**
   * Get curriculum by filters
   */
  async getCurriculum(filters: {
    academic_year?: string;
    department_id?: string;
    program_id?: string;
    semester?: number;
    course_id?: string;
    status?: string;
  }): Promise<ApiResponse<Curriculum[]>> {
    try {
      let query = supabase.from('curriculum').select('*');

      if (filters.academic_year) query = query.eq('academic_year', filters.academic_year);
      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.program_id) query = query.eq('program_id', filters.program_id);
      if (filters.semester) query = query.eq('semester', filters.semester);
      if (filters.course_id) query = query.eq('course_id', filters.course_id);
      if (filters.status) query = query.eq('status', filters.status);

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch curriculum',
        },
      };
    }
  },

  /**
   * Export curriculum as JSON
   */
  async exportCurriculum(id: string): Promise<ApiResponse<Blob>> {
    try {
      const { data, error } = await supabase
        .from('curriculum')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

      return { success: true, data: blob };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error.message || 'Failed to export curriculum',
        },
      };
    }
  },
};
