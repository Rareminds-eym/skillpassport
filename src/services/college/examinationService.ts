import { supabase } from '@/lib/supabaseClient';

// ============================================
// EXAMINATION MANAGEMENT SERVICE
// Connects to: exam_windows, exam_registrations, exam_rooms,
//              exam_seating_arrangements, invigilator_assignments
// ============================================

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
  student_id: string;
  student_name: string;
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
  student_id: string;
  student_name: string;
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

// ============================================
// EXAM WINDOW MANAGEMENT
// ============================================

export async function createExamWindow(data: Partial<ExamWindow>): Promise<ExamWindow> {
  const { data: window, error } = await supabase
    .from('exam_windows')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return window;
}

export async function getExamWindows(filters?: {
  academic_year?: string;
  semester?: string;
  status?: string;
  college_id?: string;
  school_id?: string;
}): Promise<ExamWindow[]> {
  let query = supabase.from('exam_windows').select('*');

  if (filters?.academic_year) query = query.eq('academic_year', filters.academic_year);
  if (filters?.semester) query = query.eq('semester', filters.semester);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.college_id) query = query.eq('college_id', filters.college_id);
  if (filters?.school_id) query = query.eq('school_id', filters.school_id);

  const { data, error } = await query.order('start_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateExamWindow(
  id: string,
  updates: Partial<ExamWindow>
): Promise<ExamWindow> {
  const { data, error } = await supabase
    .from('exam_windows')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishExamWindow(id: string): Promise<void> {
  const { error } = await supabase
    .from('exam_windows')
    .update({ is_published: true, status: 'scheduled' })
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// EXAM REGISTRATION
// ============================================

export async function registerStudentForExam(
  data: Partial<ExamRegistration>
): Promise<ExamRegistration> {
  // Generate registration number
  const registrationNumber = `REG${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const { data: registration, error } = await supabase
    .from('exam_registrations')
    .insert([
      {
        ...data,
        registration_number: registrationNumber,
        registration_date: new Date().toISOString().split('T')[0],
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Student already registered for this exam');
    }
    throw error;
  }

  return registration;
}

export async function getExamRegistrations(examWindowId: string): Promise<ExamRegistration[]> {
  const { data, error } = await supabase
    .from('exam_registrations')
    .select('*')
    .eq('exam_window_id', examWindowId)
    .order('registration_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function issueHallTicket(registrationId: string): Promise<string> {
  // Generate hall ticket number
  const hallTicketNumber = `HT${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

  const { error } = await supabase
    .from('exam_registrations')
    .update({
      hall_ticket_number: hallTicketNumber,
      hall_ticket_issued: true,
      hall_ticket_issued_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', registrationId);

  if (error) throw error;
  return hallTicketNumber;
}

export async function bulkIssueHallTickets(examWindowId: string): Promise<number> {
  // Get all confirmed registrations without hall tickets
  const { data: registrations, error: fetchError } = await supabase
    .from('exam_registrations')
    .select('id')
    .eq('exam_window_id', examWindowId)
    .eq('status', 'confirmed')
    .eq('hall_ticket_issued', false);

  if (fetchError) throw fetchError;

  let issued = 0;
  for (const reg of registrations || []) {
    try {
      await issueHallTicket(reg.id);
      issued++;
    } catch (error) {
      console.error(`Failed to issue hall ticket for ${reg.id}:`, error);
    }
  }

  return issued;
}

// ============================================
// EXAM ROOM MANAGEMENT
// ============================================

export async function createExamRoom(data: Partial<ExamRoom>): Promise<ExamRoom> {
  const { data: room, error } = await supabase.from('exam_rooms').insert([data]).select().single();

  if (error) throw error;
  return room;
}

export async function getExamRooms(filters?: {
  status?: string;
  building?: string;
  college_id?: string;
  school_id?: string;
}): Promise<ExamRoom[]> {
  let query = supabase.from('exam_rooms').select('*');

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.building) query = query.eq('building', filters.building);
  if (filters?.college_id) query = query.eq('college_id', filters.college_id);
  if (filters?.school_id) query = query.eq('school_id', filters.school_id);

  const { data, error } = await query.order('room_code');
  if (error) throw error;
  return data || [];
}

export async function updateExamRoom(id: string, updates: Partial<ExamRoom>): Promise<ExamRoom> {
  const { data, error } = await supabase
    .from('exam_rooms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// SEATING ARRANGEMENT
// ============================================

export async function createSeatingArrangement(
  data: Partial<ExamSeatingArrangement>
): Promise<ExamSeatingArrangement> {
  const { data: seating, error } = await supabase
    .from('exam_seating_arrangements')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return seating;
}

export async function getSeatingArrangements(
  examTimetableId: string
): Promise<ExamSeatingArrangement[]> {
  const { data, error } = await supabase
    .from('exam_seating_arrangements')
    .select('*')
    .eq('exam_timetable_id', examTimetableId)
    .order('seat_number');

  if (error) throw error;
  return data || [];
}

export async function markAttendance(
  seatingId: string,
  status: 'present' | 'absent' | 'late',
  markedBy: string
): Promise<void> {
  const { error } = await supabase
    .from('exam_seating_arrangements')
    .update({
      attendance_status: status,
      marked_at: new Date().toISOString(),
      marked_by: markedBy,
    })
    .eq('id', seatingId);

  if (error) throw error;
}

// ============================================
// INVIGILATOR ASSIGNMENT
// ============================================

export async function assignInvigilator(
  data: Partial<InvigilatorAssignment>
): Promise<InvigilatorAssignment> {
  const { data: assignment, error } = await supabase
    .from('invigilator_assignments')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return assignment;
}

export async function getInvigilatorAssignments(filters: {
  exam_timetable_id?: string;
  invigilator_id?: string;
  duty_date?: string;
}): Promise<InvigilatorAssignment[]> {
  let query = supabase.from('invigilator_assignments').select('*');

  if (filters.exam_timetable_id) query = query.eq('exam_timetable_id', filters.exam_timetable_id);
  if (filters.invigilator_id) query = query.eq('invigilator_id', filters.invigilator_id);
  if (filters.duty_date) query = query.eq('duty_date', filters.duty_date);

  const { data, error } = await query.order('duty_date');
  if (error) throw error;
  return data || [];
}

export async function markInvigilatorAttendance(
  assignmentId: string,
  status: 'present' | 'absent' | 'relieved'
): Promise<void> {
  const { error } = await supabase
    .from('invigilator_assignments')
    .update({
      attendance_status: status,
      check_in_time: status === 'present' ? new Date().toISOString() : null,
    })
    .eq('id', assignmentId);

  if (error) throw error;
}

// ============================================
// REPORTS & ANALYTICS
// ============================================

export async function getExamStatistics(examWindowId: string): Promise<any> {
  const { data: registrations, error } = await supabase
    .from('exam_registrations')
    .select('status, registration_type, fee_paid')
    .eq('exam_window_id', examWindowId);

  if (error) throw error;

  const stats = {
    total: registrations?.length || 0,
    confirmed: registrations?.filter((r) => r.status === 'confirmed').length || 0,
    pending: registrations?.filter((r) => r.status === 'registered').length || 0,
    cancelled: registrations?.filter((r) => r.status === 'cancelled').length || 0,
    feePaid: registrations?.filter((r) => r.fee_paid).length || 0,
    feePending: registrations?.filter((r) => !r.fee_paid).length || 0,
    regular: registrations?.filter((r) => r.registration_type === 'regular').length || 0,
    arrear: registrations?.filter((r) => r.registration_type === 'arrear').length || 0,
    improvement: registrations?.filter((r) => r.registration_type === 'improvement').length || 0,
  };

  return stats;
}

export async function getAttendanceReport(examTimetableId: string): Promise<any> {
  const { data: seating, error } = await supabase
    .from('exam_seating_arrangements')
    .select('attendance_status')
    .eq('exam_timetable_id', examTimetableId);

  if (error) throw error;

  return {
    total: seating?.length || 0,
    present: seating?.filter((s) => s.attendance_status === 'present').length || 0,
    absent: seating?.filter((s) => s.attendance_status === 'absent').length || 0,
    late: seating?.filter((s) => s.attendance_status === 'late').length || 0,
    expected: seating?.filter((s) => s.attendance_status === 'expected').length || 0,
  };
}
