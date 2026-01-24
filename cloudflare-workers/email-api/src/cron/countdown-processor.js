/**
 * Automated countdown email processing for CRON jobs
 */

import { 
  createSupabaseClient,
  getAllPreRegistrations
} from '../services/supabase.js';
import { calculateDaysUntilLaunch } from '../utils/date.js';
import { COUNTDOWN_DAYS } from '../config/constants.js';
import { processIndividualCountdownEmail } from './email-processor-helper.js';

export async function processCountdownEmails(env) {
  const supabase = createSupabaseClient(env);
  if (!supabase) {
    console.error('Supabase configuration missing');
    return;
  }

  const launchDate = env.LAUNCH_DATE || '2026-02-01';
  const daysUntilLaunch = calculateDaysUntilLaunch(launchDate);

  console.log(`Days until launch: ${daysUntilLaunch}`);

  // Only send emails on specific countdown days
  if (!COUNTDOWN_DAYS.includes(daysUntilLaunch)) {
    console.log(`Not a countdown day. Skipping email send.`);
    return;
  }

  console.log(`Countdown day ${daysUntilLaunch} - Processing emails...`);

  const { data: preRegistrations, error: fetchError } = await getAllPreRegistrations(supabase);

  if (fetchError) {
    console.error('Error fetching pre-registrations:', fetchError);
    return;
  }

  console.log(`Found ${preRegistrations?.length || 0} pre-registrations`);

  for (const preReg of preRegistrations || []) {
    await processIndividualCountdownEmail(supabase, env, preReg, daysUntilLaunch, launchDate);
  }

  console.log('Countdown email processing completed');
}
