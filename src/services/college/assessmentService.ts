import { supabase } from '../../lib/supabaseClient';
import type { Assessment, ExamSlot, Conflict, ApiResponse } from '../../types/college';

/**
 * Assessment and Timetable Service
 * Handles assessment creation, timetable scheduling, and conflict detection
 */

export const assessmentService = {
  /**
   * Create assessment
   * Property 17: Assessment mandatory fields validation
   */
  async createAssessment(data: Partial<Assessment>): Promise<ApiResponse<Assessment>> {
    try {
      // Validate mandatory fields
      const requiredFields = [
        'type',
        'academic_year',
        'department_id',
        'program_id',
        'semester',
        'course_id',
        'duration_minutes',
        'total_marks',
        'pass_marks',
      ];

      for (const field of requiredFields) {
        if (!data[field as keyof Assessment]) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Required field missing: ${field}`,
              field,
            },
          };
        }
      }

      const { data: assessment, error } = await supabase
        .from('assessments')
        .insert([{ ...data, status: 'draft' }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: assessment };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create assessment',
        },
      };
    }
  },

  /**
   * Update assessment
   */
  async updateAssessment(
    id: string,
    updates: Partial<Assessment>
  ): Promise<ApiResponse<Assessment>> {
    try {
      const { data, error } = await supabase
        .from('assessments')
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
          message: error.message || 'Failed to update assessment',
        },
      };
    }
  },

  /**
   * Submit to exam cell
   */
  async submitToExamCell(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ status: 'scheduled' })
        .eq('id', id);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SUBMIT_ERROR',
          message: error.message || 'Failed to submit assessment',
        },
      };
    }
  },

  /**
   * Approve assessment
   */
  async approveAssessment(id: string, approvedBy: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('assessments')
        .update({ approved_by: approvedBy })
        .eq('id', id);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message: error.message || 'Failed to approve assessment',
        },
      };
    }
  },

  /**
   * Get assessments with filters
   */
  async getAssessments(filters: {
    type?: string;
    academic_year?: string;
    department_id?: string;
    program_id?: string;
    semester?: number;
    status?: string;
  }): Promise<ApiResponse<Assessment[]>> {
    try {
      let query = supabase.from('assessments').select('*');

      if (filters.type) query = query.eq('type', filters.type);
      if (filters.academic_year) query = query.eq('academic_year', filters.academic_year);
      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.program_id) query = query.eq('program_id', filters.program_id);
      if (filters.semester) query = query.eq('semester', filters.semester);
      if (filters.status) query = query.eq('status', filters.status);

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch assessments',
        },
      };
    }
  },
};

export const timetableService = {
  /**
   * Create exam slot
   */
  async createExamSlot(data: Partial<ExamSlot>): Promise<ApiResponse<ExamSlot>> {
    try {
      const { data: slot, error } = await supabase
        .from('exam_timetable')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: slot };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error.message || 'Failed to create exam slot',
        },
      };
    }
  },

  /**
   * Detect conflicts in timetable
   * Property 18: Timetable conflict detection
   */
  async detectConflicts(slots: ExamSlot[]): Promise<ApiResponse<Conflict[]>> {
    try {
      const conflicts: Conflict[] = [];

      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const slot1 = slots[i];
          const slot2 = slots[j];

          // Check if same date
          if (slot1.exam_date !== slot2.exam_date) continue;

          // Check time overlap
          const start1 = new Date(`${slot1.exam_date}T${slot1.start_time}`);
          const end1 = new Date(`${slot1.exam_date}T${slot1.end_time}`);
          const start2 = new Date(`${slot2.exam_date}T${slot2.start_time}`);
          const end2 = new Date(`${slot2.exam_date}T${slot2.end_time}`);

          const hasTimeOverlap = start1 < end2 && end1 > start2;

          if (!hasTimeOverlap) continue;

          // Check room conflict
          if (slot1.room && slot2.room && slot1.room === slot2.room) {
            conflicts.push({
              type: 'room',
              slot1,
              slot2,
              message: `Room ${slot1.room} is double-booked`,
            });
          }

          // Check batch conflict
          if (
            slot1.batch_section &&
            slot2.batch_section &&
            slot1.batch_section === slot2.batch_section
          ) {
            conflicts.push({
              type: 'student_batch',
              slot1,
              slot2,
              message: `Batch ${slot1.batch_section} has overlapping exams`,
            });
          }

          // Check faculty conflict
          const commonInvigilators = slot1.invigilators?.filter((inv) =>
            slot2.invigilators?.includes(inv)
          );
          if (commonInvigilators && commonInvigilators.length > 0) {
            conflicts.push({
              type: 'faculty',
              slot1,
              slot2,
              message: `Faculty member is assigned to multiple exams at the same time`,
            });
          }
        }
      }

      return { success: true, data: conflicts };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CONFLICT_DETECTION_ERROR',
          message: error.message || 'Failed to detect conflicts',
        },
      };
    }
  },

  /**
   * Assign invigilator to exam slot
   * Property 19: Invigilator availability check
   */
  async assignInvigilator(slotId: string, facultyId: string): Promise<ApiResponse<void>> {
    try {
      // Get the slot details
      const { data: slot, error: fetchError } = await supabase
        .from('exam_timetable')
        .select('*')
        .eq('id', slotId)
        .single();

      if (fetchError) throw fetchError;

      // Check if faculty is already assigned to another exam at the same time
      const { data: conflictingSlots, error: conflictError } = await supabase
        .from('exam_timetable')
        .select('*')
        .eq('exam_date', slot.exam_date)
        .contains('invigilators', [facultyId])
        .neq('id', slotId);

      if (conflictError) throw conflictError;

      // Check for time overlap
      if (conflictingSlots && conflictingSlots.length > 0) {
        for (const conflictSlot of conflictingSlots) {
          const start1 = new Date(`${slot.exam_date}T${slot.start_time}`);
          const end1 = new Date(`${slot.exam_date}T${slot.end_time}`);
          const start2 = new Date(`${conflictSlot.exam_date}T${conflictSlot.start_time}`);
          const end2 = new Date(`${conflictSlot.exam_date}T${conflictSlot.end_time}`);

          if (start1 < end2 && end1 > start2) {
            return {
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'Faculty member is already assigned to another exam at this time',
              },
            };
          }
        }
      }

      // Add faculty to invigilators array
      const updatedInvigilators = [...(slot.invigilators || []), facultyId];

      const { error } = await supabase
        .from('exam_timetable')
        .update({ invigilators: updatedInvigilators })
        .eq('id', slotId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ASSIGN_ERROR',
          message: error.message || 'Failed to assign invigilator',
        },
      };
    }
  },

  /**
   * Publish timetable
   */
  async publishTimetable(assessmentId: string): Promise<ApiResponse<void>> {
    try {
      // Get all slots for this assessment
      const { data: slots, error: fetchError } = await supabase
        .from('exam_timetable')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (fetchError) throw fetchError;

      // Check for conflicts
      const conflictResult = await this.detectConflicts(slots || []);
      if (!conflictResult.success) {
        return conflictResult as ApiResponse<void>;
      }

      if (conflictResult.data.length > 0) {
        return {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Cannot publish timetable with ${conflictResult.data.length} conflicts`,
            details: conflictResult.data,
          },
        };
      }

      // Update assessment status
      const { error } = await supabase
        .from('assessments')
        .update({ status: 'ongoing' })
        .eq('id', assessmentId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'PUBLISH_ERROR',
          message: error.message || 'Failed to publish timetable',
        },
      };
    }
  },

  /**
   * Get exam slots for assessment
   */
  async getExamSlots(assessmentId: string): Promise<ApiResponse<ExamSlot[]>> {
    try {
      const { data, error } = await supabase
        .from('exam_timetable')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch exam slots',
        },
      };
    }
  },
};
