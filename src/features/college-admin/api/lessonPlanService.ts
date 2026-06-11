import { apiPost } from '@/shared/api/apiClient';

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
  course_name?: string;
  course_code?: string;
  department_name?: string;
  program_name?: string;
  unit_name?: string;
}

export const lessonPlanService = {
  async getDepartments(): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'get-departments'
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch departments' } };
      }

      return { success: true, data: result.data || [] };
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

  async getPrograms(departmentId: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'get-programs',
        department_id: departmentId
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch programs' } };
      }

      return { success: true, data: result.data || [] };
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

  async getSemesters(programId: string): Promise<{ success: boolean; data?: number[]; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'get-semesters',
        program_id: programId
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch semesters' } };
      }

      return { success: true, data: result.data || [] };
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

  async getCourses(programId: string, semester: number): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'get-courses',
        program_id: programId,
        semester
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch courses' } };
      }

      return { success: true, data: result.data || [] };
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

  async getCurriculumUnits(courseId: string, programId: string, academicYear: string): Promise<{ success: boolean; data?: any[]; curriculumId?: string; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'get-lesson-plan-curriculums',
        course_id: courseId,
        program_id: programId,
        academic_year: academicYear
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch curriculum units' } };
      }

      return {
        success: true,
        data: result.data?.units || [],
        curriculumId: result.data?.curriculumId
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch curriculum units',
        },
      };
    }
  },

  async getLessonPlanCurriculums(courseId: string, programId: string, academicYear: string): Promise<{ success: boolean; data?: any[]; curriculumId?: string; error?: any }> {
    return this.getCurriculumUnits(courseId, programId, academicYear);
  },

  async getLearningOutcomes(unitId: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'get-lesson-plan-outcomes',
        unit_id: unitId
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch learning outcomes' } };
      }

      return { success: true, data: result.data || [] };
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

  async getLessonPlanOutcomes(unitId: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    return this.getLearningOutcomes(unitId);
  },

  async createLessonPlan(data: Omit<CollegeLessonPlan, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'college_id'>): Promise<{ success: boolean; data?: CollegeLessonPlan; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'create-lesson-plan',
        ...data
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to create lesson plan' } };
      }

      return { success: true, data: result.data };
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

  async updateLessonPlan(id: string, updates: Partial<CollegeLessonPlan>): Promise<{ success: boolean; data?: CollegeLessonPlan; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'update-lesson-plan',
        id,
        ...updates
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to update lesson plan' } };
      }

      return { success: true, data: result.data };
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

  async getLessonPlans(filters: {
    department_id?: string;
    program_id?: string;
    course_id?: string;
    semester?: number;
    academic_year?: string;
    status?: string;
  } = {}): Promise<{ success: boolean; data?: CollegeLessonPlan[]; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'get-lesson-plans',
        ...filters
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch lesson plans' } };
      }

      return { success: true, data: result.data || [] };
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

  async getLessonPlan(id: string): Promise<{ success: boolean; data?: CollegeLessonPlan; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'get-lesson-plan',
        id
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch lesson plan' } };
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch lesson plan',
        },
      };
    }
  },

  async getLessonPlanUnits(curriculumId: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'get-lesson-plan-units',
        curriculum_id: curriculumId
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch units' } };
      }

      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch units',
        },
      };
    }
  },

  async deleteLessonPlan(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'delete-lesson-plan',
        id
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to delete lesson plan' } };
      }

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

  async debugCurriculums(courseId?: string, programId?: string, academicYear?: string): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const result = await apiPost<any>('/college-admin/lesson-plans', {
        action: 'debug-curriculums',
        course_id: courseId,
        program_id: programId,
        academic_year: academicYear
      });

      if (!result.success) {
        return { success: false, error: { message: result.error || 'Failed to fetch curriculums' } };
      }

      return { success: true, data: result.data || [] };
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
