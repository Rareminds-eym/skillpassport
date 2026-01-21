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

// Get current user's college ID
async function getCurrentUserCollegeId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ No authenticated user found');
    return null;
  }

  console.log(`🔍 Getting college ID for user: ${user.email}`);

  // First try to get from users table (for college admins)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organizationId, role')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('❌ Error fetching user data:', userError);
    return null;
  }

  if (userData?.organizationId && userData?.role === 'college_admin') {
    console.log(`✅ Found college ID from users table: ${userData.organizationId}`);
    return userData.organizationId;
  }

  // Fallback: try college_lecturers table (for lecturers)
  const { data: lecturer, error: lecturerError } = await supabase
    .from('college_lecturers')
    .select('collegeId')
    .eq('user_id', user.id)
    .single();

  if (lecturerError) {
    console.log('ℹ️ User not found in college_lecturers table (this is normal for college admins)');
  }

  const collegeId = lecturer?.collegeId || null;

  if (collegeId) {
    console.log(`✅ Found college ID from college_lecturers table: ${collegeId}`);
  } else {
    console.log('❌ No college ID found for user');
  }

  return collegeId;
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
  }): Promise<{ success: boolean; data?: CollegeCurriculum; error?: any }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } };
      }

      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      // Create curriculum
      const { data: curriculum, error } = await supabase
        .from('college_curriculums')
        .insert([
          {
            college_id: collegeId,
            department_id: data.department_id,
            program_id: data.program_id,
            course_id: data.course_id,
            academic_year: data.academic_year,
            status: 'draft',
            created_by: user.id,
          },
        ])
        .select(
          `
          *,
          course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
        `
        )
        .single();

      if (error) throw error;

      // Get semester from course mapping (separate query)
      const { data: mapping } = await supabase
        .from('college_course_mappings')
        .select('semester')
        .eq('program_id', data.program_id)
        .eq('course_id', data.course_id)
        .limit(1); // Get first result instead of .single()

      // Flatten the response
      const result = {
        ...curriculum,
        course_code: curriculum.course?.course_code,
        course_name: curriculum.course?.course_name,
        semester: mapping?.[0]?.semester, // Access first element
      };

      return { success: true, data: result };
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
  async getCurriculumById(
    id: string
  ): Promise<{ success: boolean; data?: CurriculumWithDetails; error?: any }> {
    try {
      console.log(`🔍 Fetching curriculum with ID: ${id}`);

      // Get curriculum with department, program names, and course details
      const { data: curriculum, error: curriculumError } = await supabase
        .from('college_curriculums')
        .select(
          `
          *,
          departments!inner(name),
          programs!inner(name),
          course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
        `
        )
        .eq('id', id)
        .single();

      if (curriculumError) {
        console.error('❌ Error fetching curriculum:', curriculumError);
        throw curriculumError;
      }

      console.log(`✅ Curriculum fetched - Status: ${curriculum.status}`);

      // Get semester from course mapping
      const { data: mapping } = await supabase
        .from('college_course_mappings')
        .select('semester')
        .eq('program_id', curriculum.program_id)
        .eq('course_id', curriculum.course_id)
        .limit(1); // Get first result instead of .single()

      // Get units
      const { data: units, error: unitsError } = await supabase
        .from('college_curriculum_units')
        .select('*')
        .eq('curriculum_id', id)
        .order('order_index');

      if (unitsError) {
        console.error('❌ Error fetching units:', unitsError);
        throw unitsError;
      }

      console.log(`✅ Units fetched: ${units?.length || 0} units`);

      // Get outcomes
      const { data: outcomes, error: outcomesError } = await supabase
        .from('college_curriculum_outcomes')
        .select('*')
        .eq('curriculum_id', id);

      if (outcomesError) {
        console.error('❌ Error fetching outcomes:', outcomesError);
        throw outcomesError;
      }

      console.log(`✅ Outcomes fetched: ${outcomes?.length || 0} outcomes`);

      const result: CurriculumWithDetails = {
        ...curriculum,
        course_code: curriculum.course?.course_code,
        course_name: curriculum.course?.course_name,
        semester: mapping?.[0]?.semester,
        units: units || [],
        outcomes: outcomes || [],
        department_name: curriculum.departments?.name,
        program_name: curriculum.programs?.name,
      };

      return { success: true, data: result };
    } catch (error: any) {
      console.error('❌ Error in getCurriculumById:', error);
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
  async getCurriculums(
    filters: {
      department_id?: string;
      program_id?: string;
      semester?: number;
      academic_year?: string;
      status?: string;
      course_id?: string;
    } = {}
  ): Promise<{ success: boolean; data?: CurriculumWithDetails[]; error?: any }> {
    try {
      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      let query = supabase
        .from('college_curriculums')
        .select(
          `
          *,
          departments!inner(name),
          programs!inner(name),
          course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
        `
        )
        .eq('college_id', collegeId);

      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.program_id) query = query.eq('program_id', filters.program_id);
      if (filters.academic_year) query = query.eq('academic_year', filters.academic_year);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.course_id) query = query.eq('course_id', filters.course_id);

      const { data: curriculums, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!curriculums || curriculums.length === 0) {
        return { success: true, data: [] };
      }

      // Get semester information for curriculums (separate query)
      const coursePrograms = curriculums.map((c) => ({
        course_id: c.course_id,
        program_id: c.program_id,
      }));

      let mappings: any[] = [];
      if (coursePrograms.length > 0) {
        const { data: mappingData } = await supabase
          .from('college_course_mappings')
          .select('course_id, program_id, semester');

        mappings = mappingData || [];
      }

      // Transform data and add semester information
      let result: CurriculumWithDetails[] = curriculums.map((curriculum) => {
        // Find ALL mappings for this course-program combination
        const allMappings = mappings.filter(
          (m) => m.program_id === curriculum.program_id && m.course_id === curriculum.course_id
        );

        // If semester filter is specified, find the mapping for that semester
        let selectedMapping;
        if (filters.semester !== undefined) {
          selectedMapping = allMappings.find((m) => m.semester === filters.semester);
        } else {
          // If no semester filter, use the first mapping
          selectedMapping = allMappings[0];
        }

        return {
          ...curriculum,
          course_code: curriculum.course?.course_code,
          course_name: curriculum.course?.course_name,
          semester: selectedMapping?.semester,
          units: [],
          outcomes: [],
          department_name: curriculum.departments?.name,
          program_name: curriculum.programs?.name,
        };
      });

      // Apply semester filter - only include curriculums that have a mapping for the requested semester
      if (filters.semester !== undefined) {
        result = result.filter((curriculum) => curriculum.semester === filters.semester);
      }

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
  async updateCurriculum(
    id: string,
    updates: Partial<CollegeCurriculum>
  ): Promise<{ success: boolean; data?: CollegeCurriculum; error?: any }> {
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
        .insert([
          {
            ...data,
            order_index: nextOrder,
          },
        ])
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
  async updateUnit(
    id: string,
    updates: Partial<CurriculumUnit>
  ): Promise<{ success: boolean; data?: CurriculumUnit; error?: any }> {
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
      const { error } = await supabase.from('college_curriculum_units').delete().eq('id', id);

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
  async updateOutcome(
    id: string,
    updates: Partial<CurriculumOutcome>
  ): Promise<{ success: boolean; data?: CurriculumOutcome; error?: any }> {
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
      const { error } = await supabase.from('college_curriculum_outcomes').delete().eq('id', id);

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
   * Approve curriculum - For private colleges only
   */
  async approveCurriculum(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } };
      }

      // Check if college is affiliated (should not allow direct approval for affiliated colleges)
      const { data: curriculum, error: fetchError } = await supabase
        .from('college_curriculums')
        .select('status, college_id, university_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (curriculum.university_id) {
        return {
          success: false,
          error: {
            code: 'AFFILIATED_COLLEGE',
            message:
              'Affiliated colleges cannot directly approve curriculum. Please request approval from your university.',
          },
        };
      }

      // Validate that curriculum has units and outcomes
      const { data: units } = await supabase
        .from('college_curriculums')
        .select('units')
        .eq('id', id)
        .single();

      if (!units || !units.units || units.units.length === 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Curriculum must have at least one unit before approval',
          },
        };
      }

      const { data: outcomes } = await supabase
        .from('college_curriculums')
        .select('outcomes')
        .eq('id', id)
        .single();

      if (!outcomes || !outcomes.outcomes || outcomes.outcomes.length === 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Curriculum must have at least one learning outcome before approval',
          },
        };
      }

      const { error } = await supabase
        .from('college_curriculums')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          review_date: new Date().toISOString(),
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
   * Publish curriculum (make it active) - For private colleges only
   */
  async publishCurriculum(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } };
      }

      // Check if curriculum is approved and college affiliation
      const { data: curriculum, error: fetchError } = await supabase
        .from('college_curriculums')
        .select('status, college_id, university_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Check curriculum status
      if (curriculum.status !== 'approved') {
        // If affiliated college and not approved, suggest requesting approval
        if (curriculum.university_id) {
          return {
            success: false,
            error: {
              code: 'REQUIRES_APPROVAL',
              message:
                'This curriculum requires university approval before publishing. Please request approval first.',
            },
          };
        }

        // For autonomous colleges, they can publish without approval
        return {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'Only approved curriculums can be published',
          },
        };
      }

      const { error } = await supabase
        .from('college_curriculums')
        .update({
          status: 'published',
          published_date: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
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
   * Clone curriculum from another academic year/semester
   */
  async cloneCurriculum(
    sourceId: string,
    targetData: {
      academic_year: string;
      semester?: number;
      department_id?: string;
      program_id?: string;
    }
  ): Promise<{ success: boolean; data?: CollegeCurriculum; error?: any }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } };
      }

      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      // Get source curriculum with units and outcomes
      const sourceResult = await this.getCurriculumById(sourceId);
      if (!sourceResult.success || !sourceResult.data) {
        return { success: false, error: { message: 'Source curriculum not found' } };
      }

      const source = sourceResult.data;

      // Create new curriculum
      const { data: newCurriculum, error: curriculumError } = await supabase
        .from('college_curriculums')
        .insert([
          {
            college_id: collegeId,
            department_id: targetData.department_id || source.department_id,
            program_id: targetData.program_id || source.program_id,
            course_id: source.course_id,
            academic_year: targetData.academic_year,
            status: 'draft',
            created_by: user.id,
            cloned_from_id: sourceId,
            version: 1,
          },
        ])
        .select(
          `
          *,
          course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
        `
        )
        .single();

      if (curriculumError) throw curriculumError;

      // Clone units
      const unitMapping: Record<string, string> = {};
      for (const unit of source.units) {
        const { data: newUnit, error: unitError } = await supabase
          .from('college_curriculum_units')
          .insert([
            {
              curriculum_id: newCurriculum.id,
              name: unit.name,
              code: unit.code,
              description: unit.description,
              credits: unit.credits,
              estimated_duration: unit.estimated_duration,
              duration_unit: unit.duration_unit,
              order_index: unit.order_index,
            },
          ])
          .select()
          .single();

        if (unitError) throw unitError;
        unitMapping[unit.id] = newUnit.id;
      }

      // Clone outcomes
      for (const outcome of source.outcomes) {
        const newUnitId = unitMapping[outcome.unit_id];
        if (newUnitId) {
          const { error: outcomeError } = await supabase
            .from('college_curriculum_outcomes')
            .insert([
              {
                curriculum_id: newCurriculum.id,
                unit_id: newUnitId,
                outcome_text: outcome.outcome_text,
                bloom_level: outcome.bloom_level,
                assessment_mappings: outcome.assessment_mappings,
              },
            ]);

          if (outcomeError) throw outcomeError;
        }
      }

      // Add course details to response
      const result = {
        ...newCurriculum,
        course_code: newCurriculum.course?.course_code,
        course_name: newCurriculum.course?.course_name,
      };

      return { success: true, data: result };
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
   * Export curriculum data in different formats
   */
  async exportCurriculum(
    id: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const result = await this.getCurriculumById(id);
      if (!result.success || !result.data) {
        return { success: false, error: { message: 'Curriculum not found' } };
      }

      const curriculum = result.data;

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
          'Assessment Types',
        ]);

        // Data rows
        curriculum.units.forEach((unit) => {
          const unitOutcomes = curriculum.outcomes.filter((outcome) => outcome.unit_id === unit.id);

          if (unitOutcomes.length === 0) {
            // Unit without outcomes
            csvData.push([
              unit.order_index,
              unit.name,
              unit.code || '',
              unit.description,
              unit.credits || '',
              unit.estimated_duration
                ? `${unit.estimated_duration} ${unit.duration_unit || 'hours'}`
                : '',
              '',
              '',
              '',
            ]);
          } else {
            // Unit with outcomes
            unitOutcomes.forEach((outcome, index) => {
              const assessmentTypes = outcome.assessment_mappings
                .map((m: any) => `${m.assessmentType}${m.weightage ? ` (${m.weightage}%)` : ''}`)
                .join('; ');

              csvData.push([
                index === 0 ? unit.order_index : '', // Only show unit details on first row
                index === 0 ? unit.name : '',
                index === 0 ? unit.code || '' : '',
                index === 0 ? unit.description : '',
                index === 0 ? unit.credits || '' : '',
                index === 0
                  ? unit.estimated_duration
                    ? `${unit.estimated_duration} ${unit.duration_unit || 'hours'}`
                    : ''
                  : '',
                outcome.outcome_text,
                outcome.bloom_level || '',
                assessmentTypes,
              ]);
            });
          }
        });

        return { success: true, data: { format: 'csv', content: csvData } };
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
        units: curriculum.units.map((unit) => ({
          name: unit.name,
          code: unit.code,
          description: unit.description,
          credits: unit.credits,
          estimated_duration: unit.estimated_duration,
          duration_unit: unit.duration_unit,
          order: unit.order_index,
        })),
        learning_outcomes: curriculum.outcomes.map((outcome) => ({
          unit_name: curriculum.units.find((u) => u.id === outcome.unit_id)?.name,
          outcome_text: outcome.outcome_text,
          bloom_level: outcome.bloom_level,
          assessment_mappings: outcome.assessment_mappings,
        })),
        export_metadata: {
          exported_at: new Date().toISOString(),
          total_units: curriculum.units.length,
          total_outcomes: curriculum.outcomes.length,
          total_credits: curriculum.units.reduce((sum, unit) => sum + (unit.credits || 0), 0),
        },
      };

      return { success: true, data: exportData };
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

  /**
   * Get curriculums available for cloning
   */
  async getCurriculumsForCloning(
    filters: {
      department_id?: string;
      program_id?: string;
      course_code?: string;
      exclude_academic_year?: string;
    } = {}
  ): Promise<{ success: boolean; data?: CurriculumWithDetails[]; error?: any }> {
    try {
      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      let query = supabase
        .from('college_curriculums')
        .select(
          `
          *,
          departments!inner(name),
          programs!inner(name)
        `
        )
        .eq('college_id', collegeId)
        .in('status', ['published', 'approved']); // Only allow cloning from published/approved curriculums

      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.program_id) query = query.eq('program_id', filters.program_id);
      if (filters.course_code) query = query.eq('course_code', filters.course_code);
      if (filters.exclude_academic_year)
        query = query.neq('academic_year', filters.exclude_academic_year);

      const { data: curriculums, error } = await query.order('academic_year', { ascending: false });

      if (error) throw error;

      // Transform data
      const result: CurriculumWithDetails[] = (curriculums || []).map((curriculum) => ({
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
          message: error.message || 'Failed to fetch curriculums for cloning',
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
  async getPrograms(
    departmentId?: string
  ): Promise<{ success: boolean; data?: any[]; error?: any }> {
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
  async getCourses(
    programId: string,
    semester: number
  ): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('college_course_mappings')
        .select(
          `
          id, 
          offering_type,
          course:college_courses(
            id,
            course_code, 
            course_name, 
            credits,
            course_type
          )
        `
        )
        .eq('program_id', programId)
        .eq('semester', semester);

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = (data || []).map((mapping) => ({
        // @ts-expect-error - Auto-suppressed for migration
        id: mapping.course?.id, // Use the actual course ID, not the mapping ID
        mapping_id: mapping.id, // Keep mapping ID for reference
        // @ts-expect-error - Auto-suppressed for migration
        course_code: mapping.course?.course_code,
        // @ts-expect-error - Auto-suppressed for migration
        course_name: mapping.course?.course_name,
        // @ts-expect-error - Auto-suppressed for migration
        credits: mapping.course?.credits,
        type: mapping.offering_type,
        // @ts-expect-error - Auto-suppressed for migration
        course_type: mapping.course?.course_type,
      }));

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
   * Get available semesters for a program
   */
  async getSemesters(
    programId: string
  ): Promise<{ success: boolean; data?: number[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('college_course_mappings')
        .select('semester')
        .eq('program_id', programId)
        .order('semester');

      if (error) throw error;

      // Get unique semesters
      const uniqueSemesters = [...new Set((data || []).map((item) => item.semester))];

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
   * Get assessment types for current user's college
   */
  async getAssessmentTypes(): Promise<{ success: boolean; data?: any[]; error?: any }> {
    try {
      const collegeId = await getCurrentUserCollegeId();
      if (!collegeId) {
        return { success: false, error: { message: 'Unable to determine user college' } };
      }

      // Get college-specific and global assessment types
      const { data, error } = await supabase
        .from('assessment_types')
        .select('id, name, description, is_active, institution_id, institution_type')
        .or(
          `and(institution_id.eq.${collegeId},institution_type.eq.college),institution_id.is.null`
        )
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
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

        if (collegeError && globalError) {
          throw new Error('Failed to fetch assessment types');
        }

        const combinedData = [...(collegeTypes || []), ...(globalTypes || [])].sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        return { success: true, data: combinedData };
      } catch (fallbackError: any) {
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
