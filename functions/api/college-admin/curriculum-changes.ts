import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { hasFeatureEntitlement } from '../../lib/entitlements';
import { publishCollegeCourseNotifications } from '../../lib/college-course-notifications';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  //Feature Gate: Lock Curriculum Changes
  const isEntitled = await hasFeatureEntitlement(supabase, user.id, 'curriculum_builder');
  if (!isEntitled) {
    return apiError(403, 'FEATURE_ACCESS_DENIED', 'Curriculum Builder requires an active plan or Curriculum Builder add-on.', context.request);
  }

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  // Educator edits must go through the mapping-checked proposal workflow.
  if (!["requires-approval", "get-all-curriculum-changes", "get-curriculum-change-details", "get-notification-count", "get-pending-changes", "get-change-request-details"].includes(action)) {
    const { data: actor, error: actorError } = await supabase.from('users').select('role,isActive').eq('id', user.id).maybeSingle();
    const ADMIN_ROLES = ['college_admin','university_admin','university_admin_dean'];
    const jwtIsAdmin = Array.isArray(user.roles) && ADMIN_ROLES.some(r => user.roles.includes(r));
    if (actorError || !actor?.isActive || (!ADMIN_ROLES.includes(actor.role) && !jwtIsAdmin)) {
      return apiError(403, 'FORBIDDEN', 'Administrator approval is required. Submit educator edits through Courses.', context.request);
    }
  }

  // Reuse the existing review actions for faculty proposals in pending_changes.
  // Delegate tagged proposals to the atomic reviewer so these legacy actions
  // cannot skip permission, ownership, or stale-content checks.
  const reviewActions = ['approve-change', 'reject-change', 'approve-curriculum-by-hod', 'reject-curriculum-by-hod', 'cancel-change-request', 'cancel-curriculum-change'];
  if (reviewActions.includes(action) && params.curriculum_id && params.change_id) {
    const { data: curriculum, error: lookupError } = await supabase.from('college_curriculums')
      .select('pending_changes').eq('id', params.curriculum_id).maybeSingle();
    if (lookupError) return apiDbError(lookupError, context.request);
    const proposal = curriculum?.pending_changes?.find((change: { id: string; source?: string }) => change.id === params.change_id && change.source === 'faculty_course');
    if (proposal) {
      const { error } = await supabase.rpc('college_course_workflow', {
        p_actor: user.id, p_action: 'review',
        p_payload: { requestId: params.change_id, decision: action.startsWith('approve-') ? 'approved' : 'rejected', note: params.review_notes || params.feedback || '' },
      });
      if (error) return apiError(error.code === '42501' ? 403 : error.code === '40001' ? 409 : 400, 'REVIEW_FAILED', error.message, context.request);
      context.waitUntil(publishCollegeCourseNotifications(supabase, context.env, params.change_id, action.startsWith('approve-') ? 'curriculum_change_approved' : 'curriculum_change_rejected'));
      return apiSuccess({ success: true }, context.request);
    }
  }

  const startTime = Date.now();

  try {
    switch (action) {
      // ── Pending Change Management ──
      case 'add-pending-change': {
        const { curriculum_id, change_type, entity_id, change_data, message } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data: curriculum, error: fetchError } = await supabase
          .from('college_curriculums')
          .select('pending_changes, change_history')
          .eq('id', curriculum_id)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        const pendingChanges = curriculum?.pending_changes || [];
        const changeHistory = curriculum?.change_history || [];
        const newChange = {
          id: crypto.randomUUID(),
          change_type,
          entity_id: entity_id || null,
          data: change_data || {},
          request_message: message || '',
          requested_by: user.id,
          requester_name: user.name || user.email || 'Unknown',
          timestamp: new Date().toISOString(),
          status: 'pending',
        };
        pendingChanges.push(newChange);
        const historyEntry = { id: newChange.id, action: 'change_added', timestamp: newChange.timestamp, user_id: user.id, change_type };
        const { error } = await supabase
          .from('college_curriculums')
          .update({
            pending_changes: pendingChanges,
            change_history: [...changeHistory, historyEntry],
            has_pending_changes: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', curriculum_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, data: newChange.id }, context.request, { startTime });
      }

      case 'requires-approval': {
        const { curriculum_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculums')
          .select('status, has_pending_changes')
          .eq('id', curriculum_id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        const status = data?.status || '';
        const hasPending = data?.has_pending_changes || false;
        const requiresApproval = status === 'pending_approval' || status === 'hod_approved' || status === 'modification_requested' || hasPending;
        return apiSuccess({ requiresApproval, reason: requiresApproval ? `Curriculum status: ${status}` : undefined }, context.request, { startTime });
      }

      // ── HoD Approval Actions (college_curriculums status) ──
      case 'approve-curriculum-by-hod': {
        const { curriculum_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculums')
          .update({ status: 'hod_approved', updated_at: new Date().toISOString(), updated_by: user.id })
          .eq('id', curriculum_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'reject-curriculum-by-hod': {
        const { curriculum_id, feedback } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculums')
          .update({ status: 'hod_rejected', hod_feedback: feedback, updated_at: new Date().toISOString(), updated_by: user.id })
          .eq('id', curriculum_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'cancel-curriculum-change': {
        const { curriculum_id, change_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data: curriculum, error: fetchError } = await supabase
          .from('college_curriculums')
          .select('pending_changes, change_history')
          .eq('id', curriculum_id)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        const pendingChanges = curriculum?.pending_changes || [];
        const updatedPending = pendingChanges.filter((c: any) => c.id !== change_id);
        const changeHistory = curriculum?.change_history || [];
        const historyEntry = { id: change_id, action: 'change_cancelled', timestamp: new Date().toISOString(), user_id: user.id };
        const { error } = await supabase
          .from('college_curriculums')
          .update({
            pending_changes: updatedPending,
            change_history: [...changeHistory, historyEntry],
            has_pending_changes: updatedPending.length > 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', curriculum_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'request-modification': {
        const { curriculum_id, feedback } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        if (!feedback) return apiError(400, 'VALIDATION_ERROR', 'Missing feedback', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculums')
          .update({ status: 'modification_requested', hod_feedback: feedback, updated_at: new Date().toISOString(), updated_by: user.id })
          .eq('id', curriculum_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-all-curriculum-changes': {
        const { university_id, college_id } = params;
        let historyCollegeId: string | undefined;
        if (params.faculty_history === true) {
          const { data: actor, error: actorError } = await supabase.from('users').select('role,isActive,organizationId').eq('id', user.id).maybeSingle();
          if (actorError) return apiDbError(actorError, context.request, { startTime });
          const jwtIsCollegeAdmin = Array.isArray(user.roles) && user.roles.includes('college_admin');
          if (!actor?.isActive || (actor.role !== 'college_admin' && !jwtIsCollegeAdmin) || !actor.organizationId) return apiError(403, 'FORBIDDEN', 'College admin required', context.request);
          historyCollegeId = actor.organizationId;
        }
        let query = supabase
          .from('college_curriculums')
          .select(`
            id, status, academic_year, pending_changes, change_history, has_pending_changes,
            created_at, updated_at,
            course:college_courses!college_curriculums_course_id_fkey(course_name, course_code),
            departments(name),
            programs(name)
          `);
        if (historyCollegeId) query = query.eq('college_id', historyCollegeId);
        else {
          if (university_id) query = query.eq('university_id', university_id);
          if (college_id) query = query.eq('college_id', college_id);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-curriculum-change-details': {
        const { curriculum_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculums')
          .select(`
            id, status, academic_year, pending_changes, change_history, has_pending_changes,
            hod_feedback, created_at, updated_at,
            course:college_courses!college_curriculums_course_id_fkey(course_name, course_code),
            departments(name),
            programs(name)
          `)
          .eq('id', curriculum_id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-notification-count': {
        const { university_id } = params;
        const { data, error } = await supabase
          .from('college_curriculums')
          .select('id')
          .eq('has_pending_changes', true)
          .eq('university_id', university_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ count: data?.length || 0 }, context.request, { startTime });
      }

      case 'approve-all-changes': {
        const { curriculum_ids } = params;
        if (!curriculum_ids || !Array.isArray(curriculum_ids) || curriculum_ids.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_ids array', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('college_curriculums')
          .update({ status: 'approved', updated_at: new Date().toISOString(), updated_by: user.id })
          .in('id', curriculum_ids)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Change Request Status Updates ──
      case 'submit-change-request': {
        const { curriculum_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculums')
          .update({ status: 'pending_approval', submitted_at: new Date().toISOString(), updated_by: user.id })
          .eq('id', curriculum_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'approve-change': {
        const { curriculum_id, change_id, review_notes } = params;
        if (!curriculum_id || !change_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id or change_id', context.request, { startTime });
        const { data: curriculum, error: fetchError } = await supabase
          .from('college_curriculums')
          .select('pending_changes, change_history')
          .eq('id', curriculum_id)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        const pendingChanges = curriculum?.pending_changes || [];
        const changeIndex = pendingChanges.findIndex((c: any) => c.id === change_id);
        if (changeIndex === -1) return apiError(404, 'NOT_FOUND', 'Change request not found', context.request, { startTime });
        const change = pendingChanges[changeIndex];
        const updatedPending = pendingChanges.filter((_: any, i: number) => i !== changeIndex);
        const changeHistory = curriculum?.change_history || [];
        const historyEntry = {
          id: change_id, action: 'change_approved', change_type: change.change_type,
          request_timestamp: change.request_timestamp, approval_timestamp: new Date().toISOString(),
          user_id: user.id, review_notes, applied: true, original_change: change,
        };
        const { error } = await supabase
          .from('college_curriculums')
          .update({
            pending_changes: updatedPending,
            change_history: [...changeHistory, historyEntry],
            has_pending_changes: updatedPending.length > 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', curriculum_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'reject-change': {
        const { curriculum_id, change_id, review_notes } = params;
        if (!curriculum_id || !change_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id or change_id', context.request, { startTime });
        const { data: curriculum, error: fetchError } = await supabase
          .from('college_curriculums')
          .select('pending_changes, change_history')
          .eq('id', curriculum_id)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        const pendingChanges = curriculum?.pending_changes || [];
        const changeIndex = pendingChanges.findIndex((c: any) => c.id === change_id);
        if (changeIndex === -1) return apiError(404, 'NOT_FOUND', 'Change request not found', context.request, { startTime });
        const change = pendingChanges[changeIndex];
        const updatedPending = pendingChanges.filter((_: any, i: number) => i !== changeIndex);
        const changeHistory = curriculum?.change_history || [];
        const historyEntry = {
          id: change_id, action: 'change_rejected', change_type: change.change_type,
          request_timestamp: change.request_timestamp, rejection_timestamp: new Date().toISOString(),
          user_id: user.id, review_notes, applied: false, original_change: change,
        };
        const { error } = await supabase
          .from('college_curriculums')
          .update({
            pending_changes: updatedPending,
            change_history: [...changeHistory, historyEntry],
            has_pending_changes: updatedPending.length > 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', curriculum_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'cancel-change-request': {
        const { curriculum_id, change_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data: curriculum, error: fetchError } = await supabase
          .from('college_curriculums')
          .select('pending_changes, change_history')
          .eq('id', curriculum_id)
          .single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        const pendingChanges = curriculum?.pending_changes || [];
        const updatedPending = change_id
          ? pendingChanges.filter((c: any) => c.id !== change_id)
          : pendingChanges;
        const changeHistory = curriculum?.change_history || [];
        const historyEntry = { id: change_id || 'all', action: 'change_cancelled', timestamp: new Date().toISOString(), user_id: user.id };
        const { error } = await supabase
          .from('college_curriculums')
          .update({
            pending_changes: updatedPending,
            change_history: [...changeHistory, historyEntry],
            has_pending_changes: updatedPending.length > 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', curriculum_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-pending-changes': {
        const { curriculum_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculums')
          .select('pending_changes')
          .eq('id', curriculum_id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data?.pending_changes || [], context.request, { startTime });
      }

      case 'get-change-request-details': {
        const { curriculum_id, change_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculums')
          .select('pending_changes, change_history')
          .eq('id', curriculum_id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        const change = (data?.pending_changes || []).find((c: any) => c.id === change_id);
        const history = (data?.change_history || []).filter((h: any) => h.id === change_id);
        return apiSuccess({ change: change || null, history: history || [] }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[curriculum-changes POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
