import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('examination-service');

export interface ExamWindow {
  id: string;
  window_name: string;
  window_code: string;
  academic_year: string;
  semester: 'Odd' | 'Even' | 'Summer' | '1' | '2';
  assessment_type_name: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  is_published: boolean;
  department_id?: string;
  program_id?: string;
  school_id?: string;
  college_id?: string;
}

export interface ExamRegistration {
  id: string;
  exam_window_id: string;
  learner_id: string;
  learner_name: string;
  roll_number: string;
  registration_number: string;
  registration_type: 'regular' | 'arrear' | 'improvement' | 'supplementary';
  registration_fee: number;
  late_fee: number;
  total_fee: number;
  fee_paid: boolean;
  status: 'registered' | 'confirmed' | 'cancelled' | 'appeared' | 'absent';
  hall_ticket_number?: string;
  hall_ticket_issued: boolean;
}

export interface ExamRoom {
  id: string;
  room_code: string;
  room_name: string;
  building?: string;
  floor?: string;
  total_capacity: number;
  exam_capacity: number;
  has_projector: boolean;
  has_ac: boolean;
  has_cctv: boolean;
  status: 'active' | 'maintenance' | 'unavailable';
  school_id?: string;
  college_id?: string;
}

export interface ExamSeatingArrangement {
  id: string;
  exam_timetable_id: string;
  exam_room_id: string;
  learner_id: string;
  learner_name: string;
  roll_number: string;
  hall_ticket_number?: string;
  seat_number: string;
  row_number?: string;
  column_number?: string;
  attendance_status: 'expected' | 'present' | 'absent' | 'late';
}

export interface InvigilatorAssignment {
  id: string;
  exam_timetable_id: string;
  exam_room_id?: string;
  invigilator_id: string;
  invigilator_name: string;
  invigilator_type: 'chief' | 'regular' | 'relief' | 'external';
  duty_date: string;
  duty_start_time: string;
  duty_end_time: string;
  attendance_status: 'assigned' | 'present' | 'absent' | 'relieved';
}

export async function createExamWindow(data: Partial<ExamWindow>): Promise<ExamWindow> {
  const result: any = await apiPost('/college-admin/exams', { action: 'create-exam-window', ...data });
  return result.data;
}

export async function getExamWindows(filters?: {
  academic_year?: string;
  semester?: string;
  status?: string;
  college_id?: string;
  school_id?: string;
}): Promise<ExamWindow[]> {
  const result: any = await apiPost('/college-admin/exams', { action: 'get-exam-windows', ...filters });
  return result.data || [];
}

export async function updateExamWindow(id: string, updates: Partial<ExamWindow>): Promise<ExamWindow> {
  const result: any = await apiPost('/college-admin/exams', { action: 'update-exam-window', id, ...updates });
  return result.data;
}

export async function publishExamWindow(id: string): Promise<void> {
  await apiPost('/college-admin/exams', { action: 'publish-exam-window', id });
}

export async function registerlearnerForExam(data: Partial<ExamRegistration>): Promise<ExamRegistration> {
  const result: any = await apiPost('/college-admin/exams', { action: 'register-learner', ...data });
  return result.data;
}

export async function getExamRegistrations(examWindowId: string): Promise<ExamRegistration[]> {
  const result: any = await apiPost('/college-admin/exams', { action: 'get-exam-registrations', exam_window_id: examWindowId });
  return result.data || [];
}

export async function issueHallTicket(registrationId: string): Promise<string> {
  const result: any = await apiPost('/college-admin/exams', { action: 'issue-hall-ticket', registration_id: registrationId });
  return result.data.hall_ticket_number;
}

export async function bulkIssueHallTickets(examWindowId: string): Promise<number> {
  const result: any = await apiPost('/college-admin/exams', { action: 'bulk-issue-hall-tickets', exam_window_id: examWindowId });
  return result.data.issued;
}

export async function createExamRoom(data: Partial<ExamRoom>): Promise<ExamRoom> {
  const result: any = await apiPost('/college-admin/exams', { action: 'create-exam-room', ...data });
  return result.data;
}

export async function getExamRooms(filters?: {
  status?: string;
  building?: string;
  college_id?: string;
  school_id?: string;
}): Promise<ExamRoom[]> {
  const result: any = await apiPost('/college-admin/exams', { action: 'get-exam-rooms', ...filters });
  return result.data || [];
}

export async function updateExamRoom(id: string, updates: Partial<ExamRoom>): Promise<ExamRoom> {
  const result: any = await apiPost('/college-admin/exams', { action: 'update-exam-room', id, ...updates });
  return result.data;
}

export async function createSeatingArrangement(data: Partial<ExamSeatingArrangement>): Promise<ExamSeatingArrangement> {
  const result: any = await apiPost('/college-admin/exams', { action: 'create-seating', ...data });
  return result.data;
}

export async function getSeatingArrangements(examTimetableId: string): Promise<ExamSeatingArrangement[]> {
  const result: any = await apiPost('/college-admin/exams', { action: 'get-seating', exam_timetable_id: examTimetableId });
  return result.data || [];
}

export async function markExamAttendance(
  seatingId: string,
  status: 'present' | 'absent' | 'late',
  markedBy: string
): Promise<void> {
  await apiPost('/college-admin/exams', { action: 'mark-exam-attendance', seating_id: seatingId, status, marked_by: markedBy });
}

export async function assignInvigilator(data: Partial<InvigilatorAssignment>): Promise<InvigilatorAssignment> {
  const result: any = await apiPost('/college-admin/exams', { action: 'assign-invigilator', ...data });
  return result.data;
}

export async function getInvigilatorAssignments(filters: {
  exam_timetable_id?: string;
  invigilator_id?: string;
  duty_date?: string;
}): Promise<InvigilatorAssignment[]> {
  const result: any = await apiPost('/college-admin/exams', { action: 'get-invigilator-assignments', ...filters });
  return result.data || [];
}

export async function markInvigilatorAttendance(
  assignmentId: string,
  status: 'present' | 'absent' | 'relieved'
): Promise<void> {
  await apiPost('/college-admin/exams', { action: 'mark-invigilator-attendance', assignment_id: assignmentId, status });
}

export async function getExamStatistics(examWindowId: string): Promise<any> {
  const result: any = await apiPost('/college-admin/exams', { action: 'exam-statistics', exam_window_id: examWindowId });
  return result.data;
}

export async function getAttendanceReport(examTimetableId: string): Promise<any> {
  const result: any = await apiPost('/college-admin/exams', { action: 'exam-attendance', exam_timetable_id: examTimetableId });
  return result.data;
}

export const examinationService = {
  createExamWindow,
  getExamWindows,
  updateExamWindow,
  publishExamWindow,
  registerlearnerForExam,
  getExamRegistrations,
  issueHallTicket,
  bulkIssueHallTickets,
  createExamRoom,
  getExamRooms,
  updateExamRoom,
  createSeatingArrangement,
  getSeatingArrangements,
  markExamAttendance,
  assignInvigilator,
  getInvigilatorAssignments,
  markInvigilatorAttendance,
  getExamStatistics,
  getAttendanceReport
};
