import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyRealtime } from './realtime';

/**
 * ERP notification types for SK-89/90 (faculty assignment), SK-91 (low attendance),
 * SK-92 (missing attendance) and SK-93 (attendance submitted).
 */
export type ErpNotificationType =
  | 'faculty_assigned'
  | 'faculty_unassigned'
  | 'low_attendance'
  | 'missing_attendance'
  | 'attendance_submitted';

export const ERP_NOTIFICATION_TYPES: ErpNotificationType[] = [
  'faculty_assigned',
  'faculty_unassigned',
  'low_attendance',
  'missing_attendance',
  'attendance_submitted',
];

export interface ErpNotificationContext {
  /** faculty_assigned / faculty_unassigned */
  lecturer_ids?: string[];
  department_name?: string;
  /** faculty_assigned — true when this assignment is specifically as Head of
   * Department, to distinguish it from a regular faculty assignment message. */
  is_hod?: boolean;
  /** low_attendance / attendance_submitted — scopes the college admin lookup */
  college_id?: string;
  subject_name?: string;
  session_date?: string;
  /** low_attendance */
  attendance_percentage?: number;
  /** attendance_submitted */
  faculty_name?: string;
  /** missing_attendance — recipient is already resolved by the caller (erp-notifications.ts) */
  recipient_id?: string;
  /** missing_attendance — stored in notifications.assessment_id for SK-92 dedup */
  session_id?: string;
}

function buildContent(type: ErpNotificationType, ctx: ErpNotificationContext): { title: string; message: string } {
  switch (type) {
    case 'faculty_assigned':
      return ctx.is_hod
        ? { title: 'Department Assignment', message: `You have been assigned as the Head of Department for ${ctx.department_name}.` }
        : { title: 'Department Assignment', message: `You have been assigned to ${ctx.department_name}.` };
    case 'faculty_unassigned':
      return { title: 'Department Assignment Ended', message: `Your assignment to ${ctx.department_name} has ended.` };
    case 'low_attendance':
      return {
        title: 'Low Attendance Alert',
        message: `Attendance for ${ctx.subject_name} on ${ctx.session_date} is ${ctx.attendance_percentage}% — below the 75% threshold.`,
      };
    case 'missing_attendance':
      return { title: 'Attendance Not Submitted', message: `Attendance for ${ctx.subject_name} on ${ctx.session_date} has not been submitted.` };
    case 'attendance_submitted':
      return {
        title: 'Attendance Submitted',
        message: `${ctx.faculty_name} submitted attendance for ${ctx.subject_name} on ${ctx.session_date}.`,
      };
  }
}

/**
 * Resolves the recipient user_ids for a given ERP notification type.
 * SK-91/SK-93 notify the college admin only — school_educators has no
 * college_id, so school admins cannot be scoped to a college and are
 * excluded here.
 */
async function resolveRecipients(db: SupabaseClient, type: ErpNotificationType, ctx: ErpNotificationContext): Promise<string[]> {
  switch (type) {
    case 'faculty_assigned':
    case 'faculty_unassigned': {
      const lecturerIds = ctx.lecturer_ids || [];
      if (lecturerIds.length === 0) return [];
      const { data, error } = await db.from('college_lecturers').select('user_id').in('id', lecturerIds);
      if (error) throw error;
      return (data || []).map((row: { user_id: string | null }) => row.user_id).filter((id: string | null): id is string => !!id);
    }
    case 'low_attendance':
    case 'attendance_submitted': {
      const { data, error } = await db
        .from('organizations')
        .select('admin_id')
        .eq('id', ctx.college_id)
        .eq('organization_type', 'college')
        .not('admin_id', 'is', null)
        .maybeSingle();
      if (error) throw error;
      return data?.admin_id ? [data.admin_id] : [];
    }
    case 'missing_attendance':
      return ctx.recipient_id ? [ctx.recipient_id] : [];
  }
}

/** Per-recipient result of a publish attempt — lets awaited callers (unlike the
 * fire-and-forget waitUntil callers) know whether a row was actually written. */
export interface PublishOutcome {
  recipientId: string;
  outcome: 'created' | 'duplicate' | 'failed';
  error?: string;
}

/**
 * Inserts an ERP notification row per resolved recipient and pushes each one
 * through REALTIME_EVENTS_QUEUE. Three callers (faculty_assigned/unassigned,
 * low_attendance, attendance_submitted) invoke this via context.waitUntil and
 * never read the return value — for them, delivery is best-effort (see
 * notifyRealtime) and a missing-recipient or insert failure is logged, not
 * thrown, exactly as before.
 *
 * missing_attendance (SK-92) is awaited directly by its caller
 * (check-missing-attendance), which uses the returned outcomes to count only
 * genuinely-created notifications — never a failed or already-existing one.
 * It dedupes via the `event_key` column, not `assessment_id` (that column is
 * foreign-keyed to personal_assessment_results, a different feature, so
 * writing an attendance session id into it always fails the FK check).
 *
 * `event_key` is covered by a PARTIAL unique index
 * (`notifications_event_key_unique ... WHERE event_key IS NOT NULL`), which
 * PostgREST/supabase-js cannot target via `.upsert(..., { onConflict })` —
 * verified directly against the local REST API: it returns
 * `42P10 no unique or exclusion constraint matching the ON CONFLICT
 * specification`, because the generated ON CONFLICT clause omits the
 * index's WHERE predicate. So this uses a plain insert and treats Postgres
 * error 23505 (unique_violation) on `event_key` as a 'duplicate' outcome —
 * the index still enforces uniqueness on a plain insert, it just can't be
 * targeted by ON CONFLICT without the matching predicate.
 */
export async function publishErpNotification(
  db: SupabaseClient,
  env: Parameters<typeof notifyRealtime>[0],
  type: ErpNotificationType,
  ctx: ErpNotificationContext
): Promise<PublishOutcome[]> {
  if (!ERP_NOTIFICATION_TYPES.includes(type)) {
    throw new Error(`Unknown ERP notification type: ${type}`);
  }

  const recipientIds = await resolveRecipients(db, type, ctx);
  if (recipientIds.length === 0) {
    console.warn(JSON.stringify({ message: 'No recipients resolved for ERP notification', type }));
    return [];
  }

  const { title, message } = buildContent(type, ctx);

  return Promise.all(
    recipientIds.map(async (recipientId): Promise<PublishOutcome> => {
      const row: Record<string, unknown> = {
        recipient_id: recipientId,
        type,
        title,
        message,
        read: false,
      };

      if (type === 'missing_attendance' && ctx.session_id) {
        row.event_key = `missing_attendance:${ctx.session_id}:${recipientId}`;
        row.metadata = { session_id: ctx.session_id };
      }

      const { data, error } = await db.from('notifications').insert(row).select().maybeSingle();

      if (error) {
        const isDuplicateEventKey = (error as { code?: string }).code === '23505';
        if (isDuplicateEventKey) {
          return { recipientId, outcome: 'duplicate' };
        }
        console.error(JSON.stringify({ message: 'Failed to insert ERP notification', type, recipientId, error: String(error) }));
        return { recipientId, outcome: 'failed', error: String(error) };
      }
      if (!data) {
        // ignoreDuplicates silently skipped an existing row with this event_key.
        return { recipientId, outcome: 'duplicate' };
      }
      await notifyRealtime(env, 'notifications', 'INSERT', data);
      return { recipientId, outcome: 'created' };
    })
  );
}
