/**
 * College Admin - Mentor Management API
 * POST: Action-based dispatch for mentor periods, allocations, notes
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
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      case 'get-periods': {
        const { college_id } = params;
        const { data, error } = await supabase
          .from('college_mentor_periods')
          .select('*')
          .eq('college_id', college_id)
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-mentors': {
        const { college_id } = params;
        const { data, error } = await supabase
          .from('college_lecturers')
          .select('*')
          .eq('collegeId', college_id)
          .eq('accountStatus', 'active');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-learners': {
        const { college_id } = params;
        const { data, error } = await supabase
          .from('learners')
          .select('*')
          .eq('college_id', college_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-allocations': {
        const { college_id } = params;
        const { data, error } = await supabase
          .from('college_mentor_learner_allocations')
          .select(`
            *,
            college_mentor_periods!inner (
              college_id
            )
          `)
          .eq('college_mentor_periods.college_id', college_id)
          .in('status', ['active', 'pending']);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'find-allocation-id': {
        const { mentor_id, learner_id, status } = params;
        const { data, error } = await supabase
          .from('college_mentor_learner_allocations')
          .select('id')
          .eq('mentor_id', mentor_id)
          .eq('learner_id', learner_id)
          .eq('status', status || 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data?.id || null, context.request, { startTime });
      }

      case 'get-mentor-notes': {
        const { college_id } = params;
        const { data: allocations, error: allocError } = await supabase
          .from('college_mentor_learner_allocations')
          .select(`
            id,
            college_mentor_periods!inner (
              college_id
            )
          `)
          .eq('college_mentor_periods.college_id', college_id);
        if (allocError) return apiDbError(allocError, context.request, { startTime });
        if (!allocations || allocations.length === 0) {
          return apiSuccess([], context.request, { startTime });
        }
        const allocationIds = allocations.map((a: any) => a.id);
        const { data, error } = await supabase
          .from('college_mentor_notes')
          .select('*')
          .in('allocation_id', allocationIds);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-period': {
        const { period, college_id, created_by } = params;
        const insertData = { ...period, college_id, created_by: created_by || user.id };
        const { data, error } = await supabase
          .from('college_mentor_periods')
          .insert([insertData])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'create-allocations': {
        const { allocations } = params;
        const learnerIds = allocations.map((a: any) => a.learner_id);
        const { data: existing } = await supabase
          .from('college_mentor_learner_allocations')
          .select('learner_id, status, mentor_id')
          .in('learner_id', learnerIds)
          .in('status', ['active', 'pending']);
        if (existing && existing.length > 0) {
          const conflictinglearners = existing.filter((e: any) => {
            const newAllocation = allocations.find((a: any) => a.learner_id === e.learner_id);
            return newAllocation && newAllocation.mentor_id !== e.mentor_id;
          });
          if (conflictinglearners.length > 0) {
            const conflictingIds = conflictinglearners.map((e: any) => e.learner_id);
            return apiError(409, 'CONFLICT', `Some learners already have active allocations with different mentors: ${conflictingIds.join(', ')}`, context.request, { startTime });
          }
        }
        const { data, error } = await supabase
          .from('college_mentor_learner_allocations')
          .insert(allocations)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-mentor-note': {
        const { note } = params;
        const { data, error } = await supabase
          .from('college_mentor_notes')
          .insert([note])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-allocation': {
        const { id, ...updates } = params;
        const { data, error } = await supabase
          .from('college_mentor_learner_allocations')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-period': {
        const { id, ...updates } = params;
        const { data, error } = await supabase
          .from('college_mentor_periods')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-departments': {
        const { college_id } = params;
        const { data, error } = await supabase
          .from('departments')
          .select('id, name')
          .eq('college_id', college_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-programs': {
        const { college_id } = params;
        const { data, error } = await supabase
          .from('programs')
          .select(`
            id,
            name,
            code,
            departments:department_id (
              name
            )
          `)
          .eq('departments.college_id', college_id);
        if (error) return apiDbError(error, context.request, { startTime });
        const programs = (data || []).map((program: any) => ({
          id: program.id,
          name: program.name,
          code: program.code,
          department_name: (Array.isArray(program.departments) ? program.departments[0] : program.departments)?.name || '',
        }));
        return apiSuccess(programs, context.request, { startTime });
      }

      case 'update-note-response': {
        const { note_id, ...updates } = params;
        const { data: currentNote, error: fetchError } = await supabase
          .from('college_mentor_notes')
          .select('*')
          .eq('id', note_id)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        if (currentNote.status !== 'pending') {
          return apiError(400, 'VALIDATION_ERROR', `Cannot respond: Note status must be 'pending' (current: '${currentNote.status}')`, context.request, { startTime });
        }
        if (currentNote.educator_response) {
          return apiError(400, 'VALIDATION_ERROR', 'Cannot respond: Response already submitted and is read-only', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_mentor_notes')
          .update({
            educator_response: updates.educator_response,
            action_taken: updates.action_taken,
            next_steps: updates.next_steps,
            status: 'acknowledged',
            last_updated_by: updates.last_updated_by,
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', note_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-note-feedback': {
        const { note_id, ...updates } = params;
        const { data: currentNote, error: fetchError } = await supabase
          .from('college_mentor_notes')
          .select('*')
          .eq('id', note_id)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        if (currentNote.status !== 'acknowledged') {
          return apiError(400, 'VALIDATION_ERROR', `Cannot give feedback: Note must be in 'acknowledged' status (current: '${currentNote.status}')`, context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_mentor_notes')
          .update({
            admin_feedback: updates.admin_feedback,
            priority: updates.priority,
            follow_up_required: updates.follow_up_required,
            follow_up_date: updates.follow_up_date,
            status: 'in_progress',
            last_updated_by: updates.last_updated_by,
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', note_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'resolve-note': {
        const { note_id, resolved_by } = params;
        const { data: currentNote, error: fetchError } = await supabase
          .from('college_mentor_notes')
          .select('*')
          .eq('id', note_id)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        if (currentNote.status !== 'in_progress') {
          return apiError(400, 'VALIDATION_ERROR', `Cannot resolve: Note must be in 'in_progress' status (current: '${currentNote.status}')`, context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_mentor_notes')
          .update({
            status: 'completed',
            resolved_at: new Date().toISOString(),
            resolved_by,
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', note_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'escalate-note': {
        const { note_id, escalation_reason, escalated_by } = params;
        const { data, error } = await supabase
          .from('college_mentor_notes')
          .update({
            status: 'escalated',
            admin_feedback: escalation_reason,
            last_updated_by: escalated_by,
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', note_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-pending-follow-ups': {
        const { mentor_id } = params;
        const { data, error } = await supabase
          .from('college_mentor_notes')
          .select('*')
          .eq('mentor_id', mentor_id)
          .eq('follow_up_required', true)
          .not('status', 'in', '("completed","resolved")')
          .order('follow_up_date', { ascending: true, nullsFirst: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-note-conversation': {
        const { id } = params;
        const { data, error } = await supabase
          .from('mentor_note_conversations')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[mentors POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
