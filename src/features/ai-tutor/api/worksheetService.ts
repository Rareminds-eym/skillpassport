import { apiPost } from '@/shared/api/apiClient';

export interface WorksheetVariant { difficulty: string; content: string }
export interface WorksheetContext { organization: { id: string; name: string }; gradeLevel: string; learnerCount: number }
export interface WorksheetLearner { id: string; name: string; school_class_id?: string; program_section_id?: string }
export interface AssignedWorksheet { id: string; title: string; difficulty: string; student_content: string; instructions: string; due_at: string | null; course_id: string }
export interface WorksheetDelivery { id: string; assigned_at: string; opened_at: string | null; worksheet: AssignedWorksheet }
export async function worksheetAction<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const response = await apiPost<{ data: T }>('/ai-tutor/worksheets', { action, ...params });
  return response.data;
}
