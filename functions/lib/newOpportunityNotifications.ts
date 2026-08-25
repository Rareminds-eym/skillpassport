/**
 * New Opportunities notification fan-out.
 *
 * Notifies all eligible learners (users.role = 'learner' with a valid
 * learners.user_id link) when a recruiter creates a new, active
 * opportunity, respecting each learner's newOpportunities preference.
 *
 * Payload construction and the learner eligibility join mirror the
 * existing (unattached) notify_learners_new_opportunity() database
 * trigger function, reused here as the mechanism instead of that trigger.
 *
 * @module lib/newOpportunityNotifications
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from './logger';

const logger = createLogger('new-opportunity-notifications');

interface OpportunityForNotification {
  id: string;
  job_title: string | null;
  title: string | null;
  company_name: string | null;
  location: string | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  is_active: boolean | null;
}

/**
 * Notifies eligible learners of a newly created opportunity.
 *
 * Never throws. Any lookup or insert failure is logged and skipped — the
 * caller's opportunity creation is never affected, since this runs only
 * after that insert has already succeeded.
 */
export async function notifyLearnersOfNewOpportunity(
  supabase: SupabaseClient,
  opportunity: OpportunityForNotification
): Promise<void> {
  if (opportunity.is_active !== true) return;

  const title = `${opportunity.job_title || ''} at ${opportunity.company_name || ''}`;
  let message = `${opportunity.title || ''} - ${opportunity.location || ''}`;
  if (opportunity.salary_range_min != null && opportunity.salary_range_max != null) {
    message += ` | ₹${opportunity.salary_range_min} - ₹${opportunity.salary_range_max}`;
  }

  let learners: { user_id: string }[] | null = null;
  try {
    const { data, error } = await supabase
      .from('learners')
      .select('user_id, users!inner(role)')
      .eq('users.role', 'learner')
      .not('user_id', 'is', null);

    if (error) {
      logger.warn('eligible_learner_lookup_failed', { opportunityId: opportunity.id, error: String(error) });
      return;
    }
    learners = data as unknown as { user_id: string }[];
  } catch (error) {
    logger.warn('eligible_learner_lookup_failed', { opportunityId: opportunity.id, error: String(error) });
    return;
  }

  if (!learners || learners.length === 0) return;

  const userIds = [...new Set(learners.map((l) => l.user_id))];

  let settingsRows: { user_id: string; notification_preferences: Record<string, unknown> | null }[] = [];
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('user_id, notification_preferences')
      .in('user_id', userIds);

    if (error) {
      logger.warn('preference_lookup_failed', { opportunityId: opportunity.id, error: String(error) });
      return;
    }
    settingsRows = data || [];
  } catch (error) {
    logger.warn('preference_lookup_failed', { opportunityId: opportunity.id, error: String(error) });
    return;
  }

  const disabledUserIds = new Set(
    settingsRows
      .filter((row) => row.notification_preferences?.['newOpportunities'] === false)
      .map((row) => row.user_id)
  );

  const recipients = userIds.filter((userId) => !disabledUserIds.has(userId));
  if (recipients.length === 0) return;

  const now = new Date().toISOString();
  const rows = recipients.map((userId) => ({
    recipient_id: userId,
    type: 'new_opportunity',
    title,
    message,
    read: false,
    created_at: now,
  }));

  try {
    const { error } = await supabase.from('notifications').insert(rows);
    if (error) {
      logger.warn('notification_insert_failed', { opportunityId: opportunity.id, error: String(error) });
    }
  } catch (error) {
    logger.warn('notification_insert_failed', { opportunityId: opportunity.id, error: String(error) });
  }
}
