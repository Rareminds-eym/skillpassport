/**
 * College Admin - Exams API
 * POST: Action-based dispatch for exam windows, registrations, rooms, seating, invigilators
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);
  }

  const startTime = Date.now();

  try {
    switch (action) {
      // ── Exam Windows ──
      case 'create-exam-window': {
        const { data, error } = await supabase.from('exam_windows').insert([{ ...params, college_id: user.org_id }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }
      case 'get-exam-windows': {
        let query = supabase.from('exam_windows').select('*').order('start_date', { ascending: false });
        if (params.college_id) query = query.eq('college_id', params.college_id);
        if (params.academic_year) query = query.eq('academic_year', params.academic_year);
        if (params.semester) query = query.eq('semester', params.semester);
        if (params.status) query = query.eq('status', params.status);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }
      case 'update-exam-window': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase.from('exam_windows').update(updates).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }
      case 'publish-exam-window': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('exam_windows').update({ is_published: true, status: 'scheduled' }).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      // ── Registrations ──
      case 'register-learner': {
        const registrationNumber = `REG${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const { data, error } = await supabase.from('exam_registrations').insert([{ ...params, registration_number: registrationNumber, registration_date: new Date().toISOString().split('T')[0] }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }
      case 'get-exam-registrations': {
        const { exam_window_id } = params;
        let query = supabase.from('exam_registrations').select('*').order('registration_date', { ascending: false });
        if (exam_window_id) query = query.eq('exam_window_id', exam_window_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }
      case 'issue-hall-ticket': {
        const { registration_id } = params;
        if (!registration_id) return apiError(400, 'VALIDATION_ERROR', 'Missing registration_id', context.request, { startTime });
        const hallTicketNumber = `HT${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        const { error } = await supabase.from('exam_registrations').update({ hall_ticket_number: hallTicketNumber, hall_ticket_issued: true, hall_ticket_issued_date: new Date().toISOString().split('T')[0] }).eq('id', registration_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ hall_ticket_number: hallTicketNumber }, context.request, { startTime });
      }
      case 'bulk-issue-hall-tickets': {
        const { exam_window_id } = params;
        const { data: registrations, error: fetchError } = await supabase.from('exam_registrations').select('id').eq('exam_window_id', exam_window_id).eq('status', 'confirmed').eq('hall_ticket_issued', false);
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        let issued = 0;
        for (const reg of registrations || []) {
          const ht = `HT${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
          const { error: updateError } = await supabase.from('exam_registrations').update({ hall_ticket_number: ht, hall_ticket_issued: true, hall_ticket_issued_date: new Date().toISOString().split('T')[0] }).eq('id', reg.id);
          if (!updateError) issued++;
        }
        return apiSuccess({ issued }, context.request, { startTime });
      }
      case 'update-registration': {
        const { registration_id, ...updates } = params;
        if (!registration_id) return apiError(400, 'VALIDATION_ERROR', 'Missing registration_id', context.request, { startTime });
        const { data, error } = await supabase.from('exam_registrations').update(updates).eq('id', registration_id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Exam Rooms ──
      case 'create-exam-room': {
        const { data, error } = await supabase.from('exam_rooms').insert([{ ...params, college_id: user.org_id }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }
      case 'get-exam-rooms': {
        let query = supabase.from('exam_rooms').select('*').order('room_code');
        if (params.college_id) query = query.eq('college_id', params.college_id);
        if (params.status) query = query.eq('status', params.status);
        if (params.building) query = query.eq('building', params.building);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }
      case 'update-exam-room': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase.from('exam_rooms').update(updates).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Seating ──
      case 'create-seating': {
        const { data, error } = await supabase.from('exam_seating_arrangements').insert([params]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }
      case 'get-seating': {
        const { exam_timetable_id } = params;
        let query = supabase.from('exam_seating_arrangements').select('*').order('seat_number');
        if (exam_timetable_id) query = query.eq('exam_timetable_id', exam_timetable_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }
      case 'mark-exam-attendance': {
        const { seating_id, status, marked_by } = params;
        if (!seating_id) return apiError(400, 'VALIDATION_ERROR', 'Missing seating_id', context.request, { startTime });
        const { error } = await supabase.from('exam_seating_arrangements').update({ attendance_status: status, marked_at: new Date().toISOString(), marked_by }).eq('id', seating_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      // ── Invigilators ──
      case 'assign-invigilator': {
        const { data, error } = await supabase.from('invigilator_assignments').insert([params]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }
      case 'get-invigilator-assignments': {
        let query = supabase.from('invigilator_assignments').select('*').order('duty_date');
        if (params.exam_timetable_id) query = query.eq('exam_timetable_id', params.exam_timetable_id);
        if (params.invigilator_id) query = query.eq('invigilator_id', params.invigilator_id);
        if (params.duty_date) query = query.eq('duty_date', params.duty_date);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }
      case 'mark-invigilator-attendance': {
        const { assignment_id, status: invStatus } = params;
        if (!assignment_id) return apiError(400, 'VALIDATION_ERROR', 'Missing assignment_id', context.request, { startTime });
        const updates: any = { attendance_status: invStatus };
        if (invStatus === 'present') updates.check_in_time = new Date().toISOString();
        const { error } = await supabase.from('invigilator_assignments').update(updates).eq('id', assignment_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      // ── Reports ──
      case 'exam-statistics': {
        const { exam_window_id } = params;
        let query = supabase.from('exam_registrations').select('status, registration_type, fee_paid');
        if (exam_window_id) query = query.eq('exam_window_id', exam_window_id);
        const { data: registrations, error: regError } = await query;
        if (regError) return apiDbError(regError, context.request, { startTime });
        return apiSuccess({
          total: registrations?.length || 0,
          confirmed: registrations?.filter((r: any) => r.status === 'confirmed').length || 0,
          pending: registrations?.filter((r: any) => r.status === 'registered').length || 0,
          cancelled: registrations?.filter((r: any) => r.status === 'cancelled').length || 0,
          feePaid: registrations?.filter((r: any) => r.fee_paid).length || 0,
          feePending: registrations?.filter((r: any) => !r.fee_paid).length || 0,
          regular: registrations?.filter((r: any) => r.registration_type === 'regular').length || 0,
          arrear: registrations?.filter((r: any) => r.registration_type === 'arrear').length || 0,
          improvement: registrations?.filter((r: any) => r.registration_type === 'improvement').length || 0,
        }, context.request, { startTime });
      }
      case 'exam-attendance': {
        const { exam_timetable_id } = params;
        let query = supabase.from('exam_seating_arrangements').select('attendance_status');
        if (exam_timetable_id) query = query.eq('exam_timetable_id', exam_timetable_id);
        const { data: seating, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({
          total: seating?.length || 0,
          present: seating?.filter((s: any) => s.attendance_status === 'present').length || 0,
          absent: seating?.filter((s: any) => s.attendance_status === 'absent').length || 0,
          late: seating?.filter((s: any) => s.attendance_status === 'late').length || 0,
          expected: seating?.filter((s: any) => s.attendance_status === 'expected').length || 0,
        }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[exams POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
