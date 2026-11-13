import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyRealtime } from './realtime';

// Persistence belongs to the curriculum transaction; websocket delivery is best effort.
export async function publishCollegeCourseNotifications(db: SupabaseClient, env: Parameters<typeof notifyRealtime>[0], requestId: string, type: string) {
  try {
    const { data, error } = await db.from('notifications').select('*').eq('curriculum_change_id', requestId).eq('type', type);
    if (error) throw error;
    await Promise.all((data || []).map(row => notifyRealtime(env, 'notifications', 'INSERT', row)));
  } catch {
    console.error('Could not broadcast curriculum notifications. Saved notifications remain available in the bell.');
  }
}
