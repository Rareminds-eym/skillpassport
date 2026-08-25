/**
 * Shared Application Updates (recruiter pipeline) notification helper.
 *
 * Consolidates the learner-resolution + preference-check + notification
 * insert logic previously duplicated across move-candidate-to-stage,
 * reject-candidate, and log-pipeline-activity in
 * functions/api/recruiter-pipeline/[[path]].ts. Title/message construction
 * remains at each call site; this helper only handles delivery.
 *
 * @module lib/pipelineNotifications
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from './logger';
import { shouldNotify } from './notificationPreferences';

const logger = createLogger('pipeline-notifications');

/**
 * Resolves a learner to their linked user account, checks the
 * applicationUpdates preference, and creates the notification if enabled.
 *
 * Never throws. Learner not found, missing/null learners.user_id, a
 * lookup failure, or a notification insert failure are all logged and
 * skipped — the caller's underlying pipeline operation is never affected.
 */
export async function notifyLearnerOfPipelineChange(
  supabase: SupabaseClient,
  learnerId: string | null | undefined,
  notificationType: string,
  title: string,
  message: string
): Promise<void> {
  if (!learnerId) return;

  let learnerData: { user_id: string | null } | null = null;
  try {
    const { data, error } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', learnerId)
      .maybeSingle();

    if (error) {
      logger.warn('learner_lookup_failed', { learnerId, error: String(error) });
      return;
    }
    learnerData = data;
  } catch (error) {
    logger.warn('learner_lookup_failed', { learnerId, error: String(error) });
    return;
  }

  if (!learnerData?.user_id) {
    logger.warn('learner_not_found', { learnerId });
    return;
  }

  const userId = learnerData.user_id;

  let enabled: boolean;
  try {
    enabled = await shouldNotify(supabase, userId, 'applicationUpdates');
  } catch (error) {
    logger.warn('preference_check_failed', { learnerId, userId, error: String(error) });
    return;
  }
  if (!enabled) return;

  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        recipient_id: userId,
        type: notificationType,
        title,
        message,
        read: false,
        created_at: new Date().toISOString(),
      }]);
    if (error) {
      logger.warn('notification_insert_failed', { learnerId, userId, error: String(error) });
    }
  } catch (error) {
    logger.warn('notification_insert_failed', { learnerId, userId, error: String(error) });
  }
}
