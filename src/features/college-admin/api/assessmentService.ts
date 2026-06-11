import { apiPost } from '@/shared/api/apiClient';
import type { Assessment, ExamSlot, Conflict, ApiResponse } from '@/shared/types/college';

export const assessmentService = {
  async createAssessment(data: Partial<Assessment>): Promise<ApiResponse<Assessment>> {
    try {
      const requiredFields = ['type', 'academic_year', 'department_id', 'program_id', 'semester', 'course_id', 'duration_minutes', 'total_marks', 'pass_marks'];
      for (const field of requiredFields) {
        if (!data[field as keyof Assessment]) {
          return { success: false, error: { code: 'VALIDATION_ERROR', message: `Required field missing: ${field}`, field } };
        }
      }
      const result: any = await apiPost('/college-admin/assessments', { action: 'create-assessment', ...data });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'CREATE_ERROR', message: error?.message || error?.error?.message || 'Failed to create assessment' } };
    }
  },

  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<ApiResponse<Assessment>> {
    try {
      const result: any = await apiPost('/college-admin/assessments', { action: 'update-assessment', id, ...updates });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'UPDATE_ERROR', message: error?.message || error?.error?.message || 'Failed to update assessment' } };
    }
  },

  async submitToExamCell(id: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/assessments', { action: 'submit-to-exam-cell', id });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'SUBMIT_ERROR', message: error?.message || error?.error?.message || 'Failed to submit assessment' } };
    }
  },

  async approveAssessment(id: string, approvedBy: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/assessments', { action: 'approve-assessment', id, approved_by: approvedBy });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'APPROVE_ERROR', message: error?.message || error?.error?.message || 'Failed to approve assessment' } };
    }
  },

  async getAssessments(filters: { type?: string; academic_year?: string; department_id?: string; program_id?: string; semester?: number; status?: string; }): Promise<ApiResponse<Assessment[]>> {
    try {
      const result: any = await apiPost('/college-admin/assessments', { action: 'get-assessments', ...filters });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'FETCH_ERROR', message: error?.message || error?.error?.message || 'Failed to fetch assessments' } };
    }
  },
};

export const timetableService = {
  async createExamSlot(data: Partial<ExamSlot>): Promise<ApiResponse<ExamSlot>> {
    try {
      const result: any = await apiPost('/college-admin/assessments', { action: 'create-exam-slot', ...data });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'CREATE_ERROR', message: error?.message || error?.error?.message || 'Failed to create exam slot' } };
    }
  },

  async detectConflicts(slots: ExamSlot[]): Promise<ApiResponse<Conflict[]>> {
    try {
      const conflicts: Conflict[] = [];
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const slot1 = slots[i];
          const slot2 = slots[j];
          if (slot1.exam_date !== slot2.exam_date) continue;
          const start1 = new Date(`${slot1.exam_date}T${slot1.start_time}`);
          const end1 = new Date(`${slot1.exam_date}T${slot1.end_time}`);
          const start2 = new Date(`${slot2.exam_date}T${slot2.start_time}`);
          const end2 = new Date(`${slot2.exam_date}T${slot2.end_time}`);
          const hasTimeOverlap = (start1 < end2 && end1 > start2);
          if (!hasTimeOverlap) continue;
          if (slot1.room && slot2.room && slot1.room === slot2.room) {
            conflicts.push({ type: 'room', slot1, slot2, message: `Room ${slot1.room} is double-booked` });
          }
          if (slot1.batch_section && slot2.batch_section && slot1.batch_section === slot2.batch_section) {
            conflicts.push({ type: 'learner_batch', slot1, slot2, message: `Batch ${slot1.batch_section} has overlapping exams` });
          }
          const commonInvigilators = slot1.invigilators?.filter(inv => slot2.invigilators?.includes(inv));
          if (commonInvigilators && commonInvigilators.length > 0) {
            conflicts.push({ type: 'faculty', slot1, slot2, message: 'Faculty member is assigned to multiple exams at the same time' });
          }
        }
      }
      return { success: true, data: conflicts };
    } catch (error: any) {
      return { success: false, error: { code: 'CONFLICT_DETECTION_ERROR', message: error.message || 'Failed to detect conflicts' } };
    }
  },

  async assignInvigilator(slotId: string, facultyId: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/assessments', { action: 'assign-invigilator', slot_id: slotId, faculty_id: facultyId });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'ASSIGN_ERROR', message: error?.message || error?.error?.message || 'Failed to assign invigilator' } };
    }
  },

  async publishTimetable(assessmentId: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/assessments', { action: 'publish-timetable', assessment_id: assessmentId });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'PUBLISH_ERROR', message: error?.message || error?.error?.message || 'Failed to publish timetable' } };
    }
  },

  async getExamSlots(assessmentId: string): Promise<ApiResponse<ExamSlot[]>> {
    try {
      const result: any = await apiPost('/college-admin/assessments', { action: 'get-exam-slots', assessment_id: assessmentId });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'FETCH_ERROR', message: error?.message || error?.error?.message || 'Failed to fetch exam slots' } };
    }
  },
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadInstructionFile(file: File, assignmentId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${assignmentId}_${Date.now()}.${fileExt}`;
    const filePath = `assignment-instructions/${fileName}`;
    const base64 = await fileToBase64(file);
    const result: any = await apiPost('/college-admin/storage', {
      action: 'upload',
      bucket: 'assignment-files',
      path: filePath,
      file_base64: base64,
      content_type: file.type || 'application/octet-stream',
    });
    return { success: true, url: result?.data?.publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to upload file' };
  }
}

export async function deleteInstructionFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiPost('/college-admin/storage', {
      action: 'delete',
      bucket: 'assignment-files',
      path: filePath,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete file' };
  }
}
