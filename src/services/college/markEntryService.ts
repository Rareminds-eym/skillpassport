import { supabase } from '../../lib/supabaseClient';
import type { MarkEntry, GradingScale, ApiResponse, BulkImportResult } from '../../types/college';

/**
 * Mark Entry Service
 * Handles mark entry, moderation, and grade calculation
 */

export const markEntryService = {
  /**
   * Enter marks for students
   * Property 20: Marks range validation
   */
  async enterMarks(entries: Partial<MarkEntry>[]): Promise<ApiResponse<MarkEntry[]>> {
    try {
      const validatedEntries: Partial<MarkEntry>[] = [];
      const errors: any[] = [];

      for (const entry of entries) {
        // Get assessment details for validation
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('total_marks')
          .eq('id', entry.assessment_id)
          .single();

        if (assessmentError) {
          errors.push({
            student_id: entry.student_id,
            message: 'Assessment not found',
          });
          continue;
        }

        // Validate marks range
        if (entry.marks_obtained !== undefined && 
            (entry.marks_obtained < 0 || entry.marks_obtained > assessment.total_marks)) {
          errors.push({
            student_id: entry.student_id,
            message: `Marks must be between 0 and ${assessment.total_marks}`,
          });
          continue;
        }

        validatedEntries.push(entry);
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some mark entries are invalid',
            details: errors,
          },
        };
      }

      const { data, error } = await supabase
        .from('mark_entries')
        .upsert(validatedEntries)
        .select();

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ENTRY_ERROR',
          message: error.message || 'Failed to enter marks',
        },
      };
    }
  },

  /**
   * Bulk upload marks from CSV
   */
  async bulkUploadMarks(assessmentId: string, csvData: any[]): Promise<ApiResponse<BulkImportResult>> {
    try {
      const result: BulkImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      const entries = csvData.map((row, index) => ({
        assessment_id: assessmentId,
        student_id: row.student_id,
        marks_obtained: parseFloat(row.marks_obtained),
        is_absent: row.is_absent === 'true' || row.is_absent === true,
        is_exempt: row.is_exempt === 'true' || row.is_exempt === true,
        remarks: row.remarks,
        entered_by: row.entered_by,
        rowNumber: index + 2,
      }));

      for (const entry of entries) {
        const { rowNumber, ...entryData } = entry;
        const entryResult = await this.enterMarks([entryData]);
        
        if (entryResult.success) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            field: 'marks',
            message: entryResult.error.message,
          });
        }
      }

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BULK_UPLOAD_ERROR',
          message: error.message || 'Failed to upload marks',
        },
      };
    }
  },

  /**
   * Submit marks for moderation
   * Property 21: Mark submission locks entry
   */
  async submitMarks(assessmentId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('mark_entries')
        .update({ is_locked: true })
        .eq('assessment_id', assessmentId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SUBMIT_ERROR',
          message: error.message || 'Failed to submit marks',
        },
      };
    }
  },

  /**
   * Lock marks (prevent further changes)
   */
  async lockMarks(assessmentId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('mark_entries')
        .update({ is_locked: true })
        .eq('assessment_id', assessmentId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOCK_ERROR',
          message: error.message || 'Failed to lock marks',
        },
      };
    }
  },

  /**
   * Moderate marks
   * Property 22: Moderation audit trail
   */
  async moderateMarks(
    entryId: string, 
    newMarks: number, 
    reason: string, 
    moderatedBy: string
  ): Promise<ApiResponse<void>> {
    try {
      if (!reason || reason.trim().length === 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Reason is required for mark moderation',
            field: 'reason',
          },
        };
      }

      const { error } = await supabase
        .from('mark_entries')
        .update({
          marks_obtained: newMarks,
          moderated_by: moderatedBy,
          moderation_reason: reason,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'MODERATION_ERROR',
          message: error.message || 'Failed to moderate marks',
        },
      };
    }
  },

  /**
   * Publish results
   */
  async publishResults(assessmentId: string): Promise<ApiResponse<void>> {
    try {
      // Update assessment status
      const { error: assessmentError } = await supabase
        .from('assessments')
        .update({ status: 'completed' })
        .eq('id', assessmentId);

      if (assessmentError) throw assessmentError;

      // Calculate grades for all entries
      const { data: entries, error: fetchError } = await supabase
        .from('mark_entries')
        .select('id, marks_obtained, assessment_id')
        .eq('assessment_id', assessmentId);

      if (fetchError) throw fetchError;

      // Get assessment total marks
      const { data: assessment } = await supabase
        .from('assessments')
        .select('total_marks')
        .eq('id', assessmentId)
        .single();

      if (!assessment) throw new Error('Assessment not found');

      // Calculate and update grades
      for (const entry of entries || []) {
        const percentage = (entry.marks_obtained / assessment.total_marks) * 100;
        const grade = this.calculateGradeFromPercentage(percentage);

        await supabase
          .from('mark_entries')
          .update({ grade })
          .eq('id', entry.id);
      }

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'PUBLISH_ERROR',
          message: error.message || 'Failed to publish results',
        },
      };
    }
  },

  /**
   * Calculate grade from marks
   * Property 23: Grade conversion consistency
   */
  calculateGradeFromPercentage(percentage: number): string {
    if (percentage >= 90) return 'O';
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B+';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    return 'F';
  },

  /**
   * Calculate grades based on grading scale
   */
  calculateGrades(marks: number, gradingScale: GradingScale[]): string {
    for (const scale of gradingScale) {
      if (marks >= scale.min_marks && marks <= scale.max_marks) {
        return scale.grade;
      }
    }
    return 'F';
  },

  /**
   * Update SGPA and CGPA for student
   */
  async updateSGPACGPA(studentId: string): Promise<ApiResponse<void>> {
    try {
      // Get all completed assessments for student
      const { data: entries, error } = await supabase
        .from('mark_entries')
        .select('grade, assessment_id')
        .eq('student_id', studentId)
        .not('grade', 'is', null);

      if (error) throw error;

      // Calculate SGPA/CGPA (simplified - would need course credits)
      // This is a placeholder implementation
      const gradePoints: { [key: string]: number } = {
        'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0
      };

      const totalPoints = entries?.reduce((sum, entry) => 
        sum + (gradePoints[entry.grade] || 0), 0
      ) || 0;

      const cgpa = entries && entries.length > 0 ? totalPoints / entries.length : 0;

      // Update student admission record
      const { error: updateError } = await supabase
        .from('student_admissions')
        .update({ cgpa: cgpa.toFixed(2) })
        .eq('user_id', studentId);

      if (updateError) throw updateError;

      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CGPA_UPDATE_ERROR',
          message: error.message || 'Failed to update SGPA/CGPA',
        },
      };
    }
  },

  /**
   * Get mark entries with filters
   */
  async getMarkEntries(filters: {
    assessment_id?: string;
    student_id?: string;
    is_locked?: boolean;
  }): Promise<ApiResponse<MarkEntry[]>> {
    try {
      let query = supabase.from('mark_entries').select('*');

      if (filters.assessment_id) query = query.eq('assessment_id', filters.assessment_id);
      if (filters.student_id) query = query.eq('student_id', filters.student_id);
      if (filters.is_locked !== undefined) query = query.eq('is_locked', filters.is_locked);

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message || 'Failed to fetch mark entries',
        },
      };
    }
  },
};
