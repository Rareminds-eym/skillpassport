import { supabase } from '../../lib/supabaseClient';

/**
 * College Lesson Plan Service
 * Handles lesson plan CRUD operations for college faculty
 */

export interface CollegeLessonPlan {
  id: string;
  title: string;
  session_date: string;
  duration_minutes?: number;
  college_id: string;
  department_id: string;
  program_id: string;
  course_id: string;
  semester: number;
  academic_year: string;
  curriculum_id?: string;
  unit_id: string;
  selected_learning_outcomes: string[];
  session_objectives: string;
  teaching_methodology: string;
  required_materials?: string;
  resource_files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url?: string;
  }>;
  resource_links: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  evaluation_criteria: string;
  evaluation_items: Array<{
    id: string;
    criterion: string;
    percentage: number;
  }>;
  follow_up_activities?: string;
  additional_notes?: string;
  status: 'draft' | 'published' | 'archived' | 'shared';
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  metadata: Record<string, any>;
  // Joined fields
  course_name?: string;
  course_code?: string;
  department_name?: string;
  program_name?: string;
  unit_name?: string;
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

export const lessonPlanService = {
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
  async getPrograms(departmentId: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, code, department_id')
        .eq('department_id', departmentId)
        .eq('status', 'active')
        .order('name');

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
        .select(`
          id, 
          offering_type,
          course:college_courses(
            id,
            course_code, 
            course_name, 
            credits,
            course_type
          )
        `)
        .eq('program_id', programId)
        .eq('semester', semester);

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = (data || []).map(mapping => {
        const course = mapping.course;
        return {
          id: course?.id || null,
          mapping_id: mapping.id,
          course_code: course?.course_code || null,
          course_name: course?.course_name || null,
          credits: course?.credits || null,
          offering_type: mapping.offering_type,
          course_type: course?.course_type || null
        };
      }).filter(item => item.id); // Filter out items without valid course IDs

      return { success: true, data: transformedData };
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
   * Get curriculum units for a specific course, program, and academic year
   * Returns both units and curriculum_id
   */
  async getCurriculumUnits(courseId: string, programId: string, academicYear: string): Promise<{ success: boolean; data?: any[]; curriculumId?: string; error?: any }> {
    try {
      const collegeId = await getCurrentUserCollegeId();
      console.log('🏫 College ID for curriculum lookup:', collegeId);
      
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      console.log('🔍 Searching for curriculum with:', {
        college_id: collegeId,
        program_id: programId,
        course_id: courseId,
        academic_year: academicYear,
        status: 'published OR approved OR draft'
      });

      // First find the curriculum - try published first, then approved, then draft
      let { data: curriculum, error: curriculumError } = await supabase
        .from('college_curriculums')
        .select('id, status, created_at')
        .eq('college_id', collegeId)
        .eq('program_id', programId)
        .eq('course_id', courseId)
        .eq('academic_year', academicYear)
        .eq('status', 'published')
        .single();

      // If no published curriculum found, try approved
      if (curriculumError || !curriculum) {
        console.log('📝 No published curriculum found, trying approved...');
        const { data: approvedCurriculum, error: approvedError } = await supabase
          .from('college_curriculums')
          .select('id, status, created_at')
          .eq('college_id', collegeId)
          .eq('program_id', programId)
          .eq('course_id', courseId)
          .eq('academic_year', academicYear)
          .eq('status', 'approved')
          .single();
        
        curriculum = approvedCurriculum;
        curriculumError = approvedError;
      }

      // If no approved curriculum found, try draft
      if (curriculumError || !curriculum) {
        console.log('📝 No approved curriculum found, trying draft...');
        const { data: draftCurriculum, error: draftError } = await supabase
          .from('college_curriculums')
          .select('id, status, created_at')
          .eq('college_id', collegeId)
          .eq('program_id', programId)
          .eq('course_id', courseId)
          .eq('academic_year', academicYear)
          .eq('status', 'draft')
          .single();
        
        curriculum = draftCurriculum;
        curriculumError = draftError;
      }

      console.log('📊 Curriculum query result:', { curriculum, curriculumError });

      if (curriculumError || !curriculum) {
        // Let's also check if there are any curriculums for this combination with different status
        const { data: allCurriculums, error: allError } = await supabase
          .from('college_curriculums')
          .select('id, status, created_at')
          .eq('college_id', collegeId)
          .eq('program_id', programId)
          .eq('course_id', courseId)
          .eq('academic_year', academicYear);
        
        console.log('📋 All curriculums for this combination:', { allCurriculums, allError });
        
        return { success: true, data: [], curriculumId: undefined }; // No curriculum found, return empty array
      }

      console.log('✅ Found curriculum:', curriculum.id, 'with status:', curriculum.status);

      // Get units for this curriculum
      const { data: units, error: unitsError } = await supabase
        .from('college_curriculum_units')
        .select('*')
        .eq('curriculum_id', curriculum.id)
        .order('order_index');

      console.log('📚 Units query result:', { units: units?.length, unitsError });

      if (unitsError) throw unitsError;

      return { success: true, data: units || [], curriculumId: curriculum.id };
    } catch (error: any) {
      console.error('❌ Error in getCurriculumUnits:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch curriculum units',
        },
      };
    }
  },

  /**
   * Get learning outcomes for a specific unit
   */
  async getLearningOutcomes(unitId: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('college_curriculum_outcomes')
        .select('*')
        .eq('unit_id', unitId);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch learning outcomes',
        },
      };
    }
  },

  /**
   * Create new lesson plan
   */
  async createLessonPlan(data: Omit<CollegeLessonPlan, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'college_id'>): Promise<{ success: boolean; data?: CollegeLessonPlan; error?: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } };
      }

      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      const { data: lessonPlan, error } = await supabase
        .from('college_lesson_plans')
        .insert([{
          ...data,
          college_id: collegeId,
          created_by: user.id,
        }])
        .select(`
          *,
          course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
          department:departments!college_lesson_plans_department_id_fkey(name),
          program:programs!college_lesson_plans_program_id_fkey(name),
          unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
        `)
        .single();

      if (error) {
        console.error('❌ Database error creating lesson plan:', error);
        
        // Handle specific constraint violations
        if (error.message?.includes('session_date') && error.message?.includes('not-null')) {
          throw new Error('Session date is required and cannot be empty');
        } else if (error.message?.includes('violates not-null constraint')) {
          throw new Error('Please fill in all required fields');
        } else {
          throw error;
        }
      }

      // Flatten the response
      const result = {
        ...lessonPlan,
        course_code: lessonPlan.course?.course_code,
        course_name: lessonPlan.course?.course_name,
        department_name: lessonPlan.department?.name,
        program_name: lessonPlan.program?.name,
        unit_name: lessonPlan.unit?.name,
      };

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create lesson plan',
        },
      };
    }
  },

  /**
   * Update lesson plan
   */
  async updateLessonPlan(id: string, updates: Partial<CollegeLessonPlan>): Promise<{ success: boolean; data?: CollegeLessonPlan; error?: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } };
      }

      const { data, error } = await supabase
        .from('college_lesson_plans')
        .update({
          ...updates,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
          department:departments!college_lesson_plans_department_id_fkey(name),
          program:programs!college_lesson_plans_program_id_fkey(name),
          unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
        `)
        .single();

      if (error) throw error;

      // Flatten the response
      const result = {
        ...data,
        course_code: data.course?.course_code,
        course_name: data.course?.course_name,
        department_name: data.department?.name,
        program_name: data.program?.name,
        unit_name: data.unit?.name,
      };

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update lesson plan',
        },
      };
    }
  },

  /**
   * Get lesson plans with filters
   */
  async getLessonPlans(filters: {
    department_id?: string;
    program_id?: string;
    course_id?: string;
    semester?: number;
    academic_year?: string;
    status?: string;
  } = {}): Promise<{ success: boolean; data?: CollegeLessonPlan[]; error?: any }> {
    try {
      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } };
      }

      let query = supabase
        .from('college_lesson_plans')
        .select(`
          *,
          course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
          department:departments!college_lesson_plans_department_id_fkey(name),
          program:programs!college_lesson_plans_program_id_fkey(name),
          unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
        `)
        .eq('college_id', collegeId)
        .eq('created_by', user.id); // Only show user's own lesson plans

      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.program_id) query = query.eq('program_id', filters.program_id);
      if (filters.course_id) query = query.eq('course_id', filters.course_id);
      if (filters.semester) query = query.eq('semester', filters.semester);
      if (filters.academic_year) query = query.eq('academic_year', filters.academic_year);
      if (filters.status) query = query.eq('status', filters.status);

      const { data: lessonPlans, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const result: CollegeLessonPlan[] = (lessonPlans || []).map(plan => ({
        ...plan,
        course_code: plan.course?.course_code,
        course_name: plan.course?.course_name,
        department_name: plan.department?.name,
        program_name: plan.program?.name,
        unit_name: plan.unit?.name,
      }));

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch lesson plans',
        },
      };
    }
  },

  /**
   * Delete lesson plan
   */
  async deleteLessonPlan(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('college_lesson_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Failed to delete lesson plan',
        },
      };
    }
  },

  /**
   * Check what curriculums exist for debugging
   */
  async debugCurriculums(courseId?: string, programId?: string, academicYear?: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      let query = supabase
        .from('college_curriculums')
        .select(`
          id, 
          status, 
          academic_year,
          created_at,
          course:college_courses!college_curriculums_course_id_fkey(course_code, course_name),
          program:programs!college_curriculums_program_id_fkey(name, code)
        `)
        .eq('college_id', collegeId);

      if (courseId) query = query.eq('course_id', courseId);
      if (programId) query = query.eq('program_id', programId);
      if (academicYear) query = query.eq('academic_year', academicYear);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
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