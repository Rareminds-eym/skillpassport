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
      // ── College Breaks ──
      case 'get-breaks': {
        const { college_id } = params;
        let query = supabase.from('college_breaks').select('*');
        if (college_id) query = query.eq('college_id', college_id);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-break': {
        const { data, error } = await supabase
          .from('college_breaks')
          .insert([params])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-break': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('college_breaks')
          .delete()
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── College Events ──
      case 'get-events': {
        const { college_id, status } = params;
        let query = supabase.from('college_events').select('*');
        if (college_id) query = query.eq('college_id', college_id);
        if (status) query = query.eq('status', status);
        const { data, error } = await query.order('start_date', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-event': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_events')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'create-event': {
        const { data, error } = await supabase
          .from('college_events')
          .insert([{ ...params, created_by: user.id }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-event': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_events')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-event': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('college_events')
          .delete()
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'publish-event': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_events')
          .update({ status: 'published' })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'cancel-event': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_events')
          .update({ status: 'cancelled' })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'reschedule-event': {
        const { id, start_date, end_date } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        if (!start_date || !end_date) return apiError(400, 'VALIDATION_ERROR', 'Missing start_date or end_date', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_events')
          .update({ start_date, end_date })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Event Registrations ──
      case 'register-for-event': {
        const { event_id, learner_id } = params;
        if (!event_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing event_id or learner_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_event_registrations')
          .insert([{ event_id, learner_id }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'cancel-registration': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('college_event_registrations')
          .delete()
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'mark-attendance': {
        const { id, attended } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_event_registrations')
          .update({ attended })
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-event-registrations': {
        const { event_id } = params;
        if (!event_id) return apiError(400, 'VALIDATION_ERROR', 'Missing event_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_event_registrations')
          .select('*, learner:learner_id(id, name, email, contactNumber)')
          .eq('event_id', event_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'check-registration': {
        const { event_id, learner_id } = params;
        if (!event_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing event_id or learner_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_event_registrations')
          .select('id')
          .eq('event_id', event_id)
          .eq('learner_id', learner_id)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ registered: !!data }, context.request, { startTime });
      }

      // ── Factory Visits (opportunities table) ──
      case 'get-factory-visits': {
        const { search, sector, location } = params;
        let query = supabase
          .from('opportunities')
          .select('id, company_name, location, sector, description, title, posted_date, is_active, created_at, updated_at')
          .eq('employment_type', 'factory_visit')
          .eq('is_active', true);
        if (search) {
          query = query.or(`company_name.ilike.%${search}%,sector.ilike.%${search}%,location.ilike.%${search}%`);
        }
        if (sector) query = query.eq('sector', sector);
        if (location) query = query.ilike('location', `%${location}%`);
        const { data, error } = await query.order('posted_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-factory-visit-details': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('opportunities')
          .select('id, company_name, location, sector, description, title, posted_date, is_active, created_at, updated_at')
          .eq('id', id)
          .eq('employment_type', 'factory_visit')
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        const { data: registrations } = await supabase
          .from('applied_jobs')
          .select('id, learner_id, application_status, applied_at')
          .eq('opportunity_id', id);
        return apiSuccess({ ...data, registrations: registrations || [] }, context.request, { startTime });
      }

      case 'register-for-factory-visit': {
        const { learner_id, opportunity_id } = params;
        if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id or opportunity_id', context.request, { startTime });
        const { data: existing } = await supabase
          .from('applied_jobs')
          .select('id')
          .eq('learner_id', learner_id)
          .eq('opportunity_id', opportunity_id)
          .maybeSingle();
        if (existing) return apiError(409, 'DUPLICATE', 'Already registered for this visit', context.request, { startTime });
        const { data, error } = await supabase
          .from('applied_jobs')
          .insert([{ learner_id, opportunity_id, application_status: 'applied', applied_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-factory-visit-sectors': {
        const { data, error } = await supabase
          .from('opportunities')
          .select('sector')
          .eq('employment_type', 'factory_visit')
          .eq('is_active', true)
          .not('sector', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        const sectors = [...new Set((data || []).map((r: any) => r.sector).filter(Boolean))].sort();
        return apiSuccess(sectors, context.request, { startTime });
      }

      case 'get-learner-factory-visit-registrations': {
        const { learner_id } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        const { data: opps } = await supabase
          .from('opportunities')
          .select('id')
          .eq('employment_type', 'factory_visit');
        const oppIds = (opps || []).map((o: any) => o.id);
        if (oppIds.length === 0) return apiSuccess([], context.request, { startTime });
        const { data, error } = await supabase
          .from('applied_jobs')
          .select('*, opportunity:opportunity_id(id, company_name, location, sector, title, posted_date)')
          .eq('learner_id', learner_id)
          .in('opportunity_id', oppIds);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-factory-visit-learners': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .select('id, name, email, contactNumber, enrollment_number, grade, section')
          .eq('college_id', college_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Registration Counts (for useEvents) ──
      case 'get-event-registration-counts': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data: collegeEvents, error: eventsError } = await supabase
          .from('college_events')
          .select('id')
          .eq('college_id', college_id);

        if (eventsError) return apiDbError(eventsError, context.request, { startTime });

        const eventIds = (collegeEvents || []).map((e: any) => e.id);

        if (eventIds.length === 0) {
          return apiSuccess({}, context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_event_registrations')
          .select('event_id')
          .in('event_id', eventIds);

        if (error) return apiDbError(error, context.request, { startTime });

        const counts: Record<string, number> = {};
        (data || []).forEach((r: any) => {
          counts[r.event_id] = (counts[r.event_id] || 0) + 1;
        });

        return apiSuccess(counts, context.request, { startTime });
      }

      case 'update-break': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_breaks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[events POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
