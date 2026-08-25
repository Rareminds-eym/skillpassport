/**
 * Shared notification preference gating.
 *
 * Rule: only the literal boolean `false` disables a notification. A
 * missing key, `null`, a malformed/non-boolean value, no `user_settings`
 * row, or a lookup failure all skip disabling — i.e. they notify, except
 * a lookup failure, which fails safe by skipping the notification (see
 * shouldNotify below).
 *
 * @module lib/notificationPreferences
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from './logger';

const logger = createLogger('notification-preferences');

export type NotificationPreferenceKey =
  | 'applicationUpdates'
  | 'newOpportunities'
  | 'recruitingMessages';

/**
 * Determines whether a notification should be created for a user.
 *
 * - No `user_settings` row, missing key, `null`, or any malformed
 *   (non-boolean) stored value -> true (notify).
 * - Explicit `false` -> false (skip).
 * - A genuine lookup/query failure -> false (skip), logged. This is
 *   distinct from a malformed value: here the preference could not be
 *   read at all, so the notification is skipped rather than guessed.
 */
export async function shouldNotify(
  supabase: SupabaseClient,
  userId: string,
  preferenceKey: NotificationPreferenceKey
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('notification_preferences')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.warn('preference_lookup_failed', { userId, preferenceKey, error: String(error) });
    return false;
  }

  const value = (data?.notification_preferences as Record<string, unknown> | null | undefined)?.[preferenceKey];
  return value !== false;
}
