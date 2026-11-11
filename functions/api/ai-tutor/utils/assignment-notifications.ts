import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyRealtime } from '../../../lib/realtime';

/** Rows are committed by database triggers. Realtime is a best-effort hint; polling recovers gaps. */
export async function broadcastAssignmentNotifications(db: SupabaseClient, env: Parameters<typeof notifyRealtime>[0], field: 'assignment_id' | 'submission_id', id: string, since: string) {
  try {
    const { data, error } = await db.from('notifications').select('*').contains('metadata', { [field]: id }).gte('created_at', since);
    if (error) throw error;
    await Promise.all((data || []).map(row => notifyRealtime(env, 'notifications', 'INSERT', row)));
  } catch {
    console.warn('Assignment notification realtime unavailable; persisted notifications remain available.');
  }
}
