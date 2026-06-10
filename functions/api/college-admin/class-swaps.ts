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
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      case 'get-faculty-info': {
        const { faculty_id, is_college_educator } = params;
        if (!faculty_id) return apiError(400, 'VALIDATION_ERROR', 'Missing faculty_id', context.request, { startTime });

        if (is_college_educator) {
          const { data, error } = await supabase
            .from('college_lecturers')
            .select('id, first_name, last_name, email')
            .eq('id', faculty_id)
            .single();
          if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
          return apiSuccess(data || null, context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('school_educators')
          .select('id, first_name, last_name, email')
          .eq('id', faculty_id)
          .single();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-slot-info': {
        const { slot_id, is_college_educator } = params;
        if (!slot_id) return apiError(400, 'VALIDATION_ERROR', 'Missing slot_id', context.request, { startTime });

        if (is_college_educator) {
          const { data, error } = await supabase
            .from('college_timetable_slots')
            .select('*, college_classes!college_timetable_slots_class_id_fkey(name, grade, section)')
            .eq('id', slot_id)
            .single();
          if (error) return apiDbError(error, context.request, { startTime });
          return apiSuccess({
            ...data,
            class_name: data.college_classes ? `${data.college_classes.name} - ${data.college_classes.grade} ${data.college_classes.section}` : '',
          }, context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('timetable_slots')
          .select('*, school_classes!timetable_slots_class_id_fkey(name, grade, section)')
          .eq('id', slot_id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({
          ...data,
          class_name: data.school_classes ? `${data.school_classes.name} - ${data.school_classes.grade} ${data.school_classes.section}` : '',
        }, context.request, { startTime });
      }

      case 'create-swap-request': {
        const { requester_faculty_id, requester_slot_id, target_faculty_id, target_slot_id, reason, request_type, swap_date, requires_admin_approval } = params;
        if (!requester_faculty_id || !requester_slot_id || !target_faculty_id || !target_slot_id || !request_type) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: requester_faculty_id, requester_slot_id, target_faculty_id, target_slot_id, request_type', context.request, { startTime });
        }

        if (request_type === 'one_time' && !swap_date) {
          return apiError(400, 'VALIDATION_ERROR', 'swap_date is required for one_time swaps', context.request, { startTime });
        }
        if (request_type === 'permanent' && swap_date) {
          return apiError(400, 'VALIDATION_ERROR', 'swap_date must not be provided for permanent swaps', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('class_swap_requests')
          .insert([{
            requester_faculty_id,
            requester_slot_id,
            target_faculty_id,
            target_slot_id,
            reason: reason || null,
            request_type,
            swap_date: swap_date || null,
            requires_admin_approval: requires_admin_approval ?? false,
            status: 'pending',
          }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'check-swap-conflicts': {
        const { requester_slot_id, target_slot_id, swap_date } = params;
        if (!requester_slot_id || !target_slot_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: requester_slot_id, target_slot_id', context.request, { startTime });
        }

        let requesterSlot: any = null;
        let targetSlot: any = null;

        const { data: rs1 } = await supabase.from('timetable_slots').select('*').eq('id', requester_slot_id).single();
        if (rs1) requesterSlot = rs1;
        if (!requesterSlot) {
          const { data: rc1 } = await supabase.from('college_timetable_slots').select('*').eq('id', requester_slot_id).single();
          if (rc1) requesterSlot = rc1;
        }

        const { data: ts1 } = await supabase.from('timetable_slots').select('*').eq('id', target_slot_id).single();
        if (ts1) targetSlot = ts1;
        if (!targetSlot) {
          const { data: tc1 } = await supabase.from('college_timetable_slots').select('*').eq('id', target_slot_id).single();
          if (tc1) targetSlot = tc1;
        }

        if (!requesterSlot || !targetSlot) {
          return apiSuccess({ has_conflict: true, conflict_reason: 'One or both slots not found' }, context.request, { startTime });
        }

        if (requesterSlot.timetable_id !== targetSlot.timetable_id) {
          return apiSuccess({ has_conflict: true, conflict_reason: 'Slots must be from the same timetable' }, context.request, { startTime });
        }

        if (requesterSlot.day_of_week === targetSlot.day_of_week && requesterSlot.period_number === targetSlot.period_number) {
          return apiSuccess({ has_conflict: true, conflict_reason: 'Slots cannot overlap - same day and period' }, context.request, { startTime });
        }

        return apiSuccess({ has_conflict: false, conflict_reason: null }, context.request, { startTime });
      }

      case 'get-swap-requests': {
        const { faculty_id, status, request_type, date_from, date_to } = params;
        if (!faculty_id) return apiError(400, 'VALIDATION_ERROR', 'Missing faculty_id', context.request, { startTime });

        let query = supabase
          .from('class_swap_requests')
          .select('*')
          .or(`requester_faculty_id.eq.${faculty_id},target_faculty_id.eq.${faculty_id}`);

        if (status) query = query.eq('status', status);
        if (request_type) query = query.eq('request_type', request_type);
        if (date_from) query = query.gte('created_at', date_from);
        if (date_to) query = query.lte('created_at', date_to);

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-swap-request-details': {
        const { request_id, is_college_educator } = params;
        if (!request_id) return apiError(400, 'VALIDATION_ERROR', 'Missing request_id', context.request, { startTime });

        const { data: swapRequest, error: reqError } = await supabase
          .from('class_swap_requests')
          .select('*')
          .eq('id', request_id)
          .single();
        if (reqError) return apiDbError(reqError, context.request, { startTime });

        const { data: history } = await supabase
          .from('class_swap_history')
          .select('*')
          .eq('swap_request_id', request_id)
          .order('created_at', { ascending: true });

        const enrichFaculty = async (facultyId: string) => {
          const { data: cl } = await supabase.from('college_lecturers').select('id, first_name, last_name, email').eq('id', facultyId).single();
          if (cl) return cl;
          const { data: se } = await supabase.from('school_educators').select('id, first_name, last_name, email').eq('id', facultyId).single();
          return se || null;
        };

        const enrichSlot = async (slotId: string) => {
          const { data: ts } = await supabase.from('timetable_slots').select('*, school_classes!timetable_slots_class_id_fkey(name, grade, section)').eq('id', slotId).single();
          if (ts) return { ...ts, class_name: ts.school_classes ? `${ts.school_classes.name} - ${ts.school_classes.grade} ${ts.school_classes.section}` : '' };
          const { data: cs } = await supabase.from('college_timetable_slots').select('*, college_classes!college_timetable_slots_class_id_fkey(name, grade, section)').eq('id', slotId).single();
          if (cs) return { ...cs, class_name: cs.college_classes ? `${cs.college_classes.name} - ${cs.college_classes.grade} ${cs.college_classes.section}` : '' };
          return null;
        };

        let adminInfo: any = null;
        if (swapRequest.admin_id) {
          const { data: ai } = await supabase.from('college_lecturers').select('id, first_name, last_name, email').eq('id', swapRequest.admin_id).single();
          if (ai) adminInfo = ai;
        }

        const [requesterFaculty, targetFaculty, requesterSlot, targetSlot] = await Promise.all([
          enrichFaculty(swapRequest.requester_faculty_id),
          enrichFaculty(swapRequest.target_faculty_id),
          enrichSlot(swapRequest.requester_slot_id),
          enrichSlot(swapRequest.target_slot_id),
        ]);

        return apiSuccess({
          ...swapRequest,
          requester_faculty: requesterFaculty,
          target_faculty: targetFaculty,
          requester_slot: requesterSlot,
          target_slot: targetSlot,
          admin: adminInfo,
          history: history || [],
        }, context.request, { startTime });
      }

      case 'respond-to-swap': {
        const { request_id, status, response_message } = params;
        if (!request_id || !status) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: request_id, status', context.request, { startTime });
        }
        if (!['accepted', 'rejected'].includes(status)) {
          return apiError(400, 'VALIDATION_ERROR', 'status must be "accepted" or "rejected"', context.request, { startTime });
        }

        const updates: Record<string, any> = {
          status,
          target_response: response_message || null,
          target_responded_at: new Date().toISOString(),
        };

        if (status === 'accepted') {
          const { data: current } = await supabase.from('class_swap_requests').select('requires_admin_approval').eq('id', request_id).single();
          if (current?.requires_admin_approval) {
            updates.admin_approval_status = 'pending';
          }
        }

        const { data, error } = await supabase
          .from('class_swap_requests')
          .update(updates)
          .eq('id', request_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'cancel-swap-request': {
        const { request_id } = params;
        if (!request_id) return apiError(400, 'VALIDATION_ERROR', 'Missing request_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('class_swap_requests')
          .update({ status: 'cancelled' })
          .eq('id', request_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'admin-approve-swap': {
        const { request_id, approval_status, response_message } = params;
        if (!request_id || !approval_status) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: request_id, approval_status', context.request, { startTime });
        }
        if (!['approved', 'rejected'].includes(approval_status)) {
          return apiError(400, 'VALIDATION_ERROR', 'approval_status must be "approved" or "rejected"', context.request, { startTime });
        }

        const adminUserId = user.id;

        const { data: adminLecturer } = await supabase
          .from('college_lecturers')
          .select('id')
          .eq('user_id', adminUserId)
          .single();

        const updates: Record<string, any> = {
          admin_approval_status: approval_status,
          admin_id: adminLecturer?.id || adminUserId,
          admin_response: response_message || null,
          admin_responded_at: new Date().toISOString(),
        };

        if (approval_status === 'approved') {
          updates.status = 'completed';
          updates.completed_at = new Date().toISOString();
        } else {
          updates.status = 'rejected';
        }

        const { data, error } = await supabase
          .from('class_swap_requests')
          .update(updates)
          .eq('id', request_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-pending-swap-count': {
        const { faculty_id } = params;
        if (!faculty_id) return apiError(400, 'VALIDATION_ERROR', 'Missing faculty_id', context.request, { startTime });

        const { count, error } = await supabase
          .from('class_swap_requests')
          .select('*', { count: 'exact', head: true })
          .eq('target_faculty_id', faculty_id)
          .eq('status', 'pending');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'get-swap-statistics': {
        const { faculty_id } = params;
        if (!faculty_id) return apiError(400, 'VALIDATION_ERROR', 'Missing faculty_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('class_swap_requests')
          .select('status, admin_approval_status')
          .or(`requester_faculty_id.eq.${faculty_id},target_faculty_id.eq.${faculty_id}`);
        if (error) return apiDbError(error, context.request, { startTime });

        const requests = data || [];
        const stats = {
          total: requests.length,
          pending: requests.filter((r: any) => r.status === 'pending').length,
          accepted: requests.filter((r: any) => r.status === 'accepted').length,
          rejected: requests.filter((r: any) => r.status === 'rejected').length,
          completed: requests.filter((r: any) => r.status === 'completed').length,
          cancelled: requests.filter((r: any) => r.status === 'cancelled').length,
          pending_admin_approval: requests.filter((r: any) => r.admin_approval_status === 'pending').length,
        };

        return apiSuccess(stats, context.request, { startTime });
      }

      case 'get-college-swap-requests': {
        const { college_id, status, request_type, date_from, date_to } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data: lecturers, error: lecError } = await supabase
          .from('college_lecturers')
          .select('id')
          .eq('collegeId', college_id);
        if (lecError) return apiDbError(lecError, context.request, { startTime });

        const facultyIds = (lecturers || []).map((l: any) => l.id);
        if (facultyIds.length === 0) return apiSuccess([], context.request, { startTime });

        let query = supabase
          .from('class_swap_requests')
          .select('*')
          .or(`requester_faculty_id.in.(${facultyIds.join(',')}),target_faculty_id.in.(${facultyIds.join(',')})`);

        if (status) query = query.eq('status', status);
        if (request_type) query = query.eq('request_type', request_type);
        if (date_from) query = query.gte('created_at', date_from);
        if (date_to) query = query.lte('created_at', date_to);

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-available-slots': {
        const { current_slot_id, current_faculty_id, is_college_educator } = params;
        if (!current_slot_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing current_slot_id', context.request, { startTime });
        }

        let currentSlot: any = null;
        let timetableId: string | null = null;
        let classId: string | null = null;

        if (is_college_educator) {
          const { data } = await supabase.from('college_timetable_slots').select('timetable_id, class_id').eq('id', current_slot_id).single();
          if (data) currentSlot = data;
        } else {
          const { data } = await supabase.from('timetable_slots').select('timetable_id, class_id').eq('id', current_slot_id).single();
          if (data) currentSlot = data;
        }

        if (!currentSlot) {
          return apiError(400, 'VALIDATION_ERROR', 'Current slot not found', context.request, { startTime });
        }

        timetableId = currentSlot.timetable_id;
        classId = currentSlot.class_id;

        let slots: any[] = [];

        if (is_college_educator) {
          const { data } = await supabase
            .from('college_timetable_slots')
            .select('*, college_classes!college_timetable_slots_class_id_fkey(name, grade, section)')
            .eq('timetable_id', timetableId)
            .eq('class_id', classId)
            .order('day_of_week')
            .order('period_number');
          slots = (data || []).map((s: any) => ({
            ...s,
            class_name: s.college_classes ? `${s.college_classes.name} - ${s.college_classes.grade} ${s.college_classes.section}` : '',
          }));
        } else {
          const { data } = await supabase
            .from('timetable_slots')
            .select('*, school_classes!timetable_slots_class_id_fkey(name, grade, section)')
            .eq('timetable_id', timetableId)
            .eq('class_id', classId)
            .order('day_of_week')
            .order('period_number');
          slots = (data || []).map((s: any) => ({
            ...s,
            class_name: s.school_classes ? `${s.school_classes.name} - ${s.school_classes.grade} ${s.school_classes.section}` : '',
          }));
        }

        if (current_faculty_id) {
          if (is_college_educator) {
            const { data: facultySlots } = await supabase
              .from('college_timetable_slots')
              .select('id')
              .eq('timetable_id', timetableId)
              .eq('faculty_id', current_faculty_id);
            const facultySlotIds = new Set((facultySlots || []).map((s: any) => s.id));
            slots = slots.filter((s: any) => !facultySlotIds.has(s.id));
          } else {
            const { data: facultySlots } = await supabase
              .from('timetable_slots')
              .select('id')
              .eq('timetable_id', timetableId)
              .eq('faculty_id', current_faculty_id);
            const facultySlotIds = new Set((facultySlots || []).map((s: any) => s.id));
            slots = slots.filter((s: any) => !facultySlotIds.has(s.id));
          }
        }

        slots = slots.filter((s: any) => s.id !== current_slot_id);

        return apiSuccess(slots, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[class-swaps POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
