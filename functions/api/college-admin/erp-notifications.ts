/**
 * College ERP Notifications API (SK-89..SK-93)
 * GET: get-notifications, get-unread-count — recipient-scoped reads for the notification bell.
 * POST: mark-read, check-missing-attendance (SK-92 lazy check on dashboard load).
 */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiDbError, apiError, apiSuccess } from '../../lib/response';
import { isValidUUID } from '../../lib/validation';
import { publishErpNotification } from '../../lib/college-erp-notifications';

const MISSING_ATTENDANCE_WINDOW_HOURS = 48;

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const collegeId = url.searchParams.get('college_id');

  if (!action || !collegeId) {
    return apiError(400, 'VALIDATION_ERROR', 'action and college_id are required', context.request);
  }

  if (action === 'get-unread-count') {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('read', false);
    if (error) return apiDbError(error, context.request);
    return apiSuccess({ unread_count: count || 0 }, context.request);
  }

  if (action === 'get-notifications') {
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Always scoped to the caller — college_id cannot widen access to other recipients' notifications.
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, read, created_at, assessment_id')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data || [], context.request);
  }

  return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);

  if (action === 'mark-read') {
    const { notification_id } = body;
    if (!notification_id) return apiError(400, 'VALIDATION_ERROR', 'notification_id is required', context.request);
    if (!isValidUUID(notification_id)) return apiError(400, 'VALIDATION_ERROR', 'notification_id must be a valid UUID', context.request);

    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('id, recipient_id')
      .eq('id', notification_id)
      .maybeSingle();
    if (fetchError) return apiDbError(fetchError, context.request);
    if (!notification) return apiError(404, 'NOT_FOUND', 'Notification not found', context.request);
    if (notification.recipient_id !== user.id) {
      return apiError(403, 'FORBIDDEN', 'User is not authorised to mark this notification', context.request);
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification_id);
    if (updateError) return apiDbError(updateError, context.request);
    return apiSuccess({ success: true }, context.request);
  }

  if (action === 'check-missing-attendance') {
    const { college_id } = body;
    if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'college_id is required', context.request);
    if (!isValidUUID(college_id)) return apiError(400, 'VALIDATION_ERROR', 'college_id must be a valid UUID', context.request);

    const [{ data: adminOrg }, { data: lecturer }] = await Promise.all([
      supabase.from('organizations').select('id').eq('id', college_id).eq('organization_type', 'college').eq('admin_id', user.id).maybeSingle(),
      supabase.from('college_lecturers').select('id').eq('collegeId', college_id).eq('user_id', user.id).maybeSingle(),
    ]);
    if (!adminOrg && !lecturer) {
      return apiError(403, 'FORBIDDEN', 'User is not authorised for this college', context.request);
    }

    const cutoff = new Date(Date.now() - MISSING_ATTENDANCE_WINDOW_HOURS * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: overdueSessions, error: sessionsError } = await supabase
      .from('college_attendance_sessions')
      .select('id, faculty_id, subject_name, date')
      .eq('college_id', college_id)
      .neq('status', 'completed')
      .gte('date', cutoff)
      .not('faculty_id', 'is', null);
    if (sessionsError) return apiDbError(sessionsError, context.request);

    if (!overdueSessions || overdueSessions.length === 0) {
      return apiSuccess({ notifications_created: 0 }, context.request);
    }

    const facultyIds = [...new Set(overdueSessions.map((s: { faculty_id: string }) => s.faculty_id))];
    const { data: lecturers, error: lecturersError } = await supabase
      .from('college_lecturers')
      .select('id, user_id')
      .in('id', facultyIds);
    if (lecturersError) return apiDbError(lecturersError, context.request);

    const lecturerUserMap = new Map((lecturers || []).map((l: { id: string; user_id: string | null }) => [l.id, l.user_id]));

    let notificationsCreated = 0;
    for (const session of overdueSessions as { id: string; faculty_id: string; subject_name: string; date: string }[]) {
      const facultyUserId = lecturerUserMap.get(session.faculty_id);
      if (!facultyUserId) continue;

      // Dedup is enforced by publishErpNotification itself (event_key unique
      // constraint via upsert+ignoreDuplicates) — only count an outcome that
      // was actually written, never one that failed or already existed.
      const outcomes = await publishErpNotification(supabase, env, 'missing_attendance', {
        recipient_id: facultyUserId,
        subject_name: session.subject_name,
        session_date: session.date,
        session_id: session.id,
      });
      if (outcomes.some((o) => o.outcome === 'created')) {
        notificationsCreated += 1;
      }
    }

    return apiSuccess({ notifications_created: notificationsCreated }, context.request);
  }

  return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
});
