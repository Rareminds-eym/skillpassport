import { supabase } from '../../lib/supabaseClient';

/**
 * College Curriculum Service
 * Handles curriculum creation, approval workflow, and CRUD operations
 * Works with the new college_curriculums, college_curriculum_units, and college_curriculum_outcomes tables
 */

// Types for the new schema
export interface CollegeCurriculum {
  id: string;
  college_id: string;
  department_id: string;
  program_id: string;
  course_code: string;
  course_name: string;
  semester: number;
  academic_year: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  created_by: string;
  approved_by?: string;
  approval_date?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CurriculumUnit {
  id: string;
  curriculum_id: string;
  name: string;
  code?: string;
  description: string;
  credits?: number;
  estimated_duration?: number;
  duration_unit?: 'hours' | 'weeks';
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CurriculumOutcome {
  id: string;
  curriculum_id: string;
  unit_id: string;
  outcome_text: string;
  bloom_level?: string;
  assessment_mappings: Array<{
    assessmentType: string;
    weightage?: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CurriculumWithDetails extends CollegeCurriculum {
  units: CurriculumUnit[];
  outcomes: CurriculumOutcome[];
  department_name?: string;
  program_name?: string;
}

// Get current user's college ID
async function getCurrentUserCollegeId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: lecturer } = await supabase
    .from('college_lecturers')
    .select('collegeId')
    .eq('user_id', user.id)
    .single();

  return lecturer?.collegeId || null;
}

export const curriculumService = {
  /**
   * Create new curriculum
   */
  async createCurriculum(data: {
    department_id: string;
    program_id: string;
    course_code: string;
    course_name: string;
    semester: number;
    academic_year: string;
  }): Promise<{ success: boolean; data?: CollegeCurriculum; error?: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } };
      }

      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      const { data: curriculum, error } = await supabase
        .from('college_curriculums')
        .insert([{
          college_id: collegeId,
          department_id: data.department_id,
          program_id: data.program_id,
          course_code: data.course_code,
          course_name: data.course_name,
          semester: data.semester,
          academic_year: data.academic_year,
          status: 'draft',
          created_by: user.id,
        }])
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
   * Get curriculum by ID with units and outcomes
   */
  async getCurriculumById(id: string): Promise<{ success: boolean; data?: CurriculumWithDetails; error?: any }> {
    try {
      // Get curriculum with department and program names
      const { data: curriculum, error: curriculumError } = await supabase
        .from('college_curriculums')
        .select(`
          *,
          departments!inner(name),
          programs!inner(name)
        `)
        .eq('id', id)
        .single();

      if (curriculumError) throw curriculumError;

      // Get units
      const { data: units, error: unitsError } = await supabase
        .from('college_curriculum_units')
        .select('*')
        .eq('curriculum_id', id)
        .order('order_index');

      if (unitsError) throw unitsError;

      // Get outcomes
      const { data: outcomes, error: outcomesError } = await supabase
        .from('college_curriculum_outcomes')
        .select('*')
        .eq('curriculum_id', id);

      if (outcomesError) throw outcomesError;

      const result: CurriculumWithDetails = {
        ...curriculum,
        units: units || [],
        outcomes: outcomes || [],
        department_name: curriculum.departments?.name,
        program_name: curriculum.programs?.name,
      };

      return { success: true, data: result };
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
   * Get curriculums with filters
   */
  async getCurriculums(filters: {
    department_id?: string;
    program_id?: string;
    semester?: number;
    academic_year?: string;
    status?: string;
  } = {}): Promise<{ success: boolean; data?: CurriculumWithDetails[]; error?: any }> {
    try {
      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      let query = supabase
        .from('college_curriculums')
        .select(`
          *,
          departments!inner(name),
          programs!inner(name)
        `)
        .eq('college_id', collegeId);

      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.program_id) query = query.eq('program_id', filters.program_id);
      if (filters.semester) query = query.eq('semester', filters.semester);
      if (filters.academic_year) query = query.eq('academic_year', filters.academic_year);
      if (filters.status) query = query.eq('status', filters.status);

      const { data: curriculums, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const result: CurriculumWithDetails[] = (curriculums || []).map(curriculum => ({
        ...curriculum,
        units: [],
        outcomes: [],
        department_name: curriculum.departments?.name,
        program_name: curriculum.programs?.name,
      }));

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch curriculums',
        },
      };
    }
  },

  /**
   * Update curriculum
   */
  async updateCurriculum(id: string, updates: Partial<CollegeCurriculum>): Promise<{ success: boolean; data?: CollegeCurriculum; error?: any }> {
    try {
      // Check if curriculum is approved
      const { data: existing, error: fetchError } = await supabase
        .from('college_curriculums')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (existing.status === 'approved') {
        return {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'Cannot modify approved curriculum',
          },
        };
      }

      const { data, error } = await supabase
        .from('college_curriculums')
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
   * Add unit to curriculum
   */
  async addUnit(data: {
    curriculum_id: string;
    name: string;
    code?: string;
    description: string;
    credits?: number;
    estimated_duration?: number;
    duration_unit?: 'hours' | 'weeks';
  }): Promise<{ success: boolean; data?: CurriculumUnit; error?: any }> {
    try {
      // Get next order index
      const { data: maxOrder } = await supabase
        .from('college_curriculum_units')
        .select('order_index')
        .eq('curriculum_id', data.curriculum_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (maxOrder?.order_index || 0) + 1;

      const { data: unit, error } = await supabase
        .from('college_curriculum_units')
        .insert([{
          ...data,
          order_index: nextOrder,
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: unit };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to add unit',
        },
      };
    }
  },

  /**
   * Update unit
   */
  async updateUnit(id: string, updates: Partial<CurriculumUnit>): Promise<{ success: boolean; data?: CurriculumUnit; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('college_curriculum_units')
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
          message: error.message || 'Failed to update unit',
        },
      };
    }
  },

  /**
   * Delete unit
   */
  async deleteUnit(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('college_curriculum_units')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Failed to delete unit',
        },
      };
    }
  },

  /**
   * Add learning outcome
   */
  async addOutcome(data: {
    curriculum_id: string;
    unit_id: string;
    outcome_text: string;
    bloom_level?: string;
    assessment_mappings: Array<{
      assessmentType: string;
      weightage?: number;
    }>;
  }): Promise<{ success: boolean; data?: CurriculumOutcome; error?: any }> {
    try {
      const { data: outcome, error } = await supabase
        .from('college_curriculum_outcomes')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: outcome };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to add outcome',
        },
      };
    }
  },

  /**
   * Update learning outcome
   */
  async updateOutcome(id: string, updates: Partial<CurriculumOutcome>): Promise<{ success: boolean; data?: CurriculumOutcome; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('college_curriculum_outcomes')
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
          message: error.message || 'Failed to update outcome',
        },
      };
    }
  },

  /**
   * Delete learning outcome
   */
  async deleteOutcome(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('college_curriculum_outcomes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Failed to delete outcome',
        },
      };
    }
  },

  /**
   * Submit curriculum for approval
   */
  async submitForApproval(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      // Validate that curriculum has units and outcomes
      const { data: units } = await supabase
        .from('college_curriculum_units')
        .select('id')
        .eq('curriculum_id', id);

      const { data: outcomes } = await supabase
        .from('college_curriculum_outcomes')
        .select('id')
        .eq('curriculum_id', id);

      if (!units || units.length === 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Curriculum must have at least one unit before submission',
          },
        };
      }

      if (!outcomes || outcomes.length === 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Curriculum must have at least one learning outcome before submission',
          },
        };
      }

      const { error } = await supabase
        .from('college_curriculums')
        .update({ status: 'pending_approval' })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
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
  async approveCurriculum(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } };
      }

      const { error } = await supabase
        .from('college_curriculums')
        .update({ 
          status: 'approved',
          approved_by: user.id,
          approval_date: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
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
   * Reject curriculum
   */
  async rejectCurriculum(id: string, reason: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('college_curriculums')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REJECT_ERROR',
          message: error.message || 'Failed to reject curriculum',
        },
      };
    }
  },

  /**
   * Get departments for current user's college
   */
  async getDepartments(): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('college_id', collegeId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch departments',
        },
      };
    }
  },

  /**
   * Get programs for a department
   */
  async getPrograms(departmentId?: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      let query = supabase
        .from('programs')
        .select('id, name, code, department_id')
        .eq('status', 'active')
        .order('name');

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch programs',
        },
      };
    }
  },

  /**
   * Get courses for a specific program and semester
   */
  async getCourses(programId: string, semester: number): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('college_course_mappings')
        .select('id, course_code, course_name, credits, type')
        .eq('program_id', programId)
        .eq('semester', semester)
        .order('course_code');

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch courses',
        },
      };
    }
  },

  /**
   * Get available semesters for a program
   */
  async getSemesters(programId: string): Promise<{ success: boolean; data?: number[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('college_course_mappings')
        .select('semester')
        .eq('program_id', programId)
        .order('semester');

      if (error) throw error;

      // Get unique semesters
      const uniqueSemesters = [...new Set((data || []).map(item => item.semester))];
      
      return { success: true, data: uniqueSemesters };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch semesters',
        },
      };
    }
  },

  /**
   * Get courses for a specific program and semester
   */
  async getCourses(programId: string, semester: number): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('college_course_mappings')
        .select('id, course_code, course_name, credits, type')
        .eq('program_id', programId)
        .eq('semester', semester)
        .order('course_code');

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch courses',
        },
      };
    }
  },

  /**
   * Get assessment types for current user's college
   */
  async getAssessmentTypes(): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      console.log('🔍 Getting assessment types...');
      
      const collegeId = await getCurrentUserCollegeId();
      console.log('🏫 College ID:', collegeId);
      
      if (!collegeId) {
        console.log('❌ No college ID found');
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      // Get college-specific and global assessment types
      console.log('📡 Fetching assessment types from database...');
      const { data, error } = await supabase
        .from('assessment_types')
        .select('id, name, description, is_active, institution_id, institution_type')
        .or(`and(institution_id.eq.${collegeId},institution_type.eq.college),institution_id.is.null`)
        .eq('is_active', true)
        .order('name');

      console.log('📊 Database response:', { data, error });

      if (error) throw error;

      console.log('✅ Successfully fetched', data?.length, 'assessment types');
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.log('⚠️ Primary query failed, trying fallback approach...');
      
      // If the complex query fails, try a simpler approach
      try {
        const collegeId = await getCurrentUserCollegeId();
        if (!collegeId) {
          return { success: false, error: { message: 'Unable to determine user college' } };
        }

        const { data: collegeTypes, error: collegeError } = await supabase
          .from('assessment_types')
          .select('id, name, description, is_active')
          .eq('institution_id', collegeId)
          .eq('institution_type', 'college')
          .eq('is_active', true);

        const { data: globalTypes, error: globalError } = await supabase
          .from('assessment_types')
          .select('id, name, description, is_active')
          .is('institution_id', null)
          .eq('is_active', true);

        console.log('📊 Fallback results:', { 
          collegeTypes: collegeTypes?.length, 
          globalTypes: globalTypes?.length,
          collegeError,
          globalError 
        });

        if (collegeError && globalError) {
          throw new Error('Failed to fetch assessment types');
        }

        const combinedData = [
          ...(collegeTypes || []),
          ...(globalTypes || [])
        ].sort((a, b) => a.name.localeCompare(b.name));

        console.log('✅ Fallback successful! Found', combinedData.length, 'assessment types');
        return { success: true, data: combinedData };
      } catch (fallbackError: any) {
        console.error('❌ Both primary and fallback failed:', fallbackError);
        return {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: fallbackError.message || 'Failed to fetch assessment types',
          },
        };
      }
    }
  },

  /**
   * Generate academic years
   */
  getAcademicYears(): string[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = -1; i <= 2; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear}`);
    }
    
    return years;
  },
};