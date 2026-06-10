import { apiPost } from '@/shared/api/apiClient';

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
  course_id: string;
  academic_year: string;
  status: 'draft' | 'approved' | 'published';
  created_by: string;
  approved_by?: string;
  approval_date?: string;
  published_date?: string;
  archived_date?: string;
  rejection_reason?: string;
  cloned_from_id?: string;
  version: number;
  created_at: string;
  updated_at: string;
  // Joined fields from related tables
  course_code?: string;
  course_name?: string;
  semester?: number;
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

export const curriculumService = {
  /**
   * Create new curriculum
   */
  async createCurriculum(data: {
    department_id: string;
    program_id: string;
    course_id: string;
    academic_year: string;
  }): Promise<CollegeCurriculum> {
    const { data: result } = await apiPost<{ data: CollegeCurriculum }>(
      '/college-admin/curriculum',
      { action: 'create-curriculum', ...data }
    );
    return result;
  },

  /**
   * Get curriculum by ID with units and outcomes
   */
  async getCurriculumById(id: string): Promise<CurriculumWithDetails> {
    const { data: result } = await apiPost<{ data: CurriculumWithDetails }>(
      '/college-admin/curriculum',
      { action: 'get-curriculum-by-id', id }
    );
    return result;
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
    course_id?: string;
  } = {}): Promise<CurriculumWithDetails[]> {
    const { data: result } = await apiPost<{ data: CurriculumWithDetails[] }>(
      '/college-admin/curriculum',
      { action: 'get-curriculums', ...filters }
    );
    return result;
  },

  /**
   * Update curriculum
   */
  async updateCurriculum(id: string, updates: Partial<CollegeCurriculum>): Promise<CollegeCurriculum> {
    const { data: result } = await apiPost<{ data: CollegeCurriculum }>(
      '/college-admin/curriculum',
      { action: 'update-curriculum', id, ...updates }
    );
    return result;
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
  }): Promise<CurriculumUnit> {
    const { data: result } = await apiPost<{ data: CurriculumUnit }>(
      '/college-admin/curriculum',
      { action: 'add-unit', ...data }
    );
    return result;
  },

  /**
   * Update unit
   */
  async updateUnit(id: string, updates: Partial<CurriculumUnit>): Promise<CurriculumUnit> {
    const { data: result } = await apiPost<{ data: CurriculumUnit }>(
      '/college-admin/curriculum',
      { action: 'update-unit', id, ...updates }
    );
    return result;
  },

  /**
   * Delete unit
   */
  async deleteUnit(id: string): Promise<void> {
    await apiPost('/college-admin/curriculum', { action: 'delete-unit', id });
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
  }): Promise<CurriculumOutcome> {
    const { data: result } = await apiPost<{ data: CurriculumOutcome }>(
      '/college-admin/curriculum',
      { action: 'add-outcome', ...data }
    );
    return result;
  },

  /**
   * Update learning outcome
   */
  async updateOutcome(id: string, updates: Partial<CurriculumOutcome>): Promise<CurriculumOutcome> {
    const { data: result } = await apiPost<{ data: CurriculumOutcome }>(
      '/college-admin/curriculum',
      { action: 'update-outcome', id, ...updates }
    );
    return result;
  },

  /**
   * Delete learning outcome
   */
  async deleteOutcome(id: string): Promise<void> {
    await apiPost('/college-admin/curriculum', { action: 'delete-outcome', id });
  },

  /**
   * Approve curriculum - For private colleges only
   */
  async approveCurriculum(id: string): Promise<void> {
    await apiPost('/college-admin/curriculum', { action: 'approve-curriculum', id });
  },

  /**
   * Publish curriculum (make it active) - For private colleges only
   */
  async publishCurriculum(id: string): Promise<void> {
    await apiPost('/college-admin/curriculum', { action: 'publish-curriculum', id });
  },

  /**
   * Clone curriculum from another academic year/semester
   */
  async cloneCurriculum(sourceId: string, targetData: {
    academic_year: string;
    semester?: number;
    department_id?: string;
    program_id?: string;
  }): Promise<CollegeCurriculum> {
    const { data: result } = await apiPost<{ data: CollegeCurriculum }>(
      '/college-admin/curriculum',
      { action: 'clone-curriculum', source_id: sourceId, ...targetData }
    );
    return result;
  },

  /**
   * Export curriculum data in different formats
   */
  async exportCurriculum(id: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<any> {
    const curriculum = await this.getCurriculumById(id);

    if (format === 'csv') {
      // Format for CSV export
      const csvData = [];

      // Header
      csvData.push([
        'Unit Order',
        'Unit Name',
        'Unit Code',
        'Unit Description',
        'Credits',
        'Duration',
        'Learning Outcome',
        'Bloom Level',
        'Assessment Types'
      ]);

      // Data rows
      curriculum.units.forEach(unit => {
        const unitOutcomes = curriculum.outcomes.filter(outcome => outcome.unit_id === unit.id);

        if (unitOutcomes.length === 0) {
          // Unit without outcomes
          csvData.push([
            unit.order_index,
            unit.name,
            unit.code || '',
            unit.description,
            unit.credits || '',
            unit.estimated_duration ? `${unit.estimated_duration} ${unit.duration_unit || 'hours'}` : '',
            '',
            '',
            ''
          ]);
        } else {
          // Unit with outcomes
          unitOutcomes.forEach((outcome, index) => {
            const assessmentTypes = outcome.assessment_mappings
              .map((m: any) => `${m.assessmentType}${m.weightage ? ` (${m.weightage}%)` : ''}`)
              .join('; ');

            csvData.push([
              index === 0 ? unit.order_index : '',
              index === 0 ? unit.name : '',
              index === 0 ? (unit.code || '') : '',
              index === 0 ? unit.description : '',
              index === 0 ? (unit.credits || '') : '',
              index === 0 ? (unit.estimated_duration ? `${unit.estimated_duration} ${unit.duration_unit || 'hours'}` : '') : '',
              outcome.outcome_text,
              outcome.bloom_level || '',
              assessmentTypes
            ]);
          });
        }
      });

      return { format: 'csv', content: csvData };
    }

    // Default JSON format
    const exportData = {
      curriculum: {
        course_code: curriculum.course_code,
        course_name: curriculum.course_name,
        department: curriculum.department_name,
        program: curriculum.program_name,
        semester: curriculum.semester,
        academic_year: curriculum.academic_year,
        status: curriculum.status,
        created_at: curriculum.created_at,
      },
      units: curriculum.units.map(unit => ({
        name: unit.name,
        code: unit.code,
        description: unit.description,
        credits: unit.credits,
        estimated_duration: unit.estimated_duration,
        duration_unit: unit.duration_unit,
        order: unit.order_index,
      })),
      learning_outcomes: curriculum.outcomes.map(outcome => ({
        unit_name: curriculum.units.find(u => u.id === outcome.unit_id)?.name,
        outcome_text: outcome.outcome_text,
        bloom_level: outcome.bloom_level,
        assessment_mappings: outcome.assessment_mappings,
      })),
      export_metadata: {
        exported_at: new Date().toISOString(),
        total_units: curriculum.units.length,
        total_outcomes: curriculum.outcomes.length,
        total_credits: curriculum.units.reduce((sum, unit) => sum + (unit.credits || 0), 0),
      }
    };

    return exportData;
  },

  /**
   * Get curriculums available for cloning
   */
  async getCurriculumsForCloning(filters: {
    department_id?: string;
    program_id?: string;
    course_code?: string;
    exclude_academic_year?: string;
  } = {}): Promise<CurriculumWithDetails[]> {
    const { data: result } = await apiPost<{ data: CurriculumWithDetails[] }>(
      '/college-admin/curriculum',
      { action: 'get-curriculums-for-cloning', ...filters }
    );
    return result;
  },

  /**
   * Get departments for current user's college
   */
  async getDepartments(): Promise<any[]> {
    const { data: result } = await apiPost<{ data: any[] }>(
      '/college-admin/curriculum',
      { action: 'get-departments' }
    );
    return result;
  },

  /**
   * Get programs for a department
   */
  async getPrograms(departmentId?: string): Promise<any[]> {
    const { data: result } = await apiPost<{ data: any[] }>(
      '/college-admin/curriculum',
      { action: 'get-programs', department_id: departmentId }
    );
    return result;
  },

  /**
   * Get courses for a specific program and semester
   */
  async getCourses(programId: string, semester: number): Promise<any[]> {
    const { data: result } = await apiPost<{ data: any[] }>(
      '/college-admin/curriculum',
      { action: 'get-courses', program_id: programId, semester }
    );
    return result;
  },

  /**
   * Get available semesters for a program
   */
  async getSemesters(programId: string): Promise<number[]> {
    const { data: result } = await apiPost<{ data: number[] }>(
      '/college-admin/curriculum',
      { action: 'get-semesters', program_id: programId }
    );
    return result;
  },

  /**
   * Get assessment types for current user's college
   */
  async getAssessmentTypes(): Promise<any[]> {
    const { data: result } = await apiPost<{ data: any[] }>(
      '/college-admin/curriculum',
      { action: 'get-assessment-types' }
    );
    return result;
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
